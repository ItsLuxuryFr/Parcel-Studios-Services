import { Link } from 'react-router-dom';
import { Plus, Filter } from 'lucide-react';
import { useCommissions } from '../contexts/CommissionContext';
import CommissionCard from '../components/CommissionCard';
import { useState } from 'react';
import { CommissionStatus } from '../types';

export default function Commissions() {
  const { commissions } = useCommissions();
  const [filterStatus, setFilterStatus] = useState<CommissionStatus | 'all'>('all');

  const filteredCommissions = filterStatus === 'all'
    ? commissions
    : commissions.filter(c => c.status === filterStatus);

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="bg-gradient-to-r from-emerald-500 to-blue-500 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-bold text-white mb-4">Commissions</h1>
          <p className="text-xl text-white/90">
            Browse all commission requests or submit your own
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as CommissionStatus | 'all')}
              className="bg-slate-800 border border-slate-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="in_review">In Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <Link
            to="/commissions/new"
            className="inline-flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>New Commission</span>
          </Link>
        </div>

        <div className="mb-4">
          <p className="text-slate-400">
            {filteredCommissions.length} commission{filteredCommissions.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {filteredCommissions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredCommissions.map(commission => (
              <CommissionCard key={commission.id} commission={commission} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg mb-4">No commissions found</p>
            <Link
              to="/commissions/new"
              className="inline-flex items-center space-x-2 text-emerald-400 hover:text-emerald-300 font-semibold"
            >
              <Plus className="w-5 h-5" />
              <span>Create your first commission</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
