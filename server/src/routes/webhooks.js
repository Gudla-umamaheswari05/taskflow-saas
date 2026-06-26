import express from "express";
import { prisma } from "../utils/prisma.js";
import { stripe, PRICE_TO_PLAN } from "../utils/stripe.js";

const router = express.Router();

// NOTE: this route must receive the RAW request body (see index.js), not JSON-parsed,
// or Stripe's signature verification will fail.
router.post("/", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Idempotency guard: if we've already processed this exact event id, skip it.
  // Stripe can deliver the same event more than once.
  const already = await prisma.webhookEvent.findUnique({ where: { id: event.id } });
  if (already) return res.json({ received: true, duplicate: true });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        if (userId) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          const priceId = subscription.items.data[0]?.price.id;
          const plan = PRICE_TO_PLAN[priceId] || "FREE";

          await prisma.subscription.update({
            where: { userId },
            data: {
              plan,
              status: subscription.status.toUpperCase(),
              stripeSubscriptionId: subscription.id,
              stripePriceId: priceId,
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
            },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const priceId = subscription.items.data[0]?.price.id;
        const plan = PRICE_TO_PLAN[priceId] || "FREE";

        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            plan,
            status: subscription.status.toUpperCase(),
            stripePriceId: priceId,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: { plan: "FREE", status: "CANCELED" },
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: invoice.subscription },
          data: { status: "PAST_DUE" },
        });
        // In a real app: trigger a "payment failed" email to the user here.
        break;
      }

      default:
        // Unhandled event types are fine to ignore
        break;
    }

    // Record that we processed this event so Stripe's automatic retries don't double-apply it.
    await prisma.webhookEvent.create({ data: { id: event.id, type: event.type } });
  } catch (err) {
    console.error("Error processing webhook:", err);
    return res.status(500).json({ error: "Webhook handler failed" });
  }

  res.json({ received: true });
});

export default router;
