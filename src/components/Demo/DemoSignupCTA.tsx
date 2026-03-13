import React from 'react';

interface DemoSignupCTAProps {
  onSignup: () => void;
  onLogin: () => void;
}

export default function DemoSignupCTA({ onSignup, onLogin }: DemoSignupCTAProps) {
  return (
    <div className="bg-gradient-to-r from-agerup-500 to-agerup-600 text-white px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-lg">🌿</span>
        <div>
          <span className="font-medium text-sm">You&apos;re in Demo Mode</span>
          <span className="text-agerup-200 text-xs ml-2">Save &amp; share features require an account</span>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onLogin}
          className="text-sm px-3 py-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
        >
          Sign In
        </button>
        <button
          onClick={onSignup}
          className="text-sm px-3 py-1.5 bg-white text-agerup-700 hover:bg-agerup-50 rounded-lg font-medium transition-colors"
        >
          Sign Up Free →
        </button>
      </div>
    </div>
  );
}
