import { Link } from "react-router-dom";

const plans = [
  { name: "Free", price: "$0", tagline: "For getting one project off the ground", features: ["1 project", "Up to 3 teammates", "Task boards"], cta: "Start free" },
  { name: "Pro", price: "$15", tagline: "For freelancers juggling several clients", features: ["10 projects", "Unlimited teammates", "Task boards"], cta: "Start 14-day trial", highlight: true },
  { name: "Team", price: "$39", tagline: "For teams that don't want to think about limits", features: ["Unlimited projects", "Unlimited teammates", "Activity log & audit trail", "Priority support"], cta: "Start 14-day trial" },
];

export default function Landing() {
  return (
    <div>
      {/* Hero — the signature element is a live-looking 3-column board, since that IS the product */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-accent font-medium text-sm tracking-wide uppercase mb-3">Projects, without the overhead</p>
          <h1 className="font-display text-4xl md:text-5xl font-semibold leading-tight text-ink">
            Move work forward, not paperwork.
          </h1>
          <p className="mt-5 text-slate-600 text-lg">
            TaskFlow gives small teams a clean board, clear ownership, and a free trial of everything — no setup calls, no seat negotiations.
          </p>
          <div className="mt-8 flex gap-4">
            <Link to="/signup" className="bg-accent text-white px-6 py-3 rounded-md font-medium hover:bg-accentDark transition">
              Start free
            </Link>
            <a href="#pricing" className="px-6 py-3 rounded-md font-medium text-ink border border-slate-300 hover:border-slate-400 transition">
              See pricing
            </a>
          </div>
        </div>

        {/* Mock board */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="col-todo pl-2 font-medium text-slate-500 mb-3">To Do</p>
              <div className="space-y-2">
                <div className="bg-slate-50 rounded p-3 border border-slate-200">Client kickoff deck</div>
                <div className="bg-slate-50 rounded p-3 border border-slate-200">Set up staging env</div>
              </div>
            </div>
            <div>
              <p className="col-progress pl-2 font-medium text-slate-500 mb-3">In Progress</p>
              <div className="space-y-2">
                <div className="bg-slate-50 rounded p-3 border border-slate-200">Billing page UI</div>
              </div>
            </div>
            <div>
              <p className="col-done pl-2 font-medium text-slate-500 mb-3">Done</p>
              <div className="space-y-2">
                <div className="bg-slate-50 rounded p-3 border border-slate-200">Auth flow</div>
                <div className="bg-slate-50 rounded p-3 border border-slate-200">Project schema</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-10">
        {[
          { title: "One board per project", body: "To Do, In Progress, Done. No custom workflows to configure before you can start working." },
          { title: "Invite by email", body: "Add a teammate, they accept, they're in. No SSO setup required for a 4-person team." },
          { title: "A real activity feed", body: "See who moved what and when — useful context without digging through Slack history." },
        ].map((f) => (
          <div key={f.title}>
            <h3 className="font-display font-semibold text-lg text-ink mb-2">{f.title}</h3>
            <p className="text-slate-600">{f.body}</p>
          </div>
        ))}
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="font-display text-3xl font-semibold text-center text-ink mb-10">Plans that grow with your team</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`rounded-xl p-6 border ${p.highlight ? "border-accent shadow-md bg-white" : "border-slate-200 bg-white"}`}
            >
              <h3 className="font-display font-semibold text-xl text-ink">{p.name}</h3>
              <p className="text-slate-500 text-sm mt-1">{p.tagline}</p>
              <p className="mt-4 text-3xl font-display font-semibold text-ink">{p.price}<span className="text-base font-normal text-slate-500">/mo</span></p>
              <ul className="mt-5 space-y-2 text-sm text-slate-600">
                {p.features.map((f) => <li key={f}>• {f}</li>)}
              </ul>
              <Link
                to="/signup"
                className={`mt-6 block text-center px-4 py-2 rounded-md font-medium transition ${
                  p.highlight ? "bg-accent text-white hover:bg-accentDark" : "border border-slate-300 text-ink hover:border-slate-400"
                }`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
