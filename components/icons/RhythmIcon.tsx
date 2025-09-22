import React from 'react';

export const RhythmIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 18v-6" />
    <path d="M9 18V6" />
    <path d="M14 18v-8" />
    <path d="M19 18v-4" />
  </svg>
);