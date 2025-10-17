import { Link } from 'react-router-dom';
import { Code, Sparkles, Building2, Palette, ArrowRight, CheckCircle2, Star, Zap, Shield, Clock } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-dark-950">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-accent-500/10" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(16, 185, 129, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(249, 115, 22, 0.15) 0%, transparent 50%)',
        }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-40 relative">
          <div className="text-center space-y-8 animate-fade-in">
            <div className="inline-block">
              <div className="flex items-center space-x-2 bg-white/5 backdrop-blur-sm border border-white/10 px-4 py-2 rounded-full mb-6">
                <Star className="w-4 h-4 text-accent-400" />
                <span className="text-sm text-gray-300 font-medium">4 Years of Excellence</span>
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-tight">
              Professional Roblox
              <span className="block mt-2 text-gradient">
                Development Services
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Bringing your game ideas to life with expert scripting, stunning VFX, detailed builds, and modern UI design.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Link
                to="/portfolio"
                className="group relative bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white px-8 py-4 rounded-2xl text-lg font-semibold transition-all hover:scale-105 shadow-xl hover:shadow-primary-500/50 flex items-center space-x-2"
              >
                <span>View Portfolio</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-accent-400 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-2xl -z-10" />
              </Link>

              <Link
                to="/commissions/new"
                className="glass hover:bg-white/10 text-white px-8 py-4 rounded-2xl text-lg font-semibold transition-all hover:scale-105 flex items-center space-x-2"
              >
                <span>Start Commission</span>
              </Link>

              <Link
                to="/signup"
                className="border-2 border-primary-400/50 text-primary-400 hover:bg-primary-400/10 hover:border-primary-400 px-8 py-4 rounded-2xl text-lg font-semibold transition-all hover:scale-105 flex items-center space-x-2"
              >
                <span>Sign Up</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-dark-950 to-transparent" />
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Services</h2>
          <p className="text-xl text-gray-400">Comprehensive development solutions for your Roblox game</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            to="/portfolio/scripting"
            className="group relative glass hover:bg-white/10 rounded-2xl p-8 transition-all hover:scale-105 overflow-hidden"
          >
            <div className="absolute top-3 right-3">
              <div className="bg-gradient-to-r from-primary-500 to-accent-500 text-white text-xs px-3 py-1.5 rounded-full flex items-center space-x-1 font-semibold">
                <Star className="w-3 h-3 fill-current" />
                <span>Featured</span>
              </div>
            </div>

            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Code className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-2xl font-bold text-white mb-2">Scripting</h3>
              <div className="text-primary-400 font-semibold mb-3 text-sm">4 Years Experience</div>
              <p className="text-gray-400 leading-relaxed">
                Expert Lua scripting for game mechanics, systems, combat, inventories, and complex gameplay features.
              </p>
            </div>
          </Link>

          <Link
            to="/portfolio/vfx"
            className="group relative glass hover:bg-white/10 rounded-2xl p-8 transition-all hover:scale-105 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Sparkles className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-2xl font-bold text-white mb-2">VFX</h3>
              <p className="text-gray-400 leading-relaxed mt-3">
                Eye-catching visual effects and particle systems that enhance your game's atmosphere and player experience.
              </p>
            </div>
          </Link>

          <Link
            to="/portfolio/building"
            className="group relative glass hover:bg-white/10 rounded-2xl p-8 transition-all hover:scale-105 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Building2 className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-2xl font-bold text-white mb-2">Building</h3>
              <p className="text-gray-400 leading-relaxed mt-3">
                Detailed environments, architecture, and world design that bring your game's vision to reality.
              </p>
            </div>
          </Link>

          <Link
            to="/portfolio/uiux"
            className="group relative glass hover:bg-white/10 rounded-2xl p-8 transition-all hover:scale-105 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-accent-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Palette className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-2xl font-bold text-white mb-2">UI/UX</h3>
              <p className="text-gray-400 leading-relaxed mt-3">
                Modern, intuitive user interfaces that provide seamless player experiences across all devices.
              </p>
            </div>
          </Link>
        </div>
      </section>

      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-accent-500/10 to-primary-500/10" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)',
        }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Why Choose Parcel Studio?</h2>
            <p className="text-xl text-gray-400">Quality, expertise, and dedication to your project</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-6 group">
              <div className="relative inline-block">
                <div className="bg-gradient-to-br from-primary-500 to-primary-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
                <div className="absolute inset-0 bg-primary-400/30 blur-2xl group-hover:bg-primary-400/50 transition-all" />
              </div>

              <h3 className="text-2xl font-bold text-white">4 Years Experience</h3>
              <p className="text-gray-400 leading-relaxed max-w-sm mx-auto">
                Proven track record with extensive scripting expertise and hundreds of successful projects delivered.
              </p>
            </div>

            <div className="text-center space-y-6 group">
              <div className="relative inline-block">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <Zap className="w-10 h-10 text-white" />
                </div>
                <div className="absolute inset-0 bg-blue-400/30 blur-2xl group-hover:bg-blue-400/50 transition-all" />
              </div>

              <h3 className="text-2xl font-bold text-white">Professional Quality</h3>
              <p className="text-gray-400 leading-relaxed max-w-sm mx-auto">
                Production-ready code and assets that are optimized, well-documented, and built to scale.
              </p>
            </div>

            <div className="text-center space-y-6 group">
              <div className="relative inline-block">
                <div className="bg-gradient-to-br from-accent-500 to-accent-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <Shield className="w-10 h-10 text-white" />
                </div>
                <div className="absolute inset-0 bg-accent-400/30 blur-2xl group-hover:bg-accent-400/50 transition-all" />
              </div>

              <h3 className="text-2xl font-bold text-white">Dedicated Support</h3>
              <p className="text-gray-400 leading-relaxed max-w-sm mx-auto">
                Clear communication throughout the project with revisions and support to ensure your satisfaction.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="relative glass-dark rounded-3xl p-12 md:p-16 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 via-accent-500/20 to-primary-500/20" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-500/30 rounded-full blur-3xl" />

          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Start Your Project?</h2>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              Submit a commission request and let's discuss how we can bring your game ideas to life.
            </p>

            <Link
              to="/commissions/new"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white px-10 py-5 rounded-2xl text-lg font-semibold transition-all hover:scale-105 shadow-2xl hover:shadow-primary-500/50"
            >
              <span>Open Commissions</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
