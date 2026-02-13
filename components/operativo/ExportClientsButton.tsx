'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { exportClientsToExcel } from '@/app/dashboard/operativo/actions';

export function ExportClientsButton() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // 1. Traer datos del servidor
      const clients = await exportClientsToExcel();

      if (clients.length === 0) {
        alert('No hay clientes para exportar');
        return;
      }

      // 2. Crear Excel con openpyxl-style approach
      const XLSX = await import('xlsx');
      
      // Preparar datos para Excel
      const excelData = clients.map((client) => ({
        'Nombre': client.contact_name || 'Sin nombre',
        'Teléfono': client.phone_number,
        'ID Conversación': client.conversation_id || '-',
        'ID Display': client.conversation_display_id || '-',
        'Llamada Telefónica': client.llamada_por_tel ? 'Sí' : 'No',
        'Venta Confirmada': client.venta ? 'Sí' : 'No',
        'Fecha de Creación': new Date(client.created_at).toLocaleDateString('es-AR'),
        'Última Actualización': new Date(client.updated_at).toLocaleDateString('es-AR'),
      }));

      // Crear workbook y worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Ajustar anchos de columnas
      const colWidths = [
        { wch: 30 }, // Nombre
        { wch: 20 }, // Teléfono
        { wch: 15 }, // ID Conversación
        { wch: 15 }, // ID Display
        { wch: 18 }, // Llamada
        { wch: 18 }, // Venta
        { wch: 20 }, // Fecha Creación
        { wch: 20 }, // Última Actualización
      ];
      ws['!cols'] = colWidths;

      // Agregar hoja al workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Clientes');

      // Generar archivo y descargar
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `clientes-waichatt-${timestamp}.xlsx`;
      XLSX.writeFile(wb, filename);

    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al generar el archivo Excel');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl border border-emerald-500 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-600"
    >
      {isExporting ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          Exportando...
        </>
      ) : (
        <>
          <Download size={16} />
          Exportar Excel
        </>
      )}
    </button>
  );
}