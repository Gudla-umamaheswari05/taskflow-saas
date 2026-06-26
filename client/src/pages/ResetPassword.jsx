import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../api.js";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/auth/reset-password", { token, newPassword }, { auth: false });
      navigate("/login");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-20">
      <h1 className="font-display text-2xl font-semibold text-ink mb-6">Set a new password</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password" required minLength={8} placeholder="New password" value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full border border-slate-300 rounded-md px-4 py-2.5 focus-visible:border-accent"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button className="w-full bg-accent text-white py-2.5 rounded-md font-medium hover:bg-accentDark transition">
          Update password
        </button>
      </form>
    </div>
  );
}
