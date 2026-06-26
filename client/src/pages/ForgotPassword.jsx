import { useState } from "react";
import { api } from "../api.js";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const data = await api.post("/auth/forgot-password", { email }, { auth: false });
    setMessage(data.message);
  }

  return (
    <div className="max-w-md mx-auto px-6 py-20">
      <h1 className="font-display text-2xl font-semibold text-ink mb-6">Reset your password</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email" required placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-slate-300 rounded-md px-4 py-2.5 focus-visible:border-accent"
        />
        <button className="w-full bg-accent text-white py-2.5 rounded-md font-medium hover:bg-accentDark transition">
          Send reset link
        </button>
      </form>
      {message && <p className="text-slate-600 text-sm mt-4">{message}</p>}
    </div>
  );
}
