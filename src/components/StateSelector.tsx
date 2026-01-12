'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, MapPin, Search, Check, X } from 'lucide-react';
import { INDIAN_STATES, getStatesExceptAll } from '@/lib/states';

interface StateSelectorProps {
  selectedStates: string[];
  onStatesChange: (states: string[]) => void;
  className?: string;
  showLabel?: boolean;
  placeholder?: string;
}

export default function StateSelector({ 
  selectedStates, 
  onStatesChange, 
  className = '',
  showLabel = true,
  placeholder = "Select states where this service is available"
}: StateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const availableStates = getStatesExceptAll();
  const isAllSelected = selectedStates.includes('ALL');
  
  const filteredStates = availableStates.filter(state =>
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

  const handleAllToggle = () => {
    if (isAllSelected) {
      onStatesChange([]);
    } else {
      onStatesChange(['ALL']);
    }
  };

  const handleStateToggle = (stateCode: string) => {
    if (isAllSelected) {
      // If ALL is selected, deselect ALL and select only this state
      onStatesChange([stateCode]);
    } else {
      if (selectedStates.includes(stateCode)) {
        // Remove state
        const newStates = selectedStates.filter(s => s !== stateCode);
        onStatesChange(newStates);
      } else {
        // Add state
        onStatesChange([...selectedStates, stateCode]);
      }
    }
  };

  const clearAll = () => {
    onStatesChange([]);
  };

  const getDisplayText = () => {
    if (isAllSelected) {
      return '🇮🇳 All India (Nationwide)';
    }
    
    if (selectedStates.length === 0) {
      return placeholder;
    }
    
    if (selectedStates.length === 1) {
      const state = availableStates.find(s => s.code === selectedStates[0]);
      return `${state?.emoji} ${state?.name}`;
    }
    
    return `${selectedStates.length} states selected`;
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
          Service Availability
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
            <span className={`text-sm ${
              selectedStates.length === 0 ? 'text-gray-500' : 'text-gray-900'
            }`}>
              {getDisplayText()}
            </span>
            <div className="flex items-center space-x-2">
              {selectedStates.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearAll();
                  }}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  title="Clear all"
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
            className="absolute z-[60] w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden"
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

            {/* All India Option */}
            <div className="border-b border-gray-100">
              <button
                onClick={handleAllToggle}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors ${
                  isAllSelected ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🇮🇳</span>
                    <div className="flex flex-col">
                      <span className={`text-sm font-medium ${
                        isAllSelected ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        All India
                      </span>
                      <span className={`text-xs ${
                        isAllSelected ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        Available nationwide in all states
                      </span>
                    </div>
                  </div>
                  {isAllSelected && (
                    <Check className="w-5 h-5 text-blue-600" />
                  )}
                </div>
              </button>
            </div>

            {/* States List */}
            <div className="max-h-48 overflow-y-auto">
              {filteredStates.length > 0 ? (
                filteredStates.map((state) => {
                  const isSelected = selectedStates.includes(state.code);
                  return (
                    <button
                      key={state.code}
                      onClick={() => handleStateToggle(state.code)}
                      disabled={isAllSelected}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors ${
                        isSelected ? 'bg-blue-50' : ''
                      } ${isAllSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">{state.emoji}</span>
                          <div className="flex flex-col">
                            <span className={`text-sm font-medium ${
                              isSelected ? 'text-blue-900' : 'text-gray-900'
                            }`}>
                              {state.name}
                            </span>
                            <span className={`text-xs ${
                              isSelected ? 'text-blue-600' : 'text-gray-500'
                            }`}>
                              State Code: {state.code}
                            </span>
                          </div>
                        </div>
                        {isSelected && !isAllSelected && (
                          <Check className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </button>
                  );
                })
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
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500">
                  {isAllSelected ? 'All states selected' : `${selectedStates.length} of ${availableStates.length} states selected`}
                </p>
                {selectedStates.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selected States Preview */}
      {selectedStates.length > 0 && !isAllSelected && (
        <div className="mt-2 flex flex-wrap gap-1">
          {selectedStates.slice(0, 5).map(stateCode => {
            const state = availableStates.find(s => s.code === stateCode);
            return (
              <span
                key={stateCode}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {state?.emoji} {state?.name}
              </span>
            );
          })}
          {selectedStates.length > 5 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              +{selectedStates.length - 5} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}