import React, { useState, useRef } from 'react';
import { Guest, Gender } from '../../types';
import { COLORS } from '../../utils/constants';

// Column indices — exported so GuestList can reference them
export const COL_NAME = 0;
export const COL_SURNAME = 1;
export const COL_GENDER = 2;
export const COL_AGE = 3;
export const COL_REL = 4;
export const COL_PARTNER = 5;
export const COL_NOTES = 6;
export const NUM_DATA_COLS = 7;

export const GENDER_LABELS: Record<Gender, string> = {
  male: 'M', female: 'F', other: 'O', unspecified: '—',
};

// ---- Shared cell input (module-level so it never re-creates on parent renders) ----

interface CellInputProps {
  initialValue: string;
  type?: 'text' | 'number';
  placeholder?: string;
  min?: number;
  max?: number;
  onCommit: (value: string) => void;
  onDeactivate: () => void;
  onTab: (forward: boolean) => void;
  onEnter: () => void;
  onPaste: (e: React.ClipboardEvent) => void;
}

export function CellInput({
  initialValue, type = 'text', placeholder, min, max,
  onCommit, onDeactivate, onTab, onEnter, onPaste,
}: CellInputProps) {
  const [value, setValue] = useState(initialValue);
  const keyHandledRef = useRef(false);

  return (
    <input
      autoFocus
      type={type}
      value={value}
      placeholder={placeholder}
      min={min}
      max={max}
      onChange={e => setValue(e.target.value)}
      onKeyDown={e => {
        if (e.key === 'Tab') {
          e.preventDefault();
          keyHandledRef.current = true;
          onCommit(value);
          onTab(!e.shiftKey);
        } else if (e.key === 'Enter') {
          keyHandledRef.current = true;
          onCommit(value);
          onEnter();
        } else if (e.key === 'Escape') {
          keyHandledRef.current = true;
          onDeactivate();
        }
      }}
      onBlur={() => {
        if (keyHandledRef.current) { keyHandledRef.current = false; return; }
        onCommit(value);
        onDeactivate();
      }}
      onPaste={onPaste}
      className="w-full text-xs bg-white border border-blue-400 rounded px-1 py-0.5 outline-none min-w-0"
    />
  );
}

// ---- GuestTableRow ----

interface GuestTableRowProps {
  guest: Guest;
  allGuests: Guest[];
  isAssigned: boolean;
  tableLabel: string | null;
  isSelected: boolean;
  activeColIndex: number | null;
  onToggleSelect: () => void;
  onCellActivate: (col: number) => void;
  onCellDeactivate: () => void;
  onTab: (col: number, forward: boolean) => void;
  onEnter: (col: number) => void;
  onUpdateGuest: (updates: Partial<Guest>) => void;
  onSetPartner: (partnerId: string | undefined) => void;
  onPaste: (e: React.ClipboardEvent) => void;
  onUnassign: () => void;
  onDelete: () => void;
  showGenderHighlight: boolean;
}

