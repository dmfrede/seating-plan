import { Guest } from '../types';

export function validateGuest(guest: Partial<Guest>): string[] {
  const errors: string[] = [];
  
  if (!guest.name || guest.name.trim() === '') {
    errors.push('First name is required');
  }
  
  if (!guest.surname || guest.surname.trim() === '') {
    errors.push('Last name is required');
  }
  
  if (guest.age !== undefined && (guest.age < 0 || guest.age > 150)) {
    errors.push('Age must be between 0 and 150');
  }
  
  return errors;
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password: string): string[] {
  const errors: string[] = [];
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  
  return errors;
}

export function checkSameGenderAdjacent(
  tableId: string,
  assignments: Array<{ guestId: string; seatIndex: number }>,
  guests: Guest[]
): boolean {
  if (assignments.length < 2) return false;
  
  const sorted = [...assignments].sort((a, b) => a.seatIndex - b.seatIndex);
  
  for (let i = 0; i < sorted.length - 1; i++) {
    const g1 = guests.find(g => g.id === sorted[i].guestId);
    const g2 = guests.find(g => g.id === sorted[i + 1].guestId);
    
    if (g1 && g2 && g1.gender === g2.gender && 
        g1.gender !== 'other' && g1.gender !== 'unspecified') {
      return true;
    }
  }
  
  return false;
}
