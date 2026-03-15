import React from 'react';

interface TopBarProps {
  isDemo: boolean;
  userName?: string;
  onLogout: () => void;
  onLogin: () => void;
  showGenderWarnings: boolean;
  onToggleGenderWarnings: () => void;
  showGenderHighlight: boolean;
  onToggleGenderHighlight: () => void;
}

export default function TopBar({
  isDemo,
  userName,
  onLogout,
  onLogin,
  showGenderWarnings,
  onToggleGenderWarnings,
  showGenderHighlight,
  onToggleGenderHighlight,
}: TopBarProps) {
  return (
    <header className="bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-agerup-500 text-xl">🌿</span>
          <div>
            <span className="font-bold text-agerup-800 text-sm">Agerup Farm</span>
            <span className="text-stone-400 text-sm"> · Seating Planner</span>
          </div>
        </div>

        {isDemo && (
          <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-1 rounded-full">
            Demo Mode
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleGenderWarnings}
            title="Toggle gender warnings (same-gender adjacent seating)"
            className={`p-1.5 rounded text-sm transition-colors ${
              showGenderWarnings
                ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'
            }`}
          >
            ⚡
          </button>

          <button
            onClick={onToggleGenderHighlight}
            title="Toggle gender highlight colors"
            className={`p-1.5 rounded text-sm transition-colors ${
              showGenderHighlight
                ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'
            }`}
          >
            🎨
          </button>
        </div>

        {!isDemo ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-stone-600 hidden sm:inline">{userName}</span>
            <button onClick={onLogout} className="btn-secondary text-sm py-1.5 px-3">
              Sign Out
            </button>
          </div>
        ) : (
          <button onClick={onLogin} className="btn-primary text-sm py-1.5 px-3">
            Sign Up Free
          </button>
        )}
      </div>
    </header>
  );
}
