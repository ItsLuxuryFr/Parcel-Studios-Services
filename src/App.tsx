import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CommissionProvider } from './contexts/CommissionContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Portfolio from './pages/Portfolio';
import PortfolioCategory from './pages/PortfolioCategory';
import Commissions from './pages/Commissions';
import NewCommission from './pages/NewCommission';
import MyCommissions from './pages/MyCommissions';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';
import Privacy from './pages/Privacy';
import Admin from './pages/Admin';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CommissionProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/portfolio/:categoryId" element={<PortfolioCategory />} />
                <Route path="/commissions" element={<Commissions />} />
                <Route path="/commissions/new" element={<NewCommission />} />
                <Route path="/my-commissions" element={<MyCommissions />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/admin" element={<Admin />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </CommissionProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
