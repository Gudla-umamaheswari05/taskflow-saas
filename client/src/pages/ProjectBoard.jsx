import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api.js";

const COLUMNS = [
  { key: "TODO", label: "To Do", className: "col-todo" },
  { key: "IN_PROGRESS", label: "In Progress", className: "col-progress" },
  { key: "DONE", label: "Done", className: "col-done" },
];

export default function ProjectBoard() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const data = await api.get(`/projects/${projectId}`);
    setProject(data);
  }
  useEffect(() => { load(); }, [projectId]);

  async function createTask(e) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    await api.post("/tasks", { projectId, title: newTaskTitle });
    setNewTaskTitle("");
    load();
  }

  async function moveTask(taskId, status) {
    await api.patch(`/tasks/${taskId}`, { status });
    load();
  }

  async function sendInvite(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post(`/projects/${projectId}/invite`, { email: inviteEmail });
      setInviteEmail("");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!project) return <p className="max-w-6xl mx-auto px-6 py-10 text-slate-500">Loading…</p>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="font-display text-2xl font-semibold text-ink mb-6">{project.name}</h1>

      <form onSubmit={createTask} className="flex gap-2 mb-6">
        <input
          placeholder="New task title" value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          className="flex-1 border border-slate-300 rounded-md px-4 py-2 focus-visible:border-accent"
        />
        <button className="bg-accent text-white px-4 py-2 rounded-md hover:bg-accentDark transition">Add task</button>
      </form>

      <div className="grid md:grid-cols-3 gap-5 mb-10">
        {COLUMNS.map((col) => (
          <div key={col.key}>
            <p className={`${col.className} pl-2 font-medium text-slate-500 mb-3`}>{col.label}</p>
            <div className="space-y-2 min-h-[100px]">
              {project.tasks.filter((t) => t.status === col.key).map((t) => (
                <div key={t.id} className="bg-white border border-slate-200 rounded-lg p-3">
                  <p className="font-medium text-sm text-ink">{t.title}</p>
                  {t.assignee && <p className="text-xs text-slate-500 mt-1">{t.assignee.name}</p>}
                  <div className="flex gap-2 mt-2">
                    {COLUMNS.filter((c) => c.key !== col.key).map((c) => (
                      <button
                        key={c.key} onClick={() => moveTask(t.id, c.key)}
                        className="text-xs text-accent hover:underline"
                      >
                        → {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-10">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink mb-3">Team</h2>
          <ul className="space-y-1 text-sm text-slate-600 mb-4">
            {project.members.map((m) => <li key={m.id}>{m.user.name} ({m.role.toLowerCase()})</li>)}
          </ul>
          <form onSubmit={sendInvite} className="flex gap-2">
            <input
              type="email" placeholder="Invite by email" value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm focus-visible:border-accent"
            />
            <button className="border border-slate-300 px-3 py-2 rounded-md text-sm hover:border-accent transition">Invite</button>
          </form>
          {error && (
            <p className="text-red-600 text-sm mt-2">
              {error} {error.includes("Upgrade") && <Link to="/billing" className="underline">View plans</Link>}
            </p>
          )}
        </div>

        <div>
          <h2 className="font-display text-lg font-semibold text-ink mb-3">Activity</h2>
          <ul className="space-y-2 text-sm text-slate-600">
            {project.activityLogs.map((log) => (
              <li key={log.id}>
                <span className="font-medium text-ink">{log.user.name}</span> {log.action}
                <span className="text-slate-400"> · {new Date(log.createdAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
