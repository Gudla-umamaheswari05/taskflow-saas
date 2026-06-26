import express from "express";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { prisma } from "../utils/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { enforceProjectLimit, enforceMemberLimit } from "../middleware/planLimits.js";
import { sendEmail } from "../utils/email.js";

const router = express.Router();
router.use(requireAuth);

// List all projects the user owns or is a member of
router.get("/", async (req, res) => {
  const projects = await prisma.project.findMany({
    where: {
      OR: [{ ownerId: req.userId }, { members: { some: { userId: req.userId } } }],
    },
    include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(projects);
});

const createSchema = z.object({ name: z.string().min(1).max(100) });

router.post("/", enforceProjectLimit, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Project name is required" });

  const project = await prisma.project.create({
    data: {
      name: parsed.data.name,
      ownerId: req.userId,
      members: { create: { userId: req.userId, role: "OWNER" } },
    },
  });
  res.status(201).json(project);
});

// Get one project with tasks + activity feed
router.get("/:projectId", async (req, res) => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.projectId },
    include: {
      tasks: { include: { assignee: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" } },
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
      activityLogs: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 30,
      },
    },
  });
  if (!project) return res.status(404).json({ error: "Project not found" });

  const isMember = project.members.some((m) => m.userId === req.userId);
  if (!isMember) return res.status(403).json({ error: "Not a member of this project" });

  res.json(project);
});

// Invite a teammate by email
const inviteSchema = z.object({ email: z.string().email() });

router.post("/:projectId/invite", enforceMemberLimit, async (req, res) => {
  const parsed = inviteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Valid email required" });

  const project = await prisma.project.findUnique({ where: { id: req.params.projectId } });
  if (!project) return res.status(404).json({ error: "Project not found" });

  const token = uuid();
  const invite = await prisma.invite.create({
    data: {
      projectId: project.id,
      email: parsed.data.email,
      token,
      invitedById: req.userId,
    },
  });

  await prisma.activityLog.create({
    data: { projectId: project.id, userId: req.userId, action: `invited ${parsed.data.email}` },
  });

  const link = `${process.env.CLIENT_URL}/accept-invite?token=${token}`;
  await sendEmail({
    to: parsed.data.email,
    subject: `You've been invited to join "${project.name}" on TaskFlow`,
    html: `<p>You've been invited to collaborate on <strong>${project.name}</strong>.</p><p><a href="${link}">${link}</a></p>`,
  });

  res.status(201).json({ message: "Invite sent", inviteId: invite.id });
});

// Accept an invite (called after the invited user logs in / signs up)
router.post("/accept-invite", async (req, res) => {
  const { token } = req.body;
  const invite = await prisma.invite.findUnique({ where: { token } });
  if (!invite || invite.accepted) return res.status(400).json({ error: "Invalid or already-used invite" });

  await prisma.$transaction([
    prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: invite.projectId, userId: req.userId } },
      create: { projectId: invite.projectId, userId: req.userId, role: "MEMBER" },
      update: {},
    }),
    prisma.invite.update({ where: { id: invite.id }, data: { accepted: true } }),
  ]);

  res.json({ message: "Joined project", projectId: invite.projectId });
});

export default router;
