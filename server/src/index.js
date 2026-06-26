import "dotenv/config";
import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import projectRoutes from "./routes/projects.js";
import taskRoutes from "./routes/tasks.js";
import billingRoutes from "./routes/billing.js";
import webhookRoutes from "./routes/webhooks.js";

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

// IMPORTANT: the Stripe webhook route needs the raw body for signature
// verification, so it's mounted BEFORE express.json() and handles its
// own raw-body parsing internally (see routes/webhooks.js).
app.use("/api/webhooks", webhookRoutes);

app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/billing", billingRoutes);

// Central error handler — keeps error responses consistent
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong. Please try again." });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`TaskFlow API running on http://localhost:${PORT}`));
