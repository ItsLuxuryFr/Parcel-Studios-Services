import { Link } from 'react-router-dom';
import { Code, Sparkles, Building2, Palette, ArrowRight, CheckCircle2, Star, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-purple-800/10" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(168, 85, 247, 0.15) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(147, 51, 234, 0.15) 0%, transparent 50%)',
        }} />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center space-y-6 animate-fade-in">
            <div className="inline-block">
              <div className="flex items-center space-x-2 glass px-4 py-2 rounded-full mb-4">
                <Star className="w-4 h-4 text-purple-400 fill-purple-400" />
                <span className="text-sm text-purple-200 font-medium">4+ Years Excellence</span>
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
              <span className="text-white">Professional</span>
              <span className="block mt-2 text-gradient-hero">
                Roblox Development
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Bringing your game ideas to life with expert scripting, stunning VFX, detailed builds, and modern UI design.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-4">
              <Link
                to="/portfolio"
                className="btn-primary group flex items-center space-x-2 glow-purple"
              >
                <span>View Portfolio</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/commissions/new"
                className="btn-secondary flex items-center space-x-2"
              >
                <span>Start Commission</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Our Services</h2>
          <p className="text-lg text-gray-400">Comprehensive development solutions for your Roblox game</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <Link
            to="/portfolio/scripting"
            className="group relative card overflow-hidden"
          >
            <div className="absolute top-3 right-3 z-10">
              <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white text-xs px-2.5 py-1 rounded-full flex items-center space-x-1 font-semibold">
                <Star className="w-3 h-3 fill-current" />
                <span>Featured</span>
              </div>
            </div>

            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/30">
                <Code className="w-6 h-6 text-white" />
              </div>

              <h3 className="text-xl font-bold text-white mb-1">Scripting</h3>
              <div className="text-purple-400 font-semibold mb-2 text-xs">4 Years Experience</div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Expert Lua scripting for game mechanics, systems, combat, and complex gameplay features.
              </p>
            </div>
          </Link>

          <Link
            to="/portfolio/vfx"
            className="group relative card overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/20">
                <Sparkles className="w-6 h-6 text-white" />
              </div>

              <h3 className="text-xl font-bold text-white mb-1">VFX</h3>
              <p className="text-gray-400 text-sm leading-relaxed mt-2">
                Eye-catching visual effects and particle systems that enhance atmosphere and player experience.
              </p>
            </div>
          </Link>

          <Link
            to="/portfolio/building"
            className="group relative card overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-brown-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-brown-600 to-brown-700 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-brown-500/20">
                <Building2 className="w-6 h-6 text-white" />
              </div>

              <h3 className="text-xl font-bold text-white mb-1">Building</h3>
              <p className="text-gray-400 text-sm leading-relaxed mt-2">
                Detailed environments, architecture, and world design that bring your vision to reality.
              </p>
            </div>
          </Link>

          <Link
            to="/portfolio/uiux"
            className="group relative card overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-purple-400/20">
                <Palette className="w-6 h-6 text-white" />
              </div>

              <h3 className="text-xl font-bold text-white mb-1">UI/UX</h3>
              <p className="text-gray-400 text-sm leading-relaxed mt-2">
                Modern, intuitive interfaces that provide seamless experiences across all devices.
              </p>
            </div>
          </Link>
        </div>
      </section>

      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/10 via-purple-800/10 to-purple-900/10" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.1) 0%, transparent 50%)',
        }} />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Why Choose Parcel Studio?</h2>
            <p className="text-lg text-gray-400">Quality, expertise, and dedication to your project</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-4 group">
              <div className="relative inline-block">
                <div className="bg-gradient-to-br from-purple-600 to-purple-700 w-16 h-16 rounded-xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/30">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <div className="absolute inset-0 bg-purple-500/30 blur-2xl group-hover:bg-purple-500/50 transition-all" />
              </div>

              <h3 className="text-xl font-bold text-white">4 Years Experience</h3>
              <p className="text-gray-400 text-sm leading-relaxed max-w-sm mx-auto">
                Proven track record with extensive scripting expertise and hundreds of successful projects.
              </p>
            </div>

            <div className="text-center space-y-4 group">
              <div className="relative inline-block">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 w-16 h-16 rounded-xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/30">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <div className="absolute inset-0 bg-purple-500/30 blur-2xl group-hover:bg-purple-500/50 transition-all" />
              </div>

              <h3 className="text-xl font-bold text-white">Professional Quality</h3>
              <p className="text-gray-400 text-sm leading-relaxed max-w-sm mx-auto">
                Production-ready code and assets that are optimized, well-documented, and built to scale.
              </p>
            </div>

            <div className="text-center space-y-4 group">
              <div className="relative inline-block">
                <div className="bg-gradient-to-br from-brown-600 to-brown-700 w-16 h-16 rounded-xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-lg shadow-brown-500/30">
                  <Star className="w-8 h-8 text-white fill-white" />
                </div>
                <div className="absolute inset-0 bg-brown-500/30 blur-2xl group-hover:bg-brown-500/50 transition-all" />
              </div>

              <h3 className="text-xl font-bold text-white">Dedicated Support</h3>
              <p className="text-gray-400 text-sm leading-relaxed max-w-sm mx-auto">
                Clear communication throughout with revisions and support to ensure your satisfaction.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="relative glass-dark rounded-2xl p-10 md:p-14 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-purple-500/20 to-purple-600/20" />
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl" />

          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Start Your Project?</h2>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Submit a commission request and let's discuss how we can bring your game ideas to life.
            </p>

            <Link
              to="/commissions/new"
              className="btn-primary inline-flex items-center space-x-2 glow-purple"
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