export default function GuestTableRow({
  guest, allGuests, isAssigned, tableLabel, isSelected,
  activeColIndex, onToggleSelect, onCellActivate, onCellDeactivate,
  onTab, onEnter, onUpdateGuest, onSetPartner, onPaste,
  onUnassign, onDelete, showGenderHighlight,
}: GuestTableRowProps) {
  const partner = guest.partnerId ? allGuests.find(g => g.id === guest.partnerId) : null;

  const rowStyle: React.CSSProperties = showGenderHighlight
    ? guest.gender === 'male' ? { backgroundColor: COLORS.genderMaleBg }
    : guest.gender === 'female' ? { backgroundColor: COLORS.genderFemaleBg }
    : { background: 'linear-gradient(90deg, #fde68a, #a7f3d0, #bfdbfe, #fbcfe8)' }
    : {};

  function commit(col: number, value: string) {
    if (col === COL_NAME) { if (value.trim()) onUpdateGuest({ name: value.trim() }); }
    else if (col === COL_SURNAME) { if (value.trim()) onUpdateGuest({ surname: value.trim() }); }
    else if (col === COL_GENDER) { onUpdateGuest({ gender: (value as Gender) || 'unspecified' }); }
    else if (col === COL_AGE) { const n = parseInt(value); onUpdateGuest({ age: isNaN(n) ? undefined : n }); }
    else if (col === COL_REL) { onUpdateGuest({ relationship: (['single', 'taken'].includes(value) ? value : undefined) as 'single' | 'taken' | undefined }); }
    else if (col === COL_NOTES) { onUpdateGuest({ notes: value.trim() || undefined }); }
  }

  const tdBase = 'px-0.5 py-0.5';
  const isEditing = (col: number) => activeColIndex === col;
  const activate = (col: number) => (e: React.MouseEvent) => { e.stopPropagation(); if (!isEditing(col)) onCellActivate(col); };

  function TextCell({ col, value, w, placeholder }: { col: number; value?: string; w: string; placeholder?: string }) {
    return (
      <td className={`${tdBase} ${w}`} onClick={activate(col)}>
        {isEditing(col)
          ? <CellInput initialValue={value ?? ''} placeholder={placeholder} onCommit={v => commit(col, v)} onDeactivate={onCellDeactivate} onTab={fwd => onTab(col, fwd)} onEnter={() => onEnter(col)} onPaste={onPaste} />
          : <span className="block truncate hover:bg-stone-100 rounded px-1 py-0.5 cursor-pointer" title={value}>{value || <span className="text-stone-300">—</span>}</span>}
      </td>
    );
  }

  const selectCls = 'w-full text-xs bg-white border border-blue-400 rounded px-0.5 py-0.5 outline-none';

  return (
    <tr
      style={rowStyle}
      draggable={!isAssigned && activeColIndex === null}
      onDragStart={e => { e.dataTransfer.setData('guestId', guest.id); e.dataTransfer.effectAllowed = 'move'; }}
      className={`border-b border-stone-100 text-xs ${isSelected ? 'ring-1 ring-inset ring-blue-400' : ''} ${!isAssigned && activeColIndex === null ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      {/* Checkbox */}
      <td className={`${tdBase} w-6 text-center`} onClick={e => e.stopPropagation()}>
        <input type="checkbox" checked={isSelected} onChange={onToggleSelect} className="cursor-pointer" />
      </td>

      {/* Name */}
      <TextCell col={COL_NAME} value={guest.name} w="w-[70px]" />

      {/* Surname */}
      <TextCell col={COL_SURNAME} value={guest.surname} w="w-[70px]" />

      {/* Gender */}
      <td className={`${tdBase} w-[54px]`} onClick={activate(COL_GENDER)}>
        {isEditing(COL_GENDER)
          ? <select autoFocus value={guest.gender} className={selectCls}
              onChange={e => { commit(COL_GENDER, e.target.value); onCellDeactivate(); }}
              onKeyDown={e => { if (e.key === 'Tab') { e.preventDefault(); onTab(COL_GENDER, !e.shiftKey); } if (e.key === 'Escape') onCellDeactivate(); }}
              onBlur={onCellDeactivate} onPaste={onPaste}>
              <option value="unspecified">—</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          : <span className="block text-center hover:bg-stone-100 rounded px-1 py-0.5 cursor-pointer">{GENDER_LABELS[guest.gender]}</span>}
      </td>

      {/* Age */}
      <td className={`${tdBase} w-[44px]`} onClick={activate(COL_AGE)}>
        {isEditing(COL_AGE)
          ? <CellInput initialValue={guest.age?.toString() ?? ''} type="number" min={0} max={150} onCommit={v => commit(COL_AGE, v)} onDeactivate={onCellDeactivate} onTab={fwd => onTab(COL_AGE, fwd)} onEnter={() => onEnter(COL_AGE)} onPaste={onPaste} />
          : <span className="block text-center hover:bg-stone-100 rounded px-1 py-0.5 cursor-pointer">{guest.age ?? <span className="text-stone-300">—</span>}</span>}
      </td>

      {/* Relationship */}
      <td className={`${tdBase} w-[64px]`} onClick={activate(COL_REL)}>
        {isEditing(COL_REL)
          ? <select autoFocus value={guest.relationship ?? ''} className={selectCls}
              onChange={e => { commit(COL_REL, e.target.value); onCellDeactivate(); }}
              onKeyDown={e => { if (e.key === 'Tab') { e.preventDefault(); onTab(COL_REL, !e.shiftKey); } if (e.key === 'Escape') onCellDeactivate(); }}
              onBlur={onCellDeactivate} onPaste={onPaste}>
              <option value="">—</option>
              <option value="single">Single</option>
              <option value="taken">Taken</option>
            </select>
          : <span className="block text-center hover:bg-stone-100 rounded px-1 py-0.5 capitalize cursor-pointer">{guest.relationship ?? <span className="text-stone-300">—</span>}</span>}
      </td>

      {/* Partner */}
      <td className={`${tdBase} w-[90px]`} onClick={activate(COL_PARTNER)}>
        {isEditing(COL_PARTNER)
          ? <select autoFocus value={guest.partnerId ?? ''} className={selectCls}
              onChange={e => { onSetPartner(e.target.value || undefined); onCellDeactivate(); }}
              onKeyDown={e => { if (e.key === 'Tab') { e.preventDefault(); onTab(COL_PARTNER, !e.shiftKey); } if (e.key === 'Escape') onCellDeactivate(); }}
              onBlur={onCellDeactivate} onPaste={onPaste}>
              <option value="">— none —</option>
              {allGuests.filter(g => g.id !== guest.id).map(g => <option key={g.id} value={g.id}>{g.name} {g.surname}</option>)}
            </select>
          : <span className="flex items-center gap-0.5 hover:bg-stone-100 rounded px-1 py-0.5 truncate cursor-pointer">
              {partner ? <><span className="text-blue-500 shrink-0">⇔</span><span className="truncate">{partner.name} {partner.surname}</span></> : <span className="text-stone-300">—</span>}
            </span>}
      </td>

      {/* Notes */}
      <TextCell col={COL_NOTES} value={guest.notes} w="min-w-[60px]" placeholder="Notes" />

      {/* Unassign */}
      <td className={`${tdBase} w-[28px] text-center`}>
        {isAssigned
          ? <button onClick={e => { e.stopPropagation(); onUnassign(); }} title={`Remove from ${tableLabel}`} className="text-amber-500 hover:text-amber-700 text-xs px-1">↩</button>
          : <span className="text-stone-300 text-xs">—</span>}
      </td>

      {/* Delete */}
      <td className={`${tdBase} w-[24px] text-center`}>
        <button onClick={e => { e.stopPropagation(); onDelete(); }} title="Delete guest" className="text-red-400 hover:text-red-600 text-xs px-1">×</button>
      </td>
    </tr>
  );
}
