import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Code, Sparkles, Building2, Palette, ArrowRight, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Project, PortfolioCategoryType } from '../types';

export default function Portfolio() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPortfolioProjects();
  }, []);

  const loadPortfolioProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('portfolio_projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: Project[] = (data || []).map(item => ({
        id: item.id,
        category: item.category,
        title: item.title,
        shortCaption: item.short_caption,
        description: item.description,
        thumbnailUrl: item.thumbnail_url,
        videoUrl: item.video_url,
        images: item.images || [],
        tags: item.tags || [],
        skills: item.skills || [],
        completionDate: item.completion_date,
        featured: item.featured || false,
      }));

      setProjects(mapped);
    } catch (error) {
      console.error('Error loading portfolio projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const portfolioCategories = [
    {
      id: 'scripting' as PortfolioCategoryType,
      name: 'Scripting',
      description: 'Advanced Lua scripting for game mechanics, systems, and tools',
      featured: true,
      experienceYears: 4,
    },
    {
      id: 'vfx' as PortfolioCategoryType,
      name: 'VFX',
      description: 'Stunning visual effects and particle systems',
    },
    {
      id: 'building' as PortfolioCategoryType,
      name: 'Building',
      description: 'Detailed environments and architectural design',
    },
    {
      id: 'uiux' as PortfolioCategoryType,
      name: 'UI/UX',
      description: 'Modern, intuitive user interfaces and experiences',
    },
  ];

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
          <div className="text-purple-300 text-xl">Loading portfolio...</div>
        </div>
      </div>
    );
  }

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
          {portfolioCategories.map((category, index) => {
            const Icon = icons[category.id];
            const color = colors[category.id];
            const categoryProjects = projects.filter(p => p.category === category.id);

            return (
              <Link
                key={category.id}
                to={`/portfolio/${category.id}`}
                className="group relative card p-8 transition-all hover:scale-[1.02] overflow-hidden animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {category.featured && (
                  <div className="absolute top-5 right-5 z-10">
                    <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white text-xs px-2.5 py-1 rounded-full flex items-center space-x-1 font-semibold shadow-lg animate-pulse">
                      <Star className="w-3 h-3 fill-current" />
                      <span>Primary Expertise</span>
                    </div>
                  </div>
                )}

                <div className={`absolute inset-0 bg-gradient-to-br ${color.bg.replace('from-', 'from-').replace('to-', 'to-')}/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                <div className="relative">
                  <div className={`w-16 h-16 bg-gradient-to-br ${color.bg} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-${color.glow}/30`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors duration-300">
                    {category.name}
                  </h2>

                  {category.experienceYears && (
                    <div className="text-purple-400 font-semibold mb-3 text-xs">
                      {category.experienceYears} Years Experience
                    </div>
                  )}

                  <p className="text-gray-400 mb-6 leading-relaxed text-sm group-hover:text-gray-300 transition-colors duration-300">
                    {category.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-purple-400 font-semibold group-hover:text-purple-300 transition-colors text-sm">
                      <span>View Projects</span>
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
                    </div>
                    <div className="text-purple-300 text-sm">
                      {categoryProjects.length} project{categoryProjects.length !== 1 ? 's' : ''}
                    </div>
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
