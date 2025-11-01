import React from 'react';
import { X, CheckCircle, XCircle, Eye, Calendar } from 'lucide-react';
import { Message, Commission } from '../types';
import { useAuth } from '../contexts/AuthContext';
import CommissionDetailsModal from './CommissionDetailsModal';

interface OfferDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: Message | null;
  onAcceptOffer?: (messageId: string) => void;
  onRejectOffer?: (messageId: string) => void;
}

export default function OfferDetailsModal({ 
  isOpen, 
  onClose, 
  message,
  onAcceptOffer,
  onRejectOffer
}: OfferDetailsModalProps) {
  const { user } = useAuth();
  const [showCommissionDetails, setShowCommissionDetails] = React.useState(false);

  if (!isOpen || !message || !message.isOffer || !message.commission) return null;

  const handleAccept = () => {
    if (onAcceptOffer) {
      onAcceptOffer(message.id);
    }
  };

  const handleReject = () => {
    if (onRejectOffer) {
      onRejectOffer(message.id);
    }
  };

  const isPending = message.offerStatus === 'pending' || !message.offerStatus;
  const isExpired = !!message.offerExpiredAt;
  const ownsCommission = message.commission.userId === user?.id;
  const didNotSendOffer = message.senderId !== user?.id;
  const isAdmin = user?.isAdmin;
  
  // Regular users: can respond only if they own the commission AND didn't send the offer
  // Admins: can respond if they own the commission AND didn't send it, OR if it's someone else's commission
  // Don't allow responses to expired offers
  const canRespond = isPending && !isExpired && (
    (ownsCommission && didNotSendOffer) || 
    (isAdmin && didNotSendOffer)
  );
  
  const showResponseButtons = canRespond && onAcceptOffer && onRejectOffer;

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-fade-in" onClick={onClose}>
        <div className="bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-amber-500/20 animate-scale-in" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="sticky top-0 bg-gray-900 border-b border-amber-500/20 px-6 py-4 flex justify-between items-center rounded-t-xl">
            <div className="flex items-center space-x-3">
              <div className="bg-amber-500/20 rounded-lg p-2">
                <span className="text-amber-400 font-bold text-sm">OFFER</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Offer Details</h2>
            </div>
            <button
              onClick={onClose}
              className="text-amber-400 hover:text-amber-300 transition-colors hover:scale-110"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Status Badge */}
            <div className="flex items-center space-x-3">
              {isExpired && (
                <div className="flex items-center space-x-2 bg-gray-500/20 border border-gray-500/30 rounded-lg px-4 py-2">
                  <XCircle className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-400 font-semibold">Expired</span>
                </div>
              )}
              {message.offerStatus === 'accepted' && !isExpired && (
                <div className="flex items-center space-x-2 bg-green-500/20 border border-green-500/30 rounded-lg px-4 py-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 font-semibold">Accepted</span>
                </div>
              )}
              {message.offerStatus === 'rejected' && !isExpired && (
                <div className="flex items-center space-x-2 bg-red-500/20 border border-red-500/30 rounded-lg px-4 py-2">
                  <XCircle className="w-5 h-5 text-red-400" />
                  <span className="text-red-400 font-semibold">Rejected</span>
                </div>
              )}
              {isPending && !isExpired && (
                <div className="flex items-center space-x-2 bg-amber-500/20 border border-amber-500/30 rounded-lg px-4 py-2">
                  <div className="w-5 h-5 border-2 border-amber-400 rounded-full animate-pulse"></div>
                  <span className="text-amber-400 font-semibold">Pending</span>
                </div>
              )}
            </div>

            {/* Offer Price - Emphasized */}
            <div className={`rounded-lg p-6 ${
              isExpired 
                ? 'bg-gray-500/10 border border-gray-500/30' 
                : 'bg-amber-500/10 border border-amber-500/30'
            }`}>
              <p className="text-slate-400 text-sm mb-2">Offer Price</p>
              <p className={`text-4xl font-bold ${
                isExpired ? 'text-gray-400' : 'text-amber-400'
              }`}>${message.offerPrice?.toFixed(2)}</p>
              {message.commission.proposedAmount !== message.offerPrice && (
                <p className="text-sm text-gray-400 mt-2">
                  Original price: <span className="line-through">${message.commission.proposedAmount.toFixed(2)}</span>
                </p>
              )}
            </div>

            {/* Commission Info */}
            <div>
              <p className="text-slate-400 text-sm mb-1">Commission Reference</p>
              <p className="text-white font-mono text-lg">{message.commission.referenceNumber}</p>
            </div>

            <div>
              <p className="text-slate-400 text-sm mb-1">Subject</p>
              <p className="text-white text-xl font-semibold">{message.commission.subject}</p>
            </div>

            <div>
              <p className="text-slate-400 text-sm mb-1">Description</p>
              <p className="text-white leading-relaxed whitespace-pre-wrap">{message.commission.description}</p>
            </div>

            {/* Offer Comments */}
            {message.offerComments && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                <p className="text-amber-400 text-sm font-semibold mb-2">Additional Comments</p>
                <p className="text-white leading-relaxed whitespace-pre-wrap">{message.offerComments}</p>
              </div>
            )}

            {/* Commission Details */}
            <div className="flex items-center space-x-2">
              <div className={`${
                message.commission.status === 'draft' ? 'bg-gray-600' :
                message.commission.status === 'submitted' ? 'bg-blue-600' :
                message.commission.status === 'in_review' ? 'bg-yellow-600' :
                message.commission.status === 'accepted' ? 'bg-emerald-600' :
                message.commission.status === 'in_progress' ? 'bg-blue-600' :
                message.commission.status === 'approved' ? 'bg-emerald-600' :
                message.commission.status === 'rejected' ? 'bg-red-600' :
                message.commission.status === 'completed' ? 'bg-purple-600' :
                'bg-slate-600'
              } text-white text-sm px-3 py-1.5 rounded-full font-semibold capitalize`}>
                {message.commission.status.replace('_', ' ')}
              </div>
              <div className={`${
                message.commission.taskComplexity === 'easy' ? 'bg-green-900/30 text-green-400 border-green-500/30' :
                message.commission.taskComplexity === 'medium' ? 'bg-blue-900/30 text-blue-400 border-blue-500/30' :
                message.commission.taskComplexity === 'hard' ? 'bg-purple-900/30 text-purple-400 border-purple-500/30' :
                'bg-red-900/30 text-red-400 border-red-500/30'
              } text-sm px-3 py-1.5 rounded-full capitalize border`}>
                {message.commission.taskComplexity}
              </div>
            </div>

            {/* Timestamps */}
            <div className="flex items-center justify-between text-sm text-slate-400 pt-4 border-t border-slate-700">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <div>
                  <span className="block">Created</span>
                  <span className="text-white">{new Date(message.createdAt).toLocaleString()}</span>
                </div>
              </div>
              {message.offerRespondedAt && (
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <div>
                    <span className="block">Responded</span>
                    <span className="text-white">{new Date(message.offerRespondedAt).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-700 space-y-3">
              <button
                onClick={() => setShowCommissionDetails(true)}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
              >
                <Eye className="w-5 h-5" />
                <span>View Commission Details</span>
              </button>

              {showResponseButtons && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleAccept}
                    className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Accept Offer</span>
                  </button>
                  <button
                    onClick={handleReject}
                    className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                  >
                    <XCircle className="w-5 h-5" />
                    <span>Reject Offer</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Commission Details Modal */}
      <CommissionDetailsModal
        isOpen={showCommissionDetails}
        onClose={() => setShowCommissionDetails(false)}
        commission={message.commission}
        showPaymentButtons={false}
      />
    </>
  );
}

