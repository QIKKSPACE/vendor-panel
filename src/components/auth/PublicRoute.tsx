import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/UserContext";

const PublicRoute = ({ children }) => {
  const { user, accessToken, isAuthLoading } = useAuth();

  // Still loading initial auth state
  if (isAuthLoading) {
    return <div>Loading...</div>;
  }

  // If already authenticated → redirect to dashboard
  if (accessToken && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PublicRoute;
