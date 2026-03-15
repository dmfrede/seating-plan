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

  const addGuests = useCallback((newGuests: Omit<Guest, 'id'>[]) => {
    const withIds = newGuests.map((g, i) => ({ ...g, id: `demo-guest-${Date.now()}-${i}` }));
    setGuests(prev => [...prev, ...withIds]);
  }, []);

  const removeGuest = useCallback((guestId: string) => {
    setGuests(prev => {
      const guestToRemove = prev.find(g => g.id === guestId);
      let updated = prev;
      if (guestToRemove?.partnerId) {
        updated = prev.map(g => g.id === guestToRemove.partnerId ? { ...g, partnerId: undefined } : g);
      }
      return updated.filter(g => g.id !== guestId);
    });
    setSeatAssignments(prev => prev.filter(a => a.guestId !== guestId));
  }, []);

  const updateGuest = useCallback((guestId: string, updates: Partial<Guest>) => {
    setGuests(prev => prev.map(g => g.id === guestId ? { ...g, ...updates } : g));
  }, []);

  const updateGuests = useCallback((updates: Array<{ id: string; updates: Partial<Guest> }>) => {
    setGuests(prev => {
      const map = new Map(updates.map(u => [u.id, u.updates]));
      return prev.map(g => map.has(g.id) ? { ...g, ...map.get(g.id)! } : g);
    });
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
    addGuests,
    removeGuest,
    updateGuest,
    updateGuests,
    moveTable,
  };
}
