import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";

export default function Account() {
  const { user, logout } = useAuth();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function changePassword(e) {
    e.preventDefault();
    setError(""); setMessage("");
    try {
      // Re-uses the forgot-password flow under the hood would need current password
      // verification server-side; for brevity this calls a dedicated endpoint pattern
      // you can add to auth.js (left as a clear extension point).
      await api.post("/auth/change-password", { oldPassword, newPassword });
      setMessage("Password updated");
      setOldPassword(""); setNewPassword("");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-12">
      <h1 className="font-display text-2xl font-semibold text-ink mb-6">Account</h1>

      <div className="bg-white border border-slate-200 rounded-lg p-5 mb-8">
        <p className="text-sm text-slate-500">Name</p>
        <p className="font-medium text-ink mb-3">{user?.name}</p>
        <p className="text-sm text-slate-500">Email</p>
        <p className="font-medium text-ink">{user?.email}</p>
      </div>

      <h2 className="font-display text-lg font-semibold text-ink mb-3">Change password</h2>
      <form onSubmit={changePassword} className="space-y-3 mb-8">
        <input
          type="password" placeholder="Current password" value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          className="w-full border border-slate-300 rounded-md px-4 py-2.5 focus-visible:border-accent"
        />
        <input
          type="password" placeholder="New password" value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full border border-slate-300 rounded-md px-4 py-2.5 focus-visible:border-accent"
        />
        {message && <p className="text-green-600 text-sm">{message}</p>}
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button className="bg-accent text-white px-4 py-2 rounded-md hover:bg-accentDark transition">Update password</button>
      </form>

      <button onClick={logout} className="text-sm text-red-600 hover:underline">
        Log out of all devices
      </button>
    </div>
  );
}
