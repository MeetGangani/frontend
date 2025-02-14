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
        d="M60 140L60 60L100 110L140 60L140 140L120 140L120 90L100 120L80 90L80 140Z" 
        fill="url(#logoGradient)"
      />

      <path 
        d="M85 130Q100 120 115 130L115 135Q100 125 85 135Z" 
        fill="url(#logoGradient)"
      />
    </svg>
  );
};

export default Logo; 