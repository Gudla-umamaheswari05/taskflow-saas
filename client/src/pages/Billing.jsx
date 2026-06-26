import { useEffect, useState } from "react";
import { api } from "../api.js";

const PLAN_OPTIONS = [
  { key: "PRO_MONTHLY", label: "Pro — $15/mo" },
  { key: "PRO_ANNUAL", label: "Pro — annual (2 months free)" },
  { key: "TEAM_MONTHLY", label: "Team — $39/mo" },
  { key: "TEAM_ANNUAL", label: "Team — annual (2 months free)" },
];

export default function Billing() {
  const [sub, setSub] = useState(null);
  const [loadingKey, setLoadingKey] = useState(null);

  useEffect(() => {
    api.get("/billing/me").then(setSub);
  }, []);

  async function startCheckout(priceKey) {
    setLoadingKey(priceKey);
    try {
      const { url } = await api.post("/billing/checkout", { priceKey });
      window.location.href = url;
    } finally {
      setLoadingKey(null);
    }
  }

  async function openPortal() {
    const { url } = await api.post("/billing/portal", {});
    window.location.href = url;
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="font-display text-2xl font-semibold text-ink mb-2">Billing</h1>
      <p className="text-slate-600 mb-8">
        Current plan: <span className="font-medium text-ink">{sub?.plan || "FREE"}</span>
        {sub?.status && sub.status !== "ACTIVE" && <span className="text-amber-600"> ({sub.status.toLowerCase()})</span>}
      </p>

      {sub?.stripeSubscriptionId && (
        <button onClick={openPortal} className="mb-8 border border-slate-300 px-4 py-2 rounded-md text-sm hover:border-accent transition">
          Manage subscription / cancel
        </button>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {PLAN_OPTIONS.map((p) => (
          <button
            key={p.key} onClick={() => startCheckout(p.key)} disabled={loadingKey === p.key}
            className="text-left bg-white border border-slate-200 rounded-lg p-4 hover:border-accent transition disabled:opacity-60"
          >
            <p className="font-medium text-ink">{p.label}</p>
            <p className="text-sm text-slate-500 mt-1">{loadingKey === p.key ? "Redirecting to checkout…" : "14-day trial included"}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
