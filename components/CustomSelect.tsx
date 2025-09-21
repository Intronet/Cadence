import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

interface CustomSelectProps {
  id: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  tooltip?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({ id, options, value, onChange, disabled, tooltip }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleWheel = (e: React.WheelEvent) => {
    if (disabled) return;
    e.preventDefault();
    const currentIndex = options.findIndex(opt => opt.value === value);
    let newIndex = currentIndex;
    if (e.deltaY < 0) { // Scroll up
      newIndex = Math.max(0, currentIndex - 1);
    } else { // Scroll down
      newIndex = Math.min(options.length - 1, currentIndex + 1);
    }
    if (newIndex !== currentIndex) {
      onChange(options[newIndex].value);
    }
  };

  return (
    <div 
        ref={wrapperRef} 
        className="relative"
        onWheel={handleWheel}
    >
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full bg-gray-800 border-2 border-gray-700 text-gray-200 text-sm rounded-[4px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent p-2.5 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex justify-between items-center text-left tooltip`}
        data-tooltip={tooltip}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">{selectedOption?.label || 'Select...'}</span>
        <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <ul
          className="absolute z-10 w-full mt-1 bg-gray-800 border-2 border-gray-700 rounded-[4px] shadow-lg max-h-60 overflow-auto focus:outline-none"
          role="listbox"
        >
          {options.map(option => (
            <li
              key={option.value}
              className={`px-3 py-2 text-sm cursor-pointer ${value === option.value ? 'bg-indigo-600 text-white' : 'text-gray-200 hover:bg-gray-700'}`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              role="option"
              aria-selected={value === option.value}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};