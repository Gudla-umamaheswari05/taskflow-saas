import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
        <Link to="/" className="font-display font-semibold text-lg text-ink">
          TaskFlow
        </Link>
        {user ? (
          <div className="flex items-center gap-6 text-sm">
            <Link to="/dashboard" className="hover:text-accent">Dashboard</Link>
            <Link to="/billing" className="hover:text-accent">Billing</Link>
            <Link to="/account" className="hover:text-accent">Account</Link>
            <button
              onClick={() => { logout(); navigate("/"); }}
              className="text-slate-500 hover:text-ink"
            >
              Log out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4 text-sm">
            <Link to="/login" className="hover:text-accent">Log in</Link>
            <Link
              to="/signup"
              className="bg-accent text-white px-4 py-2 rounded-md hover:bg-accentDark transition"
            >
              Get started
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
