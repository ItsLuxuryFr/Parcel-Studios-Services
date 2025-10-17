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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Category Not Found</h1>
          <Link to="/portfolio" className="text-purple-400 hover:text-purple-300">
            Back to Portfolio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="relative bg-gradient-to-r from-purple-900/40 to-purple-800/40 py-12 border-b border-purple-500/20">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <Link
            to="/portfolio"
            className="inline-flex items-center text-purple-300 hover:text-purple-200 mb-6 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Portfolio
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
                {category.name}
                {category.featured && (
                  <span className="ml-4 bg-purple-500/20 text-purple-200 text-xs px-3 py-1 rounded-full flex items-center border border-purple-500/30">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    Primary Expertise
                  </span>
                )}
              </h1>
              {category.experienceYears && (
                <div className="text-purple-300 text-sm mb-2 font-semibold">
                  {category.experienceYears} Years of Professional Experience
                </div>
              )}
              <p className="text-lg text-gray-400">
                {category.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {category.featured && (
          <div className="glass border-purple-500/30 rounded-xl p-5 mb-10">
            <h2 className="text-xl font-bold text-purple-300 mb-2">Featured Category</h2>
            <p className="text-gray-400 text-sm">
              Scripting is my primary expertise with 4 years of professional experience creating complex game systems,
              mechanics, and tools for Roblox games. From combat systems to inventory management, I specialize in
              writing clean, optimized, and maintainable code that scales with your game.
            </p>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            Projects ({projects.length})
          </h2>
          <p className="text-gray-400 text-sm">
            Click on any project to expand and view detailed information, demos, and images.
          </p>
        </div>

        <div className="space-y-5">
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>

        {projects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No projects in this category yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
