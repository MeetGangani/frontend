import { useState, useEffect } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { Form, Button } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import Loader from '../components/Loader';
import { useUpdateUserMutation } from '../slices/usersApiSlice';
import { setCredentials } from '../slices/authSlice';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import { showToast } from '../utils/toast';
import { FaEye, FaEyeSlash, FaLock } from 'react-icons/fa';

const ProfileScreen = () => {
  const { isDarkMode } = useTheme();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  const dispatch = useDispatch();

  const { userInfo } = useSelector((state) => state.auth);

  const [updateProfile, { isLoading }] = useUpdateUserMutation();

  useEffect(() => {
    setName(userInfo.name);
    setEmail(userInfo.email);
  }, [userInfo.email, userInfo.name]);

  const checkPasswordStrength = (password) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

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

  useEffect(() => {
    checkPasswordStrength(password);
  }, [password]);

  const isPasswordValid = () => {
    return password ? Object.values(passwordStrength.requirements).every(Boolean) : true;
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    if (password && !isPasswordValid()) {
      showToast.error('Please enter a strong password');
      return;
    }
    if (password !== confirmPassword) {
      showToast.error('Passwords do not match');
      return;
    }

    try {
      const res = await updateProfile({
        _id: userInfo._id,
        name,
        email,
        password,
      }).unwrap();
      dispatch(setCredentials(res));
      showToast.success('Profile updated successfully');
    } catch (err) {
      showToast.error(err?.data?.message || 'Update failed');
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#0A0F1C]' : 'bg-gray-50'}`}>
      <div className="max-w-xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`${
            isDarkMode ? 'bg-[#1a1f2e]' : 'bg-white'
          } rounded-2xl shadow-xl p-8`}
        >
          <h1 className={`text-2xl font-bold mb-6 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Update Profile
          </h1>

          <form onSubmit={submitHandler} className="space-y-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Name
              </label>
              <input
                type="text"
                placeholder="Enter name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg ${
                  isDarkMode 
                    ? 'bg-[#0A0F1C] border-gray-700 text-white placeholder-gray-500' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                } border focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Email Address
              </label>
              <input
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg ${
                  isDarkMode 
                    ? 'bg-[#0A0F1C] border-gray-700 text-white placeholder-gray-500' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                } border focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-10 pr-12 py-3 rounded-lg ${
                    isDarkMode 
                      ? 'bg-[#0A0F1C] border-gray-700 text-white' 
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                  } border focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <FaEye className={`h-5 w-5 ${
                      isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                    }`} />
                  ) : (
                    <FaEyeSlash className={`h-5 w-5 ${
                      isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                    }`} />
                  )}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2 space-y-2">
                  <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getStrengthColor()} transition-all duration-300`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    />
                  </div>

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

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full pl-10 pr-12 py-3 rounded-lg ${
                    isDarkMode 
                      ? 'bg-[#0A0F1C] border-gray-700 text-white' 
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                  } border focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <FaEye className={`h-5 w-5 ${
                      isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                    }`} />
                  ) : (
                    <FaEyeSlash className={`h-5 w-5 ${
                      isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                    }`} />
                  )}
                </button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading || (password && !isPasswordValid())}
              className="w-full px-4 py-3 text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg hover:from-violet-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-150"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  Updating...
                </div>
              ) : (
                'Update Profile'
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfileScreen;
