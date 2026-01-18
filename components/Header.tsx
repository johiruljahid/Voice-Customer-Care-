import React from 'react';
import { Activity } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-20 border-b border-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-hospital-50 p-2 rounded-lg text-hospital-600">
            <Activity size={28} />
          </div>
          <div>
            <h1 className="font-bold text-xl text-gray-800 leading-tight">Popular Diagnostic</h1>
            <p className="text-xs text-hospital-600 font-medium">AI Health Assistant</p>
          </div>
        </div>
        <a 
          href="https://www.populardiagnostic.com/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hidden sm:block text-sm font-medium text-gray-500 hover:text-hospital-600 transition-colors"
        >
          Visit Website
        </a>
      </div>
    </header>
  );
};