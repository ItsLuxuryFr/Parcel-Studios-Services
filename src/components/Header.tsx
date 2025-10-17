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
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2 group">
            <Package className="w-8 h-8 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
            <span className="text-xl font-bold text-white">Parcel Studio</span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/portfolio"
              className="text-slate-300 hover:text-white transition-colors"
            >
              Portfolio
            </Link>
            <Link
              to="/commissions"
              className="text-slate-300 hover:text-white transition-colors"
            >
              Commissions
            </Link>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                  className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors"
                  aria-expanded={accountMenuOpen}
                  aria-haspopup="true"
                >
                  <User className="w-5 h-5" />
                  <span>{user?.displayName || 'Account'}</span>
                </button>

                {accountMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setAccountMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-xl py-2 z-20 border border-slate-700">
                      <Link
                        to="/profile"
                        className="flex items-center space-x-2 px-4 py-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        <span>Profile</span>
                      </Link>
                      <Link
                        to="/privacy"
                        className="flex items-center space-x-2 px-4 py-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        <Shield className="w-4 h-4" />
                        <span>Privacy Settings</span>
                      </Link>
                      <Link
                        to="/my-commissions"
                        className="flex items-center space-x-2 px-4 py-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        <Briefcase className="w-4 h-4" />
                        <span>My Commissions</span>
                      </Link>
                      <div className="border-t border-slate-700 my-2" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 px-4 py-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-slate-300 hover:text-white transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          <button
            className="md:hidden text-slate-300 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-4 border-t border-slate-800">
            <Link
              to="/portfolio"
              className="block text-slate-300 hover:text-white transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Portfolio
            </Link>
            <Link
              to="/commissions"
              className="block text-slate-300 hover:text-white transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Commissions
            </Link>

            {isAuthenticated ? (
              <>
                <div className="border-t border-slate-800 pt-4 space-y-4">
                  <Link
                    to="/profile"
                    className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </Link>
                  <Link
                    to="/privacy"
                    className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Shield className="w-4 h-4" />
                    <span>Privacy Settings</span>
                  </Link>
                  <Link
                    to="/my-commissions"
                    className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>My Commissions</span>
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="border-t border-slate-800 pt-4 space-y-4">
                <Link
                  to="/login"
                  className="block text-slate-300 hover:text-white transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="block bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors text-center"
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
