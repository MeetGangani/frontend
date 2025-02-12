import { useState } from 'react';
import { useRegisterMutation } from '../slices/usersApiSlice';
import { toast } from 'react-toastify';
import Loader from '../components/Loader';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';

const AdminUserCreate = () => {
  const { isDarkMode } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('student');
  const [success, setSuccess] = useState('');

  const [register, { isLoading }] = useRegisterMutation();

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      await register({ 
        name, 
        email, 
        password,
        userType
      }).unwrap();
      
      setSuccess(`Successfully created ${userType} account`);
      setName('');
      setEmail('');
      setPassword('');
      setUserType('student');
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className={`text-2xl font-bold mb-6 ${
        isDarkMode ? 'text-white' : 'text-gray-900'
      }`}>
        Create New User
      </h2>
      
      {success && (
        <div className={`mb-4 p-4 rounded-lg ${
          isDarkMode 
            ? 'bg-green-900/20 border-green-800 text-green-300' 
            : 'bg-green-50 border-green-200 text-green-700'
        } border`}>
          {success}
        </div>
      )}
      
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={submitHandler}
        className="space-y-6"
      >
        {['name', 'email', 'password'].map((field) => (
          <div key={field}>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {field.charAt(0).toUpperCase() + field.slice(1)}
            </label>
            <input
              type={field === 'password' ? 'password' : 'text'}
              placeholder={`Enter ${field}`}
              value={eval(field)}
              onChange={(e) => eval(`set${field.charAt(0).toUpperCase() + field.slice(1)}`)(e.target.value)}
              required
              className={`w-full px-4 py-3 rounded-lg ${
                isDarkMode 
                  ? 'bg-[#0A0F1C] border-gray-700 text-white placeholder-gray-500' 
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
              } border focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
            />
          </div>
        ))}

        <div>
          <label className={`block text-sm font-medium mb-2 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            User Type
          </label>
          <select
            value={userType}
            onChange={(e) => setUserType(e.target.value)}
            className={`w-full px-4 py-3 rounded-lg ${
              isDarkMode 
                ? 'bg-[#0A0F1C] border-gray-700 text-white' 
                : 'bg-gray-50 border-gray-200 text-gray-900'
            } border focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
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
          disabled={isLoading}
          className="w-full px-4 py-3 text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg hover:from-violet-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-150"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
              Creating...
            </div>
          ) : (
            'Create User'
          )}
        </motion.button>
      </motion.form>
    </div>
  );
};

export default AdminUserCreate; 