import { useState, useCallback } from 'react';
import { Guest, Table, SeatAssignment } from '../types';
import { generateDemoGuests, generateDemoTables, generateDemoAssignments } from '../utils/demoData';

export function useDemo() {
  const [guests, setGuests] = useState<Guest[]>(() => generateDemoGuests());
  const [tables, setTables] = useState<Table[]>(() => generateDemoTables());
  const [seatAssignments, setSeatAssignments] = useState<SeatAssignment[]>(() => {
    const g = generateDemoGuests();
    const t = generateDemoTables();
    return generateDemoAssignments(g, t);
  });

  const assignGuest = useCallback((guestId: string, tableId: string, seatIndex: number) => {
    setSeatAssignments(prev => {
      const filtered = prev.filter(a => a.guestId !== guestId && !(a.tableId === tableId && a.seatIndex === seatIndex));
      return [...filtered, { guestId, tableId, seatIndex }];
    });
  }, []);

  const unassignGuest = useCallback((guestId: string) => {
    setSeatAssignments(prev => prev.filter(a => a.guestId !== guestId));
  }, []);

  const addGuest = useCallback((guest: Omit<Guest, 'id'>) => {
    const newGuest: Guest = { ...guest, id: `demo-guest-${Date.now()}` };
    setGuests(prev => [...prev, newGuest]);
    return newGuest;
  }, []);

  const moveTable = useCallback((tableId: string, x: number, y: number) => {
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, position: { x, y } } : t));
  }, []);

  return {
    guests,
    tables,
    seatAssignments,
    assignGuest,
    unassignGuest,
    addGuest,
    moveTable,
  };
}
