import React from 'react';
import { useAuth } from './context/AuthContext';
import { Navigate } from 'react-router-dom';

// Define the props type for PrivateRoute
interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/root/admin/signin" />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
