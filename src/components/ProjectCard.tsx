import { useState } from 'react';
import { ChevronDown, ChevronUp, Play, Calendar, Tag } from 'lucide-react';
import { Project } from '../types';

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="card overflow-hidden transition-all hover:scale-[1.02]">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-5 flex items-start justify-between text-left hover:bg-purple-500/5 transition-colors"
        aria-expanded={isExpanded}
        aria-controls={`project-${project.id}`}
      >
        <div className="flex-1 space-y-3">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600/20 to-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-purple-500/20">
              <span className="text-lg font-bold text-purple-300">
                {project.title.split(' ').map(w => w[0]).join('').slice(0, 2)}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-1 flex items-center">
                {project.title}
                {project.featured && (
                  <span className="ml-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white text-xs px-2 py-0.5 rounded-full">
                    Featured
                  </span>
                )}
              </h3>
              <p className="text-gray-400 text-sm">{project.shortCaption}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {project.tags.slice(0, 4).map((tag, idx) => (
              <span
                key={idx}
                className="bg-purple-900/30 text-purple-300 px-2.5 py-1 rounded-full text-xs border border-purple-500/20"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="ml-4 flex-shrink-0">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-purple-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-purple-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div
          id={`project-${project.id}`}
          className="border-t border-purple-500/10 p-5 space-y-5 animate-fadeIn bg-black/20"
        >
          {project.videoUrl && (
            <div className="glass rounded-lg aspect-video flex items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-purple-800/20" />
              <div className="relative z-10 text-center">
                <div className="bg-purple-500/20 backdrop-blur-sm rounded-full p-5 inline-flex group-hover:bg-purple-500/30 transition-colors border border-purple-500/30">
                  <Play className="w-10 h-10 text-purple-300 fill-current" />
                </div>
                <p className="text-white mt-3 font-semibold text-sm">Video Demo</p>
                <p className="text-gray-500 text-xs mt-1">{project.videoUrl}</p>
              </div>
            </div>
          )}

          {project.images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {project.images.map((img, idx) => (
                <div
                  key={idx}
                  className="glass rounded-lg aspect-video flex items-center justify-center"
                >
                  <span className="text-gray-600 text-xs">Image {idx + 1}</span>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <h4 className="text-base font-semibold text-purple-300">Description</h4>
            <div className="text-gray-400 space-y-2 leading-relaxed text-sm">
              {project.description.split('\n\n').map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <h4 className="text-xs font-semibold text-purple-400 mb-2 flex items-center uppercase tracking-wider">
                <Tag className="w-3.5 h-3.5 mr-1" />
                Skills Used
              </h4>
              <div className="flex flex-wrap gap-2">
                {project.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="bg-purple-500/10 text-purple-300 px-2.5 py-1 rounded-full text-xs border border-purple-500/30"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-purple-400 mb-2 flex items-center uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 mr-1" />
                Completion Date
              </h4>
              <p className="text-white text-sm">
                {new Date(project.completionDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                })}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
