import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import Footer from '../components/Footer';

const TermsScreen = () => {
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
              Terms of Service
            </h1>
            
            <div className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
              <p className="mb-6">Last updated: {new Date().toLocaleDateString()}</p>
              
              <section className="mb-8">
                <h2 className={`text-2xl font-semibold mb-4 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  1. Acceptance of Terms
                </h2>
                <p>
                  By accessing and using NexusEdu, you agree to be bound by these Terms of Service
                  and all applicable laws and regulations.
                </p>
              </section>

              <section className="mb-8">
                <h2 className={`text-2xl font-semibold mb-4 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  2. User Responsibilities
                </h2>
                <p>Users of NexusEdu agree to:</p>
                <ul className="list-disc pl-6 mt-2">
                  <li>Provide accurate information</li>
                  <li>Maintain confidentiality of account</li>
                  <li>Not share examination content</li>
                  <li>Follow academic integrity guidelines</li>
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

export default TermsScreen; 