import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CommissionProvider } from './contexts/CommissionContext';
import { MessageProvider } from './contexts/MessageContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Portfolio from './pages/Portfolio';
import PortfolioCategory from './pages/PortfolioCategory';
import Commissions from './pages/Commissions';
import NewCommission from './pages/NewCommission';
import Payment from './pages/Payment';
import PaymentConfirmation from './pages/PaymentConfirmation';
import Messages from './pages/Messages';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyEmail from './pages/VerifyEmail';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';
import Privacy from './pages/Privacy';
import Admin from './pages/Admin';

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname === '/admin';
  const isMessagesRoute = location.pathname === '/messages';
  const isPaymentRoute = location.pathname === '/payment' || location.pathname === '/payment-confirmation';

  return (
    <div className="flex flex-col min-h-screen">
      {!isAdminRoute && !isPaymentRoute && <Header />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/portfolio/:categoryId" element={<PortfolioCategory />} />
          <Route path="/commissions" element={<Commissions />} />
          <Route path="/commissions/new" element={<NewCommission />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/payment-confirmation" element={<PaymentConfirmation />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
      {!isAdminRoute && !isMessagesRoute && !isPaymentRoute && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <CommissionProvider>
          <MessageProvider>
            <AppContent />
          </MessageProvider>
        </CommissionProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
