import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-agerup-50 to-forest-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-agerup-500 rounded-full mb-4">
            <span className="text-white text-2xl">🌿</span>
          </div>
          <h1 className="text-2xl font-bold text-agerup-800">Agerup Farm</h1>
          <p className="text-agerup-600 text-sm">Seating Planner</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-stone-800 mb-2">{title}</h2>
          {subtitle && <p className="text-stone-500 text-sm mb-6">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}
