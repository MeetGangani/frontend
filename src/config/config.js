const config = {
  API_BASE_URL: 'https://backdeploy-9bze.onrender.com',
  FRONTEND_URL: process.env.NODE_ENV === 'production'
    ? 'https://nexusedu-jade.vercel.app'
    : 'http://localhost:3000',
  TOKEN_KEY: 'userToken',
  USER_INFO: 'userInfo',
  _config: {
    // Add any additional configuration needed by providers
    provider: {
      enabled: true,
      options: {}
    }
  }
};

export default config; 