import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  Send, 
  Paperclip, 
  MoreVertical, 
  Pin, 
  Loader2,
  Download,
  X,
  Circle,
  
  UserPlus,
  Plus,
  Briefcase,
  Trash2,
  AlertCircle
} from 'lucide-react';
import CommissionSelectorModal from './CommissionSelectorModal';
import CommissionDetailsModal from './CommissionDetailsModal';
import ResetConversationModal from './ResetConversationModal';
import OfferSelectorModal from './OfferSelectorModal';
import OfferDetailsModal from './OfferDetailsModal';
import { useMessages } from '../contexts/MessageContext';
import { useAuth } from '../contexts/AuthContext';
import { formatTimestamp, formatFileSize, getFileIcon, isImageFile, isVideoFile } from '../lib/messageHelpers';
import { MessageAttachment, Commission, Message, ConversationParticipant } from '../types';
import { supabase } from '../lib/supabase';
import NicknameModal from './NicknameModal';

// Memoized message component for better performance
const MessageBubble = React.memo(({ 
  message, 
  isOwnMessage, 
  user, 
  participants,
  commissionFeatureAvailable,
  onViewCommission,
  onViewOffer,
  onAcceptOffer,
  onRejectOffer,
  respondingOfferId,
  downloadAttachment,
  onViewImage
}: {
  message: Message;
  isOwnMessage: boolean;
  user: any;
  participants: ConversationParticipant[];
  commissionFeatureAvailable: boolean;
  onViewCommission: (commission: Commission) => void;
  onViewOffer: (message: Message) => void;
  onAcceptOffer: (messageId: string) => void;
  onRejectOffer: (messageId: string) => void;
  respondingOfferId: string | null;
  downloadAttachment: (attachment: MessageAttachment) => void;
  onViewImage: (attachment: MessageAttachment) => void;
}) => {
  const FileIcon = getFileIcon((message.attachments && message.attachments[0]?.fileType) || '');
  
  // Find sender information from participants
  const sender = participants.find(p => p.userId === message.senderId);

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      {/* Profile Icon - only show for incoming messages */}
      {!isOwnMessage && (
        <div className="flex-shrink-0 mr-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center border-2 border-gray-900">
            {sender?.avatar ? (
              <img
                src={sender.avatar}
                alt={sender.displayName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-white font-semibold text-sm">
                {sender?.displayName?.charAt(0).toUpperCase() || 'U'}
              </span>
            )}
          </div>
        </div>
      )}
      
      <div className={`max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl ${isOwnMessage ? 'order-2' : 'order-1'}`}>
        {/* Message Bubble */}
        <div
          className={`
            px-4 sm:px-6 py-3 sm:py-4 rounded-2xl
            ${isOwnMessage 
              ? 'bg-purple-600 text-white' 
              : 'bg-gray-800/80 text-gray-200'
            }
          `}
        >
          {/* Text Content */}
          {message.content && (
            <p className="text-sm sm:text-base whitespace-pre-wrap leading-relaxed">{message.content}</p>
          )}
          
          {/* Attachments */}
          {message.isAttachmentLoading ? (
            // Attachments loading - show loading state
            <div className="mt-2">
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-600/50">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                  <span className="text-gray-400 text-sm font-medium">Loading Attachments...</span>
                </div>
              </div>
            </div>
          ) : message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((attachment) => (
                isImageFile(attachment.fileType) ? (
                  // Direct image display for image attachments
                  <img
                    key={attachment.id}
                    src={attachment.fileUrl}
                    alt={attachment.fileName}
                    className="rounded-lg cursor-pointer hover:scale-105 transition-transform duration-200 max-h-64 object-cover"
                    onClick={() => onViewImage(attachment)}
                  />
                ) : (
                  // File info display for non-image attachments
                  <div
                    key={attachment.id}
                    className="bg-black/20 rounded-lg p-3 border border-white/10"
                  >
                    <div className="flex items-center space-x-2">
                      <FileIcon className="w-4 h-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">
                          {attachment.fileName}
                        </p>
                        <p className="text-xs opacity-75">
                          {formatFileSize(attachment.fileSize)}
                        </p>
                      </div>
                      <button
                        onClick={() => downloadAttachment(attachment)}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                        title="Download"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                    </div>
                    
                    {/* Video Preview */}
                    {isVideoFile(attachment.fileType) && (
                      <div className="mt-2">
                        <video
                          src={attachment.fileUrl}
                          controls
                          className="w-full rounded max-h-48"
                        />
                      </div>
                    )}
                  </div>
                )
              ))}
            </div>
          )}

          {/* Commission Reference */}
          {commissionFeatureAvailable && message.commissionId && !message.isOffer && (
            <div className="mt-2">
              {message.isCommissionLoading ? (
                // Commission loading - show loading state
                <div className="bg-blue-900/20 rounded-lg p-3 border border-blue-500/30">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                    <span className="text-blue-400 text-sm font-medium">Loading Commission...</span>
                  </div>
                </div>
              ) : message.commission ? (
                // Commission exists - show commission card
                <div
                  onClick={() => onViewCommission(message.commission!)}
                  className="bg-black/20 rounded-lg p-3 border border-white/10 cursor-pointer hover:bg-black/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`${
                          message.commission.status === 'draft' ? 'bg-gray-600' :
                          message.commission.status === 'submitted' ? 'bg-blue-600' :
                          message.commission.status === 'in_review' ? 'bg-yellow-600' :
                          message.commission.status === 'accepted' ? 'bg-emerald-600' :
                          message.commission.status === 'in_progress' ? 'bg-blue-600' :
                          message.commission.status === 'approved' ? 'bg-emerald-600' :
                          message.commission.status === 'rejected' ? 'bg-red-600' :
                          message.commission.status === 'completed' ? 'bg-purple-600' :
                          'bg-slate-600'
                        } text-white text-xs px-2 py-1 rounded-full font-semibold`}>
                          {message.commission.status.replace('_', ' ')}
                        </span>
                        <span className={`${
                          message.commission.taskComplexity === 'easy' ? 'bg-green-900/30 text-green-400 border-green-500/30' :
                          message.commission.taskComplexity === 'medium' ? 'bg-blue-900/30 text-blue-400 border-blue-500/30' :
                          message.commission.taskComplexity === 'hard' ? 'bg-purple-900/30 text-purple-400 border-purple-500/30' :
                          'bg-red-900/30 text-red-400 border-red-500/30'
                        } text-xs px-2 py-1 rounded-full capitalize border`}>
                          {message.commission.taskComplexity}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white mb-1">{message.commission.subject}</h4>
                      <p className="text-xs text-gray-400 font-mono">{message.commission.referenceNumber}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-purple-400 font-bold text-sm">
                        ${message.commission.proposedAmount.toFixed(2)}
                      </div>
                      {message.commission.paymentType && (
                        <div className="text-purple-300 text-xs mt-1">
                          {message.commission.paymentType === 'full' 
                            ? '100% upfront' 
                            : '50/50 split'}
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-300 line-clamp-2">{message.commission.description}</p>
                </div>
              ) : (
                // Commission deleted - show greyed out card
                <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-600/50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-gray-400 mb-1">Commission Deleted</h4>
                      <p className="text-xs text-gray-500">This commission has been removed</p>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-500 font-bold text-sm">--</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Offer Display */}
          {commissionFeatureAvailable && message.isOffer && (
            <div className="mt-2">
              {message.isOfferLoading ? (
                // Offer loading - show loading state
                <div className="bg-amber-900/20 rounded-lg p-3 border border-amber-500/30">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-400"></div>
                    <span className="text-amber-400 text-sm font-medium">Loading Offer...</span>
                  </div>
                </div>
              ) : message.commission ? (
                <div
                  onClick={() => !message.offerExpiredAt && onViewOffer(message)}
                  className={`rounded-lg p-3 border-2 transition-colors ${
                    message.offerExpiredAt
                      ? 'bg-gray-500/10 border-gray-500/30 cursor-not-allowed opacity-60'
                      : message.offerStatus === 'accepted'
                      ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20 cursor-pointer'
                      : message.offerStatus === 'rejected'
                      ? 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20 cursor-pointer'
                      : 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20 cursor-pointer'
                  }`}
                >
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`text-white text-xs px-2 py-1 rounded font-bold ${
                    message.offerExpiredAt
                      ? 'bg-gray-500'
                      : message.offerStatus === 'accepted'
                      ? 'bg-green-500'
                      : message.offerStatus === 'rejected'
                      ? 'bg-red-500'
                      : 'bg-amber-500'
                  }`}>OFFER</span>
                  {message.offerExpiredAt && (
                    <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded">Expired</span>
                  )}
                  {message.offerStatus === 'accepted' && !message.offerExpiredAt && (
                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">Accepted</span>
                  )}
                  {message.offerStatus === 'rejected' && !message.offerExpiredAt && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">Rejected</span>
                  )}
                  {(!message.offerStatus || message.offerStatus === 'pending') && !message.offerExpiredAt && (
                    <span className="bg-amber-500/50 text-white text-xs px-2 py-1 rounded animate-pulse">Pending</span>
                  )}
                </div>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className={`text-lg font-bold mb-1 ${
                      message.offerExpiredAt
                        ? 'text-gray-300'
                        : message.offerStatus === 'accepted'
                        ? 'text-green-300'
                        : message.offerStatus === 'rejected'
                        ? 'text-red-300'
                        : 'text-amber-300'
                    }`}>{message.commission.subject}</h4>
                    <p className={`text-xs font-mono ${
                      message.offerExpiredAt
                        ? 'text-gray-400'
                        : message.offerStatus === 'accepted'
                        ? 'text-green-400'
                        : message.offerStatus === 'rejected'
                        ? 'text-red-400'
                        : 'text-amber-400'
                    }`}>{message.commission.referenceNumber}</p>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold text-2xl ${
                      message.offerExpiredAt
                        ? 'text-gray-400'
                        : message.offerStatus === 'accepted'
                        ? 'text-green-400'
                        : message.offerStatus === 'rejected'
                        ? 'text-red-400'
                        : 'text-amber-400'
                    }`}>
                      ${message.offerPrice?.toFixed(2)}
                    </div>
                  </div>
                </div>
                {message.offerComments && (
                  <p className="text-sm text-gray-300 line-clamp-2">{message.offerComments}</p>
                )}
                {/* Show Accept/Reject buttons based on user role and offer status */}
                {(() => {
                  const isPending = !message.offerStatus || message.offerStatus === 'pending';
                  const isExpired = !!message.offerExpiredAt;
                  const ownsCommission = message.commission.userId === user?.id;
                  const didNotSendOffer = message.senderId !== user?.id;
                  const isAdmin = user?.isAdmin;
                  
                  // Regular users: can respond only if they own the commission AND didn't send the offer
                  // Admins: can respond if they own the commission AND didn't send it, OR if it's someone else's commission
                  // Don't show buttons for expired offers
                  const canRespond = isPending && !isExpired && (
                    (ownsCommission && didNotSendOffer) || 
                    (isAdmin && didNotSendOffer)
                  );
                  
                  return canRespond;
                })() && (
                  <div className={`flex items-center space-x-2 mt-3 pt-3 border-t ${
                    message.offerExpiredAt
                      ? 'border-gray-500/20'
                      : message.offerStatus === 'accepted'
                      ? 'border-green-500/20'
                      : message.offerStatus === 'rejected'
                      ? 'border-red-500/20'
                      : 'border-amber-500/20'
                  }`}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAcceptOffer(message.id);
                      }}
                      disabled={respondingOfferId === message.id}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors text-white ${respondingOfferId === message.id ? 'bg-green-700 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500'}`}
                    >
                      Accept
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRejectOffer(message.id);
                      }}
                      disabled={respondingOfferId === message.id}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors text-white ${respondingOfferId === message.id ? 'bg-red-700 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500'}`}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
              ) : (
                // Offer deleted - show greyed out card
                <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-600/50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-gray-400 mb-1">Offer Deleted</h4>
                      <p className="text-xs text-gray-500">This offer has been removed</p>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-500 font-bold text-sm">--</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Timestamp */}
        <p className={`text-xs text-gray-400 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
          {formatTimestamp(message.createdAt)}
        </p>
      </div>
    </div>
  );
});

interface MessageThreadProps {
  onViewProfile: (participant: any) => void;
  onViewUsers: () => void;
  onAddUsers: () => void;
}

export default function MessageThread({ onViewProfile, onViewUsers, onAddUsers }: MessageThreadProps) {
  const { 
    currentConversation, 
    messages, 
    typingUsers, 
    isSending, 
    isUploading,
    isLoading,
    sendMessage, 
    setTyping,
    updateConversationNickname,
    hideConversation,
    activeResetRequest,
    requestConversationReset,
    acceptConversationReset,
    cancelConversationReset,
    respondToOffer,
    loadMessages
  } = useMessages();
  
  const { user } = useAuth();
  
  const [messageInput, setMessageInput] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showAllAttachments, setShowAllAttachments] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState<MessageAttachment | null>(null);
  const [selectedCommissionForAttachment, setSelectedCommissionForAttachment] = useState<Commission | null>(null);
  const [showCommissionSelector, setShowCommissionSelector] = useState(false);
  const [selectedCommissionForView, setSelectedCommissionForView] = useState<Commission | null>(null);
  const [showCommissionDetails, setShowCommissionDetails] = useState(false);
  const [commissionFeatureAvailable, setCommissionFeatureAvailable] = useState(true);
  const [showResetModal, setShowResetModal] = useState(false);
  
  // Offer state
  const [showOfferSelector, setShowOfferSelector] = useState(false);
  const [selectedOfferCommission, setSelectedOfferCommission] = useState<Commission | null>(null);
  const [selectedOfferPrice, setSelectedOfferPrice] = useState<number>(0);
  const [selectedOfferComments, setSelectedOfferComments] = useState('');
  const [selectedOfferMessage, setSelectedOfferMessage] = useState<Message | null>(null);
  const [showOfferDetails, setShowOfferDetails] = useState(false);
  const [respondingOfferId, setRespondingOfferId] = useState<string | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const headerMenuRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Escape key to close image modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedImage) {
        setSelectedImage(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [selectedImage]);

  // Handle click outside to close add menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
      if (headerMenuRef.current && !headerMenuRef.current.contains(e.target as Node)) {
        setShowHeaderMenu(false);
      }
    };
    if (showAddMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    if (showHeaderMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAddMenu, showHeaderMenu]);

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversation) {
      // This will be handled by the parent component
    }
  }, [currentConversation]);

  // Check if commission feature is available
  useEffect(() => {
    const checkCommissionFeature = async () => {
      if (!user || !currentConversation) return;
      
      try {
        // Try to query the messages table schema to see if commission_id column exists
        // We'll use a simple approach: try to select commission_id from messages
        const { error } = await supabase
          .from('messages')
          .select('commission_id')
          .limit(1);
        
        if (error && error.code === 'PGRST204') {
          // Column doesn't exist
          setCommissionFeatureAvailable(false);
          console.warn('Commission reference feature not available - commission_id column does not exist');
        } else {
          // Column exists
          setCommissionFeatureAvailable(true);
        }
      } catch (error) {
        console.warn('Could not check commission feature availability:', error);
        setCommissionFeatureAvailable(false);
      }
    };

    checkCommissionFeature();
  }, [user, currentConversation]);

  const handleSendMessage = async () => {
    if (!currentConversation || (!messageInput.trim() && selectedFiles.length === 0 && !selectedCommissionForAttachment && !selectedOfferCommission) || isSending) {
      return;
    }

    try {
      // Check if this is an offer
      const isOffer = !!selectedOfferCommission;
      
      // Only pass commissionId if it's NOT an offer
      // For offers, we pass the commission data via the offer fields instead
      const commissionId = isOffer ? selectedOfferCommission?.id : selectedCommissionForAttachment?.id;
      
      const offerPrice = selectedOfferPrice;
      const offerComments = selectedOfferComments;
      
      await sendMessage(
        currentConversation.id, 
        messageInput, 
        selectedFiles, 
        commissionId,
        isOffer,
        offerPrice,
        offerComments
      );
      setMessageInput('');
      setSelectedFiles([]);
      setSelectedCommissionForAttachment(null);
      setSelectedOfferCommission(null);
      setSelectedOfferPrice(0);
      setSelectedOfferComments('');
      setIsTyping(false);
      setTyping(currentConversation.id, false);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value);
    
    // Handle typing indicator
    if (currentConversation) {
      if (!isTyping && e.target.value.trim()) {
        setIsTyping(true);
        setTyping(currentConversation.id, true);
      }
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        setTyping(currentConversation.id, false);
      }, 1000);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxFiles = 8;
    
    // Check if adding these files would exceed the limit
    if (selectedFiles.length + files.length > maxFiles) {
      const remainingSlots = maxFiles - selectedFiles.length;
      if (remainingSlots > 0) {
        // Add only the files that fit within the limit
        const filesToAdd = files.slice(0, remainingSlots);
        setSelectedFiles(prev => [...prev, ...filesToAdd]);
        alert(`Maximum upload limit is ${maxFiles} files. Only ${remainingSlots} files were added.`);
      } else {
        alert(`Maximum upload limit is ${maxFiles} files. Please remove some files before adding new ones.`);
      }
    } else {
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadFile = () => {
    fileInputRef.current?.click();
    setShowAddMenu(false);
  };

  const handleReferCommission = () => {
    if (!commissionFeatureAvailable) {
      alert('Commission reference feature is not available yet. The database migration needs to be applied to enable this feature.');
      return;
    }
    setShowCommissionSelector(true);
    setShowAddMenu(false);
  };

  const handleSelectCommission = (commission: Commission) => {
    setSelectedCommissionForAttachment(commission);
  };

  const handleRemoveCommission = () => {
    setSelectedCommissionForAttachment(null);
  };

  const handleCreateOffer = () => {
    if (!commissionFeatureAvailable) {
      alert('Offer feature is not available yet. The database migration needs to be applied to enable this feature.');
      return;
    }
    setShowOfferSelector(true);
    setShowAddMenu(false);
  };

  const handleSelectOffer = (commission: Commission, offerPrice: number, offerComments: string) => {
    setSelectedOfferCommission(commission);
    setSelectedOfferPrice(offerPrice);
    setSelectedOfferComments(offerComments);
  };

  const handleRemoveOffer = () => {
    setSelectedOfferCommission(null);
    setSelectedOfferPrice(0);
    setSelectedOfferComments('');
  };

  const handleViewOffer = (message: Message) => {
    setSelectedOfferMessage(message);
    setShowOfferDetails(true);
  };

  const handleAcceptOffer = async (messageId: string) => {
    try {
      setRespondingOfferId(messageId);
      await respondToOffer(messageId, 'accepted');
      setShowOfferDetails(false);
      setSelectedOfferMessage(null);
    } catch (error) {
      console.error('Error accepting offer:', error);
      alert('Failed to accept offer. Please try again.');
    } finally {
      setRespondingOfferId(prev => (prev === messageId ? null : prev));
    }
  };

  const handleRejectOffer = async (messageId: string) => {
    try {
      setRespondingOfferId(messageId);
      await respondToOffer(messageId, 'rejected');
      setShowOfferDetails(false);
      setSelectedOfferMessage(null);
    } catch (error) {
      console.error('Error rejecting offer:', error);
      alert('Failed to reject offer. Please try again.');
    } finally {
      setRespondingOfferId(prev => (prev === messageId ? null : prev));
    }
  };

  const handleViewCommission = async (commission: Commission) => {
    try {
      // Fetch the latest commission data from the database
      const { data: latestCommission, error } = await supabase
        .from('commissions')
        .select('*')
        .eq('id', commission.id)
        .single();

      if (error) {
        console.error('Error fetching latest commission data:', error);
        // Fall back to the original commission data
        setSelectedCommissionForView(commission);
      } else {
        // Map the fresh data to Commission type
        const freshCommission: Commission = {
          id: latestCommission.id,
          userId: latestCommission.user_id,
          taskComplexity: latestCommission.task_complexity,
          subject: latestCommission.subject,
          description: latestCommission.description,
          proposedAmount: Number(latestCommission.proposed_amount),
          status: latestCommission.status,
          referenceNumber: latestCommission.reference_number,
          createdAt: latestCommission.created_at,
          updatedAt: latestCommission.updated_at,
          tags: latestCommission.tags || [],
          images: latestCommission.images || [],
          rejectionReason: latestCommission.rejection_reason,
          progress: latestCommission.progress || 0,
          completionFiles: latestCommission.completion_files || [],
          completedAt: latestCommission.completed_at,
          completedByAdminId: latestCommission.completed_by_admin_id,
          completedByAdminName: latestCommission.completed_by_admin_name,
          // Payment-related fields
          paymentStatus: latestCommission.payment_status || 'unpaid',
          stripeProductId: latestCommission.stripe_product_id,
          stripePriceId: latestCommission.stripe_price_id,
          stripePaymentLinkUrl: latestCommission.stripe_payment_link_url,
          paidAt: latestCommission.paid_at,
          stripeSessionId: latestCommission.stripe_session_id,
          stripeCheckoutSessionId: latestCommission.stripe_checkout_session_id,
          paymentAbandonedAt: latestCommission.payment_abandoned_at,
          productArchivedAt: latestCommission.product_archived_at,
        };
        
        setSelectedCommissionForView(freshCommission);
      }
    } catch (error) {
      console.error('Error fetching commission data:', error);
      // Fall back to the original commission data
      setSelectedCommissionForView(commission);
    }
    
    setShowCommissionDetails(true);
  };

  const handleRequestReset = async () => {
    if (!currentConversation) return;
    try {
      await requestConversationReset(currentConversation.id);
      setShowResetModal(true);
    } catch (error) {
      console.error('Error requesting conversation reset:', error);
      alert('Failed to request conversation reset. Please try again.');
    }
  };

  const handleAcceptReset = async () => {
    if (!activeResetRequest) return;
    try {
      await acceptConversationReset(activeResetRequest.id);
      setShowResetModal(false);
    } catch (error) {
      console.error('Error accepting conversation reset:', error);
      alert('Failed to accept conversation reset. Please try again.');
    }
  };

  const handleCancelReset = async () => {
    if (!activeResetRequest) return;
    try {
      await cancelConversationReset(activeResetRequest.id);
      setShowResetModal(false);
    } catch (error) {
      console.error('Error cancelling conversation reset:', error);
      alert('Failed to cancel conversation reset. Please try again.');
    }
  };

  const downloadAttachment = async (attachment: MessageAttachment) => {
    try {
      console.log('Downloading attachment:', {
        fileName: attachment.fileName,
        fileUrl: attachment.fileUrl,
        fileSize: attachment.fileSize
      });
      
      // Fetch the file as a blob
      const response = await fetch(attachment.fileUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the temporary URL
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      // Fallback to direct download if the fetch approach fails
      const link = document.createElement('a');
      link.href = attachment.fileUrl;
      link.download = attachment.fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const loadMoreMessages = useCallback(async () => {
    if (!currentConversation || isLoadingMore || !hasMoreMessages) return;
    
    try {
      setIsLoadingMore(true);
      const currentMessageCount = messages.length;
      await loadMessages(currentConversation.id);
      
      // Check if we got fewer messages than requested (indicating no more messages)
      if (messages.length === currentMessageCount) {
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentConversation, messages.length, isLoadingMore, hasMoreMessages, loadMessages]);

  // Handle scroll to load more messages
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget;
    if (scrollTop === 0 && hasMoreMessages && !isLoadingMore) {
      loadMoreMessages();
    }
  }, [hasMoreMessages, isLoadingMore, loadMoreMessages]);

  const getOtherParticipants = useCallback(() => {
    if (!currentConversation || !user) return [];
    return currentConversation.participants.filter(p => p.userId !== user.id);
  }, [currentConversation, user]);

  const otherParticipants = useMemo(() => getOtherParticipants(), [getOtherParticipants]);
  const isGroupChat = useMemo(() => otherParticipants.length > 1, [otherParticipants.length]);
  const currentTypingUsers = useMemo(() => 
    typingUsers.filter(t => t.conversationId === currentConversation?.id), 
    [typingUsers, currentConversation?.id]
  );

  if (!currentConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black">
        <div className="text-center text-gray-400">
          <Circle className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No conversation selected</h3>
          <p className="text-sm">Choose a conversation from the sidebar to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-black h-full relative">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-purple-500/20 flex-shrink-0 relative z-30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Avatar(s) */}
            <div className="relative">
              {isGroupChat ? (
                // Group chat - stacked avatars
                <div className="flex -space-x-2">
                  {otherParticipants.slice(0, 3).map((participant, index) => (
                    <div
                      key={participant.userId}
                      className={`relative ${index > 0 ? 'ml-1' : ''}`}
                      style={{ zIndex: 3 - index }}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center border-2 border-gray-900">
                        {participant.avatar ? (
                          <img
                            src={participant.avatar}
                            alt={participant.displayName}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-semibold text-sm sm:text-base">
                            {participant.displayName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      {participant.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 border-2 border-gray-900 rounded-full"></div>
                      )}
                    </div>
                  ))}
                  {otherParticipants.length > 3 && (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-600 flex items-center justify-center border-2 border-gray-900 ml-1">
                      <span className="text-white font-semibold text-sm sm:text-base">
                        +{otherParticipants.length - 3}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                // 1-on-1 chat - single avatar
                <div className="relative">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                    {otherParticipants[0]?.avatar ? (
                      <img
                        src={otherParticipants[0].avatar}
                        alt={otherParticipants[0].displayName}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-semibold text-sm sm:text-base">
                        {otherParticipants[0]?.displayName?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  {otherParticipants[0]?.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 border-2 border-black rounded-full"></div>
                  )}
                </div>
              )}
            </div>
            
            {/* Name and Status */}
            <div>
              <h3 className="text-white font-medium text-sm sm:text-base">
                {currentConversation.nickname && currentConversation.nickname.trim()
                  ? currentConversation.nickname.trim()
                  : (isGroupChat 
                      ? `Group Chat (${currentConversation.participants.length})`
                      : (otherParticipants[0]?.displayName || 'Unknown User'))}
              </h3>
              <p className="text-xs sm:text-sm text-gray-400">
                {isGroupChat 
                  ? `${otherParticipants.length} other member${otherParticipants.length !== 1 ? 's' : ''}`
                  : (otherParticipants[0]?.isOnline ? 'Online' : 'Offline')
                }
              </p>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center space-x-2">
            {isGroupChat ? (
              // Group chat actions
              <>
                <button
                  onClick={onViewUsers}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg transition-colors"
                >
                  View Users
                </button>
                <button 
                  onClick={onAddUsers}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                  title="Add Users"
                >
                  <UserPlus className="w-5 h-5" />
                </button>
              </>
            ) : (
              // 1-on-1 chat actions
              <>
                <button
                  onClick={() => otherParticipants[0] && onViewProfile(otherParticipants[0])}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg transition-colors"
                >
                  View Profile
                </button>
                <button className="p-2 text-gray-400 hover:text-white transition-colors" title="Pinned Messages">
                  <Pin className="w-5 h-5" />
                </button>
              </>
            )}
            <div className="relative" ref={headerMenuRef}>
              <button
                onClick={() => setShowHeaderMenu(!showHeaderMenu)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title="More options"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              {showHeaderMenu && (
                <div className="absolute right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 min-w-[180px]">
                  <button
                    onClick={() => {
                      setShowHeaderMenu(false);
                      setShowNicknameModal(true);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-700"
                  >
                    Change Nickname
                  </button>
                  <button
                    onClick={() => {
                      setShowHeaderMenu(false);
                      handleRequestReset();
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-yellow-400 hover:bg-gray-700"
                  >
                    Reset Conversation
                  </button>
                  <button
                    onClick={async () => {
                      if (!currentConversation) return;
                      try {
                        // Use existing hide action so data remains intact
                        await hideConversation(currentConversation.id);
                      } finally {
                        setShowHeaderMenu(false);
                      }
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reset Request Banner */}
      {activeResetRequest && (
        <div 
          className="bg-yellow-600/20 border-y border-yellow-500/30 p-4 cursor-pointer hover:bg-yellow-600/30 transition-colors"
          onClick={() => setShowResetModal(true)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-1 bg-yellow-500/20 rounded">
                <AlertCircle className="w-4 h-4 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-yellow-200">
                  Reset Request: {activeResetRequest.acceptances.length}/{activeResetRequest.totalParticipants} users agreed
                </p>
                <p className="text-xs text-yellow-300">
                  Click to view details • Expires in {Math.max(0, Math.floor((new Date(activeResetRequest.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60)))}h {Math.max(0, Math.floor(((new Date(activeResetRequest.expiresAt).getTime() - Date.now()) % (1000 * 60 * 60)) / (1000 * 60)))}m
                </p>
              </div>
            </div>
            <div className="text-yellow-400">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div 
        className="absolute inset-0 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6"
        style={{ 
          top: '80px', 
          bottom: '0px',
          paddingBottom: '120px'
        }}
        onScroll={handleScroll}
      >
        {/* Load More Messages Button */}
        {hasMoreMessages && (
          <div className="flex justify-center py-4">
            <button
              onClick={loadMoreMessages}
              disabled={isLoadingMore}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingMore ? 'Loading...' : 'Load More Messages'}
            </button>
          </div>
        )}
        {messages.length === 0 && isLoading ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 opacity-50 animate-spin" />
              <p className="text-sm sm:text-base">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <Circle className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 opacity-50" />
              <p className="text-sm sm:text-base">No messages yet. Start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.senderId === user?.id;

            return (
              <MessageBubble
                key={message.id}
                message={message}
                isOwnMessage={isOwnMessage}
                user={user}
                participants={currentConversation.participants}
                commissionFeatureAvailable={commissionFeatureAvailable}
                onViewCommission={handleViewCommission}
                onViewOffer={handleViewOffer}
                onAcceptOffer={handleAcceptOffer}
                onRejectOffer={handleRejectOffer}
                respondingOfferId={respondingOfferId}
                downloadAttachment={downloadAttachment}
                onViewImage={setSelectedImage}
              />
            );
          })
        )}
        
        {/* Typing Indicator */}
        {currentTypingUsers.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-gray-800/80 text-gray-200 px-4 py-2 rounded-2xl">
              <div className="flex items-center space-x-1">
                <span className="text-sm">
                  {currentTypingUsers.map(u => u.userName).join(', ')} 
                  {currentTypingUsers.length === 1 ? ' is' : ' are'} typing
                </span>
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Selected Files, Commission and Offer Preview */}
      {(selectedFiles.length > 0 || selectedCommissionForAttachment || selectedOfferCommission) && (
        <div 
          className="absolute bottom-20 left-2 right-0 p-4 z-20" 
          style={{ backgroundColor: 'transparent', backdropFilter: 'none' }}
        >
          <div className={`flex gap-2 ${showAllAttachments ? 'flex-wrap' : 'flex-nowrap overflow-hidden'}`}>
            {(() => {
              // Create a combined array of all attachments
              const allAttachments = [
                ...selectedFiles.map((file, index) => ({ type: 'file', data: file, index })),
                ...(selectedCommissionForAttachment ? [{ type: 'commission', data: selectedCommissionForAttachment, index: -1 }] : []),
                ...(selectedOfferCommission ? [{ type: 'offer', data: selectedOfferCommission, index: -1 }] : [])
              ];
              
              // Calculate how many attachments can fit in one row
              const screenWidth = window.innerWidth;
              const availableWidth = screenWidth - 250; // Account for padding, margins, and other elements
              const attachmentWidth = 220; // More accurate estimate for each attachment
              
              const maxVisible = showAllAttachments ? allAttachments.length : Math.max(1, Math.floor(availableWidth / attachmentWidth));
              const visibleAttachments = showAllAttachments ? allAttachments : allAttachments.slice(0, maxVisible);
              const hiddenCount = allAttachments.length - maxVisible;
              
              // Debug logging
              console.log('Total attachments:', allAttachments.length, 'Max visible:', maxVisible, 'Hidden count:', hiddenCount);
              
              return (
                <>
                  {visibleAttachments.map((attachment) => {
                    if (attachment.type === 'file') {
                      const file = attachment.data as File;
                      return (
                        <div
                          key={`file-${attachment.index}`}
                          className="flex items-center space-x-2 rounded-lg p-2 flex-shrink-0"
                          style={{ backgroundColor: 'rgba(31, 41, 55, 1)' }}
                        >
                          <span className="text-sm text-gray-300 truncate max-w-32">
                            {file.name}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatFileSize(file.size)}
                          </span>
                          <button
                            onClick={() => removeFile(attachment.index)}
                            className="p-1 hover:bg-gray-700 rounded transition-colors"
                          >
                            <X className="w-3 h-3 text-gray-400" />
                          </button>
                        </div>
                      );
                    } else if (attachment.type === 'commission') {
                      const commission = attachment.data as Commission;
                      return (
                        <div
                          key="commission"
                          className="flex items-center space-x-2 rounded-lg p-2 border border-purple-500/30 flex-shrink-0"
                          style={{ backgroundColor: 'rgba(121, 31, 206, 0.5)' }}
                        >
                          <Briefcase className="w-4 h-4 text-purple-400" />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-purple-300 font-medium truncate">
                              {commission.subject}
                            </span>
                            <span className="text-xs text-purple-400 block">
                              {commission.referenceNumber}
                            </span>
                          </div>
                          <button
                            onClick={handleRemoveCommission}
                            className="p-1 hover:bg-purple-700/30 rounded transition-colors"
                          >
                            <X className="w-3 h-3 text-purple-400" />
                          </button>
                        </div>
                      );
                    } else if (attachment.type === 'offer') {
                      const offer = attachment.data as Commission;
                      return (
                        <div
                          key="offer"
                          className="flex items-center space-x-2 rounded-lg p-2 border border-amber-500/30 flex-shrink-0"
                          style={{ backgroundColor: 'rgba(148, 94, 2, 0.5)' }}
                        >
                          <span className="text-xs font-bold text-amber-400">OFFER</span>
                          <Briefcase className="w-4 h-4 text-amber-400" />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-amber-300 font-medium truncate">
                              {offer.subject}
                            </span>
                            <span className="text-xs text-amber-400 block">
                              ${selectedOfferPrice.toFixed(2)}
                            </span>
                          </div>
                          <button
                            onClick={handleRemoveOffer}
                            className="p-1 hover:bg-amber-700/30 rounded transition-colors"
                          >
                            <X className="w-3 h-3 text-amber-400" />
                          </button>
                        </div>
                      );
                    }
                    return null;
                  })}
                  
                  {/* Show "+X More" indicator if there are hidden attachments */}
                  {!showAllAttachments && hiddenCount > 0 && (
                    <button
                      onClick={() => setShowAllAttachments(true)}
                      className="flex items-center space-x-2 rounded-lg p-2 flex-shrink-0"
                      style={{ backgroundColor: 'rgba(31, 41, 55, 1)' }}
                    >
                      <span className="text-sm text-gray-300">
                        +{hiddenCount} More
                      </span>
                    </button>
                  )}
                  
                  {/* Show "Show Less" button when all are shown */}
                  {showAllAttachments && allAttachments.length > 3 && (
                    <button
                      onClick={() => setShowAllAttachments(false)}
                      className="flex items-center space-x-2 rounded-lg p-2 flex-shrink-0"
                      style={{ backgroundColor: 'rgba(31, 41, 55, 1)' }}
                    >
                      <span className="text-sm text-gray-300">
                        Show Less
                      </span>
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div 
        className="absolute bottom-0 left-0 right-0 flex items-center space-x-3 p-2 sm:p-3 z-20" 
        style={{ backgroundColor: 'transparent', backdropFilter: 'none' }}
      >
        {/* Add Menu Button - Detached and Rounded */}
        <div className="relative" ref={addMenuRef}>
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-colors"
            style={{ backgroundColor: '#19212c' }}
            disabled={isUploading}
          >
            {showAddMenu ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <Plus className="w-6 h-6 text-white" />
            )}
          </button>
          
          {/* Dropdown Menu */}
          {showAddMenu && (
            <div className="absolute bottom-full left-0 mb-2 bg-gray-800 border border-gray-400 rounded-lg shadow-lg min-w-[200px] z-50">
              <button
                onClick={handleUploadFile}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors first:rounded-t-lg ${
                  selectedFiles.length >= 8 
                    ? 'text-gray-500 cursor-not-allowed' 
                    : 'text-white hover:bg-gray-700'
                }`}
                disabled={selectedFiles.length >= 8}
              >
                <Paperclip className={`w-4 h-4 ${selectedFiles.length >= 8 ? 'text-gray-600' : 'text-gray-400'}`} />
                <span>
                  {selectedFiles.length >= 8 ? 'Upload limit reached' : 'Upload a file'}
                </span>
                <span className="text-xs text-gray-500 ml-auto">
                  {selectedFiles.length}/8
                </span>
              </button>
              <button
                onClick={handleReferCommission}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left text-white hover:bg-gray-700 transition-colors ${
                  !commissionFeatureAvailable ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={!commissionFeatureAvailable}
                title={!commissionFeatureAvailable ? 'Commission reference feature not available - database migration required' : ''}
              >
                <Briefcase className="w-4 h-4 text-gray-400" />
                <span>Refer a commission</span>
                {!commissionFeatureAvailable && (
                  <span className="text-xs text-gray-500 ml-auto">(Not Available)</span>
                )}
              </button>
              <button
                onClick={handleCreateOffer}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left text-white hover:bg-gray-700 transition-colors last:rounded-b-lg ${
                  !commissionFeatureAvailable ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={!commissionFeatureAvailable}
                title={!commissionFeatureAvailable ? 'Offer feature not available - database migration required' : ''}
              >
                <span className="text-xs font-bold text-amber-400">OFFER</span>
                <span>Create Offer</span>
                {!commissionFeatureAvailable && (
                  <span className="text-xs text-gray-500 ml-auto">(Not Available)</span>
                )}
              </button>
            </div>
          )}
        </div>
        
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip,.rar"
        />
        
        {/* Message Input Bar */}
        <div className="flex-1 flex items-center rounded-full px-4 py-3" style={{ backgroundColor: '#19212c' }}>
          <textarea
            value={messageInput}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Ask anything"
            className="flex-1 bg-transparent border-none text-white placeholder-gray-400 focus:outline-none resize-none text-sm"
            rows={1}
            style={{ minHeight: '20px', maxHeight: '90px' }}
          />
          
          {/* Microphone Icon */}
          <div className="ml-3">
            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
          </div>
          
          {/* Send Button */}
          <button
            onClick={handleSendMessage}
            disabled={(!messageInput.trim() && selectedFiles.length === 0 && !selectedCommissionForAttachment && !selectedOfferCommission) || isSending || isUploading}
            className="ml-3 w-10 h-10 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#9c7b6e' }}
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
        
        {/* Upload Progress */}
        {isUploading && (
          <div className="mt-2 text-sm text-gray-400">
            Uploading files...
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative group max-w-5xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage.fileUrl}
              alt={selectedImage.fileName}
              className="rounded-lg max-w-full max-h-[90vh] object-contain hover:scale-102 transition-transform duration-200"
            />
            <button
              onClick={() => downloadAttachment(selectedImage)}
              className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Download className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Nickname Modal */}
      {showNicknameModal && currentConversation && (
        <NicknameModal
          isOpen={showNicknameModal}
          initialValue={
            currentConversation.nickname?.trim() ||
            (isGroupChat
              ? otherParticipants.map(p => p.displayName).join(', ')
              : (otherParticipants[0]?.displayName || ''))
          }
          onClose={() => setShowNicknameModal(false)}
          onConfirm={async (nickname) => {
            if (!currentConversation) return;
            await updateConversationNickname(currentConversation.id, nickname);
          }}
        />
      )}

      {/* Commission Selector Modal */}
      <CommissionSelectorModal
        isOpen={showCommissionSelector}
        onClose={() => setShowCommissionSelector(false)}
        onSelectCommission={handleSelectCommission}
        conversationId={currentConversation?.id || ''}
      />

      {/* Commission Details Modal */}
      <CommissionDetailsModal
        isOpen={showCommissionDetails}
        onClose={() => {
          setShowCommissionDetails(false);
          setSelectedCommissionForView(null);
        }}
        commission={selectedCommissionForView}
        showPaymentButtons={false}
      />

      {/* Reset Conversation Modal */}
      {activeResetRequest && (
        <ResetConversationModal
          isOpen={showResetModal}
          onClose={() => setShowResetModal(false)}
          resetRequest={activeResetRequest}
          onAccept={handleAcceptReset}
          onCancel={handleCancelReset}
        />
      )}

      {/* Offer Selector Modal */}
      {currentConversation && (
        <OfferSelectorModal
          isOpen={showOfferSelector}
          onClose={() => setShowOfferSelector(false)}
          onSelectOffer={handleSelectOffer}
          conversationId={currentConversation.id}
        />
      )}

      {/* Offer Details Modal */}
      <OfferDetailsModal
        isOpen={showOfferDetails}
        onClose={() => {
          setShowOfferDetails(false);
          setSelectedOfferMessage(null);
        }}
        message={selectedOfferMessage}
        onAcceptOffer={handleAcceptOffer}
        onRejectOffer={handleRejectOffer}
      />
    </div>
  );
}
