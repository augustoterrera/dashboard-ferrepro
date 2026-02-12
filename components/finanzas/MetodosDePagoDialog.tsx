"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { InfoTip } from "@/components/info-tip";

type MetodoPagoTop = {
  tipo_pago: string;
  cantidad_usos: number;
  monto_total: number;
  pct_sobre_total: number;
};

function moneyARS(n: number) {
  return (n ?? 0).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}

function pct(n: number) {
  return `${Number(n ?? 0).toFixed(2)}%`;
}

export function MetodosPagoDialog(props: {
  data: MetodoPagoTop[] | null | undefined;
  from?: string | null;
  to?: string | null;
  limit?: number;
}) {
  const { data, from = null, to = null, limit = 5 } = props;
  const [open, setOpen] = React.useState(false);

  const rows = Array.isArray(data) ? data : [];

  return (
    <>
      {/* BOTÓN */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="border-slate-800 bg-slate-950/40 text-slate-200 hover:bg-slate-900"
          onClick={() => setOpen(true)}
        >
          Ver métodos de pago
        </Button>

        <InfoTip text="Abrí el detalle para ver el ranking de métodos de pago más usados en el período seleccionado." />
      </div>

      {/* DIALOG */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-slate-950 border-slate-800 text-slate-100 sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Métodos de pago más usados
              <InfoTip
                text="Ordenados por cantidad de usos. Incluye monto total y porcentaje sobre el total del período."
              />
            </DialogTitle>

            <DialogDescription className="text-slate-400">
              {from && to ? (
                <>
                  Período{" "}
                  <span className="font-mono">
                    {from} → {to}
                  </span>
                </>
              ) : (
                "Período histórico"
              )}
              {limit ? ` • Top ${limit}` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 overflow-hidden rounded-lg border border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-900/60 border-b border-slate-800">
                <tr className="text-slate-300">
                  <th className="px-4 py-3 text-left">
                    <span className="inline-flex items-center gap-2">
                      Método
                      <InfoTip text="Campo factura_pagos.tipo_pago." />
                    </span>
                  </th>
                  <th className="px-4 py-3 text-right">
                    <span className="inline-flex items-center gap-2 justify-end w-full">
                      Usos
                      <InfoTip text="Cantidad de veces utilizado el método." />
                    </span>
                  </th>
                  <th className="px-4 py-3 text-right">
                    <span className="inline-flex items-center gap-2 justify-end w-full">
                      Monto
                      <InfoTip text="Suma total pagada con este método." />
                    </span>
                  </th>
                  <th className="px-4 py-3 text-right">
                    <span className="inline-flex items-center gap-2 justify-end w-full">
                      %
                      <InfoTip text="Participación sobre el total del período." />
                    </span>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-10 text-center text-slate-400"
                    >
                      No hay datos para mostrar
                    </td>
                  </tr>
                ) : (
                  rows.map((r, idx) => (
                    <tr
                      key={`${r.tipo_pago}-${idx}`}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium">
                        {r.tipo_pago || "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {r.cantidad_usos}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {moneyARS(r.monto_total)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-300">
                        {pct(r.pct_sobre_total)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
