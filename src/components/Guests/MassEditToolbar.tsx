import React, { useState } from 'react';
import { Gender } from '../../types';

interface MassEditToolbarProps {
  selectedCount: number;
  onEditGender: (gender: Gender) => void;
  onEditRelationship: (rel: 'single' | 'taken') => void;
  onDeleteSelected: () => void;
  onClear: () => void;
}

export default function MassEditToolbar({
  selectedCount,
  onEditGender,
  onEditRelationship,
  onDeleteSelected,
  onClear,
}: MassEditToolbarProps) {
  const [genderValue, setGenderValue] = useState<Gender | ''>('');
  const [relValue, setRelValue] = useState<'single' | 'taken' | ''>('');

  return (
    <div className="border-t border-blue-200 bg-blue-50 px-3 py-2 flex items-center gap-2 flex-wrap text-xs">
      <span className="font-medium text-blue-700 shrink-0">{selectedCount} selected</span>

      <div className="flex items-center gap-1">
        <select
          value={genderValue}
          onChange={e => setGenderValue(e.target.value as Gender | '')}
          className="border border-stone-300 rounded px-1 py-0.5 text-xs bg-white"
        >
          <option value="">Set gender…</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
          <option value="unspecified">Unspecified</option>
        </select>
        <button
          disabled={!genderValue}
          onClick={() => { if (genderValue) { onEditGender(genderValue); setGenderValue(''); } }}
          className="bg-blue-500 text-white px-2 py-0.5 rounded disabled:opacity-40 hover:bg-blue-600"
        >
          Apply
        </button>
      </div>

      <div className="flex items-center gap-1">
        <select
          value={relValue}
          onChange={e => setRelValue(e.target.value as 'single' | 'taken' | '')}
          className="border border-stone-300 rounded px-1 py-0.5 text-xs bg-white"
        >
          <option value="">Set relationship…</option>
          <option value="single">Single</option>
          <option value="taken">Taken</option>
        </select>
        <button
          disabled={!relValue}
          onClick={() => { if (relValue) { onEditRelationship(relValue); setRelValue(''); } }}
          className="bg-blue-500 text-white px-2 py-0.5 rounded disabled:opacity-40 hover:bg-blue-600"
        >
          Apply
        </button>
      </div>

      <button
        onClick={onDeleteSelected}
        className="ml-auto bg-red-500 text-white px-2 py-0.5 rounded hover:bg-red-600"
      >
        Delete selected
      </button>

      <button
        onClick={onClear}
        className="text-stone-400 hover:text-stone-600 px-1"
        title="Clear selection"
      >
        ×
      </button>
    </div>
  );
}
