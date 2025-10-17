import { Link } from 'react-router-dom';
import { Code, Sparkles, Building2, Palette, ArrowRight, CheckCircle2, Star } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-blue-500/10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 relative">
          <div className="text-center space-y-8">
            <h1 className="text-5xl md:text-7xl font-bold text-white">
              Professional Roblox
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">
                Development Services
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto">
              Bringing your game ideas to life with expert scripting, stunning VFX, detailed builds, and modern UI design.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/portfolio"
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all hover:scale-105 shadow-lg hover:shadow-emerald-500/50 flex items-center space-x-2"
              >
                <span>View Portfolio</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/commissions/new"
                className="bg-slate-700 hover:bg-slate-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all hover:scale-105 shadow-lg flex items-center space-x-2"
              >
                <span>Start Commission</span>
              </Link>
              <Link
                to="/signup"
                className="border-2 border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all hover:scale-105 flex items-center space-x-2"
              >
                <span>Sign Up</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Services</h2>
          <p className="text-xl text-slate-400">Comprehensive development solutions for your Roblox game</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            to="/portfolio/scripting"
            className="bg-slate-800 rounded-xl p-6 border-2 border-emerald-500/50 hover:border-emerald-400 transition-all hover:scale-105 group relative overflow-hidden"
          >
            <div className="absolute top-2 right-2">
              <div className="bg-emerald-500 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
                <Star className="w-3 h-3 fill-current" />
                <span>Featured</span>
              </div>
            </div>
            <Code className="w-12 h-12 text-emerald-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-2xl font-bold text-white mb-2">Scripting</h3>
            <div className="text-emerald-400 font-semibold mb-3">4 Years Experience</div>
            <p className="text-slate-400">
              Expert Lua scripting for game mechanics, systems, combat, inventories, and complex gameplay features.
            </p>
          </Link>

          <Link
            to="/portfolio/vfx"
            className="bg-slate-800 rounded-xl p-6 border-2 border-slate-700 hover:border-blue-400 transition-all hover:scale-105 group"
          >
            <Sparkles className="w-12 h-12 text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-2xl font-bold text-white mb-2">VFX</h3>
            <p className="text-slate-400 mt-3">
              Eye-catching visual effects and particle systems that enhance your game's atmosphere and player experience.
            </p>
          </Link>

          <Link
            to="/portfolio/building"
            className="bg-slate-800 rounded-xl p-6 border-2 border-slate-700 hover:border-purple-400 transition-all hover:scale-105 group"
          >
            <Building2 className="w-12 h-12 text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-2xl font-bold text-white mb-2">Building</h3>
            <p className="text-slate-400 mt-3">
              Detailed environments, architecture, and world design that bring your game's vision to reality.
            </p>
          </Link>

          <Link
            to="/portfolio/uiux"
            className="bg-slate-800 rounded-xl p-6 border-2 border-slate-700 hover:border-pink-400 transition-all hover:scale-105 group"
          >
            <Palette className="w-12 h-12 text-pink-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-2xl font-bold text-white mb-2">UI/UX</h3>
            <p className="text-slate-400 mt-3">
              Modern, intuitive user interfaces that provide seamless player experiences across all devices.
            </p>
          </Link>
        </div>
      </section>

      <section className="bg-slate-800/50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Why Choose Parcel Studio?</h2>
            <p className="text-xl text-slate-400">Quality, expertise, and dedication to your project</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="bg-emerald-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white">4 Years Experience</h3>
              <p className="text-slate-400">
                Proven track record with extensive scripting expertise and hundreds of successful projects delivered.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="bg-blue-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Professional Quality</h3>
              <p className="text-slate-400">
                Production-ready code and assets that are optimized, well-documented, and built to scale.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="bg-purple-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Dedicated Support</h3>
              <p className="text-slate-400">
                Clear communication throughout the project with revisions and support to ensure your satisfaction.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl p-12 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Start Your Project?</h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Submit a commission request and let's discuss how we can bring your game ideas to life.
          </p>
          <Link
            to="/commissions/new"
            className="inline-flex items-center space-x-2 bg-white text-emerald-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-slate-100 transition-all hover:scale-105 shadow-xl"
          >
            <span>Open Commissions</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
