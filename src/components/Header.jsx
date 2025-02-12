import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useLogoutMutation } from '../slices/usersApiSlice';
import { logout } from '../slices/authSlice';
import { FaSignInAlt, FaSignOutAlt, FaUser, FaBrain, FaChalkboardTeacher, FaMoon, FaSun } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const Header = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [logoutApiCall] = useLogoutMutation();
  const { isDarkMode, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const logoutHandler = async () => {
    try {
      await logoutApiCall().unwrap();
      dispatch(logout());
      navigate('/login');
    } catch (err) {
      console.error(err);
    }
  };

  // Generate avatar using DiceBear API
  const getAvatar = (name) => {
    return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4,c0aede,d1d4f9&radius=50`;
  };

  // Only show navigation items when user is NOT logged in
  const navigationItems = userInfo ? [] : [
    { name: 'About Us', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const ThemeToggle = () => {
    return (
      <motion.button
        onClick={toggleTheme}
        className={`p-2 rounded-full ${
          isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
        } focus:outline-none`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        layout
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={isDarkMode ? 'dark' : 'light'}
            initial={{ y: -20, opacity: 0, rotate: -90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 20, opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
          >
            {isDarkMode ? (
              <FaSun className="w-5 h-5 text-yellow-400" />
            ) : (
              <FaMoon className="w-5 h-5 text-gray-600" />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.button>
    );
  };

  return (
    <>
      <div className="h-20"></div>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled 
            ? isDarkMode 
              ? 'bg-[#0A0F1C]/90 backdrop-blur-xl shadow-lg'
              : 'bg-white/90 backdrop-blur-xl shadow-lg'
            : isDarkMode
              ? 'bg-[#0A0F1C]/50 backdrop-blur-sm'
              : 'bg-white/50 backdrop-blur-sm'
        }`}
      >
        <nav className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="p-2 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600"
              >
                <FaBrain className="text-2xl text-white" />
              </motion.div>
              <span className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                NexusEdu
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-8">
              <div className="flex items-center space-x-6">
                {navigationItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`relative group ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    } hover:text-violet-500 transition-colors duration-300`}
                  >
                    <span>{item.name}</span>
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-violet-500 group-hover:w-full transition-all duration-300"></span>
                  </Link>
                ))}
              </div>

              <ThemeToggle />

              {userInfo ? (
                <div className="relative">
                  <motion.button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className={`flex items-center space-x-3 p-2 rounded-xl ${
                      isDarkMode 
                        ? 'hover:bg-white/10' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="relative">
                      <img
                        src={getAvatar(userInfo.name)}
                        alt="Profile"
                        className="w-10 h-10 rounded-lg ring-2 ring-violet-500"
                      />
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full ring-2 ring-white"></div>
                    </div>
                    <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {userInfo.name}
                    </span>
                  </motion.button>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className={`absolute right-0 mt-2 w-64 rounded-2xl ${
                          isDarkMode 
                            ? 'bg-[#0A0F1C] ring-1 ring-gray-800' 
                            : 'bg-white ring-1 ring-gray-200'
                        } shadow-xl p-2`}
                      >
                        <div className="p-3">
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {userInfo.email}
                          </p>
                        </div>
                        <div className={`border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`} />
                        <Link
                          to="/profile"
                          className={`flex items-center space-x-3 p-3 rounded-xl ${
                            isDarkMode 
                              ? 'hover:bg-white/5 text-white' 
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <FaUser className="text-violet-500" />
                          <span>Profile</span>
                        </Link>
                        <button
                          onClick={logoutHandler}
                          className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-red-500/10 text-red-500"
                        >
                          <FaSignOutAlt />
                          <span>Logout</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/login"
                    className={`px-6 py-2 rounded-lg ${
                      isDarkMode 
                        ? 'text-white hover:bg-white/10' 
                        : 'text-gray-700 hover:bg-gray-100'
                    } transition-all duration-300`}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-6 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg hover:shadow-violet-500/30 transition-all duration-300 hover:scale-105"
                  >
                    Join Now
                  </Link>
                </div>
              )}
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-lg"
            >
              <div className="w-6 h-5 flex flex-col justify-between">
                <span className={`w-full h-0.5 ${isDarkMode ? 'bg-white' : 'bg-gray-900'} transform transition-all duration-300 ${
                  isOpen ? 'rotate-45 translate-y-2' : ''
                }`} />
                <span className={`w-full h-0.5 ${isDarkMode ? 'bg-white' : 'bg-gray-900'} transition-all duration-300 ${
                  isOpen ? 'opacity-0' : 'opacity-100'
                }`} />
                <span className={`w-full h-0.5 ${isDarkMode ? 'bg-white' : 'bg-gray-900'} transform transition-all duration-300 ${
                  isOpen ? '-rotate-45 -translate-y-2' : ''
                }`} />
              </div>
            </motion.button>
          </div>
        </nav>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`md:hidden ${
                isDarkMode 
                  ? 'bg-[#0A0F1C] border-gray-800' 
                  : 'bg-white border-gray-200'
              } border-t`}
            >
              <div className="px-4 py-6 space-y-4">
                {navigationItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`block px-4 py-2 rounded-lg ${
                      isDarkMode 
                        ? 'text-gray-300 hover:bg-white/10' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}

                {userInfo ? (
                  <>
                    <Link to="/profile" className={`block px-4 py-2 rounded-lg ${
                      isDarkMode ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-gray-50'
                    }`}>
                      Profile
                    </Link>
                    <button
                      onClick={logoutHandler}
                      className="w-full text-left px-4 py-2 rounded-lg text-red-500 hover:bg-red-500/10"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className={`block px-4 py-2 rounded-lg ${
                      isDarkMode ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-gray-50'
                    }`}>
                      Sign In
                    </Link>
                    <Link to="/register" className="block px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
                      Join Now
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
};

export default Header;
