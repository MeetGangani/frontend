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


      {/* Large Connection Points */}
      <circle cx="100" cy="50" r="20" fill="url(#logoGradient)"/>
      <circle cx="60" cy="120" r="15" fill="url(#logoGradient)"/>
      <circle cx="140" cy="120" r="15" fill="url(#logoGradient)"/>

      {/* Medium Connection Points */}
      <circle cx="100" cy="90" r="12" fill="url(#logoGradient)"/>
      <circle cx="80" cy="150" r="10" fill="url(#logoGradient)"/>
      <circle cx="120" cy="150" r="10" fill="url(#logoGradient)"/>

      {/* Small Connection Points */}
      <circle cx="40" cy="90" r="8" fill="url(#logoGradient)"/>
      <circle cx="160" cy="90" r="8" fill="url(#logoGradient)"/>

      {/* Connection Lines */}
      <path 
        d="M100 70L60 120M100 70L140 120M100 70L40 90M100 70L160 90
           M60 120L80 150M140 120L120 150M100 90L80 150M100 90L120 150
           M60 120L140 120" 
        stroke="url(#logoGradient)" 
        strokeWidth="3"
        opacity="0.6"
      />

      {/* Background Circle */}
      <circle 
        cx="100" 
        cy="100" 
        r="80" 
        stroke="url(#logoGradient)" 
        strokeWidth="2"
        opacity="0.1"
        fill="none"
      />
    </svg>
  );
};

export default Logo; 