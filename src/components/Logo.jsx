const Logo = ({ width = "200", height = "200", className = "" }) => {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 200 200" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor:"#7C3AED"}}/> 
          <stop offset="100%" style={{stopColor:"#4F46E5"}}/> 
        </linearGradient>
        
        {/* Shadow effect gradient */}
        <linearGradient id="shadowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{stopColor:"#1F2937", stopOpacity: "0.2"}}/>
          <stop offset="100%" style={{stopColor:"#1F2937", stopOpacity: "0"}}/>
        </linearGradient>
      </defs>

      {/* Outer Hexagon */}
      <path 
        d="M100 30L160 65V135L100 170L40 135V65L100 30Z" 
        fill="white" 
        stroke="url(#logoGradient)" 
        strokeWidth="4"
      />

      {/* Middle Hexagon */}
      <path 
        d="M100 45L145 70V120L100 145L55 120V70L100 45Z" 
        fill="white" 
        stroke="url(#logoGradient)" 
        strokeWidth="4"
      />

      {/* Inner Hexagon */}
      <path 
        d="M100 60L130 77.5V112.5L100 130L70 112.5V77.5L100 60Z" 
        fill="url(#logoGradient)" 
        opacity="0.1"
      />

      {/* Connection Points Left */}
      <circle cx="30" cy="100" r="6" fill="url(#logoGradient)"/>
      <circle cx="20" cy="85" r="4" fill="url(#logoGradient)"/>
      <circle cx="20" cy="115" r="4" fill="url(#logoGradient)"/>

      {/* Connection Points Right */}
      <circle cx="170" cy="100" r="6" fill="url(#logoGradient)"/>
      <circle cx="180" cy="85" r="4" fill="url(#logoGradient)"/>
      <circle cx="180" cy="115" r="4" fill="url(#logoGradient)"/>

      {/* Connection Lines Left */}
      <line x1="36" y1="100" x2="55" y2="100" stroke="url(#logoGradient)" strokeWidth="2"/>
      <line x1="24" y1="85" x2="40" y2="85" stroke="url(#logoGradient)" strokeWidth="2"/>
      <line x1="24" y1="115" x2="40" y2="115" stroke="url(#logoGradient)" strokeWidth="2"/>

      {/* Connection Lines Right */}
      <line x1="145" y1="100" x2="164" y2="100" stroke="url(#logoGradient)" strokeWidth="2"/>
      <line x1="160" y1="85" x2="176" y2="85" stroke="url(#logoGradient)" strokeWidth="2"/>
      <line x1="160" y1="115" x2="176" y2="115" stroke="url(#logoGradient)" strokeWidth="2"/>

      {/* Small Decorative Circles */}
      <circle cx="100" cy="25" r="3" fill="url(#logoGradient)"/>
      <circle cx="100" cy="175" r="3" fill="url(#logoGradient)"/>
      <circle cx="35" cy="60" r="3" fill="url(#logoGradient)"/>
      <circle cx="165" cy="60" r="3" fill="url(#logoGradient)"/>
      <circle cx="35" cy="140" r="3" fill="url(#logoGradient)"/>
      <circle cx="165" cy="140" r="3" fill="url(#logoGradient)"/>
    </svg>
  );
};

export default Logo; 