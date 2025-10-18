import { Link } from 'react-router-dom';
import { Plus, Briefcase, Archive, X, Edit, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCommissions } from '../contexts/CommissionContext';
import CommissionCard from '../components/CommissionCard';
import { useState } from 'react';
import { Commission } from '../types';

export default function MyCommissions() {
  const { user } = useAuth();
  const { getUserCommissions, updateCommission } = useCommissions();
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
  const [isRevising, setIsRevising] = useState(false);
  const [reviseData, setReviseData] = useState({
    subject: '',
    description: '',
    proposedAmount: 0,
    taskComplexity: '' as any,
  });

  const allCommissions = user ? getUserCommissions(user.id) : [];
  const myCommissions = allCommissions.filter(c => c.status !== 'archived');
  const archivedCommissions = allCommissions.filter(c => c.status === 'archived');

  const handleArchive = async (commissionId: string) => {
    await updateCommission(commissionId, { status: 'archived' });
  };

  const handleReviseClick = (commission: Commission) => {
    setSelectedCommission(commission);
    setReviseData({
      subject: commission.subject,
      description: commission.description,
      proposedAmount: commission.proposedAmount,
      taskComplexity: commission.taskComplexity,
    });
    setIsRevising(true);
  };

  const handleReviseSubmit = async () => {
    if (selectedCommission) {
      await updateCommission(selectedCommission.id, {
        ...reviseData,
        status: 'submitted',
        rejectionReason: undefined,
      });
      setIsRevising(false);
      setSelectedCommission(null);
    }
  };

  const handleViewDetails = (commission: Commission) => {
    setSelectedCommission(commission);
  };

  const handleCloseModal = () => {
    setSelectedCommission(null);
    setIsRevising(false);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="bg-gradient-to-r from-emerald-500 to-blue-500 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3 mb-2">
            <Briefcase className="w-8 h-8 text-white" />
            <h1 className="text-4xl font-bold text-white">My Commissions</h1>
          </div>
          <p className="text-xl text-white/90">
            Manage your commission requests and track their status
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-white">
            Your Commissions ({myCommissions.length})
          </h2>

          <Link
            to="/commissions/new"
            className="inline-flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>New Commission</span>
          </Link>
        </div>

        {myCommissions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myCommissions.map(commission => (
              <div key={commission.id} className="relative">
                <div onClick={() => handleViewDetails(commission)} className="cursor-pointer">
                  <CommissionCard commission={commission} showActions />
                </div>
                {commission.status !== 'draft' && commission.status !== 'archived' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleArchive(commission.id);
                    }}
                    className="absolute top-4 right-4 bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-lg transition-colors"
                    title="Archive"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-slate-800 rounded-xl">
            <Briefcase className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Commissions Yet</h3>
            <p className="text-slate-400 mb-6">
              You haven't submitted any commission requests yet
            </p>
            <Link
              to="/commissions/new"
              className="inline-flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Create Your First Commission</span>
            </Link>
          </div>
        )}

        {archivedCommissions.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-white mb-6">Archived ({archivedCommissions.length})</h2>
            <div className="space-y-4">
              {archivedCommissions.map(commission => (
                <div
                  key={commission.id}
                  className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
                  onClick={() => handleViewDetails(commission)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="bg-slate-600 text-white text-xs px-2.5 py-1 rounded-full font-semibold">
                          Archived
                        </span>
                        <span className="text-slate-400 font-mono text-xs">{commission.referenceNumber}</span>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-1">{commission.subject}</h3>
                      <p className="text-slate-400 text-sm line-clamp-1">{commission.description}</p>
                    </div>
                    <div className="text-emerald-400 font-bold text-xl">
                      ${commission.proposedAmount.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedCommission && !isRevising && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4" onClick={handleCloseModal}>
          <div className="bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Commission Details</h2>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center space-x-3 flex-wrap">
                <span className={`${
                  selectedCommission.status === 'draft' ? 'bg-gray-600' :
                  selectedCommission.status === 'submitted' ? 'bg-blue-600' :
                  selectedCommission.status === 'in_review' ? 'bg-yellow-600' :
                  selectedCommission.status === 'accepted' ? 'bg-emerald-600' :
                  selectedCommission.status === 'approved' ? 'bg-emerald-600' :
                  selectedCommission.status === 'rejected' ? 'bg-red-600' :
                  selectedCommission.status === 'archived' ? 'bg-slate-600' :
                  'bg-purple-600'
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

              {selectedCommission.tags && selectedCommission.tags.length > 0 && (
                <div>
                  <p className="text-slate-400 text-sm mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedCommission.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-sm font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-slate-400 text-sm mb-1">Proposed Amount</p>
                <p className="text-emerald-400 text-3xl font-bold">${selectedCommission.proposedAmount.toFixed(2)}</p>
              </div>

              {selectedCommission.rejectionReason && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                    <div>
                      <p className="text-red-300 font-semibold mb-1">Rejection Reason</p>
                      <p className="text-red-200">{selectedCommission.rejectionReason}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedCommission.status === 'rejected' && (
                <button
                  onClick={() => handleReviseClick(selectedCommission)}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                >
                  <Edit className="w-5 h-5" />
                  <span>Revise and Resubmit</span>
                </button>
              )}

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

      {isRevising && selectedCommission && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4" onClick={handleCloseModal}>
          <div className="bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Revise Commission</h2>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {selectedCommission.rejectionReason && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                    <div>
                      <p className="text-red-300 font-semibold mb-1">Previous Rejection Reason</p>
                      <p className="text-red-200">{selectedCommission.rejectionReason}</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-400 text-sm mb-2">Task Complexity</label>
                <select
                  value={reviseData.taskComplexity}
                  onChange={(e) => setReviseData({ ...reviseData, taskComplexity: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="extreme">Extreme</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-2">Subject</label>
                <input
                  type="text"
                  value={reviseData.subject}
                  onChange={(e) => setReviseData({ ...reviseData, subject: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-2">Description</label>
                <textarea
                  value={reviseData.description}
                  onChange={(e) => setReviseData({ ...reviseData, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[200px]"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-2">Proposed Amount ($)</label>
                <input
                  type="number"
                  value={reviseData.proposedAmount}
                  onChange={(e) => setReviseData({ ...reviseData, proposedAmount: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReviseSubmit}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Resubmit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
