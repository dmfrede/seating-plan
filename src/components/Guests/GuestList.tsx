import React, { useState, useRef, useEffect } from 'react';
import { Guest, Gender, SeatAssignment, Table } from '../../types';
import GuestTableRow, { CellInput } from './GuestTableRow';
import {
  GENDER_LABELS,
  COL_NAME, COL_SURNAME, COL_GENDER, COL_AGE, COL_REL, COL_PARTNER, COL_NOTES, NUM_DATA_COLS,
} from './guestTableConstants';
import MassEditToolbar from './MassEditToolbar';
import CsvUploadModal from './CsvUploadModal';

interface DraftValues {
  name: string;
  surname: string;
  gender: Gender;
  age: string;
  relationship: string;
  notes: string;
}

const EMPTY_DRAFT: DraftValues = {
  name: '', surname: '', gender: 'unspecified', age: '', relationship: '', notes: '',
};

interface GuestListProps {
  guests: Guest[];
  seatAssignments: SeatAssignment[];
  tables: Table[];
  onAddGuest: (guest: Omit<Guest, 'id'>) => void;
  onAddGuests: (guests: Omit<Guest, 'id'>[]) => void;
  onRemoveGuest: (guestId: string) => void;
  onUnassign: (guestId: string) => void;
  onUpdateGuest: (guestId: string, updates: Partial<Guest>) => void;
  onUpdateGuests: (updates: Array<{ id: string; updates: Partial<Guest> }>) => void;
  showGenderHighlight: boolean;
  onToggleGenderHighlight: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

type SortColumn = 'name' | 'surname' | 'age';
type FilterAssigned = 'all' | 'assigned' | 'unassigned';

export default function GuestList({
  guests, seatAssignments, tables,
  onAddGuest, onAddGuests, onRemoveGuest, onUnassign, onUpdateGuest, onUpdateGuests,
  showGenderHighlight, onToggleGenderHighlight,
  onUndo, onRedo, canUndo, canRedo,
}: GuestListProps) {
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAssigned, setFilterAssigned] = useState<FilterAssigned>('all');
  const [filterGender, setFilterGender] = useState<Gender | 'all'>('all');
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeCell, setActiveCell] = useState<{ rowId: string | 'draft'; colIndex: number } | null>(null);
  const [draft, setDraft] = useState<DraftValues>(EMPTY_DRAFT);

  const draftRef = useRef<DraftValues>(EMPTY_DRAFT);
  const onAddGuestRef = useRef(onAddGuest);
  const prevRowIdRef = useRef<string | 'draft' | null>(null);

  useEffect(() => { onAddGuestRef.current = onAddGuest; }, [onAddGuest]);

  // Save draft when navigating away from draft row
  useEffect(() => {
    const prev = prevRowIdRef.current;
    const curr = activeCell?.rowId ?? null;
    prevRowIdRef.current = curr;
    if (prev !== 'draft' || curr === 'draft') return;

    const d = draftRef.current;
    if (!d.name.trim() || !d.surname.trim()) return;
    const age = parseInt(d.age);
    onAddGuestRef.current({
      name: d.name.trim(),
      surname: d.surname.trim(),
      gender: d.gender,
      age: isNaN(age) ? undefined : age,
      relationship: (['single', 'taken'].includes(d.relationship) ? d.relationship : undefined) as 'single' | 'taken' | undefined,
      notes: d.notes.trim() || undefined,
    });
    const empty = { ...EMPTY_DRAFT };
    draftRef.current = empty;
    setDraft(empty);
  }, [activeCell]);

  // ---- draft helpers ----

  function updateDraft(col: number, value: string) {
    setDraft(prev => {
      const next = { ...prev };
      if (col === COL_NAME) next.name = value;
      else if (col === COL_SURNAME) next.surname = value;
      else if (col === COL_GENDER) next.gender = value as Gender;
      else if (col === COL_AGE) next.age = value;
      else if (col === COL_REL) next.relationship = value;
      else if (col === COL_NOTES) next.notes = value;
      draftRef.current = next;
      return next;
    });
  }

  function tryCommitDraft() {
    const d = draftRef.current;
    if (!d.name.trim() || !d.surname.trim()) return;
    const age = parseInt(d.age);
    onAddGuestRef.current({
      name: d.name.trim(),
      surname: d.surname.trim(),
      gender: d.gender,
      age: isNaN(age) ? undefined : age,
      relationship: (['single', 'taken'].includes(d.relationship) ? d.relationship : undefined) as 'single' | 'taken' | undefined,
      notes: d.notes.trim() || undefined,
    });
    const empty = { ...EMPTY_DRAFT };
    draftRef.current = empty;
    setDraft(empty);
  }

  // ---- helpers ----

  function getAssignment(guestId: string) {
    return seatAssignments.find(a => a.guestId === guestId);
  }

  function getTableLabel(guestId: string): string | null {
    const a = getAssignment(guestId);
    if (!a) return null;
    return tables.find(t => t.id === a.tableId)?.label ?? null;
  }

  // ---- filter + sort ----

  const filtered = guests.filter(g => {
    const haystack = `${g.name} ${g.surname} ${g.notes ?? ''}`.toLowerCase();
    if (!haystack.includes(searchQuery.toLowerCase())) return false;
    const isAssigned = !!getAssignment(g.id);
    if (filterAssigned === 'assigned' && !isAssigned) return false;
    if (filterAssigned === 'unassigned' && isAssigned) return false;
    if (filterGender !== 'all' && g.gender !== filterGender) return false;
    return true;
  });

  const sorted = sortColumn
    ? [...filtered].sort((a, b) => {
        const dir = sortDir === 'asc' ? 1 : -1;
        if (sortColumn === 'age') return ((a.age ?? Infinity) - (b.age ?? Infinity)) * dir;
        return (a[sortColumn] ?? '').localeCompare(b[sortColumn] ?? '') * dir;
      })
    : filtered;

  // ---- sort toggle ----

  function handleSort(col: SortColumn) {
    if (sortColumn === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortColumn(col); setSortDir('asc'); }
  }

  function sortIcon(col: SortColumn) {
    if (sortColumn !== col) return <span className="text-stone-300 ml-0.5">⇅</span>;
    return <span className="text-blue-500 ml-0.5">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  // ---- selection ----

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === sorted.length && sorted.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sorted.map(g => g.id)));
    }
  }

  // ---- partner bidirectional helper ----

  function handleSetPartner(guestId: string, newPartnerId: string | undefined) {
    const guest = guests.find(g => g.id === guestId);
    if (!guest) return;
    const updates: Array<{ id: string; updates: Partial<Guest> }> = [];
    if (guest.partnerId && guest.partnerId !== newPartnerId) {
      updates.push({ id: guest.partnerId, updates: { partnerId: undefined } });
    }
    updates.push({ id: guestId, updates: { partnerId: newPartnerId } });
    if (newPartnerId) {
      const newPartner = guests.find(g => g.id === newPartnerId);
      if (newPartner) {
        if (newPartner.partnerId && newPartner.partnerId !== guestId) {
          updates.push({ id: newPartner.partnerId, updates: { partnerId: undefined } });
        }
        updates.push({ id: newPartnerId, updates: { partnerId: guestId } });
      }
    }
    onUpdateGuests(updates);
  }

  // ---- mass edit ----

  function handleMassGender(gender: Gender) {
    onUpdateGuests([...selectedIds].map(id => ({ id, updates: { gender } })));
  }

  function handleMassRelationship(rel: 'single' | 'taken') {
    onUpdateGuests([...selectedIds].map(id => ({ id, updates: { relationship: rel } })));
  }

  function handleMassDelete() {
    [...selectedIds].forEach(id => onRemoveGuest(id));
    setSelectedIds(new Set());
  }

  // ---- spreadsheet navigation ----

  function handleTab(rowId: string | 'draft', col: number, forward: boolean) {
    if (forward) {
      let nextCol = col + 1;
      if (rowId === 'draft' && nextCol === COL_PARTNER) nextCol++; // skip partner in draft

      if (nextCol < NUM_DATA_COLS) {
        setActiveCell({ rowId, colIndex: nextCol });
      } else {
        if (rowId === 'draft') {
          tryCommitDraft();
          setActiveCell({ rowId: 'draft', colIndex: COL_NAME });
        } else {
          const idx = sorted.findIndex(g => g.id === rowId);
          if (idx >= 0 && idx < sorted.length - 1) {
            setActiveCell({ rowId: sorted[idx + 1].id, colIndex: COL_NAME });
          } else {
            setActiveCell({ rowId: 'draft', colIndex: COL_NAME });
          }
        }
      }
    } else {
      let prevCol = col - 1;
      if (rowId === 'draft' && prevCol === COL_PARTNER) prevCol--; // skip partner in draft

      if (prevCol >= 0) {
        setActiveCell({ rowId, colIndex: prevCol });
      } else {
        if (rowId === 'draft') {
          if (sorted.length > 0) {
            setActiveCell({ rowId: sorted[sorted.length - 1].id, colIndex: NUM_DATA_COLS - 1 });
          } else {
            setActiveCell(null);
          }
        } else {
          const idx = sorted.findIndex(g => g.id === rowId);
          if (idx > 0) {
            setActiveCell({ rowId: sorted[idx - 1].id, colIndex: NUM_DATA_COLS - 1 });
          } else {
            setActiveCell(null);
          }
        }
      }
    }
  }

  function handleEnter(rowId: string | 'draft', col: number) {
    if (rowId === 'draft') {
      tryCommitDraft();
      setActiveCell({ rowId: 'draft', colIndex: COL_NAME });
    } else {
      const idx = sorted.findIndex(g => g.id === rowId);
      if (idx >= 0 && idx < sorted.length - 1) {
        setActiveCell({ rowId: sorted[idx + 1].id, colIndex: col });
      } else {
        setActiveCell({ rowId: 'draft', colIndex: col < NUM_DATA_COLS ? col : COL_NAME });
      }
    }
  }

  // ---- paste ----

  function handleGridPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    if (!activeCell) return;
    const text = e.clipboardData.getData('text/plain');
    processPaste(text, activeCell.rowId, activeCell.colIndex);
  }

  function applyPasteField(target: Partial<Guest>, colIdx: number, value: string) {
    if (colIdx === COL_NAME) { target.name = value; }
    else if (colIdx === COL_SURNAME) { target.surname = value; }
    else if (colIdx === COL_GENDER) {
      const v = value.toLowerCase();
      target.gender = v === 'male' || v === 'm' ? 'male'
        : v === 'female' || v === 'f' ? 'female'
        : v === 'other' || v === 'o' ? 'other'
        : 'unspecified';
    } else if (colIdx === COL_AGE) {
      const n = parseInt(value);
      target.age = isNaN(n) ? undefined : n;
    } else if (colIdx === COL_REL) {
      target.relationship = value === 'single' || value === 'taken' ? value : undefined;
    } else if (colIdx === COL_NOTES) { target.notes = value || undefined; }
    // COL_PARTNER: skip
  }

  function processPaste(text: string, startRowId: string | 'draft', startCol: number) {
    const lines = text.replace(/\r/g, '').split('\n').filter(l => l.trim());
    if (!lines.length) return;

    const startIdx = startRowId === 'draft' ? sorted.length : sorted.findIndex(g => g.id === startRowId);
    if (startIdx < 0) return;

    const existingUpdates: Array<{ id: string; updates: Partial<Guest> }> = [];
    const newGuests: Omit<Guest, 'id'>[] = [];

    for (let li = 0; li < lines.length; li++) {
      const cols = lines[li].split('\t');
      const rowIdx = startIdx + li;

      if (rowIdx < sorted.length) {
        const updates: Partial<Guest> = {};
        for (let ci = 0; ci < cols.length; ci++) {
          const colIdx = startCol + ci;
          if (colIdx >= NUM_DATA_COLS) break;
          applyPasteField(updates, colIdx, cols[ci].trim());
        }
        if (Object.keys(updates).length > 0) {
          existingUpdates.push({ id: sorted[rowIdx].id, updates });
        }
      } else {
        const g: Partial<Guest> = {};
        for (let ci = 0; ci < cols.length; ci++) {
          const colIdx = startCol + ci;
          if (colIdx >= NUM_DATA_COLS) break;
          applyPasteField(g, colIdx, cols[ci].trim());
        }
        if (g.name || g.surname) {
          newGuests.push({
            name: (g.name as string) || '',
            surname: (g.surname as string) || '',
            gender: (g.gender as Gender) || 'unspecified',
            age: g.age as number | undefined,
            relationship: g.relationship as 'single' | 'taken' | undefined,
            notes: g.notes as string | undefined,
          });
        }
      }
    }

    if (existingUpdates.length > 0) onUpdateGuests(existingUpdates);
    if (newGuests.length > 0) onAddGuests(newGuests);
  }

  // ---- column header ----

  function ColHeader({ col, label }: { col: SortColumn; label: string }) {
    return (
      <th
        className="px-1 py-1.5 text-left font-medium text-stone-600 cursor-pointer hover:text-stone-800 select-none whitespace-nowrap"
        onClick={() => handleSort(col)}
      >
        {label}{sortIcon(col)}
      </th>
    );
  }

  const allChecked = sorted.length > 0 && selectedIds.size === sorted.length;
  const someChecked = selectedIds.size > 0 && selectedIds.size < sorted.length;
  const tdBase = 'px-0.5 py-0.5';
  const selectCls = 'w-full text-xs bg-white border border-blue-400 rounded px-0.5 py-0.5 outline-none';
  const isDraftActive = (col: number) => activeCell?.rowId === 'draft' && activeCell.colIndex === col;
  const activateDraft = (col: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDraftActive(col)) setActiveCell({ rowId: 'draft', colIndex: col });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header controls */}
      <div className="p-2 border-b border-stone-100 space-y-2 shrink-0">
        <div className="flex items-center justify-between gap-1">
          <h2 className="font-semibold text-stone-700 text-sm shrink-0">
            Guests ({guests.length})
          </h2>
          <div className="flex items-center gap-1 flex-wrap justify-end">
            {(onUndo || onRedo) && (
              <>
                <button
                  onClick={onUndo}
                  disabled={!canUndo}
                  title="Undo (Ctrl+Z)"
                  className="text-xs py-1 px-2 border border-stone-200 rounded text-stone-600 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed"
                >↩</button>
                <button
                  onClick={onRedo}
                  disabled={!canRedo}
                  title="Redo (Ctrl+Y)"
                  className="text-xs py-1 px-2 border border-stone-200 rounded text-stone-600 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed"
                >↪</button>
              </>
            )}
            <button
              onClick={() => setShowCsvModal(true)}
              title="Upload CSV"
              className="text-xs py-1 px-2 border border-stone-200 rounded text-stone-600 hover:bg-stone-50"
            >
              📁 CSV
            </button>
            <button
              onClick={onToggleGenderHighlight}
              title="Toggle gender highlight"
              className={`text-xs py-1 px-2 border rounded transition-colors ${
                showGenderHighlight
                  ? 'border-blue-400 bg-blue-50 text-blue-600'
                  : 'border-stone-200 text-stone-400 hover:bg-stone-50'
              }`}
            >
              🎨
            </button>
          </div>
        </div>

        <input
          type="text"
          placeholder="Search name, surname, notes…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="input-field text-sm py-1.5 w-full"
        />

        <div className="flex items-center gap-1 flex-wrap">
          <div className="flex gap-1 text-xs">
            {(['all', 'unassigned', 'assigned'] as FilterAssigned[]).map(f => (
              <button
                key={f}
                onClick={() => setFilterAssigned(f)}
                className={`px-2 py-1 rounded capitalize transition-colors ${
                  filterAssigned === f
                    ? 'bg-blue-500 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <select
            value={filterGender}
            onChange={e => setFilterGender(e.target.value as Gender | 'all')}
            className="text-xs border border-stone-200 rounded px-1 py-1 bg-white ml-auto"
          >
            <option value="all">All genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="unspecified">Unspecified</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto min-h-0">
        <table className="w-full text-xs border-collapse" style={{ minWidth: 520 }}>
          <thead className="sticky top-0 bg-white z-10 shadow-[0_1px_0_0_#e7e5e4]">
            <tr>
              <th className="px-1 py-1.5 w-6 text-center">
                <input
                  type="checkbox"
                  checked={allChecked}
                  ref={el => { if (el) el.indeterminate = someChecked; }}
                  onChange={toggleSelectAll}
                  className="cursor-pointer"
                />
              </th>
              <ColHeader col="name" label="Name" />
              <ColHeader col="surname" label="Surname" />
              <th className="px-1 py-1.5 text-left font-medium text-stone-600 w-[54px]">Gender</th>
              <ColHeader col="age" label="Age" />
              <th className="px-1 py-1.5 text-left font-medium text-stone-600 w-[64px]">Rel.</th>
              <th className="px-1 py-1.5 text-left font-medium text-stone-600 w-[90px]">Partner</th>
              <th className="px-1 py-1.5 text-left font-medium text-stone-600">Notes</th>
              <th className="px-1 py-1.5 w-[28px]"></th>
              <th className="px-1 py-1.5 w-[24px]"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={10} className="pt-4 pb-1 text-center text-stone-400 text-sm">
                  {guests.length === 0
                    ? 'Type in the row below to add your first guest.'
                    : 'No guests match your filter.'}
                </td>
              </tr>
            )}

            {sorted.map(guest => {
              const isAssigned = !!getAssignment(guest.id);
              return (
                <GuestTableRow
                  key={guest.id}
                  guest={guest}
                  allGuests={guests}
                  isAssigned={isAssigned}
                  tableLabel={getTableLabel(guest.id)}
                  isSelected={selectedIds.has(guest.id)}
                  activeColIndex={activeCell?.rowId === guest.id ? activeCell.colIndex : null}
                  onToggleSelect={() => toggleSelect(guest.id)}
                  onCellActivate={col => setActiveCell({ rowId: guest.id, colIndex: col })}
                  onCellDeactivate={() => setActiveCell(null)}
                  onTab={(col, fwd) => handleTab(guest.id, col, fwd)}
                  onEnter={col => handleEnter(guest.id, col)}
                  onUpdateGuest={updates => onUpdateGuest(guest.id, updates)}
                  onSetPartner={partnerId => handleSetPartner(guest.id, partnerId)}
                  onPaste={handleGridPaste}
                  onUnassign={() => onUnassign(guest.id)}
                  onDelete={() => onRemoveGuest(guest.id)}
                  showGenderHighlight={showGenderHighlight}
                />
              );
            })}

            {/* Draft row — always at bottom for adding guests */}
            <tr
              className={`border-b border-dashed border-stone-200 text-xs bg-stone-50 ${
                activeCell?.rowId === 'draft' ? 'ring-1 ring-inset ring-blue-300' : ''
              }`}
            >
              <td className={`${tdBase} w-6`}></td>

              {/* Name */}
              <td className={`${tdBase} w-[70px]`} onClick={activateDraft(COL_NAME)}>
                {isDraftActive(COL_NAME)
                  ? <CellInput
                      initialValue={draft.name}
                      placeholder="Name"
                      onCommit={v => updateDraft(COL_NAME, v)}
                      onDeactivate={() => setActiveCell(null)}
                      onTab={fwd => handleTab('draft', COL_NAME, fwd)}
                      onEnter={() => handleEnter('draft', COL_NAME)}
                      onPaste={handleGridPaste}
                    />
                  : <span className="block truncate px-1 py-0.5 cursor-pointer hover:bg-stone-100 rounded text-stone-400">
                      {draft.name || 'Name…'}
                    </span>}
              </td>

              {/* Surname */}
              <td className={`${tdBase} w-[70px]`} onClick={activateDraft(COL_SURNAME)}>
                {isDraftActive(COL_SURNAME)
                  ? <CellInput
                      initialValue={draft.surname}
                      placeholder="Surname"
                      onCommit={v => updateDraft(COL_SURNAME, v)}
                      onDeactivate={() => setActiveCell(null)}
                      onTab={fwd => handleTab('draft', COL_SURNAME, fwd)}
                      onEnter={() => handleEnter('draft', COL_SURNAME)}
                      onPaste={handleGridPaste}
                    />
                  : <span className="block truncate px-1 py-0.5 cursor-pointer hover:bg-stone-100 rounded text-stone-400">
                      {draft.surname || 'Surname…'}
                    </span>}
              </td>

              {/* Gender */}
              <td className={`${tdBase} w-[54px]`} onClick={activateDraft(COL_GENDER)}>
                {isDraftActive(COL_GENDER)
                  ? <select
                      autoFocus
                      value={draft.gender}
                      className={selectCls}
                      onChange={e => { updateDraft(COL_GENDER, e.target.value); setActiveCell(null); }}
                      onKeyDown={e => {
                        if (e.key === 'Tab') { e.preventDefault(); handleTab('draft', COL_GENDER, !e.shiftKey); }
                        if (e.key === 'Escape') setActiveCell(null);
                      }}
                      onBlur={() => setActiveCell(null)}
                      onPaste={handleGridPaste}
                    >
                      <option value="unspecified">—</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  : <span className="block text-center px-1 py-0.5 cursor-pointer hover:bg-stone-100 rounded text-stone-400">
                      {draft.gender !== 'unspecified' ? GENDER_LABELS[draft.gender] : '—'}
                    </span>}
              </td>

              {/* Age */}
              <td className={`${tdBase} w-[44px]`} onClick={activateDraft(COL_AGE)}>
                {isDraftActive(COL_AGE)
                  ? <CellInput
                      initialValue={draft.age}
                      type="number"
                      min={0}
                      max={150}
                      onCommit={v => updateDraft(COL_AGE, v)}
                      onDeactivate={() => setActiveCell(null)}
                      onTab={fwd => handleTab('draft', COL_AGE, fwd)}
                      onEnter={() => handleEnter('draft', COL_AGE)}
                      onPaste={handleGridPaste}
                    />
                  : <span className="block text-center px-1 py-0.5 cursor-pointer hover:bg-stone-100 rounded text-stone-400">
                      {draft.age || '—'}
                    </span>}
              </td>

              {/* Relationship */}
              <td className={`${tdBase} w-[64px]`} onClick={activateDraft(COL_REL)}>
                {isDraftActive(COL_REL)
                  ? <select
                      autoFocus
                      value={draft.relationship}
                      className={selectCls}
                      onChange={e => { updateDraft(COL_REL, e.target.value); setActiveCell(null); }}
                      onKeyDown={e => {
                        if (e.key === 'Tab') { e.preventDefault(); handleTab('draft', COL_REL, !e.shiftKey); }
                        if (e.key === 'Escape') setActiveCell(null);
                      }}
                      onBlur={() => setActiveCell(null)}
                      onPaste={handleGridPaste}
                    >
                      <option value="">—</option>
                      <option value="single">Single</option>
                      <option value="taken">Taken</option>
                    </select>
                  : <span className="block text-center px-1 py-0.5 cursor-pointer hover:bg-stone-100 rounded capitalize text-stone-400">
                      {draft.relationship || '—'}
                    </span>}
              </td>

              {/* Partner — not editable in draft */}
              <td className={`${tdBase} w-[90px]`}>
                <span className="text-stone-200 px-1">—</span>
              </td>

              {/* Notes */}
              <td className={`${tdBase} min-w-[60px]`} onClick={activateDraft(COL_NOTES)}>
                {isDraftActive(COL_NOTES)
                  ? <CellInput
                      initialValue={draft.notes}
                      placeholder="Notes"
                      onCommit={v => updateDraft(COL_NOTES, v)}
                      onDeactivate={() => setActiveCell(null)}
                      onTab={fwd => handleTab('draft', COL_NOTES, fwd)}
                      onEnter={() => handleEnter('draft', COL_NOTES)}
                      onPaste={handleGridPaste}
                    />
                  : <span className="block truncate px-1 py-0.5 cursor-pointer hover:bg-stone-100 rounded text-stone-400">
                      {draft.notes || '—'}
                    </span>}
              </td>

              {/* Unassign / Delete — not applicable for draft */}
              <td className={`${tdBase} w-[28px]`}></td>
              <td className={`${tdBase} w-[24px]`}></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Mass edit toolbar */}
      {selectedIds.size >= 2 && (
        <MassEditToolbar
          selectedCount={selectedIds.size}
          onEditGender={handleMassGender}
          onEditRelationship={handleMassRelationship}
          onDeleteSelected={handleMassDelete}
          onClear={() => setSelectedIds(new Set())}
        />
      )}

      <CsvUploadModal
        isOpen={showCsvModal}
        onClose={() => setShowCsvModal(false)}
        onImport={onAddGuests}
      />
    </div>
  );
}
