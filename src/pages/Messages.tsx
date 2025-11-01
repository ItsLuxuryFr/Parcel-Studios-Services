import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import MessagesLayout from '../components/MessagesLayout';

export default function Messages() {
  const { isAuthenticated, user } = useAuth();

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="h-[calc(100vh-4.5rem)] bg-black overflow-hidden">
      <MessagesLayout isAdmin={false} containerHeight="full" />
    </div>
  );
}
