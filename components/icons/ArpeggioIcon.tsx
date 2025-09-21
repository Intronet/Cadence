import React from 'react';

export const ArpeggioIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20V4"/>
    <path d="M8 8l4-4 4 4"/>
    <path d="M4 12h16"/>
  </svg>
);