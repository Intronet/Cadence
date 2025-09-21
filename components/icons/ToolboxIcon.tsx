import React from 'react';

export const ToolboxIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
        <path d="M2 3h20v6H2z"/>
        <path d="M2 9v11a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V9"/>
        <path d="M7 3v18"/>
        <path d="M17 3v18"/>
    </svg>
);
