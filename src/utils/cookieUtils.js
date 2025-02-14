export const clearAuthCookies = () => {
  const cookies = ['jwt']; // Add any other auth-related cookies here
  const domains = [
    '', // current domain
    '.onrender.com', // production domain
    'localhost' // development domain
  ];
  
  cookies.forEach(cookieName => {
    domains.forEach(domain => {
      // Clear cookie for all paths and domains
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;${domain ? ` domain=${domain};` : ''}`;
      
      if (process.env.NODE_ENV === 'production') {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain}; secure; samesite=none;`;
      }
    });
  });
}; 
