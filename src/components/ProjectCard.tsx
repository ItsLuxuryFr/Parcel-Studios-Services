import { useState } from 'react';
import { ChevronDown, ChevronUp, Play, Calendar, Tag } from 'lucide-react';
import { Project } from '../types';

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-slate-800 rounded-xl border-2 border-slate-700 overflow-hidden transition-all hover:border-slate-600">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex items-start justify-between text-left hover:bg-slate-700/50 transition-colors"
        aria-expanded={isExpanded}
        aria-controls={`project-${project.id}`}
      >
        <div className="flex-1 space-y-3">
          <div className="flex items-start space-x-4">
            <div className="w-20 h-20 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-slate-400">
                {project.title.split(' ').map(w => w[0]).join('').slice(0, 2)}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-1 flex items-center">
                {project.title}
                {project.featured && (
                  <span className="ml-2 bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full">
                    Featured
                  </span>
                )}
              </h3>
              <p className="text-slate-400">{project.shortCaption}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {project.tags.slice(0, 4).map((tag, idx) => (
              <span
                key={idx}
                className="bg-slate-700 text-slate-300 px-3 py-1 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="ml-4 flex-shrink-0">
          {isExpanded ? (
            <ChevronUp className="w-6 h-6 text-slate-400" />
          ) : (
            <ChevronDown className="w-6 h-6 text-slate-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div
          id={`project-${project.id}`}
          className="border-t border-slate-700 p-6 space-y-6 animate-fadeIn"
        >
          {project.videoUrl && (
            <div className="bg-slate-900 rounded-lg aspect-video flex items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-blue-500/20" />
              <div className="relative z-10 text-center">
                <div className="bg-white/10 backdrop-blur-sm rounded-full p-6 inline-flex group-hover:bg-white/20 transition-colors">
                  <Play className="w-12 h-12 text-white fill-current" />
                </div>
                <p className="text-white mt-4 font-semibold">Video Demo</p>
                <p className="text-slate-400 text-sm mt-1">{project.videoUrl}</p>
              </div>
            </div>
          )}

          {project.images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {project.images.map((img, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900 rounded-lg aspect-video flex items-center justify-center"
                >
                  <span className="text-slate-600 text-sm">Image {idx + 1}</span>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Description</h4>
            <div className="text-slate-300 space-y-3 leading-relaxed">
              {project.description.split('\n\n').map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-slate-400 mb-2 flex items-center">
                <Tag className="w-4 h-4 mr-1" />
                Skills Used
              </h4>
              <div className="flex flex-wrap gap-2">
                {project.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-sm border border-emerald-500/20"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-400 mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Completion Date
              </h4>
              <p className="text-white">
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
