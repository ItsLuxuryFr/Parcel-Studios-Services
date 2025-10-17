import { Package } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Package className="w-6 h-6 text-emerald-400" />
              <span className="text-lg font-bold text-white">Parcel Studio</span>
            </div>
            <p className="text-slate-400 text-sm">
              Professional Roblox development services specializing in scripting, VFX, building, and UI/UX design.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Services</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/portfolio/scripting" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Scripting
                </Link>
              </li>
              <li>
                <Link to="/portfolio/vfx" className="text-slate-400 hover:text-white transition-colors text-sm">
                  VFX
                </Link>
              </li>
              <li>
                <Link to="/portfolio/building" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Building
                </Link>
              </li>
              <li>
                <Link to="/portfolio/uiux" className="text-slate-400 hover:text-white transition-colors text-sm">
                  UI/UX
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/portfolio" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Portfolio
                </Link>
              </li>
              <li>
                <Link to="/commissions" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Commissions
                </Link>
              </li>
              <li>
                <Link to="/admin" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Admin
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400 text-sm">
          <p>&copy; {new Date().getFullYear()} Parcel Studio. All rights reserved.</p>
          <p className="mt-2">Specializing in Roblox development with 4 years of scripting experience.</p>
        </div>
      </div>
    </footer>
  );
}
