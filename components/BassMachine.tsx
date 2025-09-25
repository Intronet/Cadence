import React, { useState } from 'react';
import { XIcon } from './icons/XIcon';
import { DistortionIcon } from './icons/DistortionIcon';
import { FilterIcon } from './icons/FilterIcon';
import { PhaserIcon } from './icons/PhaserIcon';
import { ChorusIcon } from './icons/ChorusIcon';
import { BitCrusherIcon } from './icons/BitCrusherIcon';

interface BassMachineProps {
  onClose: () => void;
  height: number;
  setHeight: (height: number) => void;
  setIsResizing: (isResizing: boolean) => void;
  isBasslineEnabled: boolean;
  onToggleBasslineEnabled: () => void;
  
  // Volume & Octave
  volume: number;
  onVolumeChange: (vol: number) => void;
  octaveOffset: number;
  onOctaveOffsetChange: (offset: number) => void;

  // Effects
  isDistortionOn: boolean;
  onToggleDistortion: (isOn: boolean) => void;
  distortionAmount: number;
  onDistortionAmountChange: (amount: number) => void;
  
  isFilterOn: boolean;
  onToggleFilter: (isOn: boolean) => void;
  filterFreq: number;
  onFilterFreqChange: (freq: number) => void;
  filterDepth: number;
  onFilterDepthChange: (depth: number) => void;
  
  isPhaserOn: boolean;
  onTogglePhaser: (isOn: boolean) => void;
  phaserFreq: number;
  onPhaserFreqChange: (freq: number) => void;
  phaserQ: number;
  onPhaserQChange: (q: number) => void;
  
  isChorusOn: boolean;
  onToggleChorus: (isOn: boolean) => void;
  chorusFreq: number;
  onChorusFreqChange: (freq: number) => void;
  chorusDepth: number;
  onChorusDepthChange: (depth: number) => void;
  
  isBitCrusherOn: boolean;
  onToggleBitCrusher: (isOn: boolean) => void;
  bitCrusherBits: number;
  onBitCrusherBitsChange: (bits: number) => void;
}


const bassOptions = ['Electric (P-Style)', 'Electric (J-Style)', 'Upright Acoustic', 'Classic Synth Bass', 'Modern Sub Bass'];

