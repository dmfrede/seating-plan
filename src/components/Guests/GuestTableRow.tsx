import React, { useState, useRef, useEffect } from 'react';
import { Guest, Gender } from '../../types';
import { COLORS } from '../../utils/constants';
import {
  COL_NAME, COL_SURNAME, COL_GENDER, COL_AGE, COL_REL, COL_PARTNER, COL_NOTES,
  COL_TABLE, COL_ROLE,
  GENDER_LABELS, PREDEFINED_ROLES,
} from './guestTableConstants';

// ---- Shared cell input ----

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

// ---- Partner searchable combobox ----

interface PartnerComboboxProps {
  guest: Guest;
  allGuests: Guest[];
  onSetPartner: (partnerId: string | undefined) => void;
  onDeactivate: () => void;
  onTab: (forward: boolean) => void;
}

function PartnerCombobox({ guest, allGuests, onSetPartner, onDeactivate, onTab }: PartnerComboboxProps) {
  const [query, setQuery] = useState('');
  const [highlightIdx, setHighlightIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Guests eligible: not already partnered with someone else (unless it's this guest's current partner)
  const eligible = allGuests.filter(g => {
    if (g.id === guest.id) return false;
    if (g.partnerId && g.partnerId !== guest.id) return false; // partnered with someone else
    return true;
  });

  const filtered = eligible.filter(g => {
    const full = `${g.name} ${g.surname}`.toLowerCase();
    return full.includes(query.toLowerCase());
  });

  // "none" option + filtered guests
  const options: Array<{ id: string | null; label: string }> = [
    { id: null, label: '— none —' },
    ...filtered.map(g => ({ id: g.id, label: `${g.name} ${g.surname}` })),
  ];

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { setHighlightIdx(0); }, [query]);

  function select(id: string | null) {
    onSetPartner(id ?? undefined);
    onDeactivate();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx(i => Math.min(i + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (options[highlightIdx]) select(options[highlightIdx].id);
    } else if (e.key === 'Escape') {
      onDeactivate();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      onDeactivate();
      onTab(!e.shiftKey);
    }
  }

  // Scroll highlighted item into view
  useEffect(() => {
    const li = listRef.current?.children[highlightIdx] as HTMLElement | undefined;
    li?.scrollIntoView({ block: 'nearest' });
  }, [highlightIdx]);

  return (
    <div className="relative" onMouseDown={e => e.stopPropagation()}>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={e => {
          // Only close if focus leaves the entire combobox
          if (!e.currentTarget.closest('[data-combobox]')?.contains(e.relatedTarget as Node)) {
            onDeactivate();
          }
        }}
        placeholder="Search…"
        className="w-full text-xs bg-white border border-blue-400 rounded px-1 py-0.5 outline-none min-w-0"
        data-combobox
      />
      <ul
        ref={listRef}
        data-combobox
        className="absolute left-0 top-full z-50 mt-0.5 w-48 max-h-40 overflow-y-auto bg-white border border-stone-200 rounded shadow-md text-xs"
      >
        {options.map((opt, i) => (
          <li
            key={opt.id ?? '__none__'}
            onMouseDown={e => { e.preventDefault(); select(opt.id); }}
            className={`px-2 py-1 cursor-pointer ${i === highlightIdx ? 'bg-blue-100 text-blue-800' : 'hover:bg-stone-50'} ${opt.id === null ? 'text-stone-400 italic' : ''}`}
          >
            {opt.label}
          </li>
        ))}
        {options.length === 1 && (
          <li className="px-2 py-1 text-stone-300 italic">No matches</li>
        )}
      </ul>
    </div>
  );
}

// ---- Role multi-select ----

interface RoleCellProps {
  roles: string[];
  onCommit: (roles: string[]) => void;
  onDeactivate: () => void;
  onTab: (forward: boolean) => void;
}

function RoleDropdown({ roles, onCommit, onDeactivate, onTab }: RoleCellProps) {
  const [selected, setSelected] = useState<string[]>(roles);
  const [customInput, setCustomInput] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  function toggle(role: string) {
    setSelected(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  }

  function addCustom() {
    const trimmed = customInput.trim();
    if (trimmed && !selected.includes(trimmed)) {
      setSelected(prev => [...prev, trimmed]);
    }
    setCustomInput('');
  }

  function commitAndClose(newSelected?: string[]) {
    onCommit(newSelected ?? selected);
    onDeactivate();
  }

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        commitAndClose();
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  return (
    <div
      ref={containerRef}
      className="absolute left-0 top-full z-50 mt-0.5 w-52 bg-white border border-stone-200 rounded shadow-md text-xs"
      onKeyDown={e => {
        if (e.key === 'Escape') commitAndClose();
        if (e.key === 'Tab') { e.preventDefault(); commitAndClose(); onTab(!e.shiftKey); }
      }}
    >
      <div className="max-h-44 overflow-y-auto p-1">
        {PREDEFINED_ROLES.map(role => (
          <label key={role} className="flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-stone-50 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(role)}
              onChange={() => toggle(role)}
              className="cursor-pointer"
            />
            {role}
          </label>
        ))}
        {selected.filter(r => !PREDEFINED_ROLES.includes(r)).map(role => (
          <label key={role} className="flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-stone-50 cursor-pointer text-blue-700">
            <input
              type="checkbox"
              checked
              onChange={() => toggle(role)}
              className="cursor-pointer"
            />
            {role}
          </label>
        ))}
      </div>
      <div className="border-t border-stone-100 p-1 flex gap-1">
        <input
          type="text"
          value={customInput}
          onChange={e => setCustomInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); addCustom(); }
            if (e.key === 'Escape') commitAndClose();
          }}
          placeholder="Add custom role…"
          className="flex-1 text-xs border border-stone-200 rounded px-1 py-0.5 outline-none"
        />
        <button
          onMouseDown={e => { e.preventDefault(); addCustom(); }}
          className="text-xs px-1.5 py-0.5 bg-stone-100 rounded hover:bg-stone-200"
        >+</button>
      </div>
    </div>
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
  columnOrder: number[];
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
  activeColIndex, columnOrder, onToggleSelect, onCellActivate, onCellDeactivate,
  onTab, onEnter, onUpdateGuest, onSetPartner, onPaste,
  onUnassign, onDelete, showGenderHighlight,
}: GuestTableRowProps) {
  const partner = guest.partnerId ? allGuests.find(g => g.id === guest.partnerId) : null;

  const rowStyle: React.CSSProperties = {
    ...(showGenderHighlight
      ? guest.gender === 'male' ? { backgroundColor: COLORS.genderMaleBg }
      : guest.gender === 'female' ? { backgroundColor: COLORS.genderFemaleBg }
      : { background: 'linear-gradient(90deg, #fde68a, #a7f3d0, #bfdbfe, #fbcfe8)' }
      : {}),
    ...(!isAssigned ? { outline: '1px solid black' } : {}),
  };

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

  function renderCell(col: number) {
    switch (col) {
      case COL_NAME:
        return <TextCell key={col} col={COL_NAME} value={guest.name} w="w-[70px]" />;

      case COL_SURNAME:
        return <TextCell key={col} col={COL_SURNAME} value={guest.surname} w="w-[70px]" />;

      case COL_GENDER:
        return (
          <td key={col} className={`${tdBase} w-[54px]`} onClick={activate(COL_GENDER)}>
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
        );

      case COL_AGE:
        return (
          <td key={col} className={`${tdBase} w-[44px]`} onClick={activate(COL_AGE)}>
            {isEditing(COL_AGE)
              ? <CellInput initialValue={guest.age?.toString() ?? ''} type="number" min={0} max={150} onCommit={v => commit(COL_AGE, v)} onDeactivate={onCellDeactivate} onTab={fwd => onTab(COL_AGE, fwd)} onEnter={() => onEnter(COL_AGE)} onPaste={onPaste} />
              : <span className="block text-center hover:bg-stone-100 rounded px-1 py-0.5 cursor-pointer">{guest.age ?? <span className="text-stone-300">—</span>}</span>}
          </td>
        );

      case COL_REL:
        return (
          <td key={col} className={`${tdBase} w-[64px]`} onClick={activate(COL_REL)}>
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
        );

      case COL_PARTNER:
        return (
          <td key={col} className={`${tdBase} w-[90px] relative`} onClick={activate(COL_PARTNER)}>
            {isEditing(COL_PARTNER)
              ? <PartnerCombobox
                  guest={guest}
                  allGuests={allGuests}
                  onSetPartner={onSetPartner}
                  onDeactivate={onCellDeactivate}
                  onTab={fwd => onTab(COL_PARTNER, fwd)}
                />
              : <span className="flex items-center gap-0.5 hover:bg-stone-100 rounded px-1 py-0.5 truncate cursor-pointer">
                  {partner ? <><span className="text-blue-500 shrink-0">⇔</span><span className="truncate">{partner.name} {partner.surname}</span></> : <span className="text-stone-300">—</span>}
                </span>}
          </td>
        );

      case COL_NOTES:
        return <TextCell key={col} col={COL_NOTES} value={guest.notes} w="min-w-[60px]" placeholder="Notes" />;

      case COL_TABLE:
        return (
          <td key={col} className={`${tdBase} w-[64px]`}>
            <span className="block truncate px-1 py-0.5 text-stone-500">
              {tableLabel ?? <span className="text-stone-300">—</span>}
            </span>
          </td>
        );

      case COL_ROLE: {
        const roles = guest.roles ?? [];
        return (
          <td key={col} className={`${tdBase} w-[100px] relative`} onClick={activate(COL_ROLE)}>
            {isEditing(COL_ROLE)
              ? <RoleDropdown
                  roles={roles}
                  onCommit={newRoles => onUpdateGuest({ roles: newRoles.length ? newRoles : undefined })}
                  onDeactivate={onCellDeactivate}
                  onTab={fwd => onTab(COL_ROLE, fwd)}
                />
              : <div className="flex flex-wrap gap-0.5 px-1 py-0.5 min-h-[18px] cursor-pointer hover:bg-stone-100 rounded">
                  {roles.length > 0
                    ? roles.map(r => (
                        <span key={r} className="bg-blue-100 text-blue-700 rounded px-1 py-0 text-[10px] leading-4 whitespace-nowrap">{r}</span>
                      ))
                    : <span className="text-stone-300">—</span>}
                </div>}
          </td>
        );
      }

      default:
        return null;
    }
  }

  return (
    <tr
      style={rowStyle}
      draggable={activeColIndex === null}
      onDragStart={e => { e.dataTransfer.setData('guestId', guest.id); e.dataTransfer.effectAllowed = 'move'; }}
      className={`border-b border-stone-100 text-xs ${isSelected ? 'ring-1 ring-inset ring-blue-400' : ''} ${activeColIndex === null ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      {/* Checkbox — always first */}
      <td className={`${tdBase} w-6 text-center`} onClick={e => e.stopPropagation()}>
        <input type="checkbox" checked={isSelected} onChange={onToggleSelect} className="cursor-pointer" />
      </td>

      {columnOrder.map(col => renderCell(col))}

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
