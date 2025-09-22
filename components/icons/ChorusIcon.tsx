import React from 'react';

export const ChorusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
        <path d="M3 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>
        <path d="M3 12c2 2 4 2 6 0s4-2 6 0 4 2 6 0"/>
        <path d="M3 16c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>
    </svg>
);