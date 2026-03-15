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

interface AppState {
  tables: Table[];
  guests: Guest[];
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

  const [appTables, setAppTables] = useState<Table[]>([]);
  const [appGuests, setAppGuests] = useState<Guest[]>([]);
  const [appAssignments, setAppAssignments] = useState<SeatAssignment[]>([]);

  const { canUndo, canRedo, push: pushHistory, undo, redo } = useUndoRedo<AppState>({
    tables: appTables,
    guests: appGuests,
    seatAssignments: appAssignments,
  });

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

    setAppTables(prev => {
      const next = [...prev, newTable];
      pushHistory({ tables: next, guests: appGuests, seatAssignments: appAssignments });
      return next;
    });
  }, [isDemo, appGuests, appAssignments, pushHistory, addToast]);

  const handleRemoveTable = useCallback((tableId: string) => {
    if (isDemo) return;
    const newAssignments = appAssignments.filter(x => x.tableId !== tableId);
    setAppAssignments(newAssignments);
    setAppTables(prev => {
      const next = prev.filter(t => t.id !== tableId);
      pushHistory({ tables: next, guests: appGuests, seatAssignments: newAssignments });
      return next;
    });
    if (selectedTableId === tableId) setSelectedTableId(null);
  }, [isDemo, appGuests, appAssignments, pushHistory, selectedTableId]);

  const handleUpdateTable = useCallback((tableId: string, updates: Partial<Table>) => {
    if (isDemo) return;
    setAppTables(prev => {
      const next = prev.map(t => t.id === tableId ? { ...t, ...updates } : t);
      pushHistory({ tables: next, guests: appGuests, seatAssignments: appAssignments });
      return next;
    });
  }, [isDemo, appGuests, appAssignments, pushHistory]);

  const handleMoveTable = useCallback((tableId: string, x: number, y: number) => {
    if (isDemo) {
      demo.moveTable(tableId, x, y);
      return;
    }
    setAppTables(prev => prev.map(t => t.id === tableId ? { ...t, position: { x, y } } : t));
  }, [isDemo, demo]);

  const handleAddGuest = useCallback((guest: Omit<Guest, 'id'>) => {
    if (isDemo) {
      demo.addGuest(guest);
      addToast(`${guest.name} ${guest.surname} added!`, 'success');
      return;
    }
    const newGuest: Guest = { ...guest, id: `guest-${Date.now()}` };
    setAppGuests(prev => {
      const next = [...prev, newGuest];
      pushHistory({ tables: appTables, guests: next, seatAssignments: appAssignments });
      return next;
    });
    addToast(`${guest.name} ${guest.surname} added!`, 'success');
  }, [isDemo, demo, appTables, appAssignments, pushHistory, addToast]);

  const handleAddGuests = useCallback((newGuests: Omit<Guest, 'id'>[]) => {
    if (isDemo) {
      demo.addGuests(newGuests);
      addToast(`${newGuests.length} guests imported!`, 'success');
      return;
    }
    const withIds = newGuests.map((g, i) => ({ ...g, id: `guest-${Date.now()}-${i}` }));
    setAppGuests(prev => {
      const next = [...prev, ...withIds];
      pushHistory({ tables: appTables, guests: next, seatAssignments: appAssignments });
      return next;
    });
    addToast(`${newGuests.length} guests imported!`, 'success');
  }, [isDemo, demo, appTables, appAssignments, pushHistory, addToast]);

  const handleRemoveGuest = useCallback((guestId: string) => {
    if (isDemo) {
      demo.removeGuest(guestId);
      return;
    }
    const newAssignments = appAssignments.filter(x => x.guestId !== guestId);
    setAppAssignments(newAssignments);
    setAppGuests(prev => {
      const guestToRemove = prev.find(g => g.id === guestId);
      let updated = prev;
      if (guestToRemove?.partnerId) {
        updated = prev.map(g => g.id === guestToRemove.partnerId ? { ...g, partnerId: undefined } : g);
      }
      const next = updated.filter(g => g.id !== guestId);
      pushHistory({ tables: appTables, guests: next, seatAssignments: newAssignments });
      return next;
    });
  }, [isDemo, demo, appTables, appAssignments, pushHistory]);

  const handleUnassignGuest = useCallback((guestId: string) => {
    if (isDemo) {
      demo.unassignGuest(guestId);
      return;
    }
    setAppAssignments(prev => {
      const next = prev.filter(a => a.guestId !== guestId);
      pushHistory({ tables: appTables, guests: appGuests, seatAssignments: next });
      return next;
    });
  }, [isDemo, demo, appTables, appGuests, pushHistory]);

  const handleUpdateGuest = useCallback((guestId: string, updates: Partial<Guest>) => {
    if (isDemo) {
      demo.updateGuest(guestId, updates);
      return;
    }
    setAppGuests(prev => {
      const next = prev.map(g => g.id === guestId ? { ...g, ...updates } : g);
      pushHistory({ tables: appTables, guests: next, seatAssignments: appAssignments });
      return next;
    });
  }, [isDemo, demo, appTables, appAssignments, pushHistory]);

  const handleUpdateGuests = useCallback((updates: Array<{ id: string; updates: Partial<Guest> }>) => {
    if (isDemo) {
      demo.updateGuests(updates);
      return;
    }
    setAppGuests(prev => {
      const map = new Map(updates.map(u => [u.id, u.updates]));
      const next = prev.map(g => map.has(g.id) ? { ...g, ...map.get(g.id)! } : g);
      pushHistory({ tables: appTables, guests: next, seatAssignments: appAssignments });
      return next;
    });
  }, [isDemo, demo, appTables, appAssignments, pushHistory]);

  const handleSeatClick = useCallback((_tableId: string, _seatIndex: number) => {
    // Reserved for future seat assignment popover
  }, []);

  const handleAssignGuest = useCallback((guestId: string, tableId: string, seatIndex: number) => {
    if (isDemo) {
      demo.assignGuest(guestId, tableId, seatIndex);
      return;
    }
    setAppAssignments(prev => {
      const next = [
        ...prev.filter(a => a.guestId !== guestId && !(a.tableId === tableId && a.seatIndex === seatIndex)),
        { guestId, tableId, seatIndex },
      ];
      pushHistory({ tables: appTables, guests: appGuests, seatAssignments: next });
      return next;
    });
  }, [isDemo, demo, appTables, appGuests, pushHistory]);

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
        onUndo={!isDemo ? undo : undefined}
        onRedo={!isDemo ? redo : undefined}
        canUndo={canUndo}
        canRedo={canRedo}
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
            onUndo={!isDemo ? undo : undefined}
            onRedo={!isDemo ? redo : undefined}
            canUndo={canUndo}
            canRedo={canRedo}
          />
        </div>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
