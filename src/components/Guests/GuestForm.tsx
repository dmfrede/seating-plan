import React, { useState } from 'react';
import { Guest, Gender } from '../../types';

interface GuestFormProps {
  onAdd: (guest: Omit<Guest, 'id'>) => void;
  onClose: () => void;
  initialValues?: Partial<Guest>;
}

export default function GuestForm({ onAdd, onClose, initialValues }: GuestFormProps) {
  const [name, setName] = useState(initialValues?.name || '');
  const [surname, setSurname] = useState(initialValues?.surname || '');
  const [gender, setGender] = useState<Gender>(initialValues?.gender || 'unspecified');
  const [age, setAge] = useState(initialValues?.age?.toString() || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !surname.trim()) return;
    
    onAdd({
      name: name.trim(),
      surname: surname.trim(),
      gender,
      age: age ? parseInt(age) : undefined,
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">First Name *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="input-field"
            placeholder="First name"
            required
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Last Name *</label>
          <input
            type="text"
            value={surname}
            onChange={e => setSurname(e.target.value)}
            className="input-field"
            placeholder="Last name"
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Gender</label>
          <select
            value={gender}
            onChange={e => setGender(e.target.value as Gender)}
            className="input-field"
          >
            <option value="unspecified">Not specified</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Age</label>
          <input
            type="number"
            value={age}
            onChange={e => setAge(e.target.value)}
            className="input-field"
            placeholder="Optional"
            min="0"
            max="150"
          />
        </div>
      </div>
      
      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary flex-1">
          Add Guest
        </button>
        <button type="button" onClick={onClose} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}
