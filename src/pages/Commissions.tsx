import { Link, useNavigate } from 'react-router-dom';
import { Plus, Filter, X } from 'lucide-react';
import { useCommissions } from '../contexts/CommissionContext';
import { useAuth } from '../contexts/AuthContext';
import CommissionCard from '../components/CommissionCard';
import { useState, useEffect } from 'react';
import { Commission, CommissionStatus } from '../types';

export default function Commissions() {
  const { commissions, isLoading, loadUserCommissions } = useCommissions();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState<CommissionStatus | 'all'>('all');
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadUserCommissions();
  }, [isAuthenticated, navigate]);

  const filteredCommissions = filterStatus === 'all'
    ? commissions
    : commissions.filter(c => c.status === filterStatus);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="bg-gradient-to-r from-emerald-500 to-blue-500 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-bold text-white mb-4">My Commissions</h1>
          <p className="text-xl text-white/90">
            View and manage your commission requests
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

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">Loading commissions...</p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-slate-400">
                {filteredCommissions.length} commission{filteredCommissions.length !== 1 ? 's' : ''} found
              </p>
            </div>

            {filteredCommissions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredCommissions.map(commission => (
                  <div key={commission.id} onClick={() => setSelectedCommission(commission)} className="cursor-pointer">
                    <CommissionCard commission={commission} />
                  </div>
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
          </>
        )}
      </div>

      {selectedCommission && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4" onClick={() => setSelectedCommission(null)}>
          <div className="bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Commission Details</h2>
              <button
                onClick={() => setSelectedCommission(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center space-x-3">
                <span className={`${
                  selectedCommission.status === 'draft' ? 'bg-gray-600' :
                  selectedCommission.status === 'submitted' ? 'bg-blue-600' :
                  selectedCommission.status === 'in_review' ? 'bg-yellow-600' :
                  selectedCommission.status === 'approved' ? 'bg-emerald-600' :
                  selectedCommission.status === 'rejected' ? 'bg-red-600' :
                  'bg-slate-600'
                } text-white text-sm px-3 py-1.5 rounded-full font-semibold capitalize`}>
                  {selectedCommission.status.replace('_', ' ')}
                </span>
                <span className={`${
                  selectedCommission.taskComplexity === 'easy' ? 'bg-green-900/30 text-green-400 border-green-500/30' :
                  selectedCommission.taskComplexity === 'medium' ? 'bg-blue-900/30 text-blue-400 border-blue-500/30' :
                  selectedCommission.taskComplexity === 'hard' ? 'bg-orange-900/30 text-orange-400 border-orange-500/30' :
                  'bg-red-900/30 text-red-400 border-red-500/30'
                } text-sm px-3 py-1.5 rounded-full capitalize border`}>
                  {selectedCommission.taskComplexity}
                </span>
              </div>

              <div>
                <p className="text-slate-400 text-sm mb-1">Reference Number</p>
                <p className="text-white font-mono text-lg">{selectedCommission.referenceNumber}</p>
              </div>

              <div>
                <p className="text-slate-400 text-sm mb-1">Subject</p>
                <p className="text-white text-xl font-semibold">{selectedCommission.subject}</p>
              </div>

              <div>
                <p className="text-slate-400 text-sm mb-1">Description</p>
                <p className="text-white leading-relaxed whitespace-pre-wrap">{selectedCommission.description}</p>
              </div>

              <div>
                <p className="text-slate-400 text-sm mb-1">Proposed Amount</p>
                <p className="text-emerald-400 text-3xl font-bold">${selectedCommission.proposedAmount.toFixed(2)}</p>
              </div>

              <div className="flex items-center justify-between text-sm text-slate-400 pt-4 border-t border-slate-700">
                <div>
                  <span className="block">Created</span>
                  <span className="text-white">{new Date(selectedCommission.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="block">Updated</span>
                  <span className="text-white">{new Date(selectedCommission.updatedAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
