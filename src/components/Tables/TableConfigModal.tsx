import React, { useState } from 'react';
import { Table } from '../../types';
import Modal from '../UI/Modal';

interface TableConfigModalProps {
  table: Table;
  onSave: (updates: Partial<Table>) => void;
  onClose: () => void;
}

export default function TableConfigModal({ table, onSave, onClose }: TableConfigModalProps) {
  const [label, setLabel] = useState(table.label);
  const [seats, setSeats] = useState(table.seats);

  const minSeats = 4;
  const maxSeats = table.type === 'round' ? 12 : 20;

  const handleSave = () => {
    onSave({ label, seats });
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`Configure ${table.label}`}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Table Label</label>
          <input
            type="text"
            value={label}
            onChange={e => setLabel(e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Number of Seats ({minSeats}–{maxSeats})
          </label>
          <input
            type="number"
            value={seats}
            onChange={e => setSeats(Math.min(maxSeats, Math.max(minSeats, parseInt(e.target.value) || minSeats)))}
            className="input-field"
            min={minSeats}
            max={maxSeats}
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={handleSave} className="btn-primary flex-1">Save</button>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </Modal>
  );
}
