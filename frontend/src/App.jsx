import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import UploadPage from './pages/Upload';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Home from './pages/Home';
import LandingPage from './pages/LandingPage';
import Onboarding from './pages/Onboarding';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-black text-white">Loading...</div>;

  if (!user) {
    return <Navigate to="/" />; // Redirect unauth to Landing Page
  }

  // Check if onboarding is complete
  if ((!user.age && !user.target_calories) && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null; // or spinner
  if (user) return <Navigate to="/home" />; // Auth users go to Home (Daily View)
  return children;
}

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Landing Page (Public) */}
            <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />

            <Route path="/onboarding" element={<Onboarding />} />

            {/* Protected Dashboard Routes */}
            <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
              <Route path="/" element={<Layout />}>
                {/* Note: Ideally /dashboard is standard, but if we want nested under layout...
                      If we want /dashboard to be the main logged-in view: */}
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="upload" element={<UploadPage />} />
                <Route path="chat" element={<Chat />} />
                <Route path="home" element={<Home />} />
                {/* Redirect root authenticated to dashboard if they land here via Outlet? 
                      Actually PublicRoute handles root. 
                      So we need a specific path for dashboard if root is landing. */}
              </Route>
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
