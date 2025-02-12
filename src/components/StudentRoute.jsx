import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

const StudentRoute = () => {
  const { userInfo } = useSelector((state) => state.auth);

  return userInfo && userInfo.userType === 'student' ? (
    <Outlet />
  ) : (
    <Navigate to='/login' replace />
  );
};

export default StudentRoute; 