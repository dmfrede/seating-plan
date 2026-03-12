import { Guest, Table, SeatAssignment } from '../types';
import { DEMO_GUEST_NAMES } from './constants';
import { metersToPixels } from './canvas';

export function generateDemoGuests(): Guest[] {
  return DEMO_GUEST_NAMES.map((g, i) => ({
    id: `demo-guest-${i}`,
    name: g.name,
    surname: g.surname,
    gender: g.gender,
    age: 25 + Math.floor(Math.random() * 40),
  }));
}

export function generateDemoTables(): Table[] {
  const venueWidth = metersToPixels(11);
  const venueHeight = metersToPixels(11.5);
  
  return [
    {
      id: 'demo-table-1',
      type: 'round',
      label: 'Table 1',
      number: 1,
      position: { x: venueWidth * 0.25, y: venueHeight * 0.25 },
      rotation: 0,
      seats: 8,
    },
    {
      id: 'demo-table-2',
      type: 'round',
      label: 'Table 2',
      number: 2,
      position: { x: venueWidth * 0.75, y: venueHeight * 0.25 },
      rotation: 0,
      seats: 8,
    },
    {
      id: 'demo-table-3',
      type: 'round',
      label: 'Table 3',
      number: 3,
      position: { x: venueWidth * 0.5, y: venueHeight * 0.5 },
      rotation: 0,
      seats: 8,
    },
    {
      id: 'demo-table-4',
      type: 'round',
      label: 'Table 4',
      number: 4,
      position: { x: venueWidth * 0.25, y: venueHeight * 0.75 },
      rotation: 0,
      seats: 8,
    },
    {
      id: 'demo-table-5',
      type: 'round',
      label: 'Table 5',
      number: 5,
      position: { x: venueWidth * 0.75, y: venueHeight * 0.75 },
      rotation: 0,
      seats: 8,
    },
  ];
}

export function generateDemoAssignments(guests: Guest[], tables: Table[]): SeatAssignment[] {
  const assignments: SeatAssignment[] = [];
  let guestIndex = 0;

  for (const table of tables) {
    const seatsToFill = Math.min(table.seats - 1, guests.length - guestIndex);
    for (let i = 0; i < seatsToFill; i++) {
      assignments.push({
        tableId: table.id,
        seatIndex: i,
        guestId: guests[guestIndex].id,
      });
      guestIndex++;
      if (guestIndex >= guests.length) break;
    }
    if (guestIndex >= guests.length) break;
  }

  return assignments;
}
