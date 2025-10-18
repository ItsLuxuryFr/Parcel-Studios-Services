import { useState, useEffect } from 'react';
import { Shield, RefreshCw, X } from 'lucide-react';
import { useCommissions } from '../contexts/CommissionContext';
import { Commission, CommissionStatus } from '../types';

export default function Admin() {
  const { commissions, updateCommission } = useCommissions();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);

  useEffect(() => {
    if (selectedCommission && selectedCommission.status !== 'in_review') {
      handleStatusChange(selectedCommission.id, 'in_review');
    }
  }, [selectedCommission]);

  const handleStatusChange = async (commissionId: string, newStatus: CommissionStatus) => {
    setIsUpdating(commissionId);
    await updateCommission(commissionId, { status: newStatus });
    setIsUpdating(null);

    if (selectedCommission && selectedCommission.id === commissionId) {
      setSelectedCommission({ ...selectedCommission, status: newStatus });
    }
  };

  const statusOptions: { value: CommissionStatus; label: string }[] = [
    { value: 'draft', label: 'Draft' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'in_review', label: 'In Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'completed', label: 'Completed' },
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3 mb-2">
            <Shield className="w-8 h-8 text-white" />
            <h1 className="text-4xl font-bold text-white">Admin Panel</h1>
          </div>
          <p className="text-xl text-white/90">
            Manage all commission requests and update their status
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-8">
          <p className="text-yellow-400 text-sm">
            <strong>Note:</strong> This is a mock admin panel for testing purposes only. In production, this would be
            secured with proper authentication and authorization.
          </p>
        </div>

        <div className="bg-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Reference</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Subject</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Complexity</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {commissions.map((commission) => (
                  <tr
                    key={commission.id}
                    className="hover:bg-slate-700/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedCommission(commission)}
                  >
                    <td className="px-6 py-4">
                      <span className="text-slate-300 font-mono text-sm">
                        {commission.referenceNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white font-medium">{commission.subject}</div>
                      <div className="text-slate-400 text-sm truncate max-w-xs">
                        {commission.description}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-300 capitalize text-sm">
                        {commission.taskComplexity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-emerald-400 font-semibold">
                        ${commission.proposedAmount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-600 text-white text-xs px-3 py-1 rounded-full capitalize">
                        {commission.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center space-x-2">
                        <select
                          value={commission.status}
                          onChange={(e) => handleStatusChange(commission.id, e.target.value as CommissionStatus)}
                          disabled={isUpdating === commission.id}
                          className="bg-slate-700 border border-slate-600 text-white text-sm px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                        >
                          {statusOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        {isUpdating === commission.id && (
                          <RefreshCw className="w-4 h-4 text-purple-400 animate-spin" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {commissions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-400">No commissions to manage</p>
            </div>
          )}
        </div>
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

              <div>
                <p className="text-slate-400 text-sm mb-3">Update Status</p>
                <div className="flex items-center space-x-2">
                  <select
                    value={selectedCommission.status}
                    onChange={(e) => handleStatusChange(selectedCommission.id, e.target.value as CommissionStatus)}
                    disabled={isUpdating === selectedCommission.id}
                    className="bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 flex-1"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {isUpdating === selectedCommission.id && (
                    <RefreshCw className="w-5 h-5 text-purple-400 animate-spin" />
                  )}
                </div>
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
