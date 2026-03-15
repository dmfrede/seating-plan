import React, { useState } from 'react';
import { Guest, Gender } from '../../types';
import Modal from '../UI/Modal';

interface CsvUploadModalProps {
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
  error?: string;
}

function parseGender(raw: string): Gender {
  const v = raw.trim().toLowerCase();
  if (v === 'male' || v === 'm') return 'male';
  if (v === 'female' || v === 'f') return 'female';
  if (v === 'other' || v === 'o') return 'other';
  return 'unspecified';
}

function splitCsvLine(line: string): string[] {
  const cols: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      cols.push(current.trim()); current = '';
    } else {
      current += ch;
    }
  }
  cols.push(current.trim());
  return cols;
}

function parseCsvData(text: string): { rows: ParsedRow[]; errors: string[]; skipped: number } {
  const lines = text.replace(/\r/g, '').split('\n');
  const rows: ParsedRow[] = [];
  const errors: string[] = [];
  let skipped = 0;

  // Skip header row (first non-empty line)
  let startIdx = 0;
  while (startIdx < lines.length && !lines[startIdx].trim()) startIdx++;
  startIdx++; // skip header

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) { skipped++; continue; }

    const cols = splitCsvLine(line);
    const name = cols[0] ?? '';
    const surname = cols[1] ?? '';

    if (!name && !surname) { skipped++; continue; }

    if (!name || !surname) {
      errors.push(`Row ${i + 1}: missing ${!name ? 'first name' : 'last name'} — skipped`);
      continue;
    }

    const genderRaw = cols[2] ?? '';
    const ageRaw = cols[3] ?? '';
    const notes = cols[4] ?? '';
    const age = parseInt(ageRaw);

    const row: ParsedRow = {
      name,
      surname,
      gender: parseGender(genderRaw),
      age: isNaN(age) ? undefined : age,
      notes: notes || undefined,
    };

    if (ageRaw && isNaN(age)) {
      row.error = `Age "${ageRaw}" ignored`;
    }

    rows.push(row);
  }

  return { rows, errors, skipped };
}

export default function CsvUploadModal({ isOpen, onClose, onImport }: CsvUploadModalProps) {
  const [parsed, setParsed] = useState<{ rows: ParsedRow[]; errors: string[]; skipped: number } | null>(null);
  const [fileName, setFileName] = useState('');

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      setParsed(parseCsvData(text));
    };
    reader.readAsText(file);
  }

  function handleImport() {
    if (!parsed) return;
    onImport(parsed.rows.map(r => ({
      name: r.name,
      surname: r.surname,
      gender: r.gender,
      age: r.age,
      notes: r.notes,
    })));
    setParsed(null);
    setFileName('');
    onClose();
  }

  function handleClose() {
    setParsed(null);
    setFileName('');
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Upload CSV">
      <div className="space-y-3">
        <p className="text-sm text-stone-500">
          Upload a CSV file. First row is treated as header and skipped.<br />
          Expected columns: <strong>Name, Surname, Gender, Age, Notes</strong>
        </p>

        <div className="flex items-center gap-2">
          <label className="btn-secondary cursor-pointer">
            Choose file
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
          </label>
          {fileName && <span className="text-sm text-stone-600 truncate">{fileName}</span>}
        </div>

        {parsed && (
          <div className="space-y-2">
            <p className="text-xs text-stone-500">
              {parsed.rows.length} valid row{parsed.rows.length !== 1 ? 's' : ''} found
              {parsed.skipped > 0 ? `, ${parsed.skipped} empty rows skipped` : ''}
            </p>

            {parsed.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700 space-y-0.5">
                {parsed.errors.map((err, i) => <div key={i}>{err}</div>)}
              </div>
            )}

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
                  {parsed.rows.map((row, i) => (
                    <tr key={i} className={row.error ? 'bg-amber-50' : ''}>
                      <td className="px-2 py-1 text-stone-400">{i + 1}</td>
                      <td className="px-2 py-1">{row.name}</td>
                      <td className="px-2 py-1">{row.surname}</td>
                      <td className="px-2 py-1">{row.gender !== 'unspecified' ? row.gender : '—'}</td>
                      <td className="px-2 py-1">{row.age ?? '—'}</td>
                      <td className="px-2 py-1 max-w-[100px] truncate">{row.notes ?? '—'}</td>
                      <td className="px-2 py-1 text-amber-600">{row.error ?? ''}</td>
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
            disabled={!parsed || parsed.rows.length === 0}
            className="btn-primary flex-1 disabled:opacity-40"
          >
            {parsed ? `Import ${parsed.rows.length} guests` : 'Import'}
          </button>
          <button onClick={handleClose} className="btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
