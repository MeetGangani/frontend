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
import { FaEye, FaEyeSlash, FaLock, FaUser, FaEnvelope, FaUserCircle } from 'react-icons/fa';

const ProfileScreen = () => {
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
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

  // Generate avatar URL using DiceBear API
  useEffect(() => {
    if (userInfo?.name) {
      setAvatarUrl(`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userInfo.name)}&backgroundColor=6d28d9`);
    }
  }, [userInfo?.name]);

  useEffect(() => {
    if (userInfo && !isEditing) {  // Only update form when not in editing mode
      setFormData({
        name: userInfo.name || '',
        email: userInfo.email || '',
        password: '',
        confirmPassword: '',
      });
    }
  }, [userInfo, isEditing]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };

  // Password strength checker
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
    const { score } = passwordStrength;
    if (score <= 2) return 'bg-red-500';
    if (score <= 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setFormData({
      name: userInfo.name || '',
      email: userInfo.email || '',
      password: '',
      confirmPassword: '',
    });
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setFormData({
      name: userInfo.name || '',
      email: userInfo.email || '',
      password: '',
      confirmPassword: '',
    });
    setPasswordStrength({
      score: 0,
      requirements: {
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false
      }
    });
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    
    if (formData.password && formData.password !== formData.confirmPassword) {
      showToast.error('Passwords do not match');
      return;
    }

    try {
      // Only send fields that have changed
      const updateData = {
        _id: userInfo._id,
        name: formData.name !== userInfo.name ? formData.name : undefined,
        email: formData.email !== userInfo.email ? formData.email : undefined,
        password: formData.password || undefined,
      };

      // Filter out undefined values
      const filteredUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, v]) => v !== undefined)
      );

      // Only make API call if there are changes
      if (Object.keys(filteredUpdateData).length > 1) { // > 1 because _id is always present
        const res = await updateProfile(filteredUpdateData).unwrap();
        dispatch(setCredentials(res));
        setIsEditing(false);
        showToast.success('Profile updated successfully');
      } else {
        setIsEditing(false);
      }
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        password: '',
        confirmPassword: ''
      }));
    } catch (err) {
      showToast.error(err?.data?.message || 'Update failed');
    }
  };

  const InputField = ({ icon: Icon, ...props }) => (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
      </div>
      <input
        className={`w-full pl-10 pr-12 py-3 rounded-lg ${
          isDarkMode 
            ? 'bg-[#0A0F1C] border-gray-700 text-white placeholder-gray-500' 
            : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
        } border focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors duration-200 ${
          !isEditing ? 'opacity-75 cursor-not-allowed' : ''
        }`}
        disabled={!isEditing}
        {...props}
      />
    </div>
  );

  return (
    <div className={`min-h-screen pt-20 ${isDarkMode ? 'bg-[#0A0F1C]' : 'bg-gray-50'}`}>
      <div className="max-w-xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${isDarkMode ? 'bg-[#1a1f2e]' : 'bg-white'} rounded-2xl shadow-xl p-8`}
        >
          {/* Profile Header */}
          <div className="flex items-center justify-center mb-8">
            <div className="text-center">
              <div className="relative inline-block">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="w-24 h-24 rounded-full border-4 border-violet-500"
                  />
                ) : (
                  <FaUserCircle className="w-24 h-24 text-violet-500" />
                )}
              </div>
              <h2 className={`mt-4 text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {userInfo?.name}
              </h2>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {userInfo?.userType?.charAt(0).toUpperCase() + userInfo?.userType?.slice(1)}
              </p>
            </div>
          </div>

          <form onSubmit={submitHandler} className="space-y-6">
            {/* Name Field */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Name
              </label>
              <InputField
                icon={FaUser}
                type="text"
                name="name"
                placeholder="Enter name"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>

            {/* Email Field */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Email Address
              </label>
              <InputField
                icon={FaEnvelope}
                type="email"
                name="email"
                placeholder="Enter email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>

            {/* Password Fields - Only show when editing */}
            {isEditing && (
              <>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    New Password
                  </label>
                  <div className="relative">
                    <InputField
                      icon={FaLock}
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Enter new password"
                      value={formData.password}
                      onChange={handleInputChange}
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
                  {formData.password && (
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
                        {Object.entries(passwordStrength.requirements).map(([key, met]) => (
                          <p key={key} className={met ? 'text-green-500' : ''}>
                            ✓ {key.charAt(0).toUpperCase() + key.slice(1)} requirement
                          </p>
                        ))}
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
                    <InputField
                      icon={FaLock}
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Confirm new password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
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
              </>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-4">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => {
                    console.log('Edit button clicked'); // Debug log
                    setIsEditing(true);
                  }}
                  className="w-full px-4 py-3 text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors duration-200"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex space-x-4 w-full">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 text-white bg-violet-600 hover:bg-violet-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: userInfo.name || '',
                        email: userInfo.email || '',
                        password: '',
                        confirmPassword: ''
                      });
                    }}
                    className={`px-4 py-3 rounded-lg ${
                      isDarkMode 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfileScreen;
