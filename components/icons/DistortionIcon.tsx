import React from 'react';

export const DistortionIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
        <path d="M3 12h2l2-8 4 16 4-16 2 8h2"/>
        <path d="M4 6h16"/>
        <path d="M4 18h16"/>
    </svg>
);