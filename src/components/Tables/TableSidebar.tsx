import React, { useState } from 'react';
import { Table, TableType } from '../../types';
import TableConfigModal from './TableConfigModal';
import { ROUND_TABLE_DIAMETER, LONG_TABLE_1_WIDTH, LONG_TABLE_1_DEPTH, LONG_TABLE_2_WIDTH, LONG_TABLE_2_DEPTH } from '../../utils/constants';

interface TableSidebarProps {
  tables: Table[];
  onAddTable: (type: TableType, seats: number) => void;
  onRemoveTable: (tableId: string) => void;
  onUpdateTable: (tableId: string, updates: Partial<Table>) => void;
  selectedTableId: string | null;
  onSelectTable: (tableId: string | null) => void;
}

export default function TableSidebar({
  tables,
  onAddTable,
  onRemoveTable,
  onUpdateTable,
  selectedTableId,
  onSelectTable,
}: TableSidebarProps) {
  const [configTable, setConfigTable] = useState<Table | null>(null);

  const tableTypes: Array<{ type: TableType; label: string; desc: string; seats: number }> = [
    { type: 'round', label: 'Round Table', desc: `${ROUND_TABLE_DIAMETER}cm ⌀`, seats: 8 },
    { type: 'long1', label: 'Long Table L1', desc: `${LONG_TABLE_1_WIDTH}×${LONG_TABLE_1_DEPTH}cm`, seats: 8 },
    { type: 'long2', label: 'Long Table L2', desc: `${LONG_TABLE_2_WIDTH}×${LONG_TABLE_2_DEPTH}cm`, seats: 10 },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-stone-100">
        <h2 className="font-semibold text-stone-700 text-sm mb-3">Add Tables</h2>
        <div className="flex flex-col gap-2">
          {tableTypes.map(tt => (
            <button
              key={tt.type}
              onClick={() => onAddTable(tt.type, tt.seats)}
              className="flex items-center gap-3 p-2 rounded-lg border border-stone-200 hover:border-agerup-300 hover:bg-agerup-50 transition-colors text-left"
            >
              <span className="text-xl">{tt.type === 'round' ? '⭕' : '▬'}</span>
              <div>
                <div className="text-sm font-medium text-stone-700">{tt.label}</div>
                <div className="text-xs text-stone-400">{tt.desc} · {tt.seats} seats</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-3">
          <h2 className="font-semibold text-stone-700 text-sm mb-2">
            Tables ({tables.length})
          </h2>
          {tables.length === 0 ? (
            <p className="text-stone-400 text-xs">No tables yet. Add one above.</p>
          ) : (
            <ul className="space-y-1">
              {tables.map(table => (
                <li
                  key={table.id}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                    selectedTableId === table.id
                      ? 'bg-agerup-50 border border-agerup-200'
                      : 'hover:bg-stone-50 border border-transparent'
                  }`}
                  onClick={() => onSelectTable(table.id === selectedTableId ? null : table.id)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{table.type === 'round' ? '⭕' : '▬'}</span>
                    <div>
                      <div className="text-sm font-medium text-stone-700">{table.label}</div>
                      <div className="text-xs text-stone-400">{table.seats} seats</div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={e => { e.stopPropagation(); setConfigTable(table); }}
                      className="text-stone-400 hover:text-stone-600 p-1"
                      title="Configure"
                    >
                      ⚙
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); onRemoveTable(table.id); }}
                      className="text-red-400 hover:text-red-600 p-1"
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {configTable && (
        <TableConfigModal
          table={configTable}
          onSave={updates => {
            onUpdateTable(configTable.id, updates);
            setConfigTable(null);
          }}
          onClose={() => setConfigTable(null)}
        />
      )}
    </div>
  );
}
