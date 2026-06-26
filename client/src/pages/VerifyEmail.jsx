import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "../api.js";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("Verifying…");

  useEffect(() => {
    api.post("/auth/verify-email", { token }, { auth: false })
      .then(() => setStatus("Your email is verified."))
      .catch((err) => setStatus(err.message));
  }, [token]);

  return (
    <div className="max-w-md mx-auto px-6 py-20 text-center">
      <p className="text-slate-600 mb-4">{status}</p>
      <Link to="/dashboard" className="text-accent">Go to dashboard</Link>
    </div>
  );
}
