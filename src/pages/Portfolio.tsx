import { Link } from 'react-router-dom';
import { Code, Sparkles, Building2, Palette, ArrowRight, Star } from 'lucide-react';
import { portfolioCategories } from '../data/mockData';

export default function Portfolio() {
  const icons = {
    scripting: Code,
    vfx: Sparkles,
    building: Building2,
    uiux: Palette,
  };

  const colors = {
    scripting: { bg: 'from-primary-500 to-primary-600', hover: 'primary-500', glow: 'primary-400' },
    vfx: { bg: 'from-blue-500 to-blue-600', hover: 'blue-500', glow: 'blue-400' },
    building: { bg: 'from-teal-500 to-teal-600', hover: 'teal-500', glow: 'teal-400' },
    uiux: { bg: 'from-accent-500 to-accent-600', hover: 'accent-500', glow: 'accent-400' },
  };

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-accent-500/10" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.15) 0%, transparent 50%)',
        }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-6">
            <div className="inline-block mb-6">
              <div className="flex items-center space-x-2 bg-white/5 backdrop-blur-sm border border-white/10 px-4 py-2 rounded-full">
                <Star className="w-4 h-4 text-accent-400" />
                <span className="text-sm text-gray-300 font-medium">Our Work</span>
              </div>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">Portfolio</h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Explore our work across scripting, VFX, building, and UI/UX design
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {portfolioCategories.map((category) => {
            const Icon = icons[category.id];
            const color = colors[category.id];

            return (
              <Link
                key={category.id}
                to={`/portfolio/${category.id}`}
                className="group relative glass hover:bg-white/10 rounded-3xl p-10 transition-all hover:scale-[1.02] overflow-hidden"
              >
                {category.featured && (
                  <div className="absolute top-6 right-6 z-10">
                    <div className="bg-gradient-to-r from-primary-500 to-accent-500 text-white text-xs px-3 py-1.5 rounded-full flex items-center space-x-1 font-semibold shadow-lg">
                      <Star className="w-3 h-3 fill-current" />
                      <span>Primary Expertise</span>
                    </div>
                  </div>
                )}

                <div className={`absolute inset-0 bg-gradient-to-br ${color.bg.replace('from-', 'from-').replace('to-', 'to-')}/5 opacity-0 group-hover:opacity-100 transition-opacity`} />

                <div className="relative">
                  <div className={`w-20 h-20 bg-gradient-to-br ${color.bg} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-xl`}>
                    <Icon className="w-10 h-10 text-white" />
                  </div>

                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                    {category.name}
                  </h2>

                  {category.experienceYears && (
                    <div className="text-primary-400 font-semibold mb-4 text-sm">
                      {category.experienceYears} Years Experience
                    </div>
                  )}

                  <p className="text-gray-400 mb-8 leading-relaxed text-lg">
                    {category.description}
                  </p>

                  <div className="flex items-center text-primary-400 font-semibold group-hover:text-primary-300 transition-colors">
                    <span>View Projects</span>
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>

                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`}>
                  <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-${color.hover}/20 rounded-full blur-3xl`} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
