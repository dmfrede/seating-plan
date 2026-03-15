import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDemo } from '../../hooks/useDemo';
import { useUndoRedo } from '../../hooks/useUndoRedo';
import { Guest, Table, SeatAssignment, TableType, Toast } from '../../types';
import { metersToPixels } from '../../utils/canvas';
import { checkSameGenderAdjacent } from '../../utils/validation';
import { DEFAULT_VENUE_WIDTH, DEFAULT_VENUE_HEIGHT } from '../../utils/constants';

import TopBar from '../UI/TopBar';
import ToastContainer from '../UI/Toast';
import VenueCanvas from '../Canvas/VenueCanvas';
import TableSidebar from '../Tables/TableSidebar';
import GuestList from '../Guests/GuestList';
import ExportButton from '../Export/ExportButton';
import DemoSignupCTA from '../Demo/DemoSignupCTA';

interface SeatingSnapshot {
  tables: Table[];
  seatAssignments: SeatAssignment[];
}

interface MainAppProps {
  isDemo?: boolean;
}

export default function MainApp({ isDemo = false }: MainAppProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const demo = useDemo();
  const tableCounterRef = useRef(1);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [showGenderWarnings, setShowGenderWarnings] = useState(true);
  const [showGenderHighlight, setShowGenderHighlight] = useState(false);
  const [canvasFontSize, setCanvasFontSize] = useState(() => {
    const s = localStorage.getItem('canvasFontSize');
    return s ? parseInt(s) : 9;
  });

  useEffect(() => {
    localStorage.setItem('canvasFontSize', String(canvasFontSize));
  }, [canvasFontSize]);

  // ---- Two independent undo/redo stacks ----

  const guestHistory = useUndoRedo<Guest[]>([]);
  const seatingHistory = useUndoRedo<SeatingSnapshot>({ tables: [], seatAssignments: [] });

  const {
    current: appGuests,
    push: pushGuests,
    undo: undoGuests,
    redo: redoGuests,
    canUndo: canUndoGuests,
    canRedo: canRedoGuests,
  } = guestHistory;

  const {
    current: seatingCurrent,
    push: pushSeating,
    replace: replaceSeating,
    undo: undoSeating,
    redo: redoSeating,
    canUndo: canUndoSeating,
    canRedo: canRedoSeating,
  } = seatingHistory;

  const appTables = seatingCurrent.tables;
  const appAssignments = seatingCurrent.seatAssignments;

  const tables = isDemo ? demo.tables : appTables;
  const guests = isDemo ? demo.guests : appGuests;
  const assignments = isDemo ? demo.seatAssignments : appAssignments;

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleAddTable = useCallback((type: TableType, seats: number) => {
    if (isDemo) {
      addToast('Sign up to add custom tables!', 'info');
      return;
    }
    const num = tableCounterRef.current++;
    const newTable: Table = {
      id: `table-${Date.now()}`,
      type,
      label: `Table ${num}`,
      number: num,
      position: { x: metersToPixels(2) + Math.random() * metersToPixels(5), y: metersToPixels(2) + Math.random() * metersToPixels(5) },
      rotation: 0,
      seats,
    };
    pushSeating({ tables: [...appTables, newTable], seatAssignments: appAssignments });
  }, [isDemo, appTables, appAssignments, pushSeating, addToast]);

  const handleRemoveTable = useCallback((tableId: string) => {
    if (isDemo) return;
    const newAssignments = appAssignments.filter(x => x.tableId !== tableId);
    const nextTables = appTables.filter(t => t.id !== tableId);
    pushSeating({ tables: nextTables, seatAssignments: newAssignments });
    if (selectedTableId === tableId) setSelectedTableId(null);
  }, [isDemo, appTables, appAssignments, pushSeating, selectedTableId]);

  const handleUpdateTable = useCallback((tableId: string, updates: Partial<Table>) => {
    if (isDemo) return;
    const nextTables = appTables.map(t => t.id === tableId ? { ...t, ...updates } : t);
    pushSeating({ tables: nextTables, seatAssignments: appAssignments });
  }, [isDemo, appTables, appAssignments, pushSeating]);

  // Move table: update in-place without adding a history entry (continuous drag)
  const handleMoveTable = useCallback((tableId: string, x: number, y: number) => {
    if (isDemo) {
      demo.moveTable(tableId, x, y);
      return;
    }
    replaceSeating({
      tables: appTables.map(t => t.id === tableId ? { ...t, position: { x, y } } : t),
      seatAssignments: appAssignments,
    });
  }, [isDemo, demo, appTables, appAssignments, replaceSeating]);

  const handleAddGuest = useCallback((guest: Omit<Guest, 'id'>) => {
    if (isDemo) {
      demo.addGuest(guest);
      addToast(`${guest.name} ${guest.surname} added!`, 'success');
      return;
    }
    const newGuest: Guest = { ...guest, id: `guest-${Date.now()}` };
    pushGuests([...appGuests, newGuest]);
    addToast(`${guest.name} ${guest.surname} added!`, 'success');
  }, [isDemo, demo, appGuests, pushGuests, addToast]);

  const handleAddGuests = useCallback((newGuests: Omit<Guest, 'id'>[]) => {
    if (isDemo) {
      demo.addGuests(newGuests);
      addToast(`${newGuests.length} guests imported!`, 'success');
      return;
    }
    const withIds = newGuests.map((g, i) => ({ ...g, id: `guest-${Date.now()}-${i}` }));
    pushGuests([...appGuests, ...withIds]);
    addToast(`${newGuests.length} guests imported!`, 'success');
  }, [isDemo, demo, appGuests, pushGuests, addToast]);

  const handleRemoveGuest = useCallback((guestId: string) => {
    if (isDemo) {
      demo.removeGuest(guestId);
      return;
    }
    // Clean up guest + partner link
    const guestToRemove = appGuests.find(g => g.id === guestId);
    let updated = appGuests;
    if (guestToRemove?.partnerId) {
      updated = appGuests.map(g => g.id === guestToRemove.partnerId ? { ...g, partnerId: undefined } : g);
    }
    const nextGuests = updated.filter(g => g.id !== guestId);
    pushGuests(nextGuests);
    // Also clean up seat assignment (push to seating stack so it's independently undoable)
    const newAssignments = appAssignments.filter(x => x.guestId !== guestId);
    if (newAssignments.length !== appAssignments.length) {
      pushSeating({ tables: appTables, seatAssignments: newAssignments });
    }
  }, [isDemo, demo, appGuests, appTables, appAssignments, pushGuests, pushSeating]);

  const handleUnassignGuest = useCallback((guestId: string) => {
    if (isDemo) {
      demo.unassignGuest(guestId);
      return;
    }
    const next = appAssignments.filter(a => a.guestId !== guestId);
    pushSeating({ tables: appTables, seatAssignments: next });
  }, [isDemo, demo, appTables, appAssignments, pushSeating]);

  const handleUpdateGuest = useCallback((guestId: string, updates: Partial<Guest>) => {
    if (isDemo) {
      demo.updateGuest(guestId, updates);
      return;
    }
    const nextGuests = appGuests.map(g => g.id === guestId ? { ...g, ...updates } : g);
    pushGuests(nextGuests);
  }, [isDemo, demo, appGuests, pushGuests]);

  const handleUpdateGuests = useCallback((updates: Array<{ id: string; updates: Partial<Guest> }>) => {
    if (isDemo) {
      demo.updateGuests(updates);
      return;
    }
    const map = new Map(updates.map(u => [u.id, u.updates]));
    const nextGuests = appGuests.map(g => map.has(g.id) ? { ...g, ...map.get(g.id)! } : g);
    pushGuests(nextGuests);
  }, [isDemo, demo, appGuests, pushGuests]);

  const handleSeatClick = useCallback((_tableId: string, _seatIndex: number) => {
    // Reserved for future seat assignment popover
  }, []);

  const handleAssignGuest = useCallback((guestId: string, tableId: string, seatIndex: number) => {
    if (isDemo) {
      demo.assignGuest(guestId, tableId, seatIndex);
      return;
    }
    const next = [
      ...appAssignments.filter(a => a.guestId !== guestId && !(a.tableId === tableId && a.seatIndex === seatIndex)),
      { guestId, tableId, seatIndex },
    ];
    pushSeating({ tables: appTables, seatAssignments: next });
  }, [isDemo, demo, appTables, appAssignments, pushSeating]);

  const hasGenderWarning = useCallback((tableId: string): boolean => {
    if (!showGenderWarnings) return false;
    const tableAssignments = assignments
      .filter(a => a.tableId === tableId)
      .map(a => ({ guestId: a.guestId, seatIndex: a.seatIndex }));
    return checkSameGenderAdjacent(tableId, tableAssignments, guests);
  }, [assignments, guests, showGenderWarnings]);

  const totalSeats = tables.reduce((sum, t) => sum + t.seats, 0);
  const assignedCount = assignments.length;

  return (
    <div className="flex flex-col h-screen bg-stone-100">
      {isDemo && (
        <DemoSignupCTA
          onSignup={() => navigate('/signup')}
          onLogin={() => navigate('/login')}
        />
      )}

      <TopBar
        isDemo={isDemo}
        userName={user?.displayName || user?.email || undefined}
        onLogout={handleLogout}
        onLogin={() => navigate('/login')}
        totalSeats={totalSeats}
        assignedGuests={assignedCount}
        totalGuests={guests.length}
        onUndo={!isDemo ? undoSeating : undefined}
        onRedo={!isDemo ? redoSeating : undefined}
        canUndo={canUndoSeating}
        canRedo={canRedoSeating}
        showGenderWarnings={showGenderWarnings}
        onToggleGenderWarnings={() => setShowGenderWarnings(v => !v)}
        showGenderHighlight={showGenderHighlight}
        onToggleGenderHighlight={() => setShowGenderHighlight(v => !v)}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="w-56 border-r border-stone-200 bg-white flex flex-col overflow-hidden">
          <TableSidebar
            tables={tables}
            onAddTable={handleAddTable}
            onRemoveTable={handleRemoveTable}
            onUpdateTable={handleUpdateTable}
            selectedTableId={selectedTableId}
            onSelectTable={setSelectedTableId}
          />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="bg-white border-b border-stone-200 px-3 py-2 flex items-center justify-between">
            <span className="text-sm text-stone-500">
              Drag tables to position · Click to select · Scroll to zoom · Alt+drag to pan
            </span>
            <ExportButton
              guests={guests}
              tables={tables}
              seatAssignments={assignments}
              eventName="agerup-farm-event"
              onError={msg => addToast(msg, 'error')}
            />
          </div>

          <VenueCanvas
            tables={tables}
            guests={guests}
            seatAssignments={assignments}
            venueWidth={DEFAULT_VENUE_WIDTH}
            venueHeight={DEFAULT_VENUE_HEIGHT}
            selectedTableId={selectedTableId}
            onSelectTable={setSelectedTableId}
            onMoveTable={handleMoveTable}
            onSeatClick={handleSeatClick}
            onAssignGuest={handleAssignGuest}
            onUnassignGuest={handleUnassignGuest}
            onShowToast={(msg) => addToast(msg)}
            showGenderWarnings={showGenderWarnings}
            hasGenderWarning={hasGenderWarning}
            showGenderHighlight={showGenderHighlight}
            canvasFontSize={canvasFontSize}
            onFontSizeChange={setCanvasFontSize}
          />
        </div>

        <div className="w-[540px] border-l border-stone-200 bg-white flex flex-col overflow-hidden">
          <GuestList
            guests={guests}
            seatAssignments={assignments}
            tables={tables}
            onAddGuest={handleAddGuest}
            onAddGuests={handleAddGuests}
            onRemoveGuest={handleRemoveGuest}
            onUnassign={handleUnassignGuest}
            onUpdateGuest={handleUpdateGuest}
            onUpdateGuests={handleUpdateGuests}
            showGenderHighlight={showGenderHighlight}
            onToggleGenderHighlight={() => setShowGenderHighlight(v => !v)}
            onUndo={!isDemo ? undoGuests : undefined}
            onRedo={!isDemo ? redoGuests : undefined}
            canUndo={canUndoGuests}
            canRedo={canRedoGuests}
          />
        </div>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
