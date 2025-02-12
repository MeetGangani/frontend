import { Link } from 'react-router-dom';
import { FaTwitter, FaGithub, FaLinkedin, FaHeart, FaBrain } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';

const Footer = () => {
  const { isDarkMode } = useTheme();

  return (
    <footer className={`${
      isDarkMode 
        ? 'bg-[#0A0F1C] border-gray-800' 
        : 'bg-white border-gray-200'
    } border-t`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center space-x-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600">
                <FaBrain className="text-2xl text-white" />
              </div>
              <span className={`text-xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                NexusEdu
              </span>
            </Link>
            <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              A secure online examination platform designed to simplify assessment processes
              for educational institutions and students.
            </p>
            <div className="flex space-x-4">
              {[FaTwitter, FaGithub, FaLinkedin].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className={`${
                    isDarkMode 
                      ? 'text-gray-400 hover:text-violet-400' 
                      : 'text-gray-600 hover:text-violet-600'
                  } transition-colors duration-300`}
                >
                  <Icon className="h-6 w-6" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className={`font-semibold mb-6 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Quick Links
            </h3>
            <ul className="space-y-4">
              {['About', 'Contact'].map((item, index) => (
                <li key={index}>
                  <Link
                    to={`/${item.toLowerCase()}`}
                    className={`${
                      isDarkMode 
                        ? 'text-gray-400 hover:text-violet-400' 
                        : 'text-gray-600 hover:text-violet-600'
                    } transition-colors duration-300`}
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className={`font-semibold mb-6 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Legal
            </h3>
            <ul className="space-y-4">
              {['Privacy Policy', 'Terms of Service'].map((item, index) => (
                <li key={index}>
                  <Link
                    to={`/${item.toLowerCase().replace(/\s+/g, '-')}`}
                    className={`${
                      isDarkMode 
                        ? 'text-gray-400 hover:text-violet-400' 
                        : 'text-gray-600 hover:text-violet-600'
                    } transition-colors duration-300`}
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={`mt-12 pt-8 border-t ${
          isDarkMode ? 'border-gray-800' : 'border-gray-200'
        }`}>
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              © {new Date().getFullYear()} NexusEdu. All rights reserved.
            </p>
            <p className={`${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            } flex items-center mt-4 md:mt-0`}>
              Made with <FaHeart className="text-violet-500 mx-1" /> by NexusEdu Team
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 