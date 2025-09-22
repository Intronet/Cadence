import React from 'react';

export const BassIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg 
        {...props}
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
    >
      <path d="M16.5 6.5C16.5 8.985 14.485 11 12 11s-4.5-2.015-4.5-4.5S9.515 2 12 2s4.5 2.015 4.5 4.5z"/>
      <path d="M12 11v11"/>
      <path d="M7 15h10"/>
      <path d="M7 19h10"/>
    </svg>
);
