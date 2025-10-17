import { Package } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="glass-dark border-t border-white/10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Package className="w-7 h-7 text-primary-400" />
                <div className="absolute inset-0 bg-primary-400/20 blur-lg" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">Parcel Studio</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Professional Roblox development services specializing in scripting, VFX, building, and UI/UX design.
            </p>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Services</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/portfolio/scripting" className="text-gray-400 hover:text-primary-400 transition-colors text-sm">
                  Scripting
                </Link>
              </li>
              <li>
                <Link to="/portfolio/vfx" className="text-gray-400 hover:text-primary-400 transition-colors text-sm">
                  VFX
                </Link>
              </li>
              <li>
                <Link to="/portfolio/building" className="text-gray-400 hover:text-primary-400 transition-colors text-sm">
                  Building
                </Link>
              </li>
              <li>
                <Link to="/portfolio/uiux" className="text-gray-400 hover:text-primary-400 transition-colors text-sm">
                  UI/UX
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/portfolio" className="text-gray-400 hover:text-primary-400 transition-colors text-sm">
                  Portfolio
                </Link>
              </li>
              <li>
                <Link to="/commissions" className="text-gray-400 hover:text-primary-400 transition-colors text-sm">
                  Commissions
                </Link>
              </li>
              <li>
                <Link to="/admin" className="text-gray-400 hover:text-primary-400 transition-colors text-sm">
                  Admin
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/privacy" className="text-gray-400 hover:text-primary-400 transition-colors text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors text-sm">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 text-center text-gray-400 text-sm space-y-2">
          <p>&copy; {new Date().getFullYear()} Parcel Studio. All rights reserved.</p>
          <p className="text-gray-500">Specializing in Roblox development with 4 years of scripting experience.</p>
        </div>
      </div>
    </footer>
  );
}
