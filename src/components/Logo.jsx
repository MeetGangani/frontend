const Logo = ({ width = "200", height = "200", className = "" }) => {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 200 200" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`transition-transform duration-700 hover:rotate-180 ${className}`}
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor:"#7C3AED"}}/> 
          <stop offset="100%" style={{stopColor:"#4F46E5"}}/> 
        </linearGradient>
        <linearGradient id="logoGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{stopColor:"#7C3AED"}}/> 
          <stop offset="100%" style={{stopColor:"#4F46E5"}}/> 
        </linearGradient>
      </defs>

      {/* Outer Circle */}
      <circle cx="100" cy="100" r="90" fill="url(#logoGradient)" opacity="0.1"/>
      
      {/* Inner Rotating Elements */}
      <g className="origin-center">
        {/* Main Circle */}
        <circle cx="100" cy="100" r="60" fill="url(#logoGradient)" opacity="0.1"/>
        
        {/* Stylized Check Mark */}
        <path 
          d="M70 100L90 120L130 80" 
          stroke="url(#logoGradient)" 
          strokeWidth="8" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          fill="none"
        />

        {/* Document Outline */}
        <path 
          d="M65 60H135V140H65V60Z" 
          stroke="url(#logoGradient)" 
          strokeWidth="4" 
          fill="none"
        />
        
        {/* Lines representing text */}
        <path 
          d="M80 90H120M80 110H120" 
          stroke="url(#logoGradient2)" 
          strokeWidth="4" 
          strokeLinecap="round"
        />

        {/* Corner Decorations */}
        <circle cx="65" cy="60" r="6" fill="url(#logoGradient)"/>
        <circle cx="135" cy="60" r="6" fill="url(#logoGradient2)"/>
        <circle cx="65" cy="140" r="6" fill="url(#logoGradient2)"/>
        <circle cx="135" cy="140" r="6" fill="url(#logoGradient)"/>
      </g>
    </svg>
  );
};

export default Logo; 