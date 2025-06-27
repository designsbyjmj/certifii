import React from 'react';
import { Award, Building2 } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Award className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Certifii</h1>
              <p className="text-sm text-gray-500">Bulk Certificate Generator</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            
            <span className="text-sm font-medium">Version 1.0</span>
          </div>
        </div>
      </div>
    </header>
  );
}