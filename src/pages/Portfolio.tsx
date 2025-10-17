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
    scripting: 'emerald',
    vfx: 'blue',
    building: 'purple',
    uiux: 'pink',
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="bg-gradient-to-r from-emerald-500 to-blue-500 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-bold text-white mb-4">Portfolio</h1>
          <p className="text-xl text-white/90">
            Explore our work across scripting, VFX, building, and UI/UX design
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {portfolioCategories.map((category) => {
            const Icon = icons[category.id];
            const color = colors[category.id];

            return (
              <Link
                key={category.id}
                to={`/portfolio/${category.id}`}
                className={`group bg-slate-800 rounded-xl p-8 border-2 border-slate-700 hover:border-${color}-400 transition-all hover:scale-105 relative overflow-hidden`}
              >
                {category.featured && (
                  <div className="absolute top-4 right-4">
                    <div className="bg-emerald-500 text-white text-xs px-3 py-1 rounded-full flex items-center space-x-1">
                      <Star className="w-3 h-3 fill-current" />
                      <span>Primary Expertise</span>
                    </div>
                  </div>
                )}

                <Icon className={`w-16 h-16 text-${color}-400 mb-4 group-hover:scale-110 transition-transform`} />

                <h2 className="text-3xl font-bold text-white mb-2">
                  {category.name}
                </h2>

                {category.experienceYears && (
                  <div className="text-emerald-400 font-semibold mb-3">
                    {category.experienceYears} Years Experience
                  </div>
                )}

                <p className="text-slate-400 mb-6">
                  {category.description}
                </p>

                <div className="flex items-center text-emerald-400 font-semibold group-hover:text-emerald-300">
                  <span>View Projects</span>
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
