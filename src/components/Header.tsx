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
    <header className="glass-dark sticky top-0 z-50 border-b border-purple-500/10 backdrop-blur-2xl">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <Package className="w-8 h-8 text-purple-400 group-hover:text-purple-300 transition-all group-hover:scale-110" />
              <div className="absolute inset-0 bg-purple-500/20 blur-xl group-hover:bg-purple-500/30 transition-all" />
            </div>
            <span className="text-lg font-bold text-gradient">Parcel Studio</span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/portfolio"
              className="text-gray-400 hover:text-purple-300 transition-all font-medium text-sm"
            >
              Portfolio
            </Link>
            <Link
              to="/commissions"
              className="text-gray-400 hover:text-purple-300 transition-all font-medium text-sm"
            >
              Commissions
            </Link>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                  className="flex items-center space-x-2 text-gray-400 hover:text-purple-300 transition-all font-medium text-sm"
                  aria-expanded={accountMenuOpen}
                  aria-haspopup="true"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/30">
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
                    <div className="absolute right-0 mt-2 w-48 glass rounded-xl shadow-2xl shadow-purple-500/20 py-2 z-20 animate-fade-in">
                      <Link
                        to="/profile"
                        className="flex items-center space-x-2 px-4 py-2.5 text-gray-300 hover:bg-purple-500/20 hover:text-purple-200 transition-all mx-2 rounded-lg"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        <span className="text-sm font-medium">Profile</span>
                      </Link>
                      <Link
                        to="/privacy"
                        className="flex items-center space-x-2 px-4 py-2.5 text-gray-300 hover:bg-purple-500/20 hover:text-purple-200 transition-all mx-2 rounded-lg"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        <Shield className="w-4 h-4" />
                        <span className="text-sm font-medium">Privacy Settings</span>
                      </Link>
                      <Link
                        to="/my-commissions"
                        className="flex items-center space-x-2 px-4 py-2.5 text-gray-300 hover:bg-purple-500/20 hover:text-purple-200 transition-all mx-2 rounded-lg"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        <Briefcase className="w-4 h-4" />
                        <span className="text-sm font-medium">My Commissions</span>
                      </Link>
                      <div className="border-t border-purple-500/20 my-2" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 px-4 py-2.5 text-gray-300 hover:bg-purple-500/20 hover:text-purple-200 transition-all w-full text-left mx-2 rounded-lg"
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
                  className="text-gray-400 hover:text-purple-300 transition-all font-medium text-sm"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="btn-primary text-sm"
                >
                  Sign Up
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
          <div className="md:hidden py-4 space-y-2 border-t border-purple-500/10 animate-slide-up">
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
                  className="btn-primary block text-center text-sm"
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
