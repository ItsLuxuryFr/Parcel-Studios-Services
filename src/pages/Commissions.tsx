import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Plus, Filter, X, Search, Archive, Trash2, Briefcase, Download, File, CheckCircle, Edit, AlertCircle, Clock } from 'lucide-react';
import { useCommissions } from '../contexts/CommissionContext';
import { useAuth } from '../contexts/AuthContext';
import CommissionCard from '../components/CommissionCard';
import DraftEditModal from '../components/DraftEditModal';
import { useState, useEffect } from 'react';
import { Commission, CommissionStatus } from '../types';

export default function Commissions() {
  const { commissions, isLoading, loadUserCommissions, updateCommission, deleteCommission, downloadFile } = useCommissions();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [filterStatus, setFilterStatus] = useState<CommissionStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
  const [isRevising, setIsRevising] = useState(false);
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [draftToEdit, setDraftToEdit] = useState<Commission | null>(null);
  const [reviseData, setReviseData] = useState({
    subject: '',
    description: '',
    proposedAmount: 0,
    taskComplexity: '' as any,
  });

  const allTags = Array.from(new Set(commissions.flatMap(c => c.tags || [])));

  // Load commissions on mount and when returning from payment confirmation
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadUserCommissions();
  }, [isAuthenticated, navigate, location.key]); // Add location.key to refresh when returning from payment

  // Also refresh when returning from payment-confirmation route
  useEffect(() => {
    const isReturningFromPayment = location.pathname === '/commissions' && 
                                     (document.referrer.includes('/payment-confirmation') || 
                                      document.referrer.includes('/payment'));
    if (isReturningFromPayment && isAuthenticated) {
      console.log('[DEBUG] Returning from payment page, refreshing commissions');
      loadUserCommissions();
    }
  }, [location.pathname, isAuthenticated, loadUserCommissions]);

  const handleArchive = async (commissionId: string) => {
    try {
      await updateCommission(commissionId, { status: 'archived' });
      // Real-time subscription will automatically update the UI
    } catch (error) {
      console.error('Error archiving commission:', error);
    }
  };

  const handleDelete = async (commissionId: string) => {
    if (window.confirm('Are you sure you want to permanently delete this archived commission? This action cannot be undone.')) {
      try {
        await deleteCommission(commissionId);
        // Real-time subscription will automatically update the UI
      } catch (error) {
        console.error('Error deleting commission:', error);
      }
    }
  };

  const filteredCommissions = commissions.filter(c => {
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchesSearch = !searchQuery ||
      c.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTags = selectedTags.length === 0 ||
      selectedTags.some(tag => c.tags?.includes(tag));
    return matchesStatus && matchesSearch && matchesTags;
  });

  // Separate archived and non-archived commissions
  const activeCommissions = filteredCommissions.filter(c => c.status !== 'archived');
  const archivedCommissions = filteredCommissions.filter(c => c.status === 'archived');

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

  const handleDownloadFile = async (fileUrl: string, fileName: string) => {
    if (!selectedCommission) return;
    try {
      await downloadFile(fileUrl, fileName, selectedCommission);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Unable to download file: ' + (error as Error).message);
    }
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

  const handleCloseModal = () => {
    setSelectedCommission(null);
    setIsRevising(false);
  };

  const handleEditDraft = (commission: Commission) => {
    setDraftToEdit(commission);
    setIsEditingDraft(true);
  };

  const handleCloseDraftEdit = () => {
    setIsEditingDraft(false);
    setDraftToEdit(null);
  };

  const hasActiveFilters = filterStatus !== 'all' || searchQuery !== '' || selectedTags.length > 0;

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-28">
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-transparent to-purple-800/20 animate-gradient-shift" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(168, 85, 247, 0.25) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(147, 51, 234, 0.25) 0%, transparent 50%)',
        }} />
        
        {/* Floating Orbs */}
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-brown-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center space-y-6 animate-fade-in">
            <div className="inline-block">
              <div className="flex items-center space-x-2 glass px-4 py-2 rounded-full mb-4 animate-glow">
                <Briefcase className="w-4 h-4 text-purple-400 fill-purple-400 animate-pulse" />
                <span className="text-sm text-purple-200 font-medium">Commission Management</span>
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
              <span className="text-white">My</span>
              <span className="block mt-2 text-gradient-hero animate-gradient-text">
                Commissions
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              View and manage your commission requests with ease
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                <input
                  type="text"
                  placeholder="Search commissions by subject, description, or reference..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-10 pr-10 py-2.5 focus:ring-purple-500/20 focus:border-purple-500/50"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-300 transition-colors hover:scale-110"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <Link
              to="/commissions/new"
              className="btn-primary inline-flex items-center space-x-2 glow-purple hover:scale-105 transition-all duration-300 whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              <span>New Commission</span>
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-purple-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as CommissionStatus | 'all')}
                className="input-field px-4 py-2 text-sm focus:ring-purple-500/20 focus:border-purple-500/50"
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

            {allTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-purple-300 text-sm">Tags:</span>
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 ${
                      selectedTags.includes(tag)
                        ? 'bg-purple-500 text-white border-2 border-purple-400 shadow-lg shadow-purple-500/30'
                        : 'glass text-purple-300 border-2 border-purple-500/30 hover:border-purple-400 hover:bg-purple-500/10'
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
                className="inline-flex items-center space-x-1 text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors hover:scale-105"
              >
                <X className="w-4 h-4" />
                <span>Clear Filters</span>
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
            <p className="text-purple-300 text-lg mt-4">Loading commissions...</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-purple-300">
                {activeCommissions.length} active commission{activeCommissions.length !== 1 ? 's' : ''}
                {archivedCommissions.length > 0 && (
                  <span className="ml-2">
                    • {archivedCommissions.length} archived
                  </span>
                )}
                {hasActiveFilters && <span className="ml-2 text-purple-400">(filtered)</span>}
              </p>
            </div>

            {activeCommissions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {activeCommissions.map((commission, index) => (
                  <div 
                    key={commission.id} 
                    onClick={() => setSelectedCommission(commission)} 
                    className="cursor-pointer animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CommissionCard commission={commission} onArchive={handleArchive} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 mb-8">
                <div className="inline-block mb-4">
                  <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
                    <Briefcase className="w-8 h-8 text-purple-400" />
                  </div>
                </div>
                <p className="text-purple-300 text-lg mb-4">No active commissions found</p>
                <Link
                  to="/commissions/new"
                  className="btn-primary inline-flex items-center space-x-2 glow-purple hover:scale-105 transition-all duration-300"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create your first commission</span>
                </Link>
              </div>
            )}

            {archivedCommissions.length > 0 && (
              <div className="mt-12">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                  <Archive className="w-5 h-5 text-purple-400" />
                  <span>Archived Commissions</span>
                </h3>
                <div className="space-y-3">
                  {archivedCommissions.map((commission, index) => (
                    <div
                      key={commission.id}
                      className="glass-dark rounded-lg p-4 hover:bg-purple-500/5 transition-all duration-300 border border-purple-500/20 hover:border-purple-500/30 animate-fade-in-up"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex items-center justify-between">
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => setSelectedCommission(commission)}
                        >
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="bg-purple-600/20 text-purple-300 text-xs px-2 py-1 rounded-full font-semibold border border-purple-500/30">
                              Archived
                            </span>
                            <span className="text-purple-400 font-mono text-xs">
                              {commission.referenceNumber}
                            </span>
                          </div>
                          <h4 className="text-white font-semibold mb-1 hover:text-purple-300 transition-colors">{commission.subject}</h4>
                          <p className="text-gray-400 text-sm line-clamp-1">{commission.description}</p>
                        </div>
                        <div className="flex items-center space-x-4 ml-4">
                          <div className="text-right">
                            <div className="text-purple-400 font-bold text-lg">
                              ${commission.proposedAmount.toFixed(2)}
                            </div>
                            <div className="text-purple-300 text-xs">
                              {new Date(commission.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(commission.id);
                            }}
                            className="text-red-400 hover:text-red-300 transition-all duration-300 p-2 hover:bg-red-900/20 rounded-lg hover:scale-110"
                            title="Delete permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {selectedCommission && !isRevising && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-fade-in" onClick={handleCloseModal}>
          <div className="glass-dark rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-purple-500/20 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 glass-dark border-b border-purple-500/20 px-6 py-4 flex justify-between items-center rounded-t-xl">
              <h2 className="text-2xl font-bold text-white">Commission Details</h2>
              <button
                onClick={handleCloseModal}
                className="text-purple-400 hover:text-purple-300 transition-colors hover:scale-110"
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
                  selectedCommission.status === 'accepted' ? 'bg-emerald-600' :
                  selectedCommission.status === 'in_progress' ? 'bg-blue-600' :
                  selectedCommission.status === 'approved' ? 'bg-purple-600' :
                  selectedCommission.status === 'rejected' ? 'bg-red-600' :
                  'bg-purple-600'
                } text-white text-sm px-3 py-1.5 rounded-full font-semibold capitalize shadow-lg`}>
                  {selectedCommission.status.replace('_', ' ')}
                </span>
                <span className={`${
                  selectedCommission.taskComplexity === 'easy' ? 'bg-green-900/30 text-green-400 border-green-500/30' :
                  selectedCommission.taskComplexity === 'medium' ? 'bg-blue-900/30 text-blue-400 border-blue-500/30' :
                  selectedCommission.taskComplexity === 'hard' ? 'bg-purple-900/30 text-purple-400 border-purple-500/30' :
                  'bg-red-900/30 text-red-400 border-red-500/30'
                } text-sm px-3 py-1.5 rounded-full capitalize border`}>
                  {selectedCommission.taskComplexity}
                </span>
              </div>

              {/* Time Remaining for Draft Commissions */}
              {selectedCommission.status === 'draft' && (() => {
                const now = new Date();
                const updated = new Date(selectedCommission.updatedAt);
                const sevenDaysFromUpdate = new Date(updated.getTime() + 7 * 24 * 60 * 60 * 1000);
                const timeRemaining = sevenDaysFromUpdate.getTime() - now.getTime();
                
                if (timeRemaining > 0) {
                  const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
                  const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                  const timeString = days > 0 ? `${days} day${days !== 1 ? 's' : ''} ${hours} hour${hours !== 1 ? 's' : ''}` : `${hours} hour${hours !== 1 ? 's' : ''}`;
                  
                  return (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-yellow-400" />
                        <div>
                          <p className="text-yellow-300 font-semibold">Auto-delete Warning</p>
                          <p className="text-yellow-200 text-sm">This draft will be automatically deleted in: {timeString}</p>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              <div>
                <p className="text-purple-300 text-sm mb-1">Reference Number</p>
                <p className="text-white font-mono text-lg">{selectedCommission.referenceNumber}</p>
              </div>

              <div>
                <p className="text-purple-300 text-sm mb-1">Subject</p>
                <p className="text-white text-xl font-semibold">{selectedCommission.subject}</p>
              </div>

              <div>
                <p className="text-purple-300 text-sm mb-1">Description</p>
                <p className="text-white leading-relaxed whitespace-pre-wrap">{selectedCommission.description}</p>
              </div>

              {selectedCommission.tags && selectedCommission.tags.length > 0 && (
                <div>
                  <p className="text-purple-300 text-sm mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedCommission.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-purple-500/30 transition-colors"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Progress Section - Show for in_progress and completed commissions */}
              {(selectedCommission.status === 'in_progress' || selectedCommission.status === 'completed') && (
                <div>
                  <p className="text-purple-300 text-sm mb-3">Progress</p>
                  <div className="space-y-4">
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">
                          {selectedCommission.status === 'completed' ? 'Project Completed' : 'Project in Progress'}
                        </span>
                        <span className="text-purple-400 font-bold text-lg">
                          {selectedCommission.progress || 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all duration-300 ${
                            selectedCommission.status === 'completed' 
                              ? 'bg-gradient-to-r from-green-500 to-green-600' 
                              : 'bg-gradient-to-r from-purple-500 to-purple-600'
                          }`}
                          style={{ width: `${selectedCommission.progress || 0}%` }}
                        />
                      </div>
                      {selectedCommission.status === 'completed' && selectedCommission.completedAt && (
                        <div className="space-y-1">
                          <p className="text-green-400 text-sm">
                            Completed: {new Date(selectedCommission.completedAt).toLocaleString()}
                          </p>
                          {selectedCommission.completedByAdminName && (
                            <p className="text-green-300 text-sm">
                              Completed by: {selectedCommission.completedByAdminName}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Completion Files - Show for completed commissions */}
                    {selectedCommission.status === 'completed' && selectedCommission.completionFiles && selectedCommission.completionFiles.length > 0 && (
                      <div>
                        <p className="text-purple-300 text-sm mb-3">Completion Files</p>
                        {selectedCommission.paymentStatus === 'completed' ? (
                          <div className="space-y-2">
                            {selectedCommission.completionFiles.map((fileUrl, index) => {
                              const fileName = fileUrl.split('/').pop() || `file-${index + 1}`;
                              return (
                                <div key={index} className="flex items-center justify-between bg-green-800/20 border border-green-500/30 rounded-lg p-3">
                                  <div className="flex items-center space-x-3">
                                    <File className="w-5 h-5 text-green-400" />
                                    <span className="text-white text-sm">{fileName}</span>
                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                  </div>
                                  <button
                                    onClick={() => handleDownloadFile(fileUrl, fileName)}
                                    className="text-green-400 hover:text-green-300 transition-colors p-1"
                                    title="Download file"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                            <p className="text-yellow-300 text-sm">
                              {selectedCommission.paymentType === 'split' && selectedCommission.paymentStatus === 'payment_started' 
                                ? 'Complete the second payment (50%) to download files' 
                                : 'Payment must be completed before downloading files'}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <p className="text-purple-300 text-sm mb-1">Proposed Amount</p>
                <p className="text-purple-400 text-3xl font-bold">${selectedCommission.proposedAmount.toFixed(2)}</p>
              </div>

              {selectedCommission.paymentType && (
                <div>
                  <p className="text-purple-300 text-sm mb-1">Payment Type</p>
                  <p className="text-white font-semibold">
                    {selectedCommission.paymentType === 'full' 
                      ? '100% upfront' 
                      : '50% upfront & 50% upon completion'}
                  </p>
                </div>
              )}

              {/* Payment Section - Show for accepted and completed commissions */}
              {(selectedCommission.status === 'accepted' || selectedCommission.status === 'completed') && (
                <div>
                  <p className="text-purple-300 text-sm mb-3">Payment Status</p>
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        {selectedCommission.paymentStatus === 'completed' ? (
                          <>
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-green-400 font-medium">Payment Completed</span>
                          </>
                        ) : selectedCommission.paymentStatus === 'payment_started' ? (
                          <>
                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                            <span className="text-yellow-400 font-medium">First Payment Completed (50%)</span>
                          </>
                        ) : selectedCommission.paymentStatus === 'pending' ? (
                          <>
                            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                            <span className="text-yellow-400 font-medium">Payment Pending</span>
                          </>
                        ) : (
                          <>
                            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                            <span className="text-gray-400 font-medium">Payment Required</span>
                          </>
                        )}
                      </div>
                      {selectedCommission.paymentType === 'split' && selectedCommission.paymentStatus === 'payment_started' && (
                        <p className="text-yellow-300 text-sm">
                          Remaining: ${(selectedCommission.proposedAmount * 0.5).toFixed(2)}
                        </p>
                      )}
                    </div>
                    
                    {selectedCommission.paymentStatus === 'unpaid' && (
                      <button
                        onClick={() => navigate(`/payment?commission=${selectedCommission.id}`)}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2"
                      >
                        <span>Pay Now</span>
                      </button>
                    )}
                    
                    {selectedCommission.paymentStatus === 'pending' && (
                      <button
                        onClick={() => navigate(`/payment?commission=${selectedCommission.id}`)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2"
                      >
                        <span>Complete Payment</span>
                      </button>
                    )}
                    
                    {/* Show second payment button for split payments when commission is completed */}
                    {selectedCommission.paymentStatus === 'payment_started' && selectedCommission.status === 'completed' && selectedCommission.paymentType === 'split' && (
                      <button
                        onClick={() => navigate(`/payment?commission=${selectedCommission.id}`)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2"
                      >
                        <span>Pay Second Half (50%)</span>
                      </button>
                    )}
                    
                    {selectedCommission.paymentStatus === 'completed' && (
                      <div className="text-green-400 text-sm">
                        Paid on {selectedCommission.paidAt ? new Date(selectedCommission.paidAt).toLocaleDateString() : 'Unknown'}
                      </div>
                    )}
                  </div>
                </div>
              )}

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

              {selectedCommission.status === 'draft' && (
                <div className="space-y-3">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleEditDraft(selectedCommission)}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                    >
                      <Edit className="w-5 h-5" />
                      <span>Edit Draft</span>
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
                          await deleteCommission(selectedCommission.id);
                          handleCloseModal();
                        }
                      }}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                    >
                      <X className="w-5 h-5" />
                      <span>Delete Draft</span>
                    </button>
                  </div>
                  <button
                    onClick={async () => {
                      if (confirm('Are you sure you want to submit this commission for review? This will change its status from draft to submitted.')) {
                        await updateCommission(selectedCommission.id, { status: 'submitted' });
                        handleCloseModal();
                      }
                    }}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Submit Commission</span>
                  </button>
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

              <div className="flex items-center justify-between text-sm text-purple-300 pt-4 border-t border-purple-500/20">
                <div>
                  <span className="block">Created</span>
                  <span className="text-white">{new Date(selectedCommission.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="block">Updated</span>
                  <span className="text-white">{new Date(selectedCommission.updatedAt).toLocaleString()}</span>
                </div>
              </div>

              {selectedCommission.status !== 'archived' && (
                <div className="pt-4 border-t border-purple-500/20">
                  <button
                    onClick={() => {
                      handleArchive(selectedCommission.id);
                      setSelectedCommission(null);
                    }}
                    className="w-full btn-secondary hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2"
                  >
                    <Archive className="w-4 h-4" />
                    <span>Archive Commission</span>
                  </button>
                </div>
              )}

              {selectedCommission.status === 'archived' && (
                <div className="pt-4 border-t border-purple-500/20">
                  <button
                    onClick={() => {
                      handleDelete(selectedCommission.id);
                      setSelectedCommission(null);
                    }}
                    className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-2 hover:scale-105"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Permanently</span>
                  </button>
                </div>
              )}
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
                  <option value="extreme">Complex</option>
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

      {/* Draft Edit Modal */}
      {draftToEdit && (
        <DraftEditModal
          isOpen={isEditingDraft}
          onClose={handleCloseDraftEdit}
          commission={draftToEdit}
        />
      )}
    </div>
  );
}
