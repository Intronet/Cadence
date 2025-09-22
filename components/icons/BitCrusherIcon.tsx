import React from 'react';

export const BitCrusherIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
        <path d="M3 12h2v4h4v-4h2v8h4v-8h2v4h4v-4h2"/>
        <path d="M5 12V8h2v4"/>
        <path d="M9 12V4h2v8"/>
        <path d="M13 12V8h2v4"/>
        <path d="M17 12V4h2v8"/>
    </svg>
);