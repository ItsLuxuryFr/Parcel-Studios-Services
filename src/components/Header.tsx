import { Link } from 'react-router-dom';
import { Menu, X, Package, User, LogOut, FileText, Shield, Briefcase } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setAccountMenuOpen(false);
  };

  return (
    <header className="glass-dark sticky top-0 z-50 border-b border-white/5">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <Package className="w-9 h-9 text-primary-400 group-hover:text-primary-300 transition-all group-hover:scale-110" />
              <div className="absolute inset-0 bg-primary-400/20 blur-xl group-hover:bg-primary-400/30 transition-all" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Parcel Studio</span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/portfolio"
              className="text-gray-300 hover:text-white transition-all hover:scale-105 font-medium"
            >
              Portfolio
            </Link>
            <Link
              to="/commissions"
              className="text-gray-300 hover:text-white transition-all hover:scale-105 font-medium"
            >
              Commissions
            </Link>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                  className="flex items-center space-x-2 text-gray-300 hover:text-white transition-all hover:scale-105 font-medium"
                  aria-expanded={accountMenuOpen}
                  aria-haspopup="true"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span>{user?.displayName || 'Account'}</span>
                </button>

                {accountMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setAccountMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 glass rounded-xl shadow-2xl py-2 z-20 animate-fade-in">
                      <Link
                        to="/profile"
                        className="flex items-center space-x-2 px-4 py-2.5 text-gray-300 hover:bg-white/10 hover:text-white transition-all mx-2 rounded-lg"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        <span className="text-sm font-medium">Profile</span>
                      </Link>
                      <Link
                        to="/privacy"
                        className="flex items-center space-x-2 px-4 py-2.5 text-gray-300 hover:bg-white/10 hover:text-white transition-all mx-2 rounded-lg"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        <Shield className="w-4 h-4" />
                        <span className="text-sm font-medium">Privacy Settings</span>
                      </Link>
                      <Link
                        to="/my-commissions"
                        className="flex items-center space-x-2 px-4 py-2.5 text-gray-300 hover:bg-white/10 hover:text-white transition-all mx-2 rounded-lg"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        <Briefcase className="w-4 h-4" />
                        <span className="text-sm font-medium">My Commissions</span>
                      </Link>
                      <div className="border-t border-white/10 my-2" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 px-4 py-2.5 text-gray-300 hover:bg-white/10 hover:text-white transition-all w-full text-left mx-2 rounded-lg"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm font-medium">Log Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-300 hover:text-white transition-all hover:scale-105 font-medium"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="relative group bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white px-6 py-2.5 rounded-xl transition-all hover:scale-105 font-semibold shadow-lg hover:shadow-primary-500/50"
                >
                  <span className="relative z-10">Sign Up</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-accent-400 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                </Link>
              </div>
            )}
          </div>

          <button
            className="md:hidden text-gray-300 hover:text-white transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t border-white/10 animate-slide-up">
            <Link
              to="/portfolio"
              className="block text-gray-300 hover:text-white transition-colors py-2 font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Portfolio
            </Link>
            <Link
              to="/commissions"
              className="block text-gray-300 hover:text-white transition-colors py-2 font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Commissions
            </Link>

            {isAuthenticated ? (
              <>
                <div className="border-t border-white/10 pt-4 space-y-2">
                  <Link
                    to="/profile"
                    className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    <span className="font-medium">Profile</span>
                  </Link>
                  <Link
                    to="/privacy"
                    className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Shield className="w-4 h-4" />
                    <span className="font-medium">Privacy Settings</span>
                  </Link>
                  <Link
                    to="/my-commissions"
                    className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Briefcase className="w-4 h-4" />
                    <span className="font-medium">My Commissions</span>
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors py-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="font-medium">Log Out</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="border-t border-white/10 pt-4 space-y-3">
                <Link
                  to="/login"
                  className="block text-gray-300 hover:text-white transition-colors py-2 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="block bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white px-4 py-3 rounded-xl transition-all text-center font-semibold shadow-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
