import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { user } = useAuth();
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!user) return; // wait until logged in
    api.post("/projects/accept-invite", { token })
      .then((data) => setStatus(`Joined! Redirecting to your project…`) || (window.location.href = `/projects/${data.projectId}`))
      .catch((err) => setStatus(err.message));
  }, [user, token]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center">
        <p className="text-slate-600 mb-4">Log in or create an account to accept this invite.</p>
        <Link to={`/login?next=/accept-invite?token=${token}`} className="text-accent mr-4">Log in</Link>
        <Link to={`/signup?next=/accept-invite?token=${token}`} className="text-accent">Sign up</Link>
      </div>
    );
  }

  return <div className="max-w-md mx-auto px-6 py-20 text-center text-slate-600">{status || "Joining project…"}</div>;
}
