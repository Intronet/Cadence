import React, { useState, useRef, useEffect } from 'react';
import { HumanizeIcon } from './icons/HumanizeIcon';

interface HumanizeControlProps {
  timing: number; // 0-1
  onTimingChange: (value: number) => void;
  dynamics: number; // 0-1
  onDynamicsChange: (value: number) => void;
}

const CustomSlider: React.FC<{
    label: string;
    value: number; // 0-100
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    minLabel: string;
    maxLabel: string;
}> = ({ label, value, onChange, minLabel, maxLabel }) => (
    <div>
        <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-semibold text-gray-300">{label}</label>
            <span className="text-sm font-mono text-indigo-300">{value}</span>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-10 text-center">{minLabel}</span>
            <input
                type="range"
                min="0"
                max="100"
                value={value}
                onChange={onChange}
                className="w-full h-2 bg-gray-600 rounded-[4px] appearance-none cursor-pointer range-slider"
            />
            <span className="text-xs text-gray-500 w-10 text-center">{maxLabel}</span>
        </div>
    </div>
);


export const HumanizeControl: React.FC<HumanizeControlProps> = ({
  timing,
  onTimingChange,
  dynamics,
  onDynamicsChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const timingPercent = Math.round(timing * 100);
  const dynamicsPercent = Math.round(dynamics * 100);
  const isActive = timing > 0 || dynamics > 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTimingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onTimingChange(parseInt(e.target.value, 10) / 100);
  };

  const handleDynamicsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onDynamicsChange(parseInt(e.target.value, 10) / 100);
  };
  
  const baseButtonClasses = "p-2 rounded-[4px] transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-gray-800";
  const regularButtonClasses = `${baseButtonClasses} bg-gray-700 text-gray-300 hover:bg-gray-600`;
  const primaryButtonClasses = `${baseButtonClasses} bg-indigo-600 text-white shadow-md hover:bg-indigo-500`;

  return (
    <div ref={wrapperRef} className="relative">
      <button
        onClick={() => setIsOpen(v => !v)}
        className={`${isActive || isOpen ? primaryButtonClasses : regularButtonClasses} h-10`}
        title="Humanize Playback"
      >
        <HumanizeIcon className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-gray-800 border border-gray-700 rounded-[4px] shadow-lg p-4 z-20 animate-fade-in-fast">
            <h4 className="text-md font-bold text-indigo-300 mb-3">Humanize</h4>
            <div className="space-y-4">
                 <CustomSlider
                    label="Timing"
                    value={timingPercent}
                    onChange={handleTimingChange}
                    minLabel="Tight"
                    maxLabel="Loose"
                />
                <CustomSlider
                    label="Dynamics"
                    value={dynamicsPercent}
                    onChange={handleDynamicsChange}
                    minLabel="Static"
                    maxLabel="Expressive"
                />
            </div>
        </div>
      )}
       <style>{`
        .range-slider::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none; width: 16px; height: 16px;
          border-radius: 50%; background: #818cf8; cursor: pointer; transition: background .2s;
        }
        .range-slider::-moz-range-thumb {
          width: 16px; height: 16px; border-radius: 50%; background: #818cf8;
          cursor: pointer; border: none; transition: background .2s;
        }
         @keyframes fade-in-fast {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-fast { animation: fade-in-fast 0.15s ease-out forwards; }
      `}</style>
    </div>
  );
};
