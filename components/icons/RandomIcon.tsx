import React from 'react';

export const RandomIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <circle cx="15.5" cy="15.5" r="1.5" />
    <circle cx="15.5" cy="8.5" r="1.5" />
    <circle cx="8.5" cy="15.5" r="1.5" />
  </svg>
);