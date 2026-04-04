"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X, Loader2, Building2 } from "lucide-react";

type Sucursal = { id: number; nombre: string; activa: boolean };
const EMPTY_FORM = { nombre: "", activa: true };

export function SucursalesClient({ initialSucursales }: { initialSucursales: Sucursal[] }) {
  const [sucursales, setSucursales] = useState<Sucursal[]>(initialSucursales);
  const [mode, setMode] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<Sucursal | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Sucursal | null>(null);

  function openCreate() {
    setEditing(null); setForm(EMPTY_FORM); setError(null); setMode("create");
  }
  function openEdit(s: Sucursal) {
    setEditing(s); setForm({ nombre: s.nombre, activa: s.activa }); setError(null); setMode("edit");
  }
  function closeModal() {
    setMode(null); setEditing(null); setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const url = mode === "create" ? "/api/superadmin/sucursales" : `/api/superadmin/sucursales/${editing!.id}`;
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: form.nombre.trim(), activa: form.activa }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error desconocido");
      if (mode === "create") {
        setSucursales(prev => [...prev, data].sort((a, b) => a.id - b.id));
      } else {
        setSucursales(prev => prev.map(s => s.id === data.id ? data : s));
      }
      closeModal();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(s: Sucursal) {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/superadmin/sucursales/${s.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al eliminar");
      setSucursales(prev => prev.filter(x => x.id !== s.id));
      setDeleteTarget(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-slate-500">
          {sucursales.length} sucursal{sucursales.length !== 1 ? "es" : ""}
        </p>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500 active:scale-95 transition-all"
        >
          <Plus size={15} /> Nueva sucursal
        </button>
      </div>

      {error && !mode && !deleteTarget && (
        <div className="mb-4 rounded-xl border border-rose-900/40 bg-rose-900/20 px-4 py-3 text-sm text-rose-400">{error}</div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-left text-[10px] font-black uppercase tracking-widest text-slate-600">
              <th className="px-4 py-3 w-12">#</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {sucursales.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <div className="flex flex-col items-center justify-center py-14 gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-slate-600">
                      <Building2 size={22} />
                    </div>
                    <p className="text-sm text-slate-600 font-medium">Sin sucursales creadas</p>
                    <button
                      onClick={openCreate}
                      className="text-xs text-emerald-500 hover:text-emerald-400 font-semibold transition-colors"
                    >
                      Crear la primera sucursal →
                    </button>
                  </div>
                </td>
              </tr>
            ) : sucursales.map((s) => (
              <tr key={s.id} className="group hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-xs font-black text-slate-400">{s.id}</span>
                </td>
                <td className="px-4 py-3 font-semibold text-slate-200">{s.nombre}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${s.activa ? "bg-emerald-900/40 text-emerald-400" : "bg-slate-800 text-slate-500"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${s.activa ? "bg-emerald-400" : "bg-slate-600"}`} />
                    {s.activa ? "Activa" : "Inactiva"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => openEdit(s)}
                      className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-700 hover:text-emerald-400 transition-colors"
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(s)}
                      className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-700 hover:text-rose-400 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
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
            <div className="h-1 bg-emerald-600 w-full" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-base font-black uppercase tracking-tight text-white">
                    {mode === "create" ? "Nueva sucursal" : "Editar sucursal"}
                  </h2>
                  {mode === "edit" && (
                    <p className="text-xs text-slate-500 mt-0.5">{editing?.nombre}</p>
                  )}
                </div>
                <button onClick={closeModal} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-500">Nombre *</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    className="input-dark"
                    placeholder="Ej: Sucursal Centro"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-500">Estado</label>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, activa: !form.activa })}
                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 transition-colors ${form.activa ? "border-emerald-700/50 bg-emerald-900/20" : "border-slate-700 bg-slate-800/40"}`}
                  >
                    <span className={`text-sm font-semibold ${form.activa ? "text-emerald-400" : "text-slate-500"}`}>
                      {form.activa ? "Activa" : "Inactiva"}
                    </span>
                    <div className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${form.activa ? "bg-emerald-600" : "bg-slate-700"}`}>
                      <span className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${form.activa ? "translate-x-5" : "translate-x-0"}`} />
                    </div>
                  </button>
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
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50 active:scale-95 transition-all"
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
              <h2 className="text-base font-black uppercase text-white mb-1">¿Eliminar sucursal?</h2>
              <p className="text-sm text-slate-400 mb-5">
                Vas a eliminar <span className="text-white font-semibold">{deleteTarget.nombre}</span>. Solo es posible si no tiene usuarios asignados.
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
        .input-dark:focus { border-color: #10b981; }
        .input-dark::placeholder { color: #475569; }
      `}</style>
    </div>
  );
}
