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
        {/* Hexagon Background */}
        <path 
          d="M100 40L160 70V130L100 160L40 130V70L100 40Z" 
          fill="url(#logoGradient)" 
          opacity="0.1"
        />

        {/* Connected Circles */}
        <circle cx="100" cy="60" r="15" fill="url(#logoGradient)"/>
        <circle cx="140" cy="100" r="15" fill="url(#logoGradient2)"/>
        <circle cx="100" cy="140" r="15" fill="url(#logoGradient)"/>
        <circle cx="60" cy="100" r="15" fill="url(#logoGradient2)"/>

        {/* Connection Lines */}
        <path 
          d="M100 75L100 125M75 100L125 100" 
          stroke="url(#logoGradient)" 
          strokeWidth="6" 
          strokeLinecap="round"
        />

        {/* Curved Connection Lines */}
        <path 
          d="M85 85Q100 100 115 85M85 115Q100 100 115 115" 
          stroke="url(#logoGradient)" 
          strokeWidth="6" 
          strokeLinecap="round"
          fill="none"
        />

        {/* Center Circle */}
        <circle cx="100" cy="100" r="10" fill="url(#logoGradient)"/>
      </g>
    </svg>
  );
};

export default Logo; 