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
            <h1 className={`text-4xl font-bold mb-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Terms of Service
            </h1>
            
            <div className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
              <p className="mb-6">Last updated: {new Date().toLocaleDateString()}</p>
              
              <section className="mb-8">
                <h2 className={`text-2xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  1. Acceptance of Terms
                </h2>
                <p className="mb-4">
                  By accessing and using NexusEdu, you agree to be bound by these Terms of Service
                  and all applicable laws and regulations. If you do not agree with any of these terms,
                  you are prohibited from using this platform.
                </p>
              </section>

              <section className="mb-8">
                <h2 className={`text-2xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  2. User Responsibilities
                </h2>
                <p className="mb-4">Users of NexusEdu agree to:</p>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li>Provide accurate and complete registration information</li>
                  <li>Maintain the security of account credentials</li>
                  <li>Not share or distribute examination content</li>
                  <li>Follow academic integrity guidelines</li>
                  <li>Respect intellectual property rights</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className={`text-2xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  3. Prohibited Activities
                </h2>
                <p className="mb-4">Users must not engage in:</p>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li>Unauthorized access or use of the platform</li>
                  <li>Cheating or attempting to manipulate exam results</li>
                  <li>Sharing account credentials with others</li>
                  <li>Disrupting platform functionality</li>
                  <li>Violating any applicable laws or regulations</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className={`text-2xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  4. Intellectual Property
                </h2>
                <p className="mb-4">
                  All content on NexusEdu, including but not limited to text, graphics, logos, and software,
                  is the property of NexusEdu and protected by intellectual property laws.
                </p>
              </section>

              <section className="mb-8">
                <h2 className={`text-2xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  5. Termination
                </h2>
                <p className="mb-4">
                  We reserve the right to terminate or suspend accounts for violations of these terms,
                  without prior notice or liability.
                </p>
              </section>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default TermsScreen; 