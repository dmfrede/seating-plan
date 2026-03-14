import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-agerup-50 to-forest-50 flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-agerup-500 rounded-full mb-6 shadow-lg">
          <span className="text-white text-4xl">🌿</span>
        </div>

        <h1 className="text-4xl font-bold text-agerup-800 mb-2">Agerup Farm</h1>
        <p className="text-xl text-agerup-600 mb-2">Seating Planner</p>
        <p className="text-stone-500 text-base max-w-md mb-10">
          Effortlessly plan and manage seating arrangements for your events at Agerup Farm.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <button
            onClick={() => navigate('/demo')}
            className="btn-secondary flex-1 text-base py-3"
          >
            🎯 Try Demo
          </button>
          <button
            onClick={() => navigate('/login')}
            className="btn-primary flex-1 text-base py-3"
          >
            Sign In
          </button>
        </div>

        <p className="mt-4 text-sm text-stone-500">
          New here?{' '}
          <button
            onClick={() => navigate('/signup')}
            className="text-agerup-600 hover:text-agerup-700 font-medium underline"
          >
            Create a free account
          </button>
        </p>
      </div>

      {/* Features strip */}
      <div className="bg-white border-t border-stone-100 py-8">
        <div className="max-w-2xl mx-auto px-6 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl mb-1">🪑</div>
            <p className="text-xs text-stone-600 font-medium">Drag &amp; Drop Tables</p>
          </div>
          <div>
            <div className="text-2xl mb-1">👥</div>
            <p className="text-xs text-stone-600 font-medium">Manage Guests</p>
          </div>
          <div>
            <div className="text-2xl mb-1">📄</div>
            <p className="text-xs text-stone-600 font-medium">Export &amp; Print</p>
          </div>
        </div>
      </div>
    </div>
  );
}
