import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useCheckAuthQuery } from './slices/usersApiSlice';
import { setCredentials, setLoading, logout } from './slices/authSlice';
import Header from './components/Header';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ProfileScreen from './screens/ProfileScreen';
import AdminDashboard from './screens/AdminDashboard';
import InstituteDashboard from './screens/InstituteDashboard';
import StudentDashboard from './screens/StudentDashboard';
import ContactScreen from './screens/ContactScreen';
import AboutScreen from './screens/AboutScreen';
import PrivacyPolicyScreen from './screens/PrivacyPolicyScreen';
import TermsScreen from './screens/TermsScreen';
import { useTheme } from './context/ThemeContext';
import { toast } from 'react-hot-toast';

// Create route components here to preserve existing dashboard logic
const AdminRouteWrapper = () => {
  const { userInfo } = useSelector((state) => state.auth);
  return userInfo?.userType === 'admin' ? <AdminDashboard /> : <Navigate to="/login" replace />;
};

const InstituteRouteWrapper = () => {
  const { userInfo } = useSelector((state) => state.auth);
  return userInfo?.userType === 'institute' ? <InstituteDashboard /> : <Navigate to="/login" replace />;
};

const StudentRouteWrapper = () => {
  const { userInfo } = useSelector((state) => state.auth);
  return userInfo?.userType === 'student' ? <StudentDashboard /> : <Navigate to="/login" replace />;
};

const PrivateRouteWrapper = ({ children }) => {
  const { userInfo } = useSelector((state) => state.auth);
  return userInfo ? children : <Navigate to="/login" replace />;
};

const App = () => {
  const { isDarkMode } = useTheme();
  const location = useLocation();
  const dispatch = useDispatch();
  const { data: authData, isLoading, isError } = useCheckAuthQuery();
  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    if (authData) {
      dispatch(setCredentials(authData));
    } else if (isError) {
      dispatch(logout());
    }
  }, [authData, isError, dispatch]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
    </div>;
  }

  const getRedirectPath = (userType) => {
    switch (userType) {
      case 'admin':
        return '/admin/dashboard';
      case 'institute':
        return '/institute/dashboard';
      case 'student':
        return '/student/dashboard';
      default:
        return '/';
    }
  };

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <Header />
      <main className="min-h-screen">
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/about" element={<AboutScreen />} />
          <Route path="/contact" element={<ContactScreen />} />
          
          {/* Public routes */}
          <Route
            path="/login"
            element={
              userInfo ? (
                <Navigate to={getRedirectPath(userInfo.userType)} replace />
              ) : (
                <LoginScreen />
              )
            }
          />
          <Route
            path="/register"
            element={
              userInfo ? (
                <Navigate to={getRedirectPath(userInfo.userType)} replace />
              ) : (
                <RegisterScreen />
              )
            }
          />

          {/* Protected routes */}
          <Route
            path="/profile"
            element={
              <PrivateRouteWrapper>
                <ProfileScreen />
              </PrivateRouteWrapper>
            }
          />

          {/* Role-specific routes */}
          <Route path="/admin/dashboard" element={<AdminRouteWrapper />} />
          <Route path="/institute/dashboard" element={<InstituteRouteWrapper />} />
          <Route path="/student/dashboard" element={<StudentRouteWrapper />} />

          {/* Add these new routes */}
          <Route path="/privacy-policy" element={<PrivacyPolicyScreen />} />
          <Route path="/terms-of-service" element={<TermsScreen />} />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};


export default App;
