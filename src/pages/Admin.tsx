import { useState, useEffect, useRef } from 'react';
import { Shield, RefreshCw, X, TrendingUp, Clock, CheckCircle, XCircle, Search, Filter, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCommissions } from '../contexts/CommissionContext';
import { Commission, CommissionStatus } from '../types';

export default function Admin() {
  const { updateCommission } = useCommissions();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<CommissionStatus | 'all'>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const autoUpdatedCommissions = useRef<Set<string>>(new Set());

  useEffect(() => {
    loadAllCommissions();
  }, []);

  const loadAllCommissions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('commissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: Commission[] = (data || []).map(item => ({
        id: item.id,
        userId: item.user_id,
        taskComplexity: item.task_complexity,
        subject: item.subject,
        description: item.description,
        proposedAmount: Number(item.proposed_amount),
        status: item.status,
        referenceNumber: item.reference_number,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        tags: item.tags || [],
        rejectionReason: item.rejection_reason,
      }));

      setCommissions(mapped);
    } catch (error) {
      console.error('Error loading commissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCommission &&
        selectedCommission.status !== 'in_review' &&
        !autoUpdatedCommissions.current.has(selectedCommission.id)) {
      autoUpdatedCommissions.current.add(selectedCommission.id);
      handleStatusChange(selectedCommission.id, 'in_review');
    }
  }, [selectedCommission?.id]);

  const handleStatusChange = async (commissionId: string, newStatus: CommissionStatus, reason?: string) => {
    setIsUpdating(commissionId);
    try {
      const updates: Partial<Commission> = { status: newStatus };
      if (reason) {
        updates.rejectionReason = reason;
      }
      await updateCommission(commissionId, updates);
      await loadAllCommissions();

      if (selectedCommission && selectedCommission.id === commissionId) {
        setSelectedCommission({ ...selectedCommission, status: newStatus, rejectionReason: reason });
      }
    } catch (error) {
      console.error('Error updating commission status:', error);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleAccept = async () => {
    if (selectedCommission) {
      await handleStatusChange(selectedCommission.id, 'accepted');
    }
  };

  const handleReject = () => {
    setShowRejectDialog(true);
  };

  const confirmReject = async () => {
    if (selectedCommission && rejectionReason.trim()) {
      await handleStatusChange(selectedCommission.id, 'rejected', rejectionReason);
      setShowRejectDialog(false);
      setRejectionReason('');
    }
  };

  const cancelReject = () => {
    setShowRejectDialog(false);
    setRejectionReason('');
  };

  const handleCloseModal = () => {
    setSelectedCommission(null);
  };

  const allTags = Array.from(new Set(commissions.flatMap(c => c.tags || [])));

  const filteredCommissions = commissions.filter(c => {
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchesSearch = !searchQuery ||
      c.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTags = selectedTags.length === 0 ||
      selectedTags.some(tag => c.tags?.includes(tag));
    const matchesHidden = showHidden || c.status !== 'archived';
    return matchesStatus && matchesSearch && matchesTags && matchesHidden;
  });

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setFilterStatus('all');
    setSearchQuery('');
    setSelectedTags([]);
  };

  const hasActiveFilters = filterStatus !== 'all' || searchQuery !== '' || selectedTags.length > 0;

  const stats = {
    total: commissions.filter(c => c.status !== 'archived').length,
    submitted: commissions.filter(c => c.status === 'submitted').length,
    inReview: commissions.filter(c => c.status === 'in_review').length,
    accepted: commissions.filter(c => c.status === 'accepted').length,
    approved: commissions.filter(c => c.status === 'approved').length,
    rejected: commissions.filter(c => c.status === 'rejected').length,
    completed: commissions.filter(c => c.status === 'completed').length,
  };

  const statusOptions: { value: CommissionStatus; label: string }[] = [
    { value: 'draft', label: 'Draft' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'in_review', label: 'In Review' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'completed', label: 'Completed' },
    { value: 'archived', label: 'Archived' },
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="bg-gradient-to-r from-emerald-600 to-blue-600 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3 mb-2">
            <Shield className="w-8 h-8 text-white" />
            <h1 className="text-4xl font-bold text-white">Admin Panel</h1>
          </div>
          <p className="text-xl text-white/90">
            Manage all commission requests across the platform
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-5 border border-slate-600">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <span className="text-2xl font-bold text-white">{stats.total}</span>
            </div>
            <p className="text-slate-400 text-sm font-medium">Total</p>
          </div>

          <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/40 rounded-xl p-5 border border-blue-700/50">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <span className="text-2xl font-bold text-white">{stats.submitted}</span>
            </div>
            <p className="text-blue-300 text-sm font-medium">Submitted</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-900/40 to-yellow-800/40 rounded-xl p-5 border border-yellow-700/50">
            <div className="flex items-center justify-between mb-2">
              <RefreshCw className="w-5 h-5 text-yellow-400" />
              <span className="text-2xl font-bold text-white">{stats.inReview}</span>
            </div>
            <p className="text-yellow-300 text-sm font-medium">In Review</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/40 rounded-xl p-5 border border-emerald-700/50">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span className="text-2xl font-bold text-white">{stats.accepted}</span>
            </div>
            <p className="text-emerald-300 text-sm font-medium">Accepted</p>
          </div>

          <div className="bg-gradient-to-br from-red-900/40 to-red-800/40 rounded-xl p-5 border border-red-700/50">
            <div className="flex items-center justify-between mb-2">
              <XCircle className="w-5 h-5 text-red-400" />
              <span className="text-2xl font-bold text-white">{stats.rejected}</span>
            </div>
            <p className="text-red-300 text-sm font-medium">Rejected</p>
          </div>

          <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 rounded-xl p-5 border border-purple-700/50">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-5 h-5 text-purple-400" />
              <span className="text-2xl font-bold text-white">{stats.completed}</span>
            </div>
            <p className="text-purple-300 text-sm font-medium">Completed</p>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 mb-6 space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowHidden(!showHidden)}
              className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                showHidden
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {showHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span>{showHidden ? 'Hide Archived' : 'Show Archived'}</span>
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by subject, description, or reference number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white pl-10 pr-10 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as CommissionStatus | 'all')}
                className="bg-slate-900 border border-slate-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="in_review">In Review</option>
                <option value="accepted">Accepted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {allTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-400 text-sm">Tags:</span>
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      selectedTags.includes(tag)
                        ? 'bg-emerald-500 text-white border-2 border-emerald-400'
                        : 'bg-slate-900 text-slate-300 border-2 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center space-x-1 text-slate-400 hover:text-white text-sm font-medium transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Clear Filters</span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-between text-sm">
            <p className="text-slate-400">
              {filteredCommissions.length} commission{filteredCommissions.length !== 1 ? 's' : ''} found
              {hasActiveFilters && <span className="ml-2 text-emerald-400">(filtered)</span>}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 bg-slate-800 rounded-xl">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
            <p className="text-slate-400">Loading commissions...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCommissions.length > 0 ? (
              filteredCommissions.map((commission) => (
                <div
                  key={commission.id}
                  className="bg-slate-800 rounded-xl p-6 hover:bg-slate-700/50 transition-all cursor-pointer border border-slate-700 hover:border-emerald-500/50"
                  onClick={() => setSelectedCommission(commission)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2 flex-wrap">
                        <span className={`${
                          commission.status === 'draft' ? 'bg-gray-600' :
                          commission.status === 'submitted' ? 'bg-blue-600' :
                          commission.status === 'in_review' ? 'bg-yellow-600' :
                          commission.status === 'accepted' ? 'bg-emerald-600' :
                          commission.status === 'approved' ? 'bg-emerald-600' :
                          commission.status === 'rejected' ? 'bg-red-600' :
                          commission.status === 'archived' ? 'bg-slate-600' :
                          'bg-purple-600'
                        } text-white text-xs px-3 py-1 rounded-full font-semibold capitalize`}>
                          {commission.status.replace('_', ' ')}
                        </span>
                        <span className={`${
                          commission.taskComplexity === 'easy' ? 'bg-green-900/30 text-green-400 border-green-500/30' :
                          commission.taskComplexity === 'medium' ? 'bg-blue-900/30 text-blue-400 border-blue-500/30' :
                          commission.taskComplexity === 'hard' ? 'bg-orange-900/30 text-orange-400 border-orange-500/30' :
                          'bg-red-900/30 text-red-400 border-red-500/30'
                        } text-xs px-3 py-1 rounded-full capitalize border`}>
                          {commission.taskComplexity}
                        </span>
                        <span className="text-slate-400 font-mono text-xs">
                          {commission.referenceNumber}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-white mb-2">{commission.subject}</h3>
                      <p className="text-slate-400 text-sm line-clamp-2 mb-3">{commission.description}</p>

                      {commission.tags && commission.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {commission.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-1 rounded text-xs font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center space-x-4 text-xs text-slate-400">
                        <span>Created: {new Date(commission.createdAt).toLocaleDateString()}</span>
                        <span>Updated: {new Date(commission.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-3">
                      <div className="text-emerald-400 font-bold text-2xl whitespace-nowrap">
                        ${commission.proposedAmount.toFixed(2)}
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <select
                          value={commission.status}
                          onChange={(e) => handleStatusChange(commission.id, e.target.value as CommissionStatus)}
                          disabled={isUpdating === commission.id}
                          className="bg-slate-700 border border-slate-600 text-white text-sm px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                        >
                          {statusOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-slate-800 rounded-xl">
                <Shield className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">No commissions found</p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="mt-4 text-emerald-400 hover:text-emerald-300 font-semibold"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {selectedCommission && !showRejectDialog && (
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
                <div>
                  <p className="text-slate-400 text-sm mb-1">Rejection Reason</p>
                  <p className="text-red-300 bg-red-900/20 border border-red-500/30 p-3 rounded-lg">{selectedCommission.rejectionReason}</p>
                </div>
              )}

              <div>
                <p className="text-slate-400 text-sm mb-3">Actions</p>
                <div className="flex items-center space-x-3">
                  {selectedCommission.status === 'in_review' && (
                    <>
                      <button
                        onClick={handleAccept}
                        disabled={isUpdating === selectedCommission.id}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-semibold transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={handleReject}
                        disabled={isUpdating === selectedCommission.id}
                        className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-semibold transition-colors"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {selectedCommission.status !== 'in_review' && (
                    <select
                      value={selectedCommission.status}
                      onChange={(e) => handleStatusChange(selectedCommission.id, e.target.value as CommissionStatus)}
                      disabled={isUpdating === selectedCommission.id}
                      className="bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 flex-1"
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                  {isUpdating === selectedCommission.id && (
                    <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
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

      {showRejectDialog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4" onClick={cancelReject}>
          <div className="bg-slate-800 rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-4">Reject Commission</h3>
            <p className="text-slate-400 text-sm mb-4">Please provide a reason for rejecting this commission:</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-slate-400 min-h-[120px]"
            />
            <div className="flex items-center space-x-3 mt-6">
              <button
                onClick={cancelReject}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2.5 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={!rejectionReason.trim()}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg font-semibold transition-colors"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
