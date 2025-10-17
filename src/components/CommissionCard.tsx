import { Link } from 'react-router-dom';
import { Calendar, DollarSign } from 'lucide-react';
import { Commission } from '../types';

interface CommissionCardProps {
  commission: Commission;
  showActions?: boolean;
}

export default function CommissionCard({ commission, showActions = false }: CommissionCardProps) {
  const statusColors = {
    draft: 'bg-slate-600',
    submitted: 'bg-blue-500',
    in_review: 'bg-yellow-500',
    approved: 'bg-emerald-500',
    rejected: 'bg-red-500',
    completed: 'bg-purple-500',
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

  return (
    <div className="bg-slate-800 rounded-xl border-2 border-slate-700 p-6 hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className={`${statusColors[commission.status]} text-white text-xs px-3 py-1 rounded-full font-semibold`}>
              {statusLabels[commission.status]}
            </span>
            <span className="bg-slate-700 text-slate-300 text-xs px-3 py-1 rounded-full capitalize">
              {complexityLabels[commission.taskComplexity]}
            </span>
          </div>
          <h3 className="text-xl font-bold text-white mb-1">{commission.subject}</h3>
          <p className="text-slate-400 text-sm font-mono">{commission.referenceNumber}</p>
        </div>

        <div className="text-right">
          <div className="text-emerald-400 font-bold text-2xl">
            ${commission.proposedAmount.toFixed(2)}
          </div>
        </div>
      </div>

      <p className="text-slate-300 mb-4 line-clamp-2">
        {commission.description}
      </p>

      <div className="flex items-center justify-between text-sm text-slate-400 border-t border-slate-700 pt-4">
        <div className="flex items-center space-x-1">
          <Calendar className="w-4 h-4" />
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
            className="text-emerald-400 hover:text-emerald-300 font-semibold"
          >
            Edit
          </Link>
        )}
      </div>
    </div>
  );
}