const EffectControl: React.FC<{
  label: string;
  icon: React.ReactNode;
  isOn: boolean;
  onToggle: (isOn: boolean) => void;
  children: React.ReactNode;
}> = ({ label, icon, isOn, onToggle, children }) => {
  return (
    <div className={`bg-gray-900/50 p-3 rounded-[4px] border-2 transition-colors ${isOn ? 'border-indigo-500' : 'border-gray-700'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <h4 className="font-semibold text-gray-200">{label}</h4>
        </div>
        <button
          onClick={() => onToggle(!isOn)}
          className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-800 ${
            isOn ? 'bg-indigo-600' : 'bg-gray-600'
          }`}
        >
          <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
              isOn ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
      <div className={`transition-opacity duration-200 ${isOn ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
        {children}
      </div>
    </div>
  );
};

export const BassMachine: React.FC<BassMachineProps> = ({
  onClose, height, setHeight, setIsResizing,
  isBasslineEnabled, onToggleBasslineEnabled,
  volume, onVolumeChange,
  octaveOffset, onOctaveOffsetChange,
  isDistortionOn, onToggleDistortion, distortionAmount, onDistortionAmountChange,
  isFilterOn, onToggleFilter, filterFreq, onFilterFreqChange, filterDepth, onFilterDepthChange,
  isPhaserOn, onTogglePhaser, phaserFreq, onPhaserFreqChange, phaserQ, onPhaserQChange,
  isChorusOn, onToggleChorus, chorusFreq, onChorusFreqChange, chorusDepth, onChorusDepthChange,
  isBitCrusherOn, onToggleBitCrusher, bitCrusherBits, onBitCrusherBitsChange
}) => {
  const [selectedBass, setSelectedBass] = useState(bassOptions[0]);

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    const startY = e.clientY;
    const startHeight = height;

    const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaY = moveEvent.clientY - startY;
        const newHeight = startHeight - deltaY;
        const MIN_HEIGHT = 200;
        const MAX_HEIGHT = window.innerHeight * 0.8;
        setHeight(Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, newHeight)));
    };

    const handleMouseUp = () => {
        setIsResizing(false);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="relative flex flex-col h-full flex-shrink-0 bg-gray-800 rounded-[4px] border border-gray-700 p-3 mt-2">
      <div 
        onMouseDown={handleResizeMouseDown}
        className="absolute -top-1 left-0 right-0 h-2 cursor-row-resize z-20"
        title="Drag to resize"
      />
      <div className="flex justify-between items-center mb-2 flex-shrink-0">
        <h3 className="text-xl font-bold text-indigo-300">Bass Engine</h3>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700 transition-colors" aria-label="Close bass machine">
          <XIcon className="w-5 h-5 text-gray-400" />
        </button>
      </div>
      
      <div className="grid grid-cols-3 gap-x-4 pt-2 mt-2 border-t border-gray-700 flex-1 min-h-0">
        {/* Left Column: Main Controls & Instruments */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between bg-gray-900/50 p-3 rounded-[4px] border border-gray-700">
            <label htmlFor="bass-enabled-toggle" className="font-semibold text-gray-200">Enabled</label>
            <button
              id="bass-enabled-toggle"
              onClick={onToggleBasslineEnabled}
              className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-800 ${
                isBasslineEnabled ? 'bg-indigo-600' : 'bg-gray-600'
              }`}
            >
              <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                  isBasslineEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
           <div>
                 <div className="flex justify-between items-center mb-1">
                    <label className="text-sm font-medium text-gray-400">Volume</label>
                    <span className="text-sm font-mono text-indigo-300">{volume.toFixed(0)} dB</span>
                </div>
                <input
                    type="range" min="-40" max="6" step="1"
                    value={volume}
                    onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-[4px] appearance-none cursor-pointer range-slider"
                />
            </div>
             <div>
                <div className="flex justify-between items-center mb-1">
                    <label className="text-sm font-medium text-gray-400">Octave</label>
                    <span className="text-sm font-mono text-indigo-300 w-8 text-center">{octaveOffset > 0 ? `+${octaveOffset}` : octaveOffset}</span>
                </div>
                <input
                    type="range" min="-2" max="2" step="1"
                    value={octaveOffset}
                    onChange={(e) => onOctaveOffsetChange(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-[4px] appearance-none cursor-pointer range-slider"
                />
            </div>
          <div className="flex flex-col flex-1 min-h-0">
            <label className="block mb-2 text-sm font-medium text-gray-400 flex-shrink-0">Bass Selection</label>
            <div className="overflow-y-auto custom-scrollbar border-2 border-gray-700 rounded-[4px] bg-[#282828] p-1 flex-1">
              {bassOptions.map(bass => (
                <button 
                  key={bass}
                  onClick={() => setSelectedBass(bass)}
                  className={`w-full text-left p-2 rounded-[2px] transition-colors text-sm font-bold whitespace-normal ${
                    selectedBass === bass 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-transparent text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {bass}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Right Column: Effects */}
        <div className="col-span-2 grid grid-cols-2 gap-4 overflow-y-auto custom-scrollbar pr-1">
            <EffectControl label="Distortion" icon={<DistortionIcon className="w-5 h-5 text-gray-400" />} isOn={isDistortionOn} onToggle={onToggleDistortion}>
                 <div className="flex justify-between items-center mb-1">
                    <label className="text-sm font-medium text-gray-400">Drive</label>
                    <span className="text-sm font-mono text-indigo-300">{Math.round(distortionAmount * 100)}</span>
                </div>
                <input
                    type="range" min="0" max="100"
                    value={distortionAmount * 100}
                    onChange={(e) => onDistortionAmountChange(parseInt(e.target.value) / 100)}
                    className="w-full h-2 bg-gray-600 rounded-[4px] appearance-none cursor-pointer range-slider"
                />
            </EffectControl>
            <EffectControl label="Auto Filter" icon={<FilterIcon className="w-5 h-5 text-gray-400" />} isOn={isFilterOn} onToggle={onToggleFilter}>
                <div className="flex justify-between items-center mb-1">
                    <label className="text-sm font-medium text-gray-400">Speed</label>
                    <span className="text-sm font-mono text-indigo-300">{(filterFreq).toFixed(1)} Hz</span>
                </div>
                <input
                    type="range" min="1" max="100" // 0.1 to 10 Hz
                    value={filterFreq * 10}
                    onChange={(e) => onFilterFreqChange(parseInt(e.target.value) / 10)}
                    className="w-full h-2 bg-gray-600 rounded-[4px] appearance-none cursor-pointer range-slider"
                />
                 <div className="flex justify-between items-center mb-1 mt-2">
                    <label className="text-sm font-medium text-gray-400">Depth</label>
                    <span className="text-sm font-mono text-indigo-300">{Math.round(filterDepth * 100)}</span>
                </div>
                <input
                    type="range" min="0" max="100"
                    value={filterDepth * 100}
                    onChange={(e) => onFilterDepthChange(parseInt(e.target.value) / 100)}
                    className="w-full h-2 bg-gray-600 rounded-[4px] appearance-none cursor-pointer range-slider"
                />
            </EffectControl>
             <EffectControl label="Phaser" icon={<PhaserIcon className="w-5 h-5 text-gray-400" />} isOn={isPhaserOn} onToggle={onTogglePhaser}>
                <div className="flex justify-between items-center mb-1">
                    <label className="text-sm font-medium text-gray-400">Speed</label>
                    <span className="text-sm font-mono text-indigo-300">{phaserFreq.toFixed(1)} Hz</span>
                </div>
                <input type="range" min="1" max="100" value={phaserFreq * 10} onChange={(e) => onPhaserFreqChange(parseInt(e.target.value) / 10)} className="w-full h-2 bg-gray-600 rounded-[4px] appearance-none cursor-pointer range-slider" />
                <div className="flex justify-between items-center mb-1 mt-2">
                    <label className="text-sm font-medium text-gray-400">Q</label>
                    <span className="text-sm font-mono text-indigo-300">{phaserQ.toFixed(1)}</span>
                </div>
                <input type="range" min="0" max="200" value={phaserQ * 10} onChange={(e) => onPhaserQChange(parseInt(e.target.value) / 10)} className="w-full h-2 bg-gray-600 rounded-[4px] appearance-none cursor-pointer range-slider" />
            </EffectControl>
            <EffectControl label="Chorus" icon={<ChorusIcon className="w-5 h-5 text-gray-400" />} isOn={isChorusOn} onToggle={onToggleChorus}>
                <div className="flex justify-between items-center mb-1">
                    <label className="text-sm font-medium text-gray-400">Speed</label>
                    <span className="text-sm font-mono text-indigo-300">{chorusFreq.toFixed(1)} Hz</span>
                </div>
                <input type="range" min="1" max="100" value={chorusFreq * 10} onChange={(e) => onChorusFreqChange(parseInt(e.target.value) / 10)} className="w-full h-2 bg-gray-600 rounded-[4px] appearance-none cursor-pointer range-slider" />
                <div className="flex justify-between items-center mb-1 mt-2">
                    <label className="text-sm font-medium text-gray-400">Depth</label>
                    <span className="text-sm font-mono text-indigo-300">{Math.round(chorusDepth * 100)}</span>
                </div>
                <input type="range" min="0" max="100" value={chorusDepth * 100} onChange={(e) => onChorusDepthChange(parseInt(e.target.value) / 100)} className="w-full h-2 bg-gray-600 rounded-[4px] appearance-none cursor-pointer range-slider" />
            </EffectControl>
             <EffectControl label="Bit Crusher" icon={<BitCrusherIcon className="w-5 h-5 text-gray-400" />} isOn={isBitCrusherOn} onToggle={onToggleBitCrusher}>
                <div className="flex justify-between items-center mb-1">
                    <label className="text-sm font-medium text-gray-400">Bits</label>
                    <span className="text-sm font-mono text-indigo-300">{bitCrusherBits}</span>
                </div>
                <input
                    type="range" min="1" max="8" step="1"
                    value={bitCrusherBits}
                    onChange={(e) => onBitCrusherBitsChange(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-[4px] appearance-none cursor-pointer range-slider"
                />
            </EffectControl>
        </div>
      </div>
      <style>{`
        .range-slider::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none; width: 16px; height: 16px;
          border-radius: 50%; background: #818cf8; cursor: pointer; transition: background .2s;
        }
        .range-slider::-moz-range-thumb {
          width: 16px; height: 16px; border-radius: 50%; background: #818cf8;
          cursor: pointer; border: none; transition: background .2s;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #1f2937; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #4f46e5; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #6366f1; }
      `}</style>
    </div>
  );
};
