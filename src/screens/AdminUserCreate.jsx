import { useState } from 'react';
import { showToast } from '../utils/toast';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';

const AdminUserCreate = ({ onUserCreated }) => {
  const { isDarkMode } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState('student');
  const [loading, setLoading] = useState(false);

  const BACKEND_URL = 'https://backdeploy-9bze.onrender.com';

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const response = await axios.post(
        `${BACKEND_URL}/api/admin/users/create`,
        {
          name,
          email,
          userType
        },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.data.success) {
        showToast.success(`Successfully created ${userType} account. Credentials sent to user's email.`);
        
        // Reset form
        setName('');
        setEmail('');
        setUserType('student');
        
        // Notify parent component
        if (onUserCreated) {
          onUserCreated();
        }
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Error creating user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full">
      {/* <h2 className={`text-3xl font-semibold mb-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        Create New User
      </h2> */}
      <motion.form
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onSubmit={handleSubmit}
        className="space-y-8"
      >
        <div>
          <label className={`block text-base font-medium mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={`mt-1 block w-full rounded-md shadow-sm py-2.5 text-base border ${
              isDarkMode 
                ? 'bg-[#2a2f3e] border-gray-600 text-white' 
                : 'bg-gray-50 border-gray-400 text-gray-900'
            } focus:border-violet-500 focus:ring-violet-500`}
          />
        </div>

        <div>
          <label className={`block text-base font-medium mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={`mt-1 block w-full rounded-md shadow-sm py-2.5 text-base border ${
              isDarkMode 
                ? 'bg-[#2a2f3e] border-gray-600 text-white' 
                : 'bg-gray-50 border-gray-400 text-gray-900'
            } focus:border-violet-500 focus:ring-violet-500`}
          />
        </div>

        <div>
          <label className={`block text-base font-medium mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            User Type
          </label>
          <select
            value={userType}
            onChange={(e) => setUserType(e.target.value)}
            className={`mt-1 block w-full rounded-md shadow-sm py-2.5 text-base border ${
              isDarkMode 
                ? 'bg-[#2a2f3e] border-gray-600 text-white' 
                : 'bg-gray-50 border-gray-400 text-gray-900'
            } focus:border-violet-500 focus:ring-violet-500`}
          >
            <option value="student">Student</option>
            <option value="institute">Institute</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white ${
            isDarkMode 
              ? 'bg-violet-600 hover:bg-violet-700' 
              : 'bg-violet-500 hover:bg-violet-600'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Creating...' : 'Create User'}
        </motion.button>
      </motion.form>
    </div>
  );
};

export default AdminUserCreate; 