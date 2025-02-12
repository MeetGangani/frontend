const config = {
  API_BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://backdeploy-9bze.onrender.com'
    : 'http://localhost:5000',
  FRONTEND_URL: process.env.NODE_ENV === 'production'
    ? 'https://nexusedu-meetgangani56-gmailcoms-projects.vercel.app'
    : 'http://localhost:3000'
};

export default config; 