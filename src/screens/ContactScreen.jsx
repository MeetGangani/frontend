import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaQuestionCircle, FaUserGraduate, FaUniversity } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';
import Footer from '../components/Footer';
import config from '../config/config.js';
import { useSelector } from 'react-redux';

const ContactScreen = () => {
  const { isDarkMode } = useTheme();
  const { userInfo } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await axios.post(
        `${config.API_BASE_URL}/api/contact`,
        formData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data) {
        toast.success('Message sent successfully!');
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
      }
    } catch (err) {
      console.error('Contact form error:', err);
      toast.error(
        err.response?.data?.message || 'Error sending message. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const contactInfo = [
    {
      icon: <FaEnvelope />,
      title: 'Email',
      details: 'kryptoexam@gmail.com',
      link: 'mailto:kryptoexam@gmail.com'
    },
    {
      icon: <FaPhone />,
      title: 'Phone',
      details: '+91 96018 10456',
      link: 'tel:+919601810456'
    },
    {
      icon: <FaMapMarkerAlt />,
      title: 'Address',
      details: 'Surat, Gujarat, India',
      link: 'https://maps.google.com/?q=Surat,Gujarat,India'
    }
  ];

  const supportCategories = [
    {
      icon: <FaQuestionCircle />,
      title: 'General Inquiries',
      description: 'Questions about our platform and services'
    },
    {
      icon: <FaUserGraduate />,
      title: 'Student Support',
      description: 'Help with exam access and technical issues'
    },
    {
      icon: <FaUniversity />,
      title: 'Institution Support',
      description: 'Assistance with exam creation and management'
    }
  ];

  return (
    <>
      <div className={`min-h-screen ${isDarkMode ? 'bg-[#0A0F1C]' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-20"
          >
            <h1 className={`text-4xl md:text-5xl font-bold mb-6 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Get in Touch
            </h1>
            <p className={`text-lg max-w-3xl mx-auto ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Have questions about our examination system? We're here to help!
              Reach out to us through any of the following channels.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {contactInfo.map((info, index) => (
              <motion.a
                key={index}
                href={info.link}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-6 rounded-2xl ${
                  isDarkMode ? 'bg-[#1a1f2e]' : 'bg-white'
                } shadow-lg text-center group hover:scale-105 transition-transform duration-300`}
              >
                <div className={`flex justify-center items-center text-3xl mb-4 ${
                  isDarkMode ? 'text-violet-400' : 'text-violet-600'
                } group-hover:scale-110 transition-transform duration-300`}>
                  {info.icon}
                </div>
                <h3 className={`text-xl font-semibold mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {info.title}
                </h3>
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  {info.details}
                </p>
              </motion.a>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-20"
          >
            <h2 className={`text-3xl font-bold text-center mb-12 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              How Can We Help?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {supportCategories.map((category, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-6 rounded-2xl ${
                    isDarkMode ? 'bg-[#1a1f2e]' : 'bg-white'
                  } shadow-lg text-center`}
                >
                  <div className={`flex justify-center items-center text-3xl mb-4 ${
                    isDarkMode ? 'text-violet-400' : 'text-violet-600'
                  }`}>
                    {category.icon}
                  </div>
                  <h3 className={`text-xl font-semibold mb-2 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {category.title}
                  </h3>
                  <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                    {category.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`max-w-3xl mx-auto p-8 rounded-2xl ${
              isDarkMode ? 'bg-[#1a1f2e]' : 'bg-white'
            } shadow-lg`}
          >
            <h2 className={`text-2xl font-bold mb-6 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Send us a Message
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
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
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 rounded-lg ${
                      isDarkMode 
                        ? 'bg-[#0A0F1C] border-gray-700 text-white placeholder-gray-500' 
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                    } border focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
                  />
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
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
                  Message
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className={`w-full px-4 py-3 rounded-lg ${
                    isDarkMode 
                      ? 'bg-[#0A0F1C] border-gray-700 text-white placeholder-gray-500' 
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                  } border focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSubmitting}
                className="w-full px-4 py-3 text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg hover:from-violet-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-150"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Sending...
                  </div>
                ) : (
                  'Send Message'
                )}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ContactScreen; 