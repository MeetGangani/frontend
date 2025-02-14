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
        
        {/* Atom-like Rings */}
        <ellipse 
          cx="100" 
          cy="100" 
          rx="50" 
          ry="20" 
          stroke="url(#logoGradient)" 
          strokeWidth="4" 
          fill="none"
          transform="rotate(0 100 100)"
        />
        <ellipse 
          cx="100" 
          cy="100" 
          rx="50" 
          ry="20" 
          stroke="url(#logoGradient2)" 
          strokeWidth="4" 
          fill="none"
          transform="rotate(60 100 100)"
        />
        <ellipse 
          cx="100" 
          cy="100" 
          rx="50" 
          ry="20" 
          stroke="url(#logoGradient)" 
          strokeWidth="4" 
          fill="none"
          transform="rotate(120 100 100)"
        />

        {/* Center Sphere */}
        <circle cx="100" cy="100" r="15" fill="url(#logoGradient)"/>
        
        {/* Orbital Points */}
        <circle cx="100" cy="50" r="8" fill="url(#logoGradient2)"/>
        <circle cx="143" cy="125" r="8" fill="url(#logoGradient)"/>
        <circle cx="57" cy="125" r="8" fill="url(#logoGradient2)"/>
      </g>
    </svg>
  );
};

export default Logo; 