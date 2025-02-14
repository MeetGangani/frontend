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
      
      <path d="
        M 60 140
        L 60 60
        L 100 110
        L 140 60
        L 140 140
        L 120 140
        L 120 90
        L 100 120
        L 80 90
        L 80 140
        Z
      " fill="url(#logoGradient)"/>

      <path d="
        M 85 130
        Q 100 120 115 130
        L 115 135
        Q 100 125 85 135
        Z
      " fill="url(#logoGradient)"/>
    </svg>
  );
};

export default Logo; 