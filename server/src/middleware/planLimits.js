import { prisma } from "../utils/prisma.js";
import { PLAN_LIMITS } from "../utils/stripe.js";

async function getUserPlan(userId) {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  return sub?.plan || "FREE";
}

// Blocks creating a new project if the user is at their plan's project limit
export async function enforceProjectLimit(req, res, next) {
  const plan = await getUserPlan(req.userId);
  const limits = PLAN_LIMITS[plan];

  const ownedProjectCount = await prisma.project.count({
    where: { ownerId: req.userId },
  });

  if (ownedProjectCount >= limits.maxProjects) {
    return res.status(403).json({
      error: "plan_limit_reached",
      message: `Your ${plan} plan allows up to ${limits.maxProjects} project(s). Upgrade to create more.`,
    });
  }
  next();
}

// Blocks inviting a new member if the project's member count is at the plan limit
export async function enforceMemberLimit(req, res, next) {
  const { projectId } = req.params;
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return res.status(404).json({ error: "Project not found" });

  const plan = await getUserPlan(project.ownerId);
  const limits = PLAN_LIMITS[plan];

  const memberCount = await prisma.projectMember.count({ where: { projectId } });

  if (memberCount >= limits.maxMembersPerProject) {
    return res.status(403).json({
      error: "plan_limit_reached",
      message: `This plan allows up to ${limits.maxMembersPerProject} members per project. Upgrade to invite more.`,
    });
  }
  next();
}
