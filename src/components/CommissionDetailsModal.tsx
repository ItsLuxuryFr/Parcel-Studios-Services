import { X, File, CheckCircle, Download, AlertCircle, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCommissions } from '../contexts/CommissionContext';
import { Commission } from '../types';

interface CommissionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  commission: Commission | null;
  showPaymentButtons?: boolean;
}

export default function CommissionDetailsModal({ 
  isOpen, 
  onClose, 
  commission,
  showPaymentButtons = true
}: CommissionDetailsModalProps) {
  const { user } = useAuth();
  const { downloadFile } = useCommissions();
  const navigate = useNavigate();

  const handleDownloadFile = async (fileUrl: string, fileName: string) => {
    try {
      await downloadFile(fileUrl, fileName, commission || undefined);
    } catch (error) {
      console.error('Error downloading file:', error);
      // Show error message to user
      alert('Unable to download file: ' + (error as Error).message);
    }
  };

  const handleViewOnAdminPanel = () => {
    if (commission) {
      // Use reference number if available, otherwise fall back to ID
      const searchTerm = commission.referenceNumber || commission.id;
      window.location.href = `/admin?search=${searchTerm}`;
    }
  };

  if (!isOpen || !commission) return null;

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

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-fade-in" onClick={onClose}>
      <div className="bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-purple-500/20 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-purple-500/20 px-6 py-4 flex justify-between items-center rounded-t-xl">
          <h2 className="text-2xl font-bold text-white">Commission Details</h2>
          <button
            onClick={onClose}
            className="text-purple-400 hover:text-purple-300 transition-colors hover:scale-110"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center space-x-3 flex-wrap">
            <span className={`${
              statusColors[commission.status]
            } text-white text-sm px-3 py-1.5 rounded-full font-semibold capitalize`}>
              {statusLabels[commission.status]}
            </span>
            <span className={`${
              commission.taskComplexity === 'easy' ? 'bg-green-900/30 text-green-400 border-green-500/30' :
              commission.taskComplexity === 'medium' ? 'bg-blue-900/30 text-blue-400 border-blue-500/30' :
              commission.taskComplexity === 'hard' ? 'bg-orange-900/30 text-orange-400 border-orange-500/30' :
              'bg-red-900/30 text-red-400 border-red-500/30'
            } text-sm px-3 py-1.5 rounded-full capitalize border`}>
              {commission.taskComplexity}
            </span>
          </div>

          <div>
            <p className="text-slate-400 text-sm mb-1">Reference Number</p>
            <p className="text-white font-mono text-lg">{commission.referenceNumber}</p>
          </div>

          <div>
            <p className="text-slate-400 text-sm mb-1">Subject</p>
            <p className="text-white text-xl font-semibold">{commission.subject}</p>
          </div>

          <div>
            <p className="text-slate-400 text-sm mb-1">Description</p>
            <p className="text-white leading-relaxed whitespace-pre-wrap">{commission.description}</p>
          </div>

          {commission.tags && commission.tags.length > 0 && (
            <div>
              <p className="text-slate-400 text-sm mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {commission.tags.map((tag, idx) => (
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

          {/* Files */}
          {commission.images && commission.images.length > 0 && (
            <div>
              <p className="text-slate-400 text-sm mb-3">Files</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {commission.images.map((imageUrl, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={imageUrl}
                      alt={`Commission image ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-purple-500/20 group-hover:border-purple-400/40 transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress Section - Show for in_progress and completed commissions */}
          {(commission.status === 'in_progress' || commission.status === 'completed') && (
            <div>
              <p className="text-slate-400 text-sm mb-3">Progress</p>
              <div className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">
                      {commission.status === 'completed' ? 'Project Completed' : 'Project in Progress'}
                    </span>
                    <span className="text-emerald-400 font-bold text-lg">
                      {commission.progress || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-300 ${
                        commission.status === 'completed' 
                          ? 'bg-gradient-to-r from-green-500 to-green-600' 
                          : 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                      }`}
                      style={{ width: `${commission.progress || 0}%` }}
                    />
                  </div>
                  {commission.status === 'completed' && commission.completedAt && (
                    <div className="space-y-1">
                      <p className="text-green-400 text-sm">
                        Completed: {new Date(commission.completedAt).toLocaleString()}
                      </p>
                      {commission.completedByAdminName && (
                        <p className="text-green-300 text-sm">
                          Completed by: {commission.completedByAdminName}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Completion Files - Show for completed commissions */}
                {commission.status === 'completed' && commission.completionFiles && commission.completionFiles.length > 0 && (
                  <div>
                    <p className="text-slate-400 text-sm mb-3">Completion Files</p>
                    {commission.paymentStatus === 'completed' || user?.isAdmin ? (
                      <div className="space-y-2">
                        {commission.completionFiles.map((fileUrl, index) => {
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
                          {commission.paymentType === 'split' && commission.paymentStatus === 'payment_started' 
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
            <p className="text-slate-400 text-sm mb-1">Proposed Amount</p>
            <p className="text-emerald-400 text-3xl font-bold">${commission.proposedAmount.toFixed(2)}</p>
          </div>

          {commission.paymentType && (
            <div>
              <p className="text-slate-400 text-sm mb-1">Payment Type</p>
              <p className="text-white font-semibold">
                {commission.paymentType === 'full' 
                  ? '100% upfront' 
                  : '50% upfront & 50% upon completion'}
              </p>
            </div>
          )}

          {/* Payment Section - Show for accepted and completed commissions */}
          {(commission.status === 'accepted' || commission.status === 'completed') && (
            <div>
              <p className="text-slate-400 text-sm mb-3">Payment Status</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {commission.paymentStatus === 'completed' ? (
                    <>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-green-400 font-medium">Payment Completed</span>
                    </>
                  ) : commission.paymentStatus === 'payment_started' ? (
                    <>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-yellow-400 font-medium">First Payment Completed (50%)</span>
                    </>
                  ) : commission.paymentStatus === 'pending' ? (
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
                
                {showPaymentButtons && (
                  <>
                    {/* First payment button - only show if unpaid or pending */}
                    {(commission.paymentStatus === 'unpaid' || commission.paymentStatus === 'pending') && (
                      <button
                        onClick={() => {
                          console.log('[DEBUG] Opening payment page for commission:', commission.id);
                          onClose();
                          navigate(`/payment?commission=${commission.id}`);
                        }}
                        className={`${commission.paymentStatus === 'unpaid' ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'} text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2`}
                      >
                        <span>{commission.paymentStatus === 'unpaid' ? 'Pay Now' : 'Complete Payment'}</span>
                      </button>
                    )}
                    
                    {/* Second payment button for split payments when commission is completed */}
                    {(() => {
                      const shouldShowSecondPaymentButton = 
                        commission.paymentType === 'split' &&
                        commission.paymentStatus === 'payment_started' &&
                        commission.status === 'completed';
                      
                      console.log('[DEBUG] Second payment button visibility check:', {
                        commissionId: commission.id,
                        paymentType: commission.paymentType,
                        paymentStatus: commission.paymentStatus,
                        status: commission.status,
                        shouldShow: shouldShowSecondPaymentButton
                      });
                      
                      return shouldShowSecondPaymentButton ? (
                        <button
                          onClick={() => {
                            console.log('[DEBUG] Opening second payment page for commission:', commission.id);
                            onClose();
                            navigate(`/payment?commission=${commission.id}`);
                          }}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2"
                        >
                          <span>Pay Second Half (50%)</span>
                        </button>
                      ) : null;
                    })()}
                  </>
                )}
                
                {commission.paymentStatus === 'completed' && (
                  <div className="text-green-400 text-sm">
                    Paid on {commission.paidAt ? new Date(commission.paidAt).toLocaleDateString() : 'Unknown'}
                  </div>
                )}
              </div>
            </div>
          )}

          {commission.rejectionReason && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                <div>
                  <p className="text-red-300 font-semibold mb-1">Rejection Reason</p>
                  <p className="text-red-200">{commission.rejectionReason}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-slate-400 pt-4 border-t border-slate-700">
            <div>
              <span className="block">Created</span>
              <span className="text-white">{new Date(commission.createdAt).toLocaleString()}</span>
            </div>
            <div>
              <span className="block">Updated</span>
              <span className="text-white">{new Date(commission.updatedAt).toLocaleString()}</span>
            </div>
          </div>

          {/* Admin Panel Button - Only show for admins and if commission exists */}
          {user?.isAdmin && (
            <div className="pt-4 border-t border-slate-700">
              <button
                onClick={handleViewOnAdminPanel}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
              >
                <Edit className="w-5 h-5" />
                <span>View on Admin Panel</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
