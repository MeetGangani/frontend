import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { FaRocket, FaShieldAlt, FaBrain, FaArrowRight } from 'react-icons/fa';
import Footer from './Footer';
import { useTheme } from '../context/ThemeContext';
import { useRef } from 'react';

const Hero = () => {
  const { isDarkMode } = useTheme();
  const ref = useRef(null);
  
  // Enhanced scroll animations
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  // Smooth scroll function
  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <div 
        ref={ref}
        className={`relative min-h-screen overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8 ${
          isDarkMode ? 'bg-[#0A0F1C]' : 'bg-gray-50'
        } scroll-smooth pt-24`}
      >
        {/* Enhanced Parallax Background Elements */}
        <motion.div 
          style={{ y, opacity, scale }} 
          className="absolute inset-0"
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${
            isDarkMode 
              ? 'from-violet-600/10 via-transparent to-indigo-600/10'
              : 'from-violet-600/5 via-transparent to-indigo-600/5'
          }`} />
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360] 
            }}
            transition={{ 
              duration: 20,
              repeat: Infinity,
              ease: "linear" 
            }}
            className="absolute top-0 left-0 w-96 h-96 bg-violet-500/10 rounded-full filter blur-3xl" 
          />
          <motion.div 
            animate={{ 
              scale: [1.2, 1, 1.2],
              rotate: [180, 360, 180] 
            }}
            transition={{ 
              duration: 15,
              repeat: Infinity,
              ease: "linear" 
            }}
            className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full filter blur-3xl" 
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              rotate: [360, 0, 360] 
            }}
            transition={{ 
              duration: 25,
              repeat: Infinity,
              ease: "linear" 
            }}
            className="absolute -bottom-8 left-1/2 w-96 h-96 bg-violet-500/10 rounded-full filter blur-3xl" 
          />
        </motion.div>

        {/* Main content sections with enhanced animations */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="relative min-h-screen"
        >
          <div className="relative min-h-[85vh] flex flex-col justify-center px-4 sm:px-6 lg:px-8 -mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
                  className="inline-block"
                >
                  <motion.span 
                    whileHover={{ scale: 1.05 }}
                    className={`inline-block px-4 py-2 rounded-full ${
                      isDarkMode 
                        ? 'bg-violet-500/10 text-violet-400' 
                        : 'bg-violet-100 text-violet-600'
                    } text-sm font-medium mb-6`}
                  >
                    Online Examination Platform
                  </motion.span>
                </motion.div>

                <motion.h1 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                  className={`text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  } mb-8`}
                >
                  Take Your Exams
                  <motion.span 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="block mt-2 bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent"
                  >
                    Anytime, Anywhere
                  </motion.span>
                </motion.h1>

                <p className={`mt-6 text-lg md:text-xl ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                } max-w-3xl mx-auto`}>
                  A secure and reliable platform for conducting online examinations. 
                  Easy to use for both institutions and students.
                </p>

                {/* CTA Section */}
                <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      to="/register"
                      className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-medium rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg hover:shadow-violet-500/25 transition-all duration-300"
                    >
                      Get Started
                      <FaArrowRight className="ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                    </Link>
                  </motion.div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
                  {[
                    {
                      icon: <FaShieldAlt className="h-6 w-6" />,
                      title: 'Secure Exams',
                      description: 'Robust security measures to maintain exam integrity.'
                    },
                    {
                      icon: <FaBrain className="h-6 w-6" />,
                      title: 'Easy Management',
                      description: 'Simple tools for creating and managing examinations.'
                    },
                    {
                      icon: <FaRocket className="h-6 w-6" />,
                      title: 'Instant Results',
                      description: 'Quick evaluation and result declaration.'
                    }
                  ].map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.2 }}
                      whileHover={{ y: -8, transition: { duration: 0.2 }}}
                      className="relative group p-8"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-b ${
                        isDarkMode 
                          ? 'from-violet-500/5 to-transparent' 
                          : 'from-violet-500/10 to-transparent'
                      } rounded-3xl transform transition-transform group-hover:scale-105`} />
                      <div className="relative">
                        <div className={`flex items-center justify-center w-12 h-12 rounded-2xl ${
                          isDarkMode 
                            ? 'bg-violet-500/10 text-violet-400' 
                            : 'bg-violet-100 text-violet-600'
                        } mb-6 group-hover:scale-110 transition-transform duration-300`}>
                          {feature.icon}
                        </div>
                        <h3 className={`text-xl font-semibold ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        } mb-4`}>
                          {feature.title}
                        </h3>
                        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                          {feature.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Additional sections with enhanced scroll animations */}
        <div id="how-it-works" className={`py-20 ${isDarkMode ? 'bg-[#0A0F1C]' : 'bg-gray-50'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* How It Works Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <h2 className={`text-3xl md:text-4xl font-bold mb-6 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                How It Works
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                {[
                  {
                    step: '01',
                    title: 'Create Account',
                    description: 'Sign up as an institution or student to get started with our platform.'
                  },
                  {
                    step: '02',
                    title: 'Set Up Exam',
                    description: 'Institutions can easily create and schedule exams with our user-friendly interface.'
                  },
                  {
                    step: '03',
                    title: 'Take Exam',
                    description: 'Students can securely take exams from anywhere with stable internet connection.'
                  }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.2 }}
                    className={`p-6 rounded-2xl ${
                      isDarkMode ? 'bg-gray-800/50' : 'bg-white'
                    } shadow-xl`}
                  >
                    <div className={`text-4xl font-bold mb-4 bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent`}>
                      {item.step}
                    </div>
                    <h3 className={`text-xl font-semibold mb-3 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {item.title}
                    </h3>
                    <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                      {item.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Benefits Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mt-32"
            >
              <h2 className={`text-3xl md:text-4xl font-bold mb-6 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Why Choose NexusEdu?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                {[
                  {
                    title: 'Advanced Security',
                    description: 'Our platform uses state-of-the-art security measures to prevent cheating and ensure exam integrity.'
                  },
                  {
                    title: 'Real-time Monitoring',
                    description: 'Track student progress and exam status in real-time with our comprehensive dashboard.'
                  },
                  {
                    title: 'Automated Evaluation',
                    description: 'Save time with instant result generation and automated performance analytics.'
                  },
                  {
                    title: 'Flexible Access',
                    description: 'Conduct exams anywhere, anytime with our cloud-based platform accessible from any device.'
                  }
                ].map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.2 }}
                    className={`p-8 rounded-2xl ${
                      isDarkMode ? 'bg-gray-800/50' : 'bg-white'
                    } shadow-xl`}
                  >
                    <h3 className={`text-xl font-semibold mb-4 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {benefit.title}
                    </h3>
                    <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                      {benefit.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Updated CTA Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mt-32 mb-20"
            >
              <h2 className={`text-3xl md:text-4xl font-bold mb-6 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Ready to Get Started?
              </h2>
              <p className={`text-lg mb-8 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Join NexusEdu today and transform your examination process
              </p>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/register"
                  className="group inline-flex items-center px-8 py-4 text-lg font-medium rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg hover:shadow-violet-500/25 transition-all duration-300"
                >
                  Create Free Account
                  <FaArrowRight className="ml-2 transform group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Hero;
