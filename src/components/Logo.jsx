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
        <linearGradient id="logoGradient2" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" style={{stopColor:"#7C3AED"}}/> 
          <stop offset="100%" style={{stopColor:"#4F46E5"}}/> 
        </linearGradient>
      </defs>

      {/* Background Shape */}
      <path 
        d="M40 80C40 60 50 40 80 40H120C150 40 160 60 160 80V120C160 140 150 160 120 160H80C50 160 40 140 40 120V80Z" 
        fill="url(#logoGradient)"
        opacity="0.1"
      />

      {/* Main Shield Shape */}
      <path 
        d="M70 60C70 50 75 40 100 40C125 40 130 50 130 60V100C130 120 115 130 100 130C85 130 70 120 70 100V60Z" 
        fill="url(#logoGradient)"
      />

      {/* Inner Elements */}
      <path 
        d="M85 70H115M85 90H115" 
        stroke="white" 
        strokeWidth="6" 
        strokeLinecap="round"
      />

      {/* Decorative Elements */}
      <circle cx="85" cy="110" r="4" fill="white"/>
      <circle cx="100" cy="110" r="4" fill="white"/>
      <circle cx="115" cy="110" r="4" fill="white"/>

      {/* Bottom Accent */}
      <path 
        d="M80 140H120M90 150H110" 
        stroke="url(#logoGradient2)" 
        strokeWidth="6" 
        strokeLinecap="round"
      />
    </svg>
  );
};

export default Logo; 