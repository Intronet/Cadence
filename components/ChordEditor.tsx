import React, { useState, useEffect, useMemo } from 'react';
import { SequenceChord } from '../types';
import { parseChord, getRelativeMinor, getDominant, getSubdominant } from '../index';
import { CheckIcon } from './icons/CheckIcon';
import { UndoIcon } from './icons/UndoIcon';
import { XIcon } from './icons/XIcon';

interface ChordEditorProps {
  chord: SequenceChord;
  onClose: () => void;
  onApply: (newChordName: string) => void;
  onPreview: (chordName: string) => void;
  updateChordUtil: (original: string, updates: any) => string;
}

const CIRCLE_NOTES = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];

const MODIFIERS = {
  Quality: [
    { label: 'maj', value: 'maj', type: 'quality' },
    { label: 'min', value: 'min', type: 'quality' },
    { label: 'dim', value: 'dim', type: 'quality' },
  ],
  Tensions: [
    { label: '7', value: '7', type: 'toggle' },
    { label: 'maj7', value: 'maj7', type: 'toggle' },
    { label: 'sus4', value: 'sus4', type: 'toggle' },
    { label: 'add9', value: 'add9', type: 'toggle' },
  ],
  Inversions: [
    { label: 'Root', value: 0, type: 'inversion' },
    { label: '1st', value: 1, type: 'inversion' },
    { label: '2nd', value: 2, type: 'inversion' },
    { label: '3rd', value: 3, type: 'inversion' },
  ],
};

