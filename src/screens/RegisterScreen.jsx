import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useRegisterMutation, useSendOtpMutation, useVerifyOtpMutation } from '../slices/usersApiSlice';
import { setCredentials } from '../slices/authSlice';
import { motion } from 'framer-motion';
import { FaBrain, FaEnvelope, FaLock, FaUser, FaGithub, FaEye, FaEyeSlash, FaExclamationTriangle, FaExclamationCircle } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import Loader from '../components/Loader';
import { useTheme } from '../context/ThemeContext';
import config from '../config/config.js';
import { showToast } from '../utils/toast';

const RegisterScreen = () => {
  const { isDarkMode } = useTheme();
  const [email, setEmail] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    requirements: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false
    }
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [register, { isLoading }] = useRegisterMutation();
  const [sendOtp] = useSendOtpMutation();
  const [verifyOtp] = useVerifyOtpMutation();

  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    if (userInfo) {
      navigate('/');
    }
  }, [navigate, userInfo]);

  useEffect(() => {
    // Check for successful Google OAuth login
    const params = new URLSearchParams(location.search);
    const loginSuccess = params.get('loginSuccess');
    const error = params.get('error');

    if (loginSuccess === 'true') {
      showToast.success('Login successful');
      // Redirect to appropriate dashboard based on user type
      if (userInfo) {
        const dashboardPath = getDashboardPath(userInfo.userType);
        navigate(dashboardPath);
      }
    } else if (error) {
      showToast.error(decodeURIComponent(error));
    }
  }, [location, userInfo, navigate]);

  const getDashboardPath = (userType) => {
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

  const checkPasswordStrength = (password) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    // Calculate score based on met requirements
    const score = Object.values(requirements).filter(Boolean).length;

    setPasswordStrength({ score, requirements });
  };

  const getStrengthColor = () => {
    switch (passwordStrength.score) {
      case 0:
      case 1:
        return 'bg-red-500';
      case 2:
      case 3:
        return 'bg-yellow-500';
      case 4:
      case 5:
        return 'bg-green-500';
      default:
        return 'bg-gray-200';
    }
  };

  // Update password strength when password changes
  useEffect(() => {
    checkPasswordStrength(password);
  }, [password]);

  const isPasswordValid = () => {
    return Object.values(passwordStrength.requirements).every(Boolean);
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please make sure both passwords are identical.');
      showToast.error('Passwords do not match');
      return;
    }

    try {
      const res = await register({ name, email, password }).unwrap();
      dispatch(setCredentials({ ...res }));
      showToast.success('Registration successful! Welcome to NexusEdu.');
      navigate('/');
    } catch (err) {
      console.error('Registration error:', err);
      
      // Handle different error scenarios
      if (err?.data?.message?.includes('User already exists')) {
        setErrorMessage(`An account with email "${email}" already exists. Please use a different email or try logging in.`);
        showToast.error(err.data.message);
      } else if (err?.data?.message?.includes('Email')) {
        setErrorMessage(err.data.message);
        showToast.error(err.data.message);
      } else if (err?.data?.message?.includes('Password')) {
        setErrorMessage(err.data.message);
        showToast.error(err.data.message);
      } else if (!navigator.onLine) {
        setErrorMessage('No internet connection. Please check your network and try again.');
        showToast.error('Network error');
      } else if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        setErrorMessage('Unable to connect to the server. Please try again later.');
        showToast.error('Connection error');
      } else {
        setErrorMessage(err?.data?.message || 'Registration failed. Please try again later.');
        showToast.error(err?.data?.message || 'Registration failed');
      }
    }
  };

  const handleGoogleSignIn = () => {
    const authUrl = `${config.API_BASE_URL}/api/users/auth/google`;
    // Ensure HTTPS in production and correct redirect
    if (process.env.NODE_ENV === 'production') {
      const redirectUrl = `${config.FRONTEND_URL}/register`;
      window.location.href = `${authUrl}?redirect_uri=${encodeURIComponent(redirectUrl)}`;
    } else {
      window.location.href = authUrl;
    }
  };

  // Handle email verification
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    // Basic email validation
    if (!email || !email.includes('@') || !email.includes('.')) {
      setErrorMessage('Please enter a valid email address');
      showToast.error('Invalid email format');
      return;
    }
    
    try {
      await sendOtp({ email }).unwrap();
      setShowOtpInput(true);
      showToast.success('OTP sent to your email');
    } catch (err) {
      console.error('Send OTP error:', err);
      
      if (err?.data?.message?.includes('User already exists')) {
        setErrorMessage(`An account with email "${email}" already exists. Please use a different email or try logging in.`);
        showToast.error(err.data.message);
      } else {
        setErrorMessage(err?.data?.message || 'Failed to send OTP');
        showToast.error(err?.data?.message || 'Failed to send OTP');
      }
    }
  };

  // Handle OTP verification
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!otp || otp.length !== 6) {
      setErrorMessage('Please enter a valid 6-digit OTP');
      showToast.error('Invalid OTP');
      return;
    }
    
    try {
      await verifyOtp({ email, otp }).unwrap();
      setIsEmailVerified(true);
      setShowOtpInput(false);
      showToast.success('Email verified successfully');
    } catch (err) {
      console.error('Verify OTP error:', err);
      
      if (err?.data?.message?.includes('expired')) {
        setErrorMessage('OTP has expired. Please request a new one.');
        showToast.error(err.data.message);
      } else if (err?.data?.message?.includes('Invalid OTP')) {
        setErrorMessage('The OTP you entered is incorrect. Please try again.');
        showToast.error(err.data.message);
      } else {
        setErrorMessage(err?.data?.message || 'Invalid OTP');
        showToast.error(err?.data?.message || 'Invalid OTP');
      }
    }
  };

  return (
    <div className={`min-h-screen relative flex items-center justify-center pt-28 pb-12 px-4 sm:px-6 lg:px-8 ${
      isDarkMode ? 'bg-[#0A0F1C]' : 'bg-white'
    }`}>
      {/* Fixed background gradients */}
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md relative z-10 mt-4"
      >
        {/* Title Section - Removed logo */}
        <div className="text-center mb-8">
          <h2 className={`text-3xl font-bold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Create Account
          </h2>
          <p className={isDarkMode ? 'mt-2 text-gray-400' : 'mt-2 text-gray-600'}>
            Join the future of education
          </p>
        </div>

        <div className="mt-6 relative">
          {/* Background blur effect */}
          <div className={`absolute inset-0 bg-gradient-to-r ${
            isDarkMode 
              ? 'from-violet-600/20 to-indigo-600/20'
              : 'from-violet-600/10 to-indigo-600/10'
          } rounded-lg blur`} />
          
          {/* Google Sign In Button */}
          <div className="relative">
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

          {/* Divider */}
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

          <form 
            onSubmit={!isEmailVerified ? (showOtpInput ? handleVerifyOTP : handleSendOTP) : submitHandler} 
            className={`relative space-y-6 ${
              isDarkMode 
                ? 'bg-gray-900/50 border-gray-800' 
                : 'bg-white/50 border-gray-200'
            } backdrop-blur-xl p-6 sm:p-8 rounded-lg shadow-xl border`}
          >
            {/* Error message display */}
            {errorMessage && (
              <div className={`p-3 rounded-lg ${
                isDarkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-50 text-red-700'
              } flex items-start`}>
                <FaExclamationTriangle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{errorMessage}</p>
              </div>
            )}
            
            {/* Email Input */}
            <div>
              <label htmlFor="email" className={`block text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Email Address
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  type="email"
                  required
                  disabled={isEmailVerified}
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    isDarkMode 
                      ? 'border-gray-700 bg-gray-800/50 text-white placeholder-gray-500' 
                      : 'border-gray-300 bg-white/50 text-gray-900 placeholder-gray-400'
                  } rounded-lg`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* OTP Input - Show only when OTP is sent */}
            {showOtpInput && !isEmailVerified && (
              <div>
                <label htmlFor="otp" className={`block text-sm font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Enter OTP
                </label>
                <div className="mt-1">
                  <div className="flex gap-2 justify-between">
                    {[...Array(6)].map((_, index) => (
                      <input
                        key={index}
                        type="text"
                        maxLength={1}
                        className={`w-12 h-12 text-center text-xl font-semibold border ${
                          isDarkMode 
                            ? 'border-gray-700 bg-gray-800/50 text-white' 
                            : 'border-gray-300 bg-white/50 text-gray-900'
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
                        value={otp[index] || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value.match(/^[0-9]$/)) {
                            const newOtp = [...otp];
                            newOtp[index] = value;
                            setOtp(newOtp.join(''));
                            // Auto-focus next input
                            if (index < 5 && value) {
                              const nextInput = e.target.nextElementSibling;
                              if (nextInput) {
                                nextInput.focus();
                              }
                            }
                          }
                        }}
                        onKeyDown={(e) => {
                          // Handle backspace
                          if (e.key === 'Backspace') {
                            e.preventDefault();
                            const newOtp = [...otp];
                            newOtp[index] = '';
                            setOtp(newOtp.join(''));
                            // Move focus to previous input
                            if (index > 0) {
                              const prevInput = e.target.previousElementSibling;
                              if (prevInput) {
                                prevInput.focus();
                              }
                            }
                          }
                          // Handle left arrow
                          else if (e.key === 'ArrowLeft' && index > 0) {
                            e.target.previousElementSibling?.focus();
                          }
                          // Handle right arrow
                          else if (e.key === 'ArrowRight' && index < 5) {
                            e.target.nextElementSibling?.focus();
                          }
                        }}
                        onFocus={(e) => {
                          // Select text on focus
                          e.target.select();
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pastedData = e.clipboardData.getData('text').slice(0, 6);
                          if (pastedData.match(/^[0-9]{1,6}$/)) {
                            const newOtp = pastedData.padEnd(6, '').split('');
                            setOtp(newOtp.join(''));
                            // Focus the next empty input
                            const inputs = e.target.parentElement.getElementsByTagName('input');
                            const nextEmptyIndex = pastedData.length;
                            if (nextEmptyIndex < 6) {
                              inputs[nextEmptyIndex]?.focus();
                            }
                          }
                        }}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifyOTP}
                    disabled={otp.length !== 6}
                    className={`mt-4 w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                      ${otp.length === 6 
                        ? 'bg-violet-600 hover:bg-violet-700' 
                        : 'bg-violet-400 cursor-not-allowed'
                      } transition-colors duration-200`}
                  >
                    Verify OTP
                  </button>
                </div>
              </div>
            )}

            {/* Show rest of the form only after email verification */}
            {isEmailVerified && (
              <>
                <div className="space-y-5">
                  <div>
                    <label htmlFor="name" className={`block text-sm font-medium ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Full Name
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaUser className={`h-5 w-5 ${
                          isDarkMode ? 'text-gray-500' : 'text-gray-400'
                        }`} />
                      </div>
                      <input
                        id="name"
                        type="text"
                        required
                        className={`block w-full pl-10 pr-3 py-2 border ${
                          isDarkMode 
                            ? 'border-gray-700 bg-gray-800/50 text-white placeholder-gray-500' 
                            : 'border-gray-300 bg-white/50 text-gray-900 placeholder-gray-400'
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className={`block text-sm font-medium ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Password
                    </label>
                    <div className="mt-1 space-y-2">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FaLock className={`h-5 w-5 ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-400'
                          }`} />
                        </div>
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          required
                          className={`block w-full pl-10 pr-12 py-2 border ${
                            isDarkMode 
                              ? 'border-gray-700 bg-gray-800/50 text-white placeholder-gray-500' 
                              : 'border-gray-300 bg-white/50 text-gray-900 placeholder-gray-400'
                          } rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
                          placeholder="Create a password"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            checkPasswordStrength(e.target.value);
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

                      {/* Password Strength Indicator */}
                      {password && (
                        <div className="space-y-2">
                          <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${getStrengthColor()} transition-all duration-300`}
                              style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                            />
                          </div>

                          {/* Password Requirements */}
                          <div className={`text-xs space-y-1 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            <p className={passwordStrength.requirements.length ? 'text-green-500' : ''}>
                              ✓ At least 8 characters
                            </p>
                            <p className={passwordStrength.requirements.uppercase ? 'text-green-500' : ''}>
                              ✓ At least one uppercase letter
                            </p>
                            <p className={passwordStrength.requirements.lowercase ? 'text-green-500' : ''}>
                              ✓ At least one lowercase letter
                            </p>
                            <p className={passwordStrength.requirements.number ? 'text-green-500' : ''}>
                              ✓ At least one number
                            </p>
                            <p className={passwordStrength.requirements.special ? 'text-green-500' : ''}>
                              ✓ At least one special character
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className={`block text-sm font-medium ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Confirm Password
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaLock className={`h-5 w-5 ${
                          isDarkMode ? 'text-gray-500' : 'text-gray-400'
                        }`} />
                      </div>
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        className={`block w-full pl-10 pr-12 py-2 border ${
                          isDarkMode 
                            ? 'border-gray-700 bg-gray-800/50 text-white placeholder-gray-500' 
                            : 'border-gray-300 bg-white/50 text-gray-900 placeholder-gray-400'
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showConfirmPassword ? (
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
                  disabled={isLoading || !isPasswordValid() || !password || !confirmPassword}
                  className="w-full flex justify-center py-3 px-4 rounded-lg text-white bg-gradient-to-r from-violet-600 to-indigo-600"
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </motion.button>
              </>
            )}

            {/* Initial verify email button */}
            {!isEmailVerified && !showOtpInput && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full flex justify-center py-3 px-4 rounded-lg text-white bg-gradient-to-r from-violet-600 to-indigo-600"
              >
                Verify Email
              </motion.button>
            )}
          </form>
        </div>

        <div className="text-center mt-6">
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-violet-600 hover:text-violet-500 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterScreen;