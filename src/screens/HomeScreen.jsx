import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { setCredentials } from '../slices/authSlice';
import Hero from '../components/Hero';
import StudentDashboard from './StudentDashboard';
import AdminDashboard from './AdminDashboard';
import InstituteDashboard from './InstituteDashboard';

const HomeScreen = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {
    // Check for login success and userInfo cookie
    const searchParams = new URLSearchParams(location.search);
    const loginSuccess = searchParams.get('loginSuccess');
    
    if (loginSuccess === 'true') {
      // Get userInfo from cookie
      const userInfoCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('userInfo='));
      
      if (userInfoCookie) {
        const userInfoData = JSON.parse(decodeURIComponent(userInfoCookie.split('=')[1]));
        dispatch(setCredentials(userInfoData));
        
        // Clean up the URL
        window.history.replaceState({}, document.title, '/');
      }
    }
  }, [dispatch, location]);

  return (
    <div className="min-h-screen bg-gray-50">
      {userInfo ? (
        <>
          {userInfo.userType === 'admin' && <AdminDashboard />}
          {userInfo.userType === 'institute' && <InstituteDashboard />}
          {userInfo.userType === 'student' && <StudentDashboard />}
        </>
      ) : (
        <Hero />
      )}
    </div>
  );
};

export default HomeScreen;
