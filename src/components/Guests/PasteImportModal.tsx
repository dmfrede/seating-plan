import React, { useState, useMemo } from 'react';
import { Guest, Gender } from '../../types';
import Modal from '../UI/Modal';

interface PasteImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (guests: Omit<Guest, 'id'>[]) => void;
}

interface ParsedRow {
  name: string;
  surname: string;
  gender: Gender;
  age?: number;
  notes?: string;
  warning?: string;
}

function parseGender(raw: string): Gender {
  const v = raw.trim().toLowerCase();
  if (v === 'male' || v === 'm') return 'male';
  if (v === 'female' || v === 'f') return 'female';
  if (v === 'other' || v === 'o') return 'other';
  return 'unspecified';
}

function parsePastedData(raw: string): { rows: ParsedRow[]; skipped: number } {
  const lines = raw.replace(/\r/g, '').split('\n');
  const rows: ParsedRow[] = [];
  let skipped = 0;

  for (const line of lines) {
    const cols = line.split('\t').map(c => c.trim());
    const name = cols[0] ?? '';
    const surname = cols[1] ?? '';
    if (!name && !surname) { skipped++; continue; }

    const genderRaw = cols[2] ?? '';
    const ageRaw = cols[3] ?? '';
    const notes = cols[4] ?? '';
    const age = parseInt(ageRaw);

    const row: ParsedRow = {
      name: name || '?',
      surname: surname || '?',
      gender: parseGender(genderRaw),
      age: isNaN(age) ? undefined : age,
      notes: notes || undefined,
    };

    if (!name) row.warning = 'Missing first name';
    else if (!surname) row.warning = 'Missing last name';
    else if (ageRaw && isNaN(age)) row.warning = `Age "${ageRaw}" ignored`;

    rows.push(row);
  }

  return { rows, skipped };
}

export default function PasteImportModal({ isOpen, onClose, onImport }: PasteImportModalProps) {
  const [raw, setRaw] = useState('');

  const { rows, skipped } = useMemo(() => parsePastedData(raw), [raw]);
  const validRows = rows.filter(r => r.name !== '?' && r.surname !== '?');

  function handleImport() {
    onImport(validRows.map(r => ({
      name: r.name,
      surname: r.surname,
      gender: r.gender,
      age: r.age,
      notes: r.notes,
    })));
    setRaw('');
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={() => { setRaw(''); onClose(); }} title="Paste from Excel">
      <div className="space-y-3">
        <p className="text-sm text-stone-500">
          Copy rows from Excel and paste below.<br />
          Expected columns: <strong>Name · Surname · Gender · Age · Notes</strong>
        </p>

        <textarea
          className="w-full border border-stone-300 rounded p-2 text-sm font-mono resize-y"
          rows={6}
          placeholder={'Emma\tJohnson\tFemale\t32\tVegetarian'}
          value={raw}
          onChange={e => setRaw(e.target.value)}
          autoFocus
        />

        {rows.length > 0 && (
          <div>
            <p className="text-xs text-stone-500 mb-1">
              {validRows.length} valid row{validRows.length !== 1 ? 's' : ''} found
              {skipped > 0 ? `, ${skipped} empty rows skipped` : ''}
            </p>
            <div className="max-h-48 overflow-y-auto border border-stone-200 rounded">
              <table className="w-full text-xs">
                <thead className="bg-stone-50 sticky top-0">
                  <tr>
                    <th className="px-2 py-1 text-left font-medium text-stone-600">#</th>
                    <th className="px-2 py-1 text-left font-medium text-stone-600">Name</th>
                    <th className="px-2 py-1 text-left font-medium text-stone-600">Surname</th>
                    <th className="px-2 py-1 text-left font-medium text-stone-600">Gender</th>
                    <th className="px-2 py-1 text-left font-medium text-stone-600">Age</th>
                    <th className="px-2 py-1 text-left font-medium text-stone-600">Notes</th>
                    <th className="px-2 py-1 text-left font-medium text-stone-600">⚠</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className={row.warning ? 'bg-amber-50' : ''}>
                      <td className="px-2 py-1 text-stone-400">{i + 1}</td>
                      <td className="px-2 py-1">{row.name}</td>
                      <td className="px-2 py-1">{row.surname}</td>
                      <td className="px-2 py-1">{row.gender !== 'unspecified' ? row.gender : '—'}</td>
                      <td className="px-2 py-1">{row.age ?? '—'}</td>
                      <td className="px-2 py-1 max-w-[100px] truncate">{row.notes ?? '—'}</td>
                      <td className="px-2 py-1 text-amber-600">{row.warning ?? ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleImport}
            disabled={validRows.length === 0}
            className="btn-primary flex-1 disabled:opacity-40"
          >
            Import {validRows.length > 0 ? `${validRows.length} guests` : ''}
          </button>
          <button onClick={() => { setRaw(''); onClose(); }} className="btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
