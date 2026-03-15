export type Gender = 'male' | 'female' | 'other' | 'unspecified';

export interface Guest {
  id: string;
  name: string;
  surname: string;
  gender: Gender;
  age?: number;
  notes?: string;
  relationship?: 'single' | 'taken';
  partnerId?: string;
  tableId?: string;
  seatIndex?: number;
}

export type TableType = 'round' | 'long1' | 'long2';

export interface TablePosition {
  x: number;
  y: number;
}

export interface Table {
  id: string;
  type: TableType;
  label: string;
  number: number;
  position: TablePosition;
  rotation: number;
  seats: number;
  endSeats?: number;
  linkedTableId?: string;
}

export interface SeatAssignment {
  tableId: string;
  seatIndex: number;
  guestId: string;
}

export interface Version {
  id: string;
  eventId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  tables: Table[];
  guests: Guest[];
  seatAssignments: SeatAssignment[];
  venueWidth: number;
  venueHeight: number;
  minTableDistance: number;
}

export interface Event {
  id: string;
  userId: string;
  name: string;
  date?: string;
  venue?: string;
  createdAt: Date;
  updatedAt: Date;
  versions: string[];
  currentVersionId?: string;
}

export interface User {
  id: string;
  email: string;
  displayName?: string;
  createdAt: Date;
}

export interface VenueConfig {
  width: number;
  height: number;
  gridSize: number;
  minTableDistance: number;
}

export interface CanvasState {
  scale: number;
  offsetX: number;
  offsetY: number;
  isDragging: boolean;
  selectedTableId: string | null;
}

export interface GenderWarning {
  tableId: string;
  seatIndices: number[];
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export interface DemoState {
  isDemo: boolean;
  guests: Guest[];
  tables: Table[];
  seatAssignments: SeatAssignment[];
}
