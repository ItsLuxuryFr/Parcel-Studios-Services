import { Link } from 'react-router-dom';
import { Calendar, Archive, Image as ImageIcon, File, Clock, Edit, X } from 'lucide-react';
import { Commission } from '../types';

interface CommissionCardProps {
  commission: Commission;
  showActions?: boolean;
  onArchive?: (commissionId: string) => void;
  onEdit?: (commission: Commission) => void;
  onDelete?: (commissionId: string) => void;
}

export default function CommissionCard({ commission, showActions = false, onArchive, onEdit, onDelete }: CommissionCardProps) {
  // Calculate time remaining for draft commissions
  const getTimeRemaining = (updatedAt: string) => {
    const now = new Date();
    const updated = new Date(updatedAt);
    const sevenDaysFromUpdate = new Date(updated.getTime() + 7 * 24 * 60 * 60 * 1000);
    const timeRemaining = sevenDaysFromUpdate.getTime() - now.getTime();
    
    if (timeRemaining <= 0) return null;
    
    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days} day${days !== 1 ? 's' : ''} ${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
  };

  const timeRemaining = commission.status === 'draft' ? getTimeRemaining(commission.updatedAt) : null;
  const statusColors = {
    draft: 'bg-gray-600',
    submitted: 'bg-blue-600',
    in_review: 'bg-yellow-600',
    accepted: 'bg-emerald-600',
    in_progress: 'bg-blue-600',
    approved: 'bg-emerald-600',
    rejected: 'bg-red-600',
    completed: 'bg-purple-600',
    archived: 'bg-slate-600',
  };

  const statusLabels = {
    draft: 'Draft',
    submitted: 'Submitted',
    in_review: 'In Review',
    accepted: 'Accepted',
    in_progress: 'In Progress',
    approved: 'Approved',
    rejected: 'Rejected',
    completed: 'Completed',
    archived: 'Archived',
  };

  const complexityLabels = {
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    extreme: 'Complex',
  };

  const complexityColors = {
    easy: 'bg-green-900/30 text-green-400 border-green-500/30',
    medium: 'bg-blue-900/30 text-blue-400 border-blue-500/30',
    hard: 'bg-purple-900/30 text-purple-400 border-purple-500/30',
    extreme: 'bg-red-900/30 text-red-400 border-red-500/30',
  };

  return (
    <div className="card hover:scale-[1.02] transition-all duration-500 ease-out group animate-fade-in-up">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className={`${statusColors[commission.status]} text-white text-xs px-2.5 py-1 rounded-full font-semibold transition-all duration-300 group-hover:scale-105 shadow-lg`}>
              {statusLabels[commission.status]}
            </span>
            <span className={`${complexityColors[commission.taskComplexity]} text-xs px-2.5 py-1 rounded-full capitalize border transition-all duration-300 group-hover:scale-105`}>
              {complexityLabels[commission.taskComplexity]}
            </span>
          </div>
          <h3 className="text-lg font-bold text-white mb-1 group-hover:text-purple-300 transition-colors duration-300">{commission.subject}</h3>
          <p className="text-purple-400 text-xs font-mono group-hover:text-purple-300 transition-colors duration-300">{commission.referenceNumber}</p>
        </div>

        <div className="text-right">
          <div className="text-purple-400 font-bold text-xl group-hover:text-purple-300 transition-colors duration-300">
            ${commission.proposedAmount.toFixed(2)}
          </div>
        </div>
      </div>

      <p className="text-gray-400 text-sm mb-4 line-clamp-2 group-hover:text-gray-300 transition-colors duration-300">
        {commission.description}
      </p>

      {timeRemaining && (
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-300 text-sm font-medium">
              Auto-delete in: {timeRemaining}
            </span>
          </div>
        </div>
      )}

      {commission.images && commission.images.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <File className="w-4 h-4 text-purple-400" />
            <span className="text-purple-300 text-sm font-medium">Files</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <img
                src={commission.images[0]}
                alt="Commission preview"
                className="w-16 h-16 object-cover rounded-lg border border-purple-500/20 group-hover:border-purple-400/40 transition-colors duration-300"
              />
            </div>
            {commission.images.length > 1 && (
              <div className="flex items-center justify-center w-16 h-16 bg-purple-500/20 border border-purple-500/30 rounded-lg group-hover:bg-purple-500/30 transition-colors duration-300">
                <span className="text-purple-300 text-sm font-semibold group-hover:text-purple-200 transition-colors duration-300">
                  +{commission.images.length - 1}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {commission.tags && commission.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {commission.tags.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-1 rounded text-xs font-medium transition-all duration-300 group-hover:bg-purple-500/30 group-hover:text-purple-200 group-hover:scale-105"
            >
              {tag}
            </span>
          ))}
          {commission.tags.length > 3 && (
            <span className="text-purple-400 text-xs font-medium group-hover:text-purple-300 transition-colors duration-300">
              +{commission.tags.length - 3} more
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-purple-300 border-t border-purple-500/20 pt-3">
        <div className="flex items-center space-x-1 group-hover:text-purple-200 transition-colors duration-300">
          <Calendar className="w-3.5 h-3.5 group-hover:text-purple-400 transition-colors duration-300" />
          <span>
            {new Date(commission.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {showActions && commission.status === 'draft' && onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(commission);
              }}
              className="text-purple-400 hover:text-purple-300 font-semibold transition-all duration-300 hover:scale-105 flex items-center space-x-1"
              title="Edit draft"
            >
              <Edit className="w-3.5 h-3.5" />
              <span className="text-xs">Edit</span>
            </button>
          )}
          
          {showActions && commission.status === 'draft' && onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
                  onDelete(commission.id);
                }
              }}
              className="text-red-400 hover:text-red-300 transition-all duration-300 flex items-center space-x-1 hover:scale-105"
              title="Delete draft"
            >
              <X className="w-3.5 h-3.5" />
              <span className="text-xs">Delete</span>
            </button>
          )}
          
          {commission.status !== 'archived' && commission.status !== 'draft' && onArchive && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onArchive(commission.id);
              }}
              className="text-purple-400 hover:text-purple-300 transition-all duration-300 flex items-center space-x-1 hover:scale-105 hover:text-red-400"
              title="Archive commission"
            >
              <Archive className="w-3.5 h-3.5" />
              <span className="text-xs">Archive</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
