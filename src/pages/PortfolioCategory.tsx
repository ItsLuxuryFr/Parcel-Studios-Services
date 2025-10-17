import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star } from 'lucide-react';
import { mockProjects, portfolioCategories } from '../data/mockData';
import ProjectCard from '../components/ProjectCard';

export default function PortfolioCategory() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const category = portfolioCategories.find(c => c.id === categoryId);
  const projects = mockProjects.filter(p => p.category === categoryId);

  if (!category) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Category Not Found</h1>
          <Link to="/portfolio" className="text-emerald-400 hover:text-emerald-300">
            Back to Portfolio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="bg-gradient-to-r from-emerald-500 to-blue-500 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/portfolio"
            className="inline-flex items-center text-white/90 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Portfolio
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-5xl font-bold text-white mb-3 flex items-center">
                {category.name}
                {category.featured && (
                  <span className="ml-4 bg-white/20 text-white text-sm px-3 py-1 rounded-full flex items-center">
                    <Star className="w-4 h-4 mr-1 fill-current" />
                    Primary Expertise
                  </span>
                )}
              </h1>
              {category.experienceYears && (
                <div className="text-white/90 text-lg mb-2">
                  {category.experienceYears} Years of Professional Experience
                </div>
              )}
              <p className="text-xl text-white/80">
                {category.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {category.featured && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 mb-12">
            <h2 className="text-2xl font-bold text-emerald-400 mb-2">Featured Category</h2>
            <p className="text-slate-300">
              Scripting is my primary expertise with 4 years of professional experience creating complex game systems,
              mechanics, and tools for Roblox games. From combat systems to inventory management, I specialize in
              writing clean, optimized, and maintainable code that scales with your game.
            </p>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            Projects ({projects.length})
          </h2>
          <p className="text-slate-400">
            Click on any project to expand and view detailed information, demos, and images.
          </p>
        </div>

        <div className="space-y-6">
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>

        {projects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">No projects in this category yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
