import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { prisma } from "../utils/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { sendEmail, verifyEmailTemplate, resetPasswordTemplate } from "../utils/email.js";

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many attempts. Try again later." },
});
router.use(authLimiter);

function signAccessToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "15m" });
}
function signRefreshToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: "30d" });
}

const signupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

router.post("/signup", async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "An account with that email already exists" });

  const passwordHash = await bcrypt.hash(password, 10);
  const emailVerifyToken = uuid();

  const user = await prisma.user.create({
    data: { name, email, passwordHash, emailVerifyToken },
  });

  // New user starts on the Free plan
  await prisma.subscription.create({ data: { userId: user.id, plan: "FREE", status: "ACTIVE" } });

  const verifyLink = `${process.env.CLIENT_URL}/verify-email?token=${emailVerifyToken}`;
  await sendEmail({
    to: email,
    subject: "Confirm your TaskFlow email",
    html: verifyEmailTemplate(name, verifyLink),
  });

  const accessToken = signAccessToken(user.id);
  const refreshToken = signRefreshToken(user.id);
  res.status(201).json({ accessToken, refreshToken, user: { id: user.id, name, email } });
});

const loginSchema = z.object({ email: z.string().email(), password: z.string() });

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid email or password" });
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Invalid email or password" });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Invalid email or password" });

  const accessToken = signAccessToken(user.id);
  const refreshToken = signRefreshToken(user.id);
  res.json({ accessToken, refreshToken, user: { id: user.id, name: user.name, email: user.email } });
});

router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ error: "Missing refresh token" });
  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const accessToken = signAccessToken(payload.userId);
    res.json({ accessToken });
  } catch {
    res.status(401).json({ error: "Invalid or expired refresh token" });
  }
});

router.post("/verify-email", async (req, res) => {
  const { token } = req.body;
  const user = await prisma.user.findFirst({ where: { emailVerifyToken: token } });
  if (!user) return res.status(400).json({ error: "Invalid or expired verification link" });
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, emailVerifyToken: null },
  });
  res.json({ message: "Email verified" });
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  // Always respond success to avoid leaking which emails are registered
  if (!user) return res.json({ message: "If that email exists, a reset link has been sent" });

  const resetToken = uuid();
  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken, resetTokenExpires: new Date(Date.now() + 60 * 60 * 1000) },
  });

  const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
  await sendEmail({
    to: email,
    subject: "Reset your TaskFlow password",
    html: resetPasswordTemplate(user.name, resetLink),
  });
  res.json({ message: "If that email exists, a reset link has been sent" });
});

router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }
  const user = await prisma.user.findFirst({
    where: { resetToken: token, resetTokenExpires: { gt: new Date() } },
  });
  if (!user) return res.status(400).json({ error: "Invalid or expired reset link" });

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetToken: null, resetTokenExpires: null },
  });
  res.json({ message: "Password updated" });
});

// Change password while logged in (requires current password)
router.post("/change-password", requireAuth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: "New password must be at least 8 characters" });
  }
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  const valid = await bcrypt.compare(oldPassword || "", user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Current password is incorrect" });

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  res.json({ message: "Password updated" });
});

export default router;
