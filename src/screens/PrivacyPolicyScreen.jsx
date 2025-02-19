import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import Footer from '../components/Footer';

const PrivacyPolicyScreen = () => {
  const { isDarkMode } = useTheme();

  return (
    <>
      <div className={`min-h-screen ${isDarkMode ? 'bg-[#0A0F1C]' : 'bg-gray-50'} pt-20`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
                <p className="mb-4">We collect information that you provide directly to us, including:</p>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li>Personal Information: Name, email address, contact details</li>
                  <li>Academic Information: Institution details, course enrollments</li>
                  <li>Examination Data: Responses, results, and performance metrics</li>
                  <li>Technical Data: Device information, IP address, browser type</li>
                  <li>Usage Data: How you interact with our platform</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className={`text-2xl font-semibold mb-4 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  2. How We Use Your Information
                </h2>
                <p className="mb-4">We use the collected information for:</p>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li>Providing and improving our examination services</li>
                  <li>Personalizing your learning experience</li>
                  <li>Analyzing platform usage and trends</li>
                  <li>Communicating updates and important notices</li>
                  <li>Preventing fraud and ensuring platform security</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className={`text-2xl font-semibold mb-4 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  3. Data Security
                </h2>
                <p className="mb-4">We implement robust security measures to protect your data:</p>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li>Encryption of sensitive information</li>
                  <li>Regular security audits and updates</li>
                  <li>Secure data storage and transmission</li>
                  <li>Access controls and authentication</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className={`text-2xl font-semibold mb-4 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  4. Your Rights
                </h2>
                <p className="mb-4">You have the right to:</p>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li>Access your personal data</li>
                  <li>Request corrections to your information</li>
                  <li>Delete your account and associated data</li>
                  <li>Opt-out of marketing communications</li>
                </ul>
              </section>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PrivacyPolicyScreen; 