import React, { useState, useEffect } from 'react';
import { X, Search, Filter, Eye, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCommissions } from '../contexts/CommissionContext';
import { Commission, CommissionStatus, TaskComplexity } from '../types';
import CommissionDetailsModal from './CommissionDetailsModal';
import { supabase } from '../lib/supabase';

interface CommissionSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCommission: (commission: Commission) => void;
  conversationId: string;
}

export default function CommissionSelectorModal({ 
  isOpen, 
  onClose, 
  onSelectCommission,
  conversationId
}: CommissionSelectorModalProps) {
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<CommissionStatus | 'all'>('all');
  const [filterComplexity, setFilterComplexity] = useState<TaskComplexity | 'all'>('all');
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showCommissionDetails, setShowCommissionDetails] = useState(false);
  const [commissionToView, setCommissionToView] = useState<Commission | null>(null);
  const [conversationCommissions, setConversationCommissions] = useState<Commission[]>([]);
  const [isLoadingCommissions, setIsLoadingCommissions] = useState(false);

  // Fetch commissions based on user role
  useEffect(() => {
    const fetchConversationCommissions = async () => {
      if (!user || !conversationId) return;
      
      setIsLoadingCommissions(true);
      try {
        let commissions;
        
        if (user.isAdmin) {
          // Admins can see all commissions from conversation participants
          const { data: participants, error: participantsError } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', conversationId);

          if (participantsError) {
            console.error('Error fetching participants:', participantsError);
            setIsLoadingCommissions(false);
            return;
          }

          const participantIds = participants.map(p => p.user_id);
          
          // Get commissions from all participants
          const { data: commissionsData, error: commissionsError } = await supabase
            .from('commissions')
            .select('*')
            .in('user_id', participantIds)
            .neq('status', 'archived')
            .order('created_at', { ascending: false });

          if (commissionsError) {
            console.error('Error fetching commissions:', commissionsError);
            setIsLoadingCommissions(false);
            return;
          }
          
          commissions = commissionsData;
        } else {
          // Non-admins can only see their own commissions
          const { data: commissionsData, error: commissionsError } = await supabase
            .from('commissions')
            .select('*')
            .eq('user_id', user.id)
            .neq('status', 'archived')
            .order('created_at', { ascending: false });

          if (commissionsError) {
            console.error('Error fetching commissions:', commissionsError);
            setIsLoadingCommissions(false);
            return;
          }
          
          commissions = commissionsData;
        }

        // Transform commissions to match Commission type
        const transformedCommissions: Commission[] = commissions.map((c: any) => ({
          id: c.id,
          userId: c.user_id,
          taskComplexity: c.task_complexity,
          subject: c.subject,
          description: c.description,
          proposedAmount: Number(c.proposed_amount),
          status: c.status,
          referenceNumber: c.reference_number,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
          tags: c.tags || [],
          images: c.images || [],
          rejectionReason: c.rejection_reason,
          progress: c.progress || 0,
          completionFiles: c.completion_files || [],
          completedAt: c.completed_at,
          completedByAdminId: c.completed_by_admin_id,
          completedByAdminName: c.completed_by_admin_name,
          paymentStatus: c.payment_status || 'unpaid',
          stripeProductId: c.stripe_product_id,
          stripePriceId: c.stripe_price_id,
          stripePaymentLinkUrl: c.stripe_payment_link_url,
          paidAt: c.paid_at,
          stripeSessionId: c.stripe_session_id,
          stripeCheckoutSessionId: c.stripe_checkout_session_id,
          paymentAbandonedAt: c.payment_abandoned_at,
          productArchivedAt: c.product_archived_at,
        }));

        setConversationCommissions(transformedCommissions);
      } catch (error) {
        console.error('Error fetching conversation commissions:', error);
      } finally {
        setIsLoadingCommissions(false);
      }
    };

    if (isOpen) {
      fetchConversationCommissions();
    }
  }, [user, conversationId, isOpen]);

  // Filter commissions based on search and filters
  const filteredCommissions = conversationCommissions.filter(commission => {
    const matchesSearch = !searchQuery ||
      commission.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      commission.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      commission.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || commission.status === filterStatus;
    const matchesComplexity = filterComplexity === 'all' || commission.taskComplexity === filterComplexity;
    
    return matchesSearch && matchesStatus && matchesComplexity;
  });

  // Separate commissions for admins (since they can see all participants' commissions)
  const myCommissions = user?.isAdmin 
    ? filteredCommissions.filter(c => c.userId === user.id)
    : filteredCommissions; // Non-admins only see their own commissions
  
  const otherUsersCommissions = user?.isAdmin
    ? filteredCommissions.filter(c => c.userId !== user.id)
    : []; // Non-admins don't see other users' commissions

  const handleCommissionClick = (commission: Commission) => {
    setSelectedCommission(commission);
  };

  const handleViewCommission = (commission: Commission) => {
    setCommissionToView(commission);
    setShowCommissionDetails(true);
  };

  const handleSelectCommission = () => {
    if (selectedCommission) {
      onSelectCommission(selectedCommission);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedCommission(null);
    setSearchQuery('');
    setFilterStatus('all');
    setFilterComplexity('all');
    setShowFilters(false);
    setShowCommissionDetails(false);
    setCommissionToView(null);
    onClose();
  };

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-fade-in">
      <div className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-purple-500/20 animate-scale-in">
        {/* Header */}
        <div className="p-6 border-b border-purple-500/20 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Select Commission to Reference</h2>
            <p className="text-sm text-gray-400 mt-1">
              {user?.isAdmin 
                ? "Admins can reference any commission from conversation participants"
                : "You can only reference your own commissions"
              }
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors hover:scale-110"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-purple-500/20">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by subject, description, or reference number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-800 border border-purple-500/20 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
              />
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>
          </div>

          {/* Filter Dropdown */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-purple-500/20">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as CommissionStatus | 'all')}
                    className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="draft">Draft</option>
                    <option value="submitted">Submitted</option>
                    <option value="in_review">In Review</option>
                    <option value="accepted">Accepted</option>
                    <option value="in_progress">In Progress</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Complexity</label>
                  <select
                    value={filterComplexity}
                    onChange={(e) => setFilterComplexity(e.target.value as TaskComplexity | 'all')}
                    className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Complexities</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                    <option value="extreme">Complex</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Commissions Grid */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          {isLoadingCommissions ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-purple-400 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Loading Commissions...</h3>
            </div>
          ) : myCommissions.length > 0 || otherUsersCommissions.length > 0 ? (
            <div className="space-y-6">
              {/* My Commissions Section (for admins) or All Commissions (for regular users) */}
              {(user?.isAdmin ? myCommissions.length > 0 : myCommissions.length > 0) && (
                <div>
                  {user?.isAdmin && (
                    <h3 className="text-lg font-semibold text-white mb-3 pb-2 border-b border-purple-500/20">
                      My Commissions
                    </h3>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myCommissions.map((commission) => (
                      <div
                        key={commission.id}
                        onClick={() => handleCommissionClick(commission)}
                        className={`p-4 bg-gray-800 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
                          selectedCommission?.id === commission.id
                            ? 'border-purple-500 bg-purple-500/10'
                            : 'border-gray-700 hover:border-purple-500/50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
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
                            <p className="text-purple-400 text-xs font-mono">{commission.referenceNumber}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-purple-400 font-bold text-xl">
                              ${commission.proposedAmount.toFixed(2)}
                            </div>
                            {commission.paymentType && (
                              <div className="text-purple-300 text-xs mt-1">
                                {commission.paymentType === 'full' ? '100% upfront' : '50/50 split'}
                              </div>
                            )}
                          </div>
                        </div>

                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                          {commission.description}
                        </p>

                        {commission.tags && commission.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {commission.tags.slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-1 rounded text-xs font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                            {commission.tags.length > 3 && (
                              <span className="text-purple-400 text-xs font-medium">
                                +{commission.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-400">
                            {new Date(commission.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewCommission(commission);
                              }}
                              className="p-1 text-gray-400 hover:text-white transition-colors"
                              title="View Commission Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {selectedCommission?.id === commission.id && (
                              <Check className="w-4 h-4 text-purple-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Other Users' Commissions Section (admin only) */}
              {user?.isAdmin && otherUsersCommissions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 pb-2 border-b border-purple-500/20">
                    Other Users' Commissions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {otherUsersCommissions.map((commission) => (
                      <div
                        key={commission.id}
                        onClick={() => handleCommissionClick(commission)}
                        className={`p-4 bg-gray-800 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
                          selectedCommission?.id === commission.id
                            ? 'border-purple-500 bg-purple-500/10'
                            : 'border-gray-700 hover:border-purple-500/50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`${statusColors[commission.status]} text-white text-xs px-2.5 py-1 rounded-full font-semibold`}>
                                {statusLabels[commission.status]}
                              </span>
                              <span className={`${complexityColors[commission.taskComplexity]} text-xs px-2.5 py-1 rounded-full capitalize border`}>
                                {complexityLabels[commission.taskComplexity]}
                              </span>
                              <span className="bg-blue-500/20 text-blue-400 text-xs px-2.5 py-1 rounded-full border border-blue-500/30">
                                Other User
                              </span>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1">{commission.subject}</h3>
                            <p className="text-purple-400 text-xs font-mono">{commission.referenceNumber}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-purple-400 font-bold text-xl">
                              ${commission.proposedAmount.toFixed(2)}
                            </div>
                            {commission.paymentType && (
                              <div className="text-purple-300 text-xs mt-1">
                                {commission.paymentType === 'full' ? '100% upfront' : '50/50 split'}
                              </div>
                            )}
                          </div>
                        </div>

                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                          {commission.description}
                        </p>

                        {commission.tags && commission.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {commission.tags.slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-1 rounded text-xs font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                            {commission.tags.length > 3 && (
                              <span className="text-purple-400 text-xs font-medium">
                                +{commission.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-400">
                            {new Date(commission.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewCommission(commission);
                              }}
                              className="p-1 text-gray-400 hover:text-white transition-colors"
                              title="View Commission Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {selectedCommission?.id === commission.id && (
                              <Check className="w-4 h-4 text-purple-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No Commissions Found</h3>
              <p className="text-gray-400">
                {conversationCommissions.length === 0 
                  ? (user?.isAdmin 
                      ? "No commissions found from conversation participants."
                      : "You haven't created any commissions yet."
                    )
                  : "No commissions match your search criteria."
                }
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-purple-500/20 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            {user?.isAdmin ? (
              <>
                {myCommissions.length + otherUsersCommissions.length} commission{(myCommissions.length + otherUsersCommissions.length) !== 1 ? 's' : ''} found
                {myCommissions.length > 0 && otherUsersCommissions.length > 0 && (
                  <span className="text-gray-500 ml-2">
                    ({myCommissions.length} yours, {otherUsersCommissions.length} others)
                  </span>
                )}
              </>
            ) : (
              <>{filteredCommissions.length} commission{filteredCommissions.length !== 1 ? 's' : ''} found</>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSelectCommission}
              disabled={!selectedCommission}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              <Check className="w-4 h-4" />
              <span>Select Commission</span>
            </button>
          </div>
        </div>
      </div>

      {/* Commission Details Modal */}
      <CommissionDetailsModal
        isOpen={showCommissionDetails}
        onClose={() => {
          setShowCommissionDetails(false);
          setCommissionToView(null);
        }}
        commission={commissionToView}
        showPaymentButtons={false}
      />
    </div>
  );
}
