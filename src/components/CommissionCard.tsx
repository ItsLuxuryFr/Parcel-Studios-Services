import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { Commission } from '../types';

interface CommissionCardProps {
  commission: Commission;
  showActions?: boolean;
}

export default function CommissionCard({ commission, showActions = false }: CommissionCardProps) {
  const statusColors = {
    draft: 'bg-gray-600',
    submitted: 'bg-blue-600',
    in_review: 'bg-yellow-600',
    approved: 'bg-purple-600',
    rejected: 'bg-red-600',
    completed: 'bg-brown-600',
  };

  const statusLabels = {
    draft: 'Draft',
    submitted: 'Submitted',
    in_review: 'In Review',
    approved: 'Approved',
    rejected: 'Rejected',
    completed: 'Completed',
  };

  const complexityLabels = {
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    extreme: 'Extreme',
  };

  const complexityColors = {
    easy: 'bg-green-900/30 text-green-400 border-green-500/30',
    medium: 'bg-blue-900/30 text-blue-400 border-blue-500/30',
    hard: 'bg-purple-900/30 text-purple-400 border-purple-500/30',
    extreme: 'bg-red-900/30 text-red-400 border-red-500/30',
  };

  return (
    <div className="card hover:scale-[1.01] transition-transform">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className={`${statusColors[commission.status]} text-white text-xs px-2.5 py-1 rounded-full font-semibold`}>
              {statusLabels[commission.status]}
            </span>
            <span className={`${complexityColors[commission.taskComplexity]} text-xs px-2.5 py-1 rounded-full capitalize border`}>
              {complexityLabels[commission.taskComplexity]}
            </span>
          </div>
          <h3 className="text-lg font-bold text-white mb-1">{commission.subject}</h3>
          <p className="text-gray-500 text-xs font-mono">{commission.referenceNumber}</p>
        </div>

        <div className="text-right">
          <div className="text-purple-400 font-bold text-xl">
            ${commission.proposedAmount.toFixed(2)}
          </div>
        </div>
      </div>

      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
        {commission.description}
      </p>

      {commission.tags && commission.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {commission.tags.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-1 rounded text-xs font-medium"
            >
              {tag}
            </span>
          ))}
          {commission.tags.length > 3 && (
            <span className="text-emerald-400 text-xs font-medium">
              +{commission.tags.length - 3} more
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500 border-t border-purple-500/10 pt-3">
        <div className="flex items-center space-x-1">
          <Calendar className="w-3.5 h-3.5" />
          <span>
            {new Date(commission.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>

        {showActions && commission.status === 'draft' && (
          <Link
            to={`/commissions/edit/${commission.id}`}
            className="text-purple-400 hover:text-purple-300 font-semibold"
          >
            Edit
          </Link>
        )}
      </div>
    </div>
  );
}
