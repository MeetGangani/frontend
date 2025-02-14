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
        
        {/* 3D effect gradients */}
        <linearGradient id="topGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{stopColor:"#7C3AED", stopOpacity: "1"}}/>
          <stop offset="100%" style={{stopColor:"#4F46E5", stopOpacity: "0.8"}}/>
        </linearGradient>
      </defs>

      {/* Largest Hexagon */}
      <path 
        d="M100 40L155 70V130L100 160L45 130V70L100 40Z" 
        fill="white" 
        stroke="url(#logoGradient)" 
        strokeWidth="3"
      />

      {/* Second Hexagon */}
      <path 
        d="M100 50L145 75V125L100 150L55 125V75L100 50Z" 
        fill="white" 
        stroke="url(#logoGradient)" 
        strokeWidth="3"
      />

      {/* Third Hexagon */}
      <path 
        d="M100 60L135 80V120L100 140L65 120V80L100 60Z" 
        fill="white" 
        stroke="url(#logoGradient)" 
        strokeWidth="3"
      />

      {/* Center Hexagon */}
      <path 
        d="M100 70L125 85V115L100 130L75 115V85L100 70Z" 
        fill="url(#topGradient)" 
        opacity="0.2"
      />

      {/* Left Connection Lines */}
      <line x1="25" y1="85" x2="45" y2="85" stroke="url(#logoGradient)" strokeWidth="2"/>
      <line x1="25" y1="100" x2="45" y2="100" stroke="url(#logoGradient)" strokeWidth="2"/>
      <line x1="25" y1="115" x2="45" y2="115" stroke="url(#logoGradient)" strokeWidth="2"/>

      {/* Right Connection Lines */}
      <line x1="155" y1="85" x2="175" y2="85" stroke="url(#logoGradient)" strokeWidth="2"/>
      <line x1="155" y1="100" x2="175" y2="100" stroke="url(#logoGradient)" strokeWidth="2"/>
      <line x1="155" y1="115" x2="175" y2="115" stroke="url(#logoGradient)" strokeWidth="2"/>

      {/* Connection Points Left */}
      <circle cx="20" cy="85" r="4" fill="url(#logoGradient)"/>
      <circle cx="20" cy="100" r="4" fill="url(#logoGradient)"/>
      <circle cx="20" cy="115" r="4" fill="url(#logoGradient)"/>

      {/* Connection Points Right */}
      <circle cx="180" cy="85" r="4" fill="url(#logoGradient)"/>
      <circle cx="180" cy="100" r="4" fill="url(#logoGradient)"/>
      <circle cx="180" cy="115" r="4" fill="url(#logoGradient)"/>

      {/* Decorative Dots */}
      <circle cx="100" cy="30" r="3" fill="url(#logoGradient)"/>
      <circle cx="100" cy="170" r="3" fill="url(#logoGradient)"/>
      <circle cx="40" cy="60" r="3" fill="url(#logoGradient)"/>
      <circle cx="160" cy="60" r="3" fill="url(#logoGradient)"/>
      <circle cx="40" cy="140" r="3" fill="url(#logoGradient)"/>
      <circle cx="160" cy="140" r="3" fill="url(#logoGradient)"/>
    </svg>
  );
};

export default Logo; 