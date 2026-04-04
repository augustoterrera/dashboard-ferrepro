"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X, Loader2, ShieldCheck, Shield, User, Users } from "lucide-react";

type Sucursal = { id: number; nombre: string };
type UserRow = { id: string; email: string; name: string | null; role: string; id_sucursal: number | null };

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  superadmin: { label: "Super Admin", color: "bg-rose-900/40 text-rose-400 border border-rose-900/50", icon: ShieldCheck },
  admin:      { label: "Admin",       color: "bg-blue-900/40 text-blue-400 border border-blue-900/50", icon: Shield },
  branch:     { label: "Branch",      color: "bg-slate-800 text-slate-400 border border-slate-700/50", icon: User },
};

function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.branch;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cfg.color}`}>
      <cfg.icon size={10} />
      {cfg.label}
    </span>
  );
}

type ModalMode = "create" | "edit" | null;
const EMPTY_FORM = { email: "", password: "", name: "", role: "branch", id_sucursal: "" };

export function UsuariosClient({
  initialUsers,
  sucursales,
  currentUserId,
}: {
  initialUsers: UserRow[];
  sucursales: Sucursal[];
  currentUserId: string;
}) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [mode, setMode] = useState<ModalMode>(null);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);

  function openCreate() {
    setEditing(null); setForm(EMPTY_FORM); setError(null); setMode("create");
  }
  function openEdit(u: UserRow) {
    setEditing(u);
    setForm({ email: u.email, password: "", name: u.name ?? "", role: u.role, id_sucursal: u.id_sucursal ? String(u.id_sucursal) : "" });
    setError(null); setMode("edit");
  }
  function closeModal() { setMode(null); setEditing(null); setError(null); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const body: Record<string, unknown> = {
        name: form.name || null,
        role: form.role,
        id_sucursal: form.id_sucursal ? Number(form.id_sucursal) : null,
      };
      if (mode === "create") { body.email = form.email; body.password = form.password; }
      else if (form.password) { body.password = form.password; }

      const url = mode === "create" ? "/api/superadmin/users" : `/api/superadmin/users/${editing!.id}`;
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error desconocido");

      if (mode === "create") { setUsers(prev => [data, ...prev]); }
      else { setUsers(prev => prev.map(u => u.id === data.id ? data : u)); }
      closeModal();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally { setLoading(false); }
  }

  async function handleDelete(u: UserRow) {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/superadmin/users/${u.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al eliminar");
      setUsers(prev => prev.filter(x => x.id !== u.id));
      setDeleteTarget(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally { setLoading(false); }
  }

  const sucursalName = (id: number | null) =>
    id ? (sucursales.find(s => s.id === id)?.nombre ?? `#${id}`) : null;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-slate-500">{users.length} usuario{users.length !== 1 ? "s" : ""}</p>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500 active:scale-95 transition-all"
        >
          <Plus size={15} /> Nuevo usuario
        </button>
      </div>

      {error && !mode && (
        <div className="mb-4 rounded-xl border border-rose-900/40 bg-rose-900/20 px-4 py-3 text-sm text-rose-400">{error}</div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-left text-[10px] font-black uppercase tracking-widest text-slate-600">
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Sucursal</th>
              <th className="px-4 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="flex flex-col items-center justify-center py-14 gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-slate-600">
                      <Users size={22} />
                    </div>
                    <p className="text-sm text-slate-600 font-medium">Sin usuarios registrados</p>
                    <button
                      onClick={openCreate}
                      className="text-xs text-blue-500 hover:text-blue-400 font-semibold transition-colors"
                    >
                      Crear el primer usuario →
                    </button>
                  </div>
                </td>
              </tr>
            ) : users.map((u) => (
              <tr key={u.id} className="group hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3">
                  <span className="font-medium text-slate-200">
                    {u.name ?? <span className="text-slate-600 italic text-xs">Sin nombre</span>}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400 font-mono text-xs">{u.email}</td>
                <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                <td className="px-4 py-3">
                  {sucursalName(u.id_sucursal)
                    ? <span className="text-slate-400 text-xs">{sucursalName(u.id_sucursal)}</span>
                    : <span className="text-slate-700 text-xs">—</span>
                  }
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => openEdit(u)}
                      className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-700 hover:text-blue-400 transition-colors"
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    {u.id !== currentUserId && (
                      <button
                        onClick={() => setDeleteTarget(u)}
                        className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-700 hover:text-rose-400 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      {mode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
            <div className="h-1 bg-blue-600 w-full" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-base font-black uppercase tracking-tight text-white">
                    {mode === "create" ? "Nuevo usuario" : "Editar usuario"}
                  </h2>
                  {mode === "edit" && (
                    <p className="text-xs text-slate-500 mt-0.5">{editing?.email}</p>
                  )}
                </div>
                <button onClick={closeModal} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "create" && (
                  <Field label="Email *">
                    <input type="email" required autoFocus value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      className="input-dark" placeholder="usuario@ejemplo.com" />
                  </Field>
                )}
                <Field label="Nombre">
                  <input type="text" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="input-dark" placeholder="Nombre completo" />
                </Field>
                <Field label={mode === "create" ? "Contraseña *" : "Nueva contraseña (opcional)"}>
                  <input type="password" required={mode === "create"} value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className="input-dark" placeholder="Mínimo 8 caracteres" minLength={8} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Rol *">
                    <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="input-dark">
                      <option value="branch">Branch</option>
                      <option value="admin">Admin</option>
                      <option value="superadmin">Super Admin</option>
                    </select>
                  </Field>
                  <Field label="Sucursal">
                    <select value={form.id_sucursal} onChange={e => setForm({ ...form, id_sucursal: e.target.value })} className="input-dark">
                      <option value="">Sin asignar</option>
                      {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                    </select>
                  </Field>
                </div>

                {error && (
                  <p className="rounded-xl border border-rose-900/40 bg-rose-900/20 px-3 py-2 text-xs text-rose-400">{error}</p>
                )}
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={closeModal}
                    className="flex-1 rounded-xl border border-slate-700 py-2.5 text-sm font-bold text-slate-400 hover:bg-slate-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-50 active:scale-95 transition-all"
                  >
                    {loading && <Loader2 size={14} className="animate-spin" />}
                    {mode === "create" ? "Crear" : "Guardar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
            <div className="h-1 bg-rose-600 w-full" />
            <div className="p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-900/30 mb-4">
                <Trash2 size={18} className="text-rose-400" />
              </div>
              <h2 className="text-base font-black uppercase text-white mb-1">¿Eliminar usuario?</h2>
              <p className="text-sm text-slate-400 mb-5">
                Vas a eliminar a <span className="text-white font-semibold">{deleteTarget.email}</span>. Esta acción no se puede deshacer.
              </p>
              {error && (
                <p className="mb-4 rounded-xl border border-rose-900/40 bg-rose-900/20 px-3 py-2 text-xs text-rose-400">{error}</p>
              )}
              <div className="flex gap-3">
                <button onClick={() => { setDeleteTarget(null); setError(null); }}
                  className="flex-1 rounded-xl border border-slate-700 py-2.5 text-sm font-bold text-slate-400 hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button onClick={() => handleDelete(deleteTarget)} disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-rose-600 py-2.5 text-sm font-bold text-white hover:bg-rose-500 disabled:opacity-50 active:scale-95 transition-all"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .input-dark {
          width: 100%; background: #0f172a; border: 1px solid #334155;
          border-radius: 0.75rem; padding: 0.6rem 0.875rem; color: #e2e8f0;
          font-size: 0.875rem; outline: none; transition: border-color 0.2s;
        }
        .input-dark:focus { border-color: #3b82f6; }
        .input-dark::placeholder { color: #475569; }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-500">{label}</label>
      {children}
    </div>
  );
}
