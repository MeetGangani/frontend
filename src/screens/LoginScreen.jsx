import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useLoginMutation } from '../slices/usersApiSlice';
import { setCredentials } from '../slices/authSlice';
import { motion } from 'framer-motion';
import { FaBrain, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaExclamationTriangle, FaCheckCircle, FaExclamationCircle, FaInfoCircle } from 'react-icons/fa';
import Loader from '../components/Loader';
import { useTheme } from '../context/ThemeContext';
import { FcGoogle } from 'react-icons/fc';
import config from '../config/config.js';
import Logo from '../components/Logo';
import { showToast } from '../utils/toast';
import axios from 'axios';

const LoginScreen = () => {
  const { isDarkMode } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionEmail, setSessionEmail] = useState('');
  const [sessionPassword, setSessionPassword] = useState('');
  const [isForceLoggingOut, setIsForceLoggingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [login, { isLoading }] = useLoginMutation();
  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    if (userInfo && !isLoading) {
      const redirectPath = getRedirectPath(userInfo.userType);
      navigate(redirectPath);
    }
  }, [navigate, userInfo, isLoading]);

  const getRedirectPath = (userType) => {
    switch (userType) {
      case 'admin':
        return '/admin/dashboard';
      case 'institute':
        return '/institute/dashboard';
      case 'student':
        return '/student/dashboard';
      default:
        return '/';
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    // Basic validation
    if (!email.trim()) {
      setErrorMessage('Please enter your email address');
      return;
    }
    
    if (!password) {
      setErrorMessage('Please enter your password');
      return;
    }
    
    try {
      const res = await login({ email, password }).unwrap();
      dispatch(setCredentials({ ...res }));
      
      // Show different success messages based on user type
      let successMessage = '';
      switch (res.userType) {
        case 'student':
          successMessage = `Welcome back, ${res.name}! You're now logged in as a student.`;
          break;
        case 'institute':
          successMessage = `Welcome back, ${res.name}! You're now logged in as an institute.`;
          break;
        case 'admin':
          successMessage = `Welcome back, ${res.name}! You're now logged in as an administrator.`;
          break;
        default:
          successMessage = 'Login successful!';
      }
      
      showToast.success(successMessage);
      navigate(getRedirectPath(res.userType));
    } catch (err) {
      console.error('Login error:', err);
      
      // Check for session conflict error
      if (err?.data?.message && err.data.message.includes('already logged in on another')) {
        // Show session modal
        setSessionEmail(email);
        setSessionPassword(password);
        setShowSessionModal(true);
        // Display the exact error message from the backend
        setErrorMessage(err.data.message);
        // Show toast with the exact error message
        showToast.error(err.data.message);
      } else if (err?.data?.message?.includes('Invalid email or password')) {
        setErrorMessage('The email or password you entered is incorrect. Please try again.');
        showToast.error('Invalid credentials');
      } else if (err?.data?.message?.includes('Email address is required')) {
        setErrorMessage('Please enter your email address');
        showToast.error('Email required');
      } else if (err?.data?.message?.includes('Password is required')) {
        setErrorMessage('Please enter your password');
        showToast.error('Password required');
      } else if (!navigator.onLine) {
        setErrorMessage('No internet connection. Please check your network and try again.');
        showToast.error('Network error');
      } else {
        // For any other error, display the exact error message from the backend
        setErrorMessage(err?.data?.message || 'Login failed. Please try again later.');
        showToast.error(err?.data?.message || 'Login failed');
      }
    }
  };

  const handleForceLogout = async () => {
    setIsForceLoggingOut(true);
    try {
      // First login
      const loginRes = await login({ 
        email: sessionEmail, 
        password: sessionPassword,
        forceLogin: true 
      }).unwrap();
      
      // Then force logout other sessions
      await axios.post(
        `${config.API_BASE_URL}/api/users/force-logout-others`,
        {},
        { withCredentials: true }
      );
      
      // Set credentials and navigate
      dispatch(setCredentials({ ...loginRes }));
      
      const deviceInfo = navigator.userAgent;
      const deviceName = deviceInfo.includes('Mobile') ? 'mobile device' : 'computer';
      
      showToast.success(`Successfully logged in on this ${deviceName}. All other sessions have been terminated.`);
      navigate(getRedirectPath(loginRes.userType));
      setShowSessionModal(false);
    } catch (error) {
      console.error('Force logout error:', error);
      // Display the exact error message from the backend
      const errorMsg = error?.response?.data?.message || error?.data?.message || 'Failed to force logout';
      showToast.error(errorMsg);
      setErrorMessage(errorMsg);
    } finally {
      setIsForceLoggingOut(false);
    }
  };

  const handleGoogleSignIn = () => {
    const authUrl = process.env.NODE_ENV === 'production'
      ? 'https://backdeploy-9bze.onrender.com/api/users/auth/google'
      : 'http://localhost:5000/api/users/auth/google';
    window.location.href = authUrl;
  };

  return (
    <div className={`min-h-screen relative flex items-center justify-center pt-28 pb-12 px-4 sm:px-6 lg:px-8 ${
      isDarkMode ? 'bg-[#0A0F1C]' : 'bg-white'
    }`}>
      {/* Background gradients */}
      <div className="fixed inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-violet-600/10 via-transparent to-indigo-600/10" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-violet-500/10 rounded-full filter blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full filter blur-3xl" />
      </div>

      {/* Loader - Move outside the motion.div and center it */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <Loader />
        </div>
      )}

      {/* Session Modal */}
      {showSessionModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-xl ${
            isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
          } p-6 shadow-2xl`}>
            <div className="flex items-center mb-4 text-amber-500">
              <FaExclamationTriangle className="w-6 h-6 mr-2" />
              <h3 className="text-xl font-bold">Active Session Detected</h3>
            </div>
            
            <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {errorMessage || 'You are already logged in on another device. Please log out from there first or use the option below to log out other sessions.'}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button
                onClick={() => setShowSessionModal(false)}
                className={`px-4 py-2 rounded-lg ${
                  isDarkMode 
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                } transition-colors`}
                disabled={isForceLoggingOut}
              >
                Cancel
              </button>
              <button
                onClick={handleForceLogout}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors flex items-center justify-center"
                disabled={isForceLoggingOut}
              >
                {isForceLoggingOut ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  'Log out other sessions'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md relative z-10 mt-4"
      >
        {/* Title Section */}
        <div className="text-center mb-8">
          <h2 className={`text-3xl font-bold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Welcome Back
          </h2>
          <p className={`mt-2 text-sm ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Sign in to your account
          </p>
        </div>

        {/* Form Container */}
        <div className={`rounded-xl backdrop-blur-xl ${
          isDarkMode 
            ? 'bg-gray-900/50 border-gray-800' 
            : 'bg-white/50 border-gray-200'
        } border p-8 shadow-xl`}>
          {/* Error message display */}
          {errorMessage && (
            <div className={`mb-6 p-3 rounded-lg ${
              isDarkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-50 text-red-700'
            } flex items-start`}>
              <FaExclamationTriangle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{errorMessage}</p>
            </div>
          )}
          
          <div className="relative mb-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleSignIn}
              className={`w-full flex items-center justify-center px-4 py-3 border ${
                isDarkMode 
                  ? 'border-gray-700 bg-gray-800/50 hover:bg-gray-700/50' 
                  : 'border-gray-300 bg-white hover:bg-gray-50'
              } rounded-lg transition-colors duration-150`}
            >
              <FcGoogle className="w-5 h-5 mr-2" />
              <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                Continue with Google
              </span>
            </motion.button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className={`w-full border-t ${
                isDarkMode ? 'border-gray-700' : 'border-gray-300'
              }`}></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className={`px-2 ${
                isDarkMode 
                  ? 'bg-gray-900/50 text-gray-400' 
                  : 'bg-white/50 text-gray-500'
              }`}>
                Or continue with email
              </span>
            </div>
          </div>

          <div className="relative">
            <div className={`absolute inset-0 bg-gradient-to-r ${
              isDarkMode 
                ? 'from-violet-600/20 to-indigo-600/20'
                : 'from-violet-600/10 to-indigo-600/10'
            } rounded-lg blur`} />
            <form 
              onSubmit={submitHandler} 
              className={`relative ${
                isDarkMode 
                  ? 'bg-gray-900/50 border-gray-800' 
                  : 'bg-white/50 border-gray-200'
              } backdrop-blur-xl p-8 rounded-lg shadow-xl space-y-6 border`}
            >
              <div className="space-y-5">
                <div>
                  <label htmlFor="email" className={`block text-sm font-medium ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Email Address
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaEnvelope className={`h-5 w-5 ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-400'
                      }`} />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className={`block w-full pl-10 pr-3 py-2 border ${
                        isDarkMode 
                          ? 'border-gray-700 bg-gray-800/50 text-white placeholder-gray-500' 
                          : 'border-gray-300 bg-white/50 text-gray-900 placeholder-gray-400'
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrorMessage('');
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className={`block text-sm font-medium ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Password
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLock className={`h-5 w-5 ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-400'
                      }`} />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      className={`block w-full pl-10 pr-12 py-2 border ${
                        isDarkMode 
                          ? 'border-gray-700 bg-gray-800/50 text-white placeholder-gray-500' 
                          : 'border-gray-300 bg-white/50 text-gray-900 placeholder-gray-400'
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrorMessage('');
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <FaEye className={`h-5 w-5 ${
                          isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                        } cursor-pointer transition-colors`} />
                      ) : (
                        <FaEyeSlash className={`h-5 w-5 ${
                          isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                        } cursor-pointer transition-colors`} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 rounded-lg text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-150"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </motion.button>
            </form>
          </div>

          <div className="text-center mt-6">
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              New to NexusEdu?{' '}
              <Link to="/register" className="font-medium text-violet-600 hover:text-violet-500 transition-colors">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginScreen;