import { useState } from 'react';
import { Shield, RefreshCw } from 'lucide-react';
import { useCommissions } from '../contexts/CommissionContext';
import { CommissionStatus } from '../types';

export default function Admin() {
  const { commissions, updateCommission } = useCommissions();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const handleStatusChange = async (commissionId: string, newStatus: CommissionStatus) => {
    setIsUpdating(commissionId);
    await updateCommission(commissionId, { status: newStatus });
    setIsUpdating(null);
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
                  <tr key={commission.id} className="hover:bg-slate-700/50 transition-colors">
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
                    <td className="px-6 py-4">
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
    </div>
  );
}
