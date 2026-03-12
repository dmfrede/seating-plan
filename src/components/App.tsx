import React, { useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useDemo } from '../hooks/useDemo';
import { useSeating } from '../hooks/useSeating';
import { useUndoRedo } from '../hooks/useUndoRedo';
import { Guest, Table, SeatAssignment, TableType, Toast } from '../types';
import { metersToPixels } from '../utils/canvas';
import { DEFAULT_VENUE_WIDTH, DEFAULT_VENUE_HEIGHT } from '../utils/constants';

import LoginForm from './Auth/LoginForm';
import SignupForm from './Auth/SignupForm';
import TopBar from './UI/TopBar';
import ToastContainer from './UI/Toast';
import VenueCanvas from './Canvas/VenueCanvas';
import TableSidebar from './Tables/TableSidebar';
import GuestList from './Guests/GuestList';
import ExportButton from './Export/ExportButton';
import DemoSignupCTA from './Demo/DemoSignupCTA';

type AuthView = 'login' | 'signup';
type AppMode = 'auth' | 'demo' | 'app';

interface AppState {
  tables: Table[];
  guests: Guest[];
  seatAssignments: SeatAssignment[];
}

let tableCounter = 1;

export default function App() {
  const { user, loading, login, signup, logout, error: authError } = useAuth();
  const demo = useDemo();
  
  const [mode, setMode] = useState<AppMode>('auth');
  const [authView, setAuthView] = useState<AuthView>('login');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [showGenderWarnings, setShowGenderWarnings] = useState(true);

  const [appTables, setAppTables] = useState<Table[]>([]);
  const [appGuests, setAppGuests] = useState<Guest[]>([]);
  const [appAssignments, setAppAssignments] = useState<SeatAssignment[]>([]);

  const { canUndo, canRedo, push: pushHistory, undo, redo } = useUndoRedo<AppState>({
    tables: appTables,
    guests: appGuests,
    seatAssignments: appAssignments,
  });

  const isDemo = mode === 'demo';
  const tables = isDemo ? demo.tables : appTables;
  const guests = isDemo ? demo.guests : appGuests;
  const assignments = isDemo ? demo.seatAssignments : appAssignments;

  const seating = useSeating(assignments, guests, tables);

  React.useEffect(() => {
    if (user && !loading) {
      setMode('app');
    }
  }, [user, loading]);

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
      setMode('app');
    } catch {
      // error handled by useAuth
    }
  };

  const handleSignup = async (email: string, password: string, name: string) => {
    try {
      await signup(email, password, name);
      setMode('app');
      addToast('Welcome to Agerup Farm Seating Planner!', 'success');
    } catch {
      // error handled by useAuth
    }
  };

  const handleLogout = async () => {
    await logout();
    setMode('auth');
    setAuthView('login');
  };

  const handleAddTable = useCallback((type: TableType, seats: number) => {
    if (isDemo) {
      addToast('Sign up to add custom tables!', 'info');
      return;
    }
    const num = tableCounter++;
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

  const handleRemoveGuest = useCallback((guestId: string) => {
    if (isDemo) return;
    const newAssignments = appAssignments.filter(x => x.guestId !== guestId);
    setAppAssignments(newAssignments);
    setAppGuests(prev => {
      const next = prev.filter(g => g.id !== guestId);
      pushHistory({ tables: appTables, guests: next, seatAssignments: newAssignments });
      return next;
    });
  }, [isDemo, appTables, appAssignments, pushHistory]);

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

  const handleSeatClick = useCallback((_tableId: string, _seatIndex: number) => {
    // Reserved for future seat assignment popover
  }, []);

  const totalSeats = tables.reduce((sum, t) => sum + t.seats, 0);
  const assignedCount = assignments.length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <div className="text-center">
          <div className="text-4xl mb-4">🌿</div>
          <p className="text-agerup-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (mode === 'auth') {
    if (authView === 'login') {
      return (
        <>
          <LoginForm
            onLogin={handleLogin}
            onSwitchToSignup={() => setAuthView('signup')}
            onDemo={() => setMode('demo')}
            error={authError}
            loading={loading}
          />
          <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </>
      );
    }
    return (
      <>
        <SignupForm
          onSignup={handleSignup}
          onSwitchToLogin={() => setAuthView('login')}
          onDemo={() => setMode('demo')}
          error={authError}
          loading={loading}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-stone-100">
      {isDemo && (
        <DemoSignupCTA
          onSignup={() => { setMode('auth'); setAuthView('signup'); }}
          onLogin={() => { setMode('auth'); setAuthView('login'); }}
        />
      )}
      
      <TopBar
        isDemo={isDemo}
        userName={user?.displayName || user?.email || undefined}
        onLogout={handleLogout}
        onLogin={() => { setMode('auth'); setAuthView('login'); }}
        totalSeats={totalSeats}
        assignedGuests={assignedCount}
        totalGuests={guests.length}
        onUndo={!isDemo ? undo : undefined}
        onRedo={!isDemo ? redo : undefined}
        canUndo={canUndo}
        canRedo={canRedo}
        showGenderWarnings={showGenderWarnings}
        onToggleGenderWarnings={() => setShowGenderWarnings(v => !v)}
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

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-white border-b border-stone-200 px-3 py-2 flex items-center justify-between">
            <span className="text-sm text-stone-500">
              Drag tables to position · Click to select · Scroll to zoom
            </span>
            <ExportButton
              guests={guests}
              tables={tables}
              seatAssignments={assignments}
              eventName="agerup-farm-event"
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
            showGenderWarnings={showGenderWarnings}
            hasGenderWarning={seating.hasGenderWarning}
          />
        </div>

        <div className="w-64 border-l border-stone-200 bg-white flex flex-col overflow-hidden">
          <GuestList
            guests={guests}
            seatAssignments={assignments}
            tables={tables}
            onAddGuest={handleAddGuest}
            onRemoveGuest={handleRemoveGuest}
            onUnassign={handleUnassignGuest}
          />
        </div>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
