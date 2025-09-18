import React from 'react';

interface HoverDisplayProps {
  name: string | null;
}

export const HoverDisplay: React.FC<HoverDisplayProps> = ({ name }) => {
  return (
    <div className="h-12 flex items-center justify-center">
      <p className="text-3xl font-bold text-white transition-opacity duration-200" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
        {name || ''}
      </p>
    </div>
  );
};