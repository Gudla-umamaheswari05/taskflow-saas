import express from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

// All tasks assigned to the current user, across every project — powers the dashboard
router.get("/mine", async (req, res) => {
  const tasks = await prisma.task.findMany({
    where: { assigneeId: req.userId },
    include: { project: { select: { id: true, name: true } } },
    orderBy: { dueDate: "asc" },
  });
  res.json(tasks);
});

const createSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  assigneeId: z.string().uuid().optional(),
});

router.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: parsed.data.projectId, userId: req.userId } },
  });
  if (!member) return res.status(403).json({ error: "Not a member of this project" });

  const task = await prisma.task.create({
    data: {
      ...parsed.data,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
    },
  });

  await prisma.activityLog.create({
    data: { projectId: parsed.data.projectId, userId: req.userId, action: `created task "${task.title}"` },
  });

  res.status(201).json(task);
});

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  assigneeId: z.string().uuid().nullable().optional(),
});

router.patch("/:taskId", async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const task = await prisma.task.findUnique({ where: { id: req.params.taskId } });
  if (!task) return res.status(404).json({ error: "Task not found" });

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: task.projectId, userId: req.userId } },
  });
  if (!member) return res.status(403).json({ error: "Not a member of this project" });

  const updated = await prisma.task.update({
    where: { id: task.id },
    data: {
      ...parsed.data,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : parsed.data.dueDate,
    },
  });

  if (parsed.data.status) {
    await prisma.activityLog.create({
      data: {
        projectId: task.projectId,
        userId: req.userId,
        action: `moved task "${task.title}" to ${parsed.data.status.replace("_", " ")}`,
      },
    });
  }

  res.json(updated);
});

export default router;