export const ChordEditor: React.FC<ChordEditorProps> = ({ chord, onClose, onApply, onPreview, updateChordUtil }) => {
  const [previewChord, setPreviewChord] = useState(chord.chordName);
  const parsedPreview = useMemo(() => parseChord(previewChord), [previewChord]);

  useEffect(() => {
    onPreview(previewChord);
  }, [previewChord, onPreview]);

  const handleUpdate = (updates: any) => {
    setPreviewChord(prev => updateChordUtil(prev, updates));
  };
  
  const handleRestore = () => {
    setPreviewChord(chord.chordName);
  };

  const handleApply = () => {
    onApply(previewChord);
    onClose();
  };
  
  const originalParsed = parseChord(chord.chordName);
  const subdominant = originalParsed ? getSubdominant(originalParsed.root) : '';
  const dominant = originalParsed ? getDominant(originalParsed.root) : '';
  const relativeMinor = originalParsed ? getRelativeMinor(originalParsed.root) : '';


  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center"
      onClick={onClose}
    >
      <div 
        className="relative w-[30rem] h-[30rem] animate-zoom-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Main Rings */}
        <CircleRing 
          notes={CIRCLE_NOTES} 
          radius={125} 
          type="major"
          activeRoot={parsedPreview?.root}
          highlightedNotes={{
            primary: originalParsed?.root,
            secondary: [subdominant, dominant]
          }}
          onNoteClick={(note) => handleUpdate({ root: note, quality: 'maj' })}
        />
        <CircleRing 
          notes={CIRCLE_NOTES.map(getRelativeMinor)} 
          radius={85}
          type="minor"
          activeRoot={parsedPreview?.root}
          highlightedNotes={{
            primary: relativeMinor,
            secondary: []
          }}
          onNoteClick={(note) => handleUpdate({ root: note, quality: 'min' })}
        />

        {/* Center Display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 rounded-full bg-gray-800 flex items-center justify-center border-2 border-gray-600">
            <span className="text-2xl font-bold text-indigo-300">{previewChord}</span>
          </div>
        </div>

        {/* Modifier Arcs */}
        <ModifierArc buttons={MODIFIERS.Quality} startAngle={-150} arc={60} radius={170} onUpdate={handleUpdate} activeChord={previewChord} />
        <ModifierArc buttons={MODIFIERS.Tensions} startAngle={-60} arc={120} radius={170} onUpdate={handleUpdate} activeChord={previewChord} />
        <ModifierArc buttons={MODIFIERS.Inversions} startAngle={90} arc={60} radius={170} onUpdate={handleUpdate} activeChord={previewChord} />
        
        {/* Action Buttons */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
          <button onClick={handleApply} className="p-3 rounded-full bg-green-600 hover:bg-green-500 transition-colors shadow-lg"><CheckIcon className="w-6 h-6 text-white" /></button>
          <button onClick={handleRestore} className="p-3 rounded-full bg-gray-600 hover:bg-gray-500 transition-colors shadow-lg"><UndoIcon className="w-6 h-6 text-white" /></button>
          <button onClick={onClose} className="p-3 rounded-full bg-red-600 hover:bg-red-500 transition-colors shadow-lg"><XIcon className="w-6 h-6 text-white" /></button>
        </div>
      </div>
       <style>{`
        @keyframes zoom-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-zoom-in { animation: zoom-in 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
};

const CircleRing: React.FC<{
  notes: string[];
  radius: number;
  type: 'major' | 'minor';
  activeRoot?: string;
  highlightedNotes: { primary?: string; secondary?: string[] };
  onNoteClick: (note: string) => void;
}> = ({ notes, radius, type, activeRoot, highlightedNotes, onNoteClick }) => {
  const parsedActive = parseChord(`${activeRoot || ''}${type}`);
  const isActive = (note: string) => parsedActive?.root === note;

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {notes.map((note, i) => {
        const angle = (i / notes.length) * 2 * Math.PI - (Math.PI / 2);
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        const isPrimary = highlightedNotes.primary === note;
        const isSecondary = highlightedNotes.secondary?.includes(note);
        
        return (
          <button
            key={note}
            className={`absolute w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm transition-all
              ${isActive(note) ? 'bg-indigo-500 text-white scale-110' : 
               isPrimary ? 'bg-indigo-800/80 text-indigo-200' :
               isSecondary ? 'bg-gray-700/80 text-gray-300' : 
               'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:scale-105'
              }
            `}
            style={{ transform: `translate(${x}px, ${y}px)` }}
            onClick={() => onNoteClick(note)}
          >
            {note}
            <span className="text-xs absolute -bottom-1">{type === 'minor' ? 'm' : ''}</span>
          </button>
        );
      })}
    </div>
  );
};


const ModifierArc: React.FC<{
  buttons: { label: string; value: any; type: string }[];
  startAngle: number;
  arc: number;
  radius: number;
  onUpdate: (updates: any) => void;
  activeChord: string;
}> = ({ buttons, startAngle, arc, radius, onUpdate, activeChord }) => {
  const parsed = parseChord(activeChord);
  
  return (
    <>
      {buttons.map((btn, i) => {
        const totalButtons = buttons.length;
        const angleDeg = startAngle + (i / (totalButtons - 1)) * arc;
        const angleRad = angleDeg * (Math.PI / 180);
        const x = radius * Math.cos(angleRad - Math.PI / 2);
        const y = radius * Math.sin(angleRad - Math.PI / 2);
        
        let isActive = false;
        if (parsed) {
          if (btn.type === 'quality') {
            isActive = (btn.value === 'maj' && !parsed.quality.includes('min') && !parsed.quality.includes('dim')) ||
                       (btn.value === 'min' && parsed.quality.includes('min')) ||
                       (btn.value === 'dim' && parsed.quality.includes('dim'));
          } else if (btn.type === 'toggle') {
            isActive = parsed.quality.includes(btn.value);
          } else if (btn.type === 'inversion') {
            isActive = parsed.inversion === btn.value;
          }
        }

        return (
          <button
            key={btn.label}
            className={`absolute w-14 h-8 rounded-[3px] flex items-center justify-center font-semibold text-xs transition-colors
              ${isActive ? 'bg-sky-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}
            `}
            style={{ transform: `translate(${x}px, ${y}px) translate(-50%, -50%)` }}
            onClick={() => {
              if (btn.type === 'quality') onUpdate({ quality: btn.value });
              if (btn.type === 'toggle') onUpdate({ toggleQuality: btn.value });
              if (btn.type === 'inversion') onUpdate({ inversion: btn.value });
            }}
          >
            {btn.label}
          </button>
        );
      })}
    </>
  );
};