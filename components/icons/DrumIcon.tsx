import React from 'react';

export const DrumIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
        <path d="M12 2a2 2 0 0 0-2 2v2a2 2 0 1 0 4 0V4a2 2 0 0 0-2-2z"/>
        <path d="M6.7 13.3a1 1 0 0 0-1.4 0L3 15.6a1 1 0 0 0 0 1.4l1.4 1.4a1 1 0 0 0 1.4 0l2.3-2.3a1 1 0 0 0 0-1.4z"/>
        <path d="m21 15.6-2.3-2.3a1 1 0 0 0-1.4 0l-1.4 1.4a1 1 0 0 0 0 1.4l2.3 2.3a1 1 0 0 0 1.4 0l1.4-1.4a1 1 0 0 0 0-1.4z"/>
        <path d="M7.7 8.7a1 1 0 0 0 0 1.4l8.6 8.6a1 1 0 0 0 1.4 0l1.4-1.4a1 1 0 0 0 0-1.4L10.5 7.3a1 1 0 0 0-1.4 0l-1.4 1.4z"/>
        <path d="m16.3 15.3 1.4-1.4a1 1 0 0 0 0-1.4L9.1 4.3a1 1 0 0 0-1.4 0L6.3 5.7a1 1 0 0 0 0 1.4l8.6 8.6a1 1 0 0 0 1.4 0z"/>
    </svg>
);