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
    scripting: { bg: 'from-purple-600 to-purple-500', glow: 'purple-500' },
    vfx: { bg: 'from-purple-500 to-purple-600', glow: 'purple-400' },
    building: { bg: 'from-brown-600 to-brown-700', glow: 'brown-500' },
    uiux: { bg: 'from-purple-400 to-purple-500', glow: 'purple-300' },
  };

  return (
    <div className="min-h-screen">
      <div className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-purple-800/10" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.15) 0%, transparent 50%)',
        }} />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-6">
            <div className="inline-block mb-4">
              <div className="flex items-center space-x-2 glass px-4 py-2 rounded-full">
                <Star className="w-4 h-4 text-purple-400 fill-purple-400" />
                <span className="text-sm text-purple-200 font-medium">Our Work</span>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Portfolio</h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Explore our work across scripting, VFX, building, and UI/UX design
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {portfolioCategories.map((category) => {
            const Icon = icons[category.id];
            const color = colors[category.id];

            return (
              <Link
                key={category.id}
                to={`/portfolio/${category.id}`}
                className="group relative card p-8 transition-all hover:scale-[1.02] overflow-hidden"
              >
                {category.featured && (
                  <div className="absolute top-5 right-5 z-10">
                    <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white text-xs px-2.5 py-1 rounded-full flex items-center space-x-1 font-semibold shadow-lg">
                      <Star className="w-3 h-3 fill-current" />
                      <span>Primary Expertise</span>
                    </div>
                  </div>
                )}

                <div className={`absolute inset-0 bg-gradient-to-br ${color.bg.replace('from-', 'from-').replace('to-', 'to-')}/5 opacity-0 group-hover:opacity-100 transition-opacity`} />

                <div className="relative">
                  <div className={`w-16 h-16 bg-gradient-to-br ${color.bg} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-${color.glow}/30`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    {category.name}
                  </h2>

                  {category.experienceYears && (
                    <div className="text-purple-400 font-semibold mb-3 text-xs">
                      {category.experienceYears} Years Experience
                    </div>
                  )}

                  <p className="text-gray-400 mb-6 leading-relaxed text-sm">
                    {category.description}
                  </p>

                  <div className="flex items-center text-purple-400 font-semibold group-hover:text-purple-300 transition-colors text-sm">
                    <span>View Projects</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
