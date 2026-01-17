'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

type Point = { day: string; ventas: number; facturas?: number };

export function VentasLineChart({ data }: { data: Point[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-sm text-slate-400">
        Sin datos para graficar en este rango
      </div>
    );
  }

  return (
    <div className="h-[320px] min-w-0 rounded-lg border border-slate-700 bg-slate-800 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="day" stroke="#94a3b8" style={{ fontSize: '12px' }} />
          <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
            labelStyle={{ color: '#f1f5f9' }}
          />
          <Line type="monotone" dataKey="ventas" stroke="#3b82f6" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
