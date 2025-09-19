import React, { useState } from 'react';
import { SparklesIcon } from './icons/SparklesIcon';

interface GeneratorProps {
  onGenerate: (prompt: string) => void;
  isGenerating: boolean;
}

export const Generator: React.FC<GeneratorProps> = ({ onGenerate, isGenerating }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isGenerating) {
      onGenerate(prompt);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-indigo-300">AI Generator</h2>
        <button
          type="submit"
          disabled={isGenerating || !prompt.trim()}
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-[3px] shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-800 disabled:bg-indigo-500/50 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating ? (
             <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
          ) : (
            <SparklesIcon className="w-5 h-5 mr-2" />
          )}
          {isGenerating ? 'Generating...' : 'Generate'}
        </button>
      </div>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe a progression (e.g., 'dreamy lofi') or enter a song title"
        className="bg-gray-800 border-2 border-gray-700 text-gray-200 text-sm rounded-[3px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent block w-full p-2.5 transition-all duration-200 resize-none h-20 disabled:opacity-50"
        aria-label="Chord progression description"
        disabled={isGenerating}
      />
    </form>
  );
};