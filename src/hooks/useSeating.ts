import { useState, useCallback } from 'react';
import { SeatAssignment, Guest, Table } from '../types';
import { checkSameGenderAdjacent } from '../utils/validation';

export function useSeating(
  initialAssignments: SeatAssignment[] = [],
  guests: Guest[] = [],
  _tables: Table[] = []
) {
  const [assignments, setAssignments] = useState<SeatAssignment[]>(initialAssignments);
  const [showGenderWarnings, setShowGenderWarnings] = useState(true);

  const assign = useCallback((guestId: string, tableId: string, seatIndex: number) => {
    setAssignments(prev => {
      const filtered = prev.filter(
        a => a.guestId !== guestId && !(a.tableId === tableId && a.seatIndex === seatIndex)
      );
      return [...filtered, { guestId, tableId, seatIndex }];
    });
  }, []);

  const unassign = useCallback((guestId: string) => {
    setAssignments(prev => prev.filter(a => a.guestId !== guestId));
  }, []);

  const getGuestAtSeat = useCallback((tableId: string, seatIndex: number): Guest | undefined => {
    const assignment = assignments.find(a => a.tableId === tableId && a.seatIndex === seatIndex);
    if (!assignment) return undefined;
    return guests.find(g => g.id === assignment.guestId);
  }, [assignments, guests]);

  const getTableAssignments = useCallback((tableId: string): SeatAssignment[] => {
    return assignments.filter(a => a.tableId === tableId);
  }, [assignments]);

  const hasGenderWarning = useCallback((tableId: string): boolean => {
    if (!showGenderWarnings) return false;
    const tableAssignments = assignments
      .filter(a => a.tableId === tableId)
      .map(a => ({ guestId: a.guestId, seatIndex: a.seatIndex }));
    return checkSameGenderAdjacent(tableId, tableAssignments, guests);
  }, [assignments, guests, showGenderWarnings]);

  const assignedCount = assignments.length;
  const unassignedCount = guests.length - assignedCount;

  return {
    assignments,
    assign,
    unassign,
    getGuestAtSeat,
    getTableAssignments,
    hasGenderWarning,
    showGenderWarnings,
    setShowGenderWarnings,
    assignedCount,
    unassignedCount,
  };
}
