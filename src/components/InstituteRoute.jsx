import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

const InstituteRoute = () => {
  const { userInfo } = useSelector((state) => state.auth);

  return userInfo && userInfo.userType === 'institute' ? (
    <Outlet />
  ) : (
    <Navigate to='/login' replace />
  );
};

export default InstituteRoute; 