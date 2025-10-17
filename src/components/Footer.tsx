import { Package } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="glass-dark border-t border-purple-500/10 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Package className="w-6 h-6 text-purple-400" />
                <div className="absolute inset-0 bg-purple-500/20 blur-lg" />
              </div>
              <span className="text-base font-bold text-gradient">Parcel Studio</span>
            </div>
            <p className="text-gray-500 text-xs leading-relaxed">
              Professional Roblox development services specializing in scripting, VFX, building, and UI/UX design.
            </p>
          </div>

          <div>
            <h3 className="text-purple-300 font-semibold mb-3 text-xs uppercase tracking-wider">Services</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/portfolio/scripting" className="text-gray-500 hover:text-purple-400 transition-colors text-xs">
                  Scripting
                </Link>
              </li>
              <li>
                <Link to="/portfolio/vfx" className="text-gray-500 hover:text-purple-400 transition-colors text-xs">
                  VFX
                </Link>
              </li>
              <li>
                <Link to="/portfolio/building" className="text-gray-500 hover:text-purple-400 transition-colors text-xs">
                  Building
                </Link>
              </li>
              <li>
                <Link to="/portfolio/uiux" className="text-gray-500 hover:text-purple-400 transition-colors text-xs">
                  UI/UX
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-purple-300 font-semibold mb-3 text-xs uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/portfolio" className="text-gray-500 hover:text-purple-400 transition-colors text-xs">
                  Portfolio
                </Link>
              </li>
              <li>
                <Link to="/commissions" className="text-gray-500 hover:text-purple-400 transition-colors text-xs">
                  Commissions
                </Link>
              </li>
              <li>
                <Link to="/admin" className="text-gray-500 hover:text-purple-400 transition-colors text-xs">
                  Admin
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-purple-300 font-semibold mb-3 text-xs uppercase tracking-wider">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="text-gray-500 hover:text-purple-400 transition-colors text-xs">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <a href="#" className="text-gray-500 hover:text-purple-400 transition-colors text-xs">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-purple-500/10 mt-8 pt-6 text-center text-gray-500 text-xs space-y-1">
          <p>&copy; {new Date().getFullYear()} Parcel Studio. All rights reserved.</p>
          <p className="text-gray-600">Specializing in Roblox development with 4 years of scripting experience.</p>
        </div>
      </div>
    </footer>
  );
}
