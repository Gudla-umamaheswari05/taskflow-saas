import express from "express";
import { prisma } from "../utils/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { stripe } from "../utils/stripe.js";

const router = express.Router();
router.use(requireAuth);

const PRICE_IDS = {
  PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY,
  PRO_ANNUAL: process.env.STRIPE_PRICE_PRO_ANNUAL,
  TEAM_MONTHLY: process.env.STRIPE_PRICE_TEAM_MONTHLY,
  TEAM_ANNUAL: process.env.STRIPE_PRICE_TEAM_ANNUAL,
};

// GET current plan/status for the logged-in user
router.get("/me", async (req, res) => {
  const sub = await prisma.subscription.findUnique({ where: { userId: req.userId } });
  res.json(sub);
});

// Create a Stripe Checkout session for a given plan
router.post("/checkout", async (req, res) => {
  const { priceKey } = req.body; // e.g. "PRO_MONTHLY"
  const priceId = PRICE_IDS[priceKey];
  if (!priceId) return res.status(400).json({ error: "Unknown plan" });

  const user = await prisma.user.findUnique({ where: { id: req.userId } });

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email, name: user.name });
    customerId = customer.id;
    await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: { trial_period_days: 14 },
    success_url: `${process.env.CLIENT_URL}/billing?success=true`,
    cancel_url: `${process.env.CLIENT_URL}/billing?canceled=true`,
    metadata: { userId: user.id },
  });

  res.json({ url: session.url });
});

// Create a Customer Portal session so users can manage/cancel their subscription
router.post("/portal", async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user.stripeCustomerId) return res.status(400).json({ error: "No billing account yet" });

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${process.env.CLIENT_URL}/billing`,
  });
  res.json({ url: session.url });
});

export default router;
