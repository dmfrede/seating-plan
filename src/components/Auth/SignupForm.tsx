import React, { useState } from 'react';
import AuthLayout from './AuthLayout';

interface SignupFormProps {
  onSignup: (email: string, password: string, name: string) => Promise<void>;
  onSwitchToLogin: () => void;
  onDemo: () => void;
  error?: string | null;
  loading?: boolean;
}

export default function SignupForm({ onSignup, onSwitchToLogin, onDemo, error, loading }: SignupFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    
    if (password !== confirm) {
      setLocalError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }
    
    await onSignup(email, password, name);
  };

  const displayError = localError || error;

  return (
    <AuthLayout title="Create your account" subtitle="Start planning your seating today">
      <form onSubmit={handleSubmit} className="space-y-4">
        {displayError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {displayError}
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="input-field"
            placeholder="Your name"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="input-field"
            placeholder="you@example.com"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="input-field"
            placeholder="Min. 6 characters"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Confirm Password</label>
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            className="input-field"
            placeholder="••••••••"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-stone-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-stone-400">or</span>
          </div>
        </div>
        
        <button
          type="button"
          onClick={onDemo}
          className="btn-secondary w-full"
        >
          🎯 Try Demo (no account needed)
        </button>
        
        <p className="text-center text-sm text-stone-500">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-agerup-600 hover:text-agerup-700 font-medium"
          >
            Sign in
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}
