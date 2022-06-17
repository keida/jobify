// import { useAppContext } from '../context/appContext';
// import { useNavigate } from 'react-router-dom';
// import { useEffect } from 'react';

// const ProtectedRoute = ({ children }) => {
//   const { user } = useAppContext();
//   const navigate = useNavigate();
//   useEffect(() => {
//     if (!user) {
//       setTimeout(() => {
//         navigate('/landing');
//       }, 1000);
//     }
//   }, [user, navigate]);
//   return children;
// };

// export default ProtectedRoute;
import { useAppContext } from '../context/appContext';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const { user } = useAppContext();
  if (!user) {
    return <Navigate to="/landing" />;
  }
  return children;
};

export default ProtectedRoute;
