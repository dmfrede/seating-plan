import React, { useState } from 'react';
import { Guest, SeatAssignment, Table } from '../../types';
import Modal from '../UI/Modal';
import GuestForm from './GuestForm';

interface GuestListProps {
  guests: Guest[];
  seatAssignments: SeatAssignment[];
  tables: Table[];
  onAddGuest: (guest: Omit<Guest, 'id'>) => void;
  onRemoveGuest: (guestId: string) => void;
  onUnassign: (guestId: string) => void;
}

export default function GuestList({
  guests,
  seatAssignments,
  tables,
  onAddGuest,
  onRemoveGuest,
  onUnassign,
}: GuestListProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAssigned, setFilterAssigned] = useState<'all' | 'assigned' | 'unassigned'>('all');

  const getGuestTable = (guestId: string): Table | null => {
    const assignment = seatAssignments.find(a => a.guestId === guestId);
    if (!assignment) return null;
    return tables.find(t => t.id === assignment.tableId) || null;
  };

  const filteredGuests = guests.filter(g => {
    const fullName = `${g.name} ${g.surname}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase());
    
    const assigned = seatAssignments.some(a => a.guestId === g.id);
    const matchesFilter =
      filterAssigned === 'all' ||
      (filterAssigned === 'assigned' && assigned) ||
      (filterAssigned === 'unassigned' && !assigned);
    
    return matchesSearch && matchesFilter;
  });

  const genderIcons: Record<string, string> = {
    male: '♂',
    female: '♀',
    other: '⊕',
    unspecified: '·',
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-stone-100">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-stone-700 text-sm">
            Guests ({guests.length})
          </h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary text-xs py-1 px-2"
          >
            + Add
          </button>
        </div>
        
        <input
          type="text"
          placeholder="Search guests..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="input-field text-sm py-1.5 mb-2"
        />
        
        <div className="flex gap-1 text-xs">
          {(['all', 'unassigned', 'assigned'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterAssigned(f)}
              className={`px-2 py-1 rounded capitalize transition-colors ${
                filterAssigned === f
                  ? 'bg-agerup-500 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredGuests.length === 0 ? (
          <div className="p-4 text-center text-stone-400 text-sm">
            {guests.length === 0 ? 'No guests yet. Add your first guest!' : 'No guests match your filter.'}
          </div>
        ) : (
          <ul className="divide-y divide-stone-50">
            {filteredGuests.map(guest => {
              const table = getGuestTable(guest.id);
              const isAssigned = !!table;
              
              return (
                <li
                  key={guest.id}
                  draggable={!isAssigned}
                  onDragStart={e => {
                    e.dataTransfer.setData('guestId', guest.id);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  className={`px-3 py-2 flex items-center justify-between hover:bg-stone-50 group ${!isAssigned ? 'cursor-grab active:cursor-grabbing' : ''}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-stone-400 text-xs w-4 text-center">
                      {genderIcons[guest.gender]}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-stone-700 truncate">
                        {guest.name} {guest.surname}
                      </div>
                      <div className="text-xs text-stone-400">
                        {isAssigned ? (
                          <span className="text-forest-600">📍 {table!.label}</span>
                        ) : (
                          <span className="text-amber-500">Unassigned</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isAssigned && (
                      <button
                        onClick={() => onUnassign(guest.id)}
                        title="Remove from table"
                        className="text-amber-400 hover:text-amber-600 text-xs p-1"
                      >
                        ↩
                      </button>
                    )}
                    <button
                      onClick={() => onRemoveGuest(guest.id)}
                      title="Remove guest"
                      className="text-red-400 hover:text-red-600 text-xs p-1"
                    >
                      ×
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Guest">
        <GuestForm onAdd={onAddGuest} onClose={() => setShowAddModal(false)} />
      </Modal>
    </div>
  );
}
