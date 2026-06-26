import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

// Maps a price ID back to our internal plan name. Used by webhooks.
export const PRICE_TO_PLAN = {
  [process.env.STRIPE_PRICE_PRO_MONTHLY]: "PRO",
  [process.env.STRIPE_PRICE_PRO_ANNUAL]: "PRO",
  [process.env.STRIPE_PRICE_TEAM_MONTHLY]: "TEAM",
  [process.env.STRIPE_PRICE_TEAM_ANNUAL]: "TEAM",
};

export const PLAN_LIMITS = {
  FREE: { maxProjects: 1, maxMembersPerProject: 3 },
  PRO: { maxProjects: 10, maxMembersPerProject: Infinity },
  TEAM: { maxProjects: Infinity, maxMembersPerProject: Infinity },
};
