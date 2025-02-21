import { Link } from 'react-router-dom';
import { FaTwitter, FaGithub, FaLinkedin, FaHeart, FaBrain } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';

const Footer = () => {
  const { isDarkMode } = useTheme();

  const socialLinks = [
    { icon: FaTwitter, url: 'https://x.com/MeetGangani25' },
    { icon: FaGithub, url: 'https://github.com/MeetGangani' },
    { icon: FaLinkedin, url: 'https://www.linkedin.com/in/meet-gangani-166750254' }
  ];

  const quickLinks = [
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' }
  ];

  const legalLinks = [
    { name: 'Privacy Policy', path: '/privacy-policy' },
    { name: 'Terms of Service', path: '/terms-of-service' }
  ];

  return (
    <footer className={`w-full ${
      isDarkMode ? 'bg-[#0A0F1C] border-gray-800' : 'bg-white border-gray-200'
    } border-t`}>
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <Link 
              to="/" 
              className="flex items-center space-x-3 mb-6 hover:opacity-80 transition-opacity"
            >
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
              Empowering education through secure and efficient online examination solutions.
              Making assessment simple, reliable, and accessible for everyone.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`transform transition-all duration-200 hover:scale-110 ${
                    isDarkMode 
                      ? 'text-gray-400 hover:text-violet-400' 
                      : 'text-gray-600 hover:text-violet-600'
                  }`}
                >
                  <social.icon className="h-6 w-6" />
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
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.path}
                    className={`inline-block transform transition-all duration-200 hover:-translate-y-1 ${
                      isDarkMode 
                        ? 'text-gray-400 hover:text-violet-400' 
                        : 'text-gray-600 hover:text-violet-600'
                    }`}
                  >
                    {link.name}
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
              {legalLinks.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.path}
                    className={`inline-block transform transition-all duration-200 hover:-translate-y-1 ${
                      isDarkMode 
                        ? 'text-gray-400 hover:text-violet-400' 
                        : 'text-gray-600 hover:text-violet-600'
                    }`}
                  >
                    {link.name}
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
              Made by <FaHeart className="text-violet-500 mx-1 animate-pulse" /> NexusEdu Team
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 