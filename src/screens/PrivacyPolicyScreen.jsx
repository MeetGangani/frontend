import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import Footer from '../components/Footer';

const PrivacyPolicyScreen = () => {
  const { isDarkMode } = useTheme();

  return (
    <>
      <div className={`min-h-screen ${isDarkMode ? 'bg-[#0A0F1C]' : 'bg-gray-50'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="prose max-w-none"
          >
            <h1 className={`text-4xl font-bold mb-8 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Privacy Policy
            </h1>
            
            <div className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
              <p className="mb-6">Last updated: {new Date().toLocaleDateString()}</p>
              
              <section className="mb-8">
                <h2 className={`text-2xl font-semibold mb-4 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  1. Information We Collect
                </h2>
                <p>We collect information that you provide directly to us, including:</p>
                <ul className="list-disc pl-6 mt-2">
                  <li>Name and contact information</li>
                  <li>Educational institution details</li>
                  <li>Examination responses and results</li>
                  <li>Account credentials</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className={`text-2xl font-semibold mb-4 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  2. How We Use Your Information
                </h2>
                <p>We use the collected information for:</p>
                <ul className="list-disc pl-6 mt-2">
                  <li>Providing examination services</li>
                  <li>Improving our platform</li>
                  <li>Communication about services</li>
                  <li>Security and fraud prevention</li>
                </ul>
              </section>

              {/* Add more sections as needed */}
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PrivacyPolicyScreen; 