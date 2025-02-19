import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { FaArrowRight, FaShieldAlt, FaBrain, FaRocket, FaChartLine, FaClock, FaUsers } from 'react-icons/fa';
import Footer from './Footer';

const Hero = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className={`${isDarkMode ? 'bg-[#0A0F1C]' : 'bg-gray-50'} pt-20`}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative flex flex-col justify-center overflow-hidden"
      >
        {/* Background Gradient Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className={`absolute -top-48 left-1/2 transform -translate-x-1/2 w-[800px] h-[800px] rounded-full ${
            isDarkMode ? 'bg-violet-900' : 'bg-violet-200'
          } opacity-20 blur-3xl`}></div>
          <div className={`absolute top-1/2 left-1/4 w-[600px] h-[600px] rounded-full ${
            isDarkMode ? 'bg-indigo-900' : 'bg-indigo-200'
          } opacity-20 blur-3xl`}></div>
        </div>

        {/* Main Content */}
        <div className="relative max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            {/* Badge */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
              className="inline-block"
            >
              <motion.span 
                whileHover={{ scale: 1.05 }}
                className={`inline-flex items-center px-6 py-2.5 rounded-full ${
                  isDarkMode 
                    ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                    : 'bg-violet-100 text-violet-600 border border-violet-200'
                } text-sm font-medium mb-8 gap-2`}
              >
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isDarkMode ? 'bg-violet-400' : 'bg-violet-500'
                  }`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${
                    isDarkMode ? 'bg-violet-400' : 'bg-violet-500'
                  }`}></span>
                </span>
                Next Generation Examination Platform
              </motion.span>
            </motion.div>

            {/* Hero Title */}
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className={`text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              } mb-8 leading-tight`}
            >
              Transform Your
              <motion.span 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="block mt-2 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent"
              >
                Examination Process
              </motion.span>
            </motion.h1>

            {/* Description */}
            <p className={`mt-8 text-xl md:text-2xl leading-relaxed ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            } max-w-3xl mx-auto`}>
              Experience the future of assessments with our secure, 
              intelligent, and seamless examination platform.
            </p>

            {/* CTA Buttons */}
            <div className="mt-12 flex flex-col sm:flex-row justify-center items-center gap-6">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/register"
                  className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-medium rounded-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white shadow-xl hover:shadow-violet-500/25 transition-all duration-300"
                >
                  Get Started Now
                  <FaArrowRight className="ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/about"
                  className={`group inline-flex items-center px-8 py-4 text-lg font-medium rounded-full border-2 ${
                    isDarkMode 
                      ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-100'
                  } transition-all duration-300`}
                >
                  Learn More
                </Link>
              </motion.div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24">
              {[
                {
                  icon: <FaShieldAlt className="h-6 w-6" />,
                  title: 'Advanced Security',
                  description: 'Multi-layered protection for exam integrity'
                },
                {
                  icon: <FaBrain className="h-6 w-6" />,
                  title: 'Smart Analytics',
                  description: 'AI-powered insights and performance tracking'
                },
                {
                  icon: <FaRocket className="h-6 w-6" />,
                  title: 'Real-time Results',
                  description: 'Instant evaluation and detailed reports'
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  whileHover={{ y: -8, transition: { duration: 0.2 }}}
                  className={`relative group p-8 ${
                    isDarkMode 
                      ? 'bg-gray-800/50 hover:bg-gray-800/70 backdrop-blur-lg'
                      : 'bg-white/80 hover:bg-white backdrop-blur-lg'
                  } rounded-2xl shadow-lg transition-all duration-300 border ${
                    isDarkMode ? 'border-gray-700' : 'border-gray-200'
                  }`}
                >
                  <div className={`mx-auto flex items-center justify-center w-14 h-14 rounded-2xl ${
                    isDarkMode 
                      ? 'bg-violet-500/10 text-violet-400' 
                      : 'bg-violet-100 text-violet-600'
                  } mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <h3 className={`text-xl font-semibold mb-4 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {feature.title}
                  </h3>
                  <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Why Choose Us Section - Core Features */}
      <motion.section 
        className={`py-20 ${isDarkMode ? 'bg-[#0A0F1C]' : 'bg-gray-50'}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              Platform Features
            </motion.h2>
            <p className={`text-xl ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Designed specifically for modern educational needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <FaShieldAlt className="h-6 w-6" />,
                title: 'Secure Testing',
                description: 'Anti-cheating measures and encrypted exam data'
              },
              {
                icon: <FaClock className="h-6 w-6" />,
                title: 'Auto-Proctoring',
                description: 'Real-time monitoring and automated supervision'
              },
              {
                icon: <FaChartLine className="h-6 w-6" />,
                title: 'Result Analysis',
                description: 'Detailed performance reports and analytics'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className={`p-8 rounded-2xl ${
                  isDarkMode 
                    ? 'bg-gray-800/50 hover:bg-gray-800/70' 
                    : 'bg-white hover:bg-gray-50'
                } transition-all duration-300 shadow-lg hover:shadow-xl`}
              >
                <div className={`w-12 h-12 rounded-lg mb-6 flex items-center justify-center ${
                  isDarkMode ? 'bg-violet-500/20' : 'bg-violet-100'
                }`}>
                  <span className={isDarkMode ? 'text-violet-400' : 'text-violet-600'}>
                    {feature.icon}
                  </span>
                </div>
                <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {feature.title}
                </h3>
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Call to Action Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className={`py-20 relative overflow-hidden ${isDarkMode ? 'bg-[#0F1524]' : 'bg-white'}`}
      >
        <div className="absolute inset-0">
          <div className={`absolute inset-0 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 backdrop-blur-3xl`}></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className={`text-4xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            Start Your Digital Assessment Journey
          </motion.h2>
          <p className={`text-xl mb-10 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Experience secure and efficient online examinations
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              to="/register"
              className="inline-flex items-center px-8 py-4 text-lg font-medium rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xl hover:shadow-violet-500/25 transition-all duration-300"
            >
              Get Started
              <FaArrowRight className="ml-2" />
            </Link>
          </motion.div>
        </div>
      </motion.section>

      <Footer />
    </div>
  );
};

export default Hero;
