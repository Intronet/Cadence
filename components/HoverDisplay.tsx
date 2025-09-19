import React from 'react';

interface HoverDisplayProps {
  data: { name: string; notes: string } | null;
}

export const HoverDisplay: React.FC<HoverDisplayProps> = ({ data }) => {
  return (
    <div className="h-12 flex flex-col items-center justify-center -mt-2">
      <p className="text-2xl font-bold text-white transition-opacity duration-200 h-8 flex items-center" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
        {data?.name || ''}
      </p>
      <div className="h-6">
        {data?.notes && (
          <p className="text-lg font-semibold bg-gradient-to-r from-indigo-400 to-purple-500 text-transparent bg-clip-text">
            {data.notes}
          </p>
        )}
      </div>
    </div>
  );
};