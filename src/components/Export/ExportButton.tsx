import React, { useState } from 'react';
import { Guest, Table, SeatAssignment } from '../../types';
import { exportGuestListByName, exportGuestListByTable, downloadTextFile, exportSeatingChartPDF } from '../../utils/export';

interface ExportButtonProps {
  guests: Guest[];
  tables: Table[];
  seatAssignments: SeatAssignment[];
  canvasRef?: React.RefObject<HTMLElement>;
  eventName?: string;
  onError?: (message: string) => void;
}

export default function ExportButton({ guests, tables, seatAssignments, canvasRef, eventName, onError }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const name = eventName || 'seating-plan';

  const handleExportByName = () => {
    const content = exportGuestListByName(guests, tables, seatAssignments);
    downloadTextFile(content, `${name}-guests-by-name.txt`);
    setOpen(false);
  };

  const handleExportByTable = () => {
    const content = exportGuestListByTable(guests, tables, seatAssignments);
    downloadTextFile(content, `${name}-guests-by-table.txt`);
    setOpen(false);
  };

  const handleExportPDF = async () => {
    if (!canvasRef?.current) return;
    setExporting(true);
    try {
      await exportSeatingChartPDF(canvasRef.current, `${name}-seating-chart.pdf`);
    } catch {
      const msg = 'PDF export failed. Please try again.';
      if (onError) onError(msg); else console.error(msg);
    } finally {
      setExporting(false);
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1"
      >
        <span>📤</span> Export
        <span className="text-stone-400">▾</span>
      </button>
      
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-white border border-stone-200 rounded-lg shadow-lg z-20 min-w-[200px]">
            <button
              onClick={handleExportByName}
              className="w-full text-left px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 rounded-t-lg"
            >
              📋 Guest list by name
            </button>
            <button
              onClick={handleExportByTable}
              className="w-full text-left px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50"
            >
              🪑 Guest list by table
            </button>
            {canvasRef && (
              <button
                onClick={handleExportPDF}
                disabled={exporting}
                className="w-full text-left px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 rounded-b-lg disabled:opacity-50"
              >
                🖼 {exporting ? 'Generating PDF...' : 'Seating chart PDF'}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
