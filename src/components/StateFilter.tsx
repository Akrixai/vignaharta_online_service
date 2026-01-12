'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, MapPin, Search, X } from 'lucide-react';
import { INDIAN_STATES, getStateByCode } from '@/lib/states';

interface StateFilterProps {
  selectedState: string;
  onStateChange: (state: string) => void;
  className?: string;
  showLabel?: boolean;
}

export default function StateFilter({ 
  selectedState, 
  onStateChange, 
  className = '',
  showLabel = true 
}: StateFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedStateData = getStateByCode(selectedState);
  
  const filteredStates = INDIAN_STATES.filter(state =>
    state.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    state.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleStateSelect = (stateCode: string) => {
    onStateChange(stateCode);
    setIsOpen(false);
    setSearchTerm('');
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStateChange('ALL');
  };

  return (
    <div 
      className={`relative ${className}`} 
      ref={dropdownRef}
      onClick={(e) => e.stopPropagation()}
    >
      {showLabel && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <MapPin className="w-4 h-4 inline mr-1" />
          Filter by State
        </label>
      )}
      
      <div className="relative">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-left shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">
                {selectedStateData?.emoji || '🇮🇳'}
              </span>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">
                  {selectedStateData?.name || 'All India'}
                </span>
                {selectedState !== 'ALL' && (
                  <span className="text-xs text-gray-500">
                    {selectedStateData?.code}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {selectedState !== 'ALL' && (
                <button
                  onClick={clearSelection}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  title="Clear selection"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
              <ChevronDown 
                className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                  isOpen ? 'rotate-180' : ''
                }`} 
              />
            </div>
          </div>
        </button>

        {isOpen && (
          <div 
            className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search states..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* States List */}
            <div className="max-h-60 overflow-y-auto">
              {filteredStates.length > 0 ? (
                filteredStates.map((state) => (
                  <button
                    key={state.code}
                    onClick={() => handleStateSelect(state.code)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors ${
                      selectedState === state.code ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{state.emoji}</span>
                      <div className="flex flex-col">
                        <span className={`text-sm font-medium ${
                          selectedState === state.code ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {state.name}
                        </span>
                        <span className={`text-xs ${
                          selectedState === state.code ? 'text-blue-600' : 'text-gray-500'
                        }`}>
                          {state.code === 'ALL' ? 'Nationwide Services' : `State Code: ${state.code}`}
                        </span>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-6 text-center text-gray-500">
                  <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No states found</p>
                  <p className="text-xs text-gray-400">Try a different search term</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-500 text-center">
                {filteredStates.length} of {INDIAN_STATES.length} states shown
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}