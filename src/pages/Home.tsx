import { Link } from 'react-router-dom';
import { Code, Sparkles, Building2, Palette, ArrowRight, CheckCircle2, Star, Zap, ChevronLeft, ChevronRight, Play, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [currentPortfolioIndex, setCurrentPortfolioIndex] = useState(0);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check if user is authenticated and needs onboarding
  useEffect(() => {
    const checkAuthAndOnboarding = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (authUser) {
          // Check if user has a profile in the database
          const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', authUser.id)
            .single();

          // If user is authenticated but hasn't completed onboarding, redirect to onboarding
          if (!profile) {
            window.location.href = '/onboarding';
            return;
          }
        }
      } catch (error) {
        console.error('Error checking auth and onboarding:', error);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthAndOnboarding();
  }, []);

  const portfolioProjects = [
    {
      id: 1,
      title: "Advanced Combat System",
      category: "Scripting",
      description: "Complex weapon mechanics with realistic physics and dynamic damage calculations",
      image: "/api/placeholder/400/300",
      tags: ["Combat", "Physics", "Lua"],
      color: "purple"
    },
    {
      id: 2,
      title: "Epic VFX Showcase",
      category: "VFX",
      description: "Stunning particle effects and visual enhancements for immersive gameplay",
      image: "/api/placeholder/400/300",
      tags: ["Particles", "Effects", "Atmosphere"],
      color: "purple"
    },
    {
      id: 3,
      title: "Medieval Castle Build",
      category: "Building",
      description: "Detailed architectural masterpiece with intricate stonework and medieval design",
      image: "/api/placeholder/400/300",
      tags: ["Architecture", "Medieval", "Detailed"],
      color: "brown"
    },
    {
      id: 4,
      title: "Modern UI Dashboard",
      category: "UI/UX",
      description: "Clean, responsive interface with smooth animations and intuitive navigation",
      image: "/api/placeholder/400/300",
      tags: ["Interface", "Modern", "Responsive"],
      color: "purple"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPortfolioIndex((prev) => (prev + 1) % portfolioProjects.length);
    }, 10000); // Changed to 10 seconds
    return () => clearInterval(interval);
  }, [portfolioProjects.length]);

  // Don't render anything while checking auth
  if (isCheckingAuth) {
    return null;
  }

  const nextPortfolio = () => {
    setCurrentPortfolioIndex((prev) => (prev + 1) % portfolioProjects.length);
  };

  const prevPortfolio = () => {
    setCurrentPortfolioIndex((prev) => (prev - 1 + portfolioProjects.length) % portfolioProjects.length);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-28">
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-transparent to-purple-800/20 animate-gradient-shift" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(168, 85, 247, 0.25) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(147, 51, 234, 0.25) 0%, transparent 50%)',
        }} />
        
        {/* Floating Orbs */}
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-brown-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center space-y-6 animate-fade-in">
            <div className="inline-block">
              <div className="flex items-center space-x-2 glass px-4 py-2 rounded-full mb-4 animate-glow">
                <Star className="w-4 h-4 text-purple-400 fill-purple-400 animate-pulse" />
                <span className="text-sm text-purple-200 font-medium">4+ Years Excellence</span>
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
              <span className="text-white">Professional</span>
              <span className="block mt-2 text-gradient-hero animate-gradient-text">
                Roblox Development
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Bringing your game ideas to life with expert scripting, stunning VFX, detailed builds, and modern UI design.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-4">
              <Link
                to="/portfolio"
                className="btn-primary group flex items-center space-x-2 glow-purple hover:scale-105 transition-all duration-300"
              >
                <span>View Portfolio</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/commissions/new"
                className="btn-secondary flex items-center space-x-2 hover:scale-105 transition-all duration-300"
              >
                <span>Start Commission</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio Preview Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/10 via-purple-800/10 to-purple-900/10" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.15) 0%, transparent 50%)',
        }} />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Featured Projects</h2>
            <p className="text-lg text-gray-400">Explore our latest work and creative solutions</p>
          </div>

          {/* Portfolio Cards Carousel */}
          <div className="relative">
            {/* Navigation Arrows - Outside content area */}
            <button
              onClick={prevPortfolio}
              className="absolute -left-16 top-1/2 -translate-y-1/2 w-12 h-12 bg-purple-600/20 hover:bg-purple-600/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-110 border border-purple-500/30 z-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextPortfolio}
              className="absolute -right-16 top-1/2 -translate-y-1/2 w-12 h-12 bg-purple-600/20 hover:bg-purple-600/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-110 border border-purple-500/30 z-10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            <div className="overflow-hidden rounded-2xl">
              <div 
                className="flex transition-transform duration-700 ease-out"
                style={{ transform: `translateX(-${currentPortfolioIndex * 100}%)` }}
              >
                {portfolioProjects.map((project) => (
                  <div key={project.id} className="w-full flex-shrink-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              project.color === 'purple' 
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                                : 'bg-brown-500/20 text-brown-300 border border-brown-500/30'
                            }`}>
                              {project.category}
                            </span>
                            <div className="flex space-x-1">
                              {project.tags.map((tag) => (
                                <span key={tag} className="text-xs text-gray-500 bg-gray-800/50 px-2 py-1 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                          <h3 className="text-3xl md:text-4xl font-bold text-white">{project.title}</h3>
                          <p className="text-lg text-gray-400 leading-relaxed">{project.description}</p>
                        </div>
                        <div className="flex space-x-4">
                          <Link
                            to="/portfolio"
                            className="btn-primary flex items-center space-x-2 hover:scale-105 transition-all duration-300"
                          >
                            <span>View Project</span>
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                          <button className="btn-secondary flex items-center space-x-2 hover:scale-105 transition-all duration-300">
                            <Play className="w-4 h-4" />
                            <span>Watch Demo</span>
                          </button>
                        </div>
                      </div>
                      <div className="relative">
                        <div className="aspect-video bg-gradient-to-br from-purple-900/20 to-brown-900/20 rounded-xl overflow-hidden border border-purple-500/20">
                          <div className="w-full h-full bg-gradient-to-br from-purple-600/10 to-brown-600/10 flex items-center justify-center">
                            <div className="text-center space-y-4">
                              <div className={`w-16 h-16 mx-auto rounded-xl flex items-center justify-center ${
                                project.color === 'purple' 
                                  ? 'bg-gradient-to-br from-purple-600 to-purple-500' 
                                  : 'bg-gradient-to-br from-brown-600 to-brown-500'
                              }`}>
                                {project.category === 'Scripting' && <Code className="w-8 h-8 text-white" />}
                                {project.category === 'VFX' && <Sparkles className="w-8 h-8 text-white" />}
                                {project.category === 'Building' && <Building2 className="w-8 h-8 text-white" />}
                                {project.category === 'UI/UX' && <Palette className="w-8 h-8 text-white" />}
                              </div>
                              <p className="text-gray-400 text-sm">Project Preview</p>
                            </div>
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent rounded-xl pointer-events-none" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center space-x-2 mt-8">
              {portfolioProjects.map((project, index) => (
                <button
                  key={project.id}
                  onClick={() => setCurrentPortfolioIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentPortfolioIndex 
                      ? 'bg-purple-500 scale-125' 
                      : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Our Services</h2>
          <p className="text-lg text-gray-400">Comprehensive development solutions for your Roblox game</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Link
            to="/portfolio/scripting"
            className="group relative card overflow-hidden hover:scale-105 transition-all duration-500"
          >
            <div className="absolute top-3 right-3 z-10">
              <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white text-xs px-2.5 py-1 rounded-full flex items-center space-x-1 font-semibold animate-pulse">
                <Star className="w-3 h-3 fill-current" />
                <span>Featured</span>
              </div>
            </div>

            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-500/30">
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
            className="group relative card overflow-hidden hover:scale-105 transition-all duration-500"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-500/20">
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
            className="group relative card overflow-hidden hover:scale-105 transition-all duration-500"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-brown-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-brown-600 to-brown-700 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-brown-500/20">
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
            className="group relative card overflow-hidden hover:scale-105 transition-all duration-500"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-400/20">
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

      {/* Why Choose Us Section */}
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
                <div className="bg-gradient-to-br from-purple-600 to-purple-700 w-16 h-16 rounded-xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-500/30">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <div className="absolute inset-0 bg-purple-500/30 blur-2xl group-hover:bg-purple-500/50 transition-all duration-300" />
              </div>

              <h3 className="text-xl font-bold text-white">4 Years Experience</h3>
              <p className="text-gray-400 text-sm leading-relaxed max-w-sm mx-auto">
                Proven track record with extensive scripting expertise and hundreds of successful projects.
              </p>
            </div>

            <div className="text-center space-y-4 group">
              <div className="relative inline-block">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 w-16 h-16 rounded-xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-500/30">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <div className="absolute inset-0 bg-purple-500/30 blur-2xl group-hover:bg-purple-500/50 transition-all duration-300" />
              </div>

              <h3 className="text-xl font-bold text-white">Professional Quality</h3>
              <p className="text-gray-400 text-sm leading-relaxed max-w-sm mx-auto">
                Production-ready code and assets that are optimized, well-documented, and built to scale.
              </p>
            </div>

            <div className="text-center space-y-4 group">
              <div className="relative inline-block">
                <div className="bg-gradient-to-br from-brown-600 to-brown-700 w-16 h-16 rounded-xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-brown-500/30">
                  <Star className="w-8 h-8 text-white fill-white" />
                </div>
                <div className="absolute inset-0 bg-brown-500/30 blur-2xl group-hover:bg-brown-500/50 transition-all duration-300" />
              </div>

              <h3 className="text-xl font-bold text-white">Dedicated Support</h3>
              <p className="text-gray-400 text-sm leading-relaxed max-w-sm mx-auto">
                Clear communication throughout with revisions and support to ensure your satisfaction.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="relative glass-dark rounded-2xl p-10 md:p-14 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-purple-500/20 to-purple-600/20" />
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />

          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Start Your Project?</h2>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Submit a commission request and let's discuss how we can bring your game ideas to life.
            </p>

            <Link
              to="/commissions/new"
              className="btn-primary inline-flex items-center space-x-2 glow-purple hover:scale-105 transition-all duration-300"
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
