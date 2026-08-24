import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/UserContext";

const ProtectedRoute = ({ children }) => {
  const { user, accessToken, isAuthLoading } = useAuth();

  // Still loading initial auth state (e.g., reading from localStorage)
  if (isAuthLoading) {
    return <div>Loading...</div>;
  }

  // If no token OR no user → not authenticated
  if (!accessToken || !user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
