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
      </defs>

      <circle cx="100" cy="100" r="90" fill="url(#logoGradient)" opacity="0.1"/>
      
      <path 
        d="M50 90L100 65L150 90L100 115L50 90Z M100 125L70 110V130Q85 140 100 145Q115 140 130 130V110L100 125Z" 
        fill="url(#logoGradient)"
      />

      <path 
        d="M60 80Q80 60 100 55Q120 60 140 80M60 100Q80 120 100 125Q120 120 140 100" 
        stroke="url(#logoGradient)" 
        strokeWidth="4" 
        fill="none"
        strokeLinecap="round"
      />

      <circle cx="60" cy="80" r="4" fill="url(#logoGradient)"/>
      <circle cx="140" cy="80" r="4" fill="url(#logoGradient)"/>
      <circle cx="60" cy="100" r="4" fill="url(#logoGradient)"/>
      <circle cx="140" cy="100" r="4" fill="url(#logoGradient)"/>
    </svg>
  );
};

export default Logo; 