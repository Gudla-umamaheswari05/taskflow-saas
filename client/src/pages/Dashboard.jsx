import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [newProjectName, setNewProjectName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadData() {
    const [projectsData, tasksData] = await Promise.all([
      api.get("/projects"),
      api.get("/tasks/mine"),
    ]);
    setProjects(projectsData);
    setMyTasks(tasksData);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function createProject(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/projects", { name: newProjectName });
      setNewProjectName("");
      loadData();
    } catch (err) {
      setError(err.message); // surfaces plan-limit errors, e.g. "Upgrade to create more"
    }
  }

  if (loading) return <p className="max-w-6xl mx-auto px-6 py-10 text-slate-500">Loading…</p>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 grid md:grid-cols-3 gap-10">
      <div className="md:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-2xl font-semibold text-ink">Your projects</h1>
        </div>

        <form onSubmit={createProject} className="flex gap-2 mb-6">
          <input
            placeholder="New project name" value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            className="flex-1 border border-slate-300 rounded-md px-4 py-2 focus-visible:border-accent"
          />
          <button className="bg-accent text-white px-4 py-2 rounded-md hover:bg-accentDark transition">
            Create
          </button>
        </form>
        {error && (
          <p className="text-red-600 text-sm mb-4">
            {error} {error.includes("Upgrade") && <Link to="/billing" className="underline">View plans</Link>}
          </p>
        )}

        <div className="space-y-3">
          {projects.length === 0 && <p className="text-slate-500">No projects yet — create your first one above.</p>}
          {projects.map((p) => (
            <Link
              key={p.id} to={`/projects/${p.id}`}
              className="block bg-white border border-slate-200 rounded-lg p-4 hover:border-accent transition"
            >
              <p className="font-medium text-ink">{p.name}</p>
              <p className="text-sm text-slate-500">{p.members.length} member{p.members.length !== 1 ? "s" : ""}</p>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-display text-xl font-semibold text-ink mb-4">Your tasks</h2>
        <div className="space-y-2">
          {myTasks.length === 0 && <p className="text-slate-500 text-sm">Nothing assigned to you right now.</p>}
          {myTasks.map((t) => (
            <div key={t.id} className="bg-white border border-slate-200 rounded-lg p-3">
              <p className="text-sm font-medium text-ink">{t.title}</p>
              <p className="text-xs text-slate-500">{t.project.name}{t.dueDate ? ` · Due ${new Date(t.dueDate).toLocaleDateString()}` : ""}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
