import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { AuthContext } from './AuthContext';
import { 
  Conversation, 
  Message, 
  MessageAttachment, 
  TypingIndicator, 
  ConversationParticipant,
  ConversationResetRequest 
} from '../types';

interface MessageContextType {
  // State
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  typingUsers: TypingIndicator[];
  isLoading: boolean;
  isSending: boolean;
  isUploading: boolean;
  unreadCount: number;
  activeResetRequest: ConversationResetRequest | null;
  connectionStatus: string;

  // Actions
  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: string, limit?: number, offset?: number) => Promise<void>;
  sendMessage: (conversationId: string, content: string, attachments?: File[], commissionId?: string, isOffer?: boolean, offerPrice?: number, offerComments?: string) => Promise<void>;
  createConversation: (participantIds: string[]) => Promise<string | null>;
  markAsRead: (conversationId: string) => Promise<void>;
  uploadAttachment: (file: File) => Promise<string>;
  deleteMessage: (messageId: string) => Promise<void>;
  hideConversation: (conversationId: string) => Promise<void>;
  updateConversationNickname: (conversationId: string, nickname: string) => Promise<void>;
  togglePinConversation: (conversationId: string) => Promise<void>;
  updateConversationOrder: (conversationOrders: { conversationId: string; displayOrder: number }[]) => Promise<void>;
  setTyping: (conversationId: string, isTyping: boolean) => void;
  setCurrentConversation: (conversation: Conversation | null) => void;
  searchUsers: (query: string) => Promise<ConversationParticipant[]>;
  requestConversationReset: (conversationId: string) => Promise<void>;
  acceptConversationReset: (resetRequestId: string) => Promise<void>;
  cancelConversationReset: (resetRequestId: string) => Promise<void>;
  respondToOffer: (messageId: string, status: 'accepted' | 'rejected') => Promise<void>;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export function MessageProvider({ children }: { children: React.ReactNode }) {
  const authContext = useContext(AuthContext);
  const user = authContext?.user || null;
  const isAuthenticated = !!user;
  
  // Debug logging
// console.log('MessageProvider initialized with:', { user: !!user, isAuthenticated });
  
  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeResetRequest, setActiveResetRequest] = useState<ConversationResetRequest | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('connecting');

  // Refs for cleanup
  const messageSubscription = useRef<any>(null);
  const typingSubscription = useRef<any>(null);
  const resetRequestSubscription = useRef<any>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Track pending order updates to prevent race conditions
  const pendingOrderUpdates = useRef<Map<string, number>>(new Map());
  
  // Ref for current conversation to avoid recreating loadConversations callback
  const currentConversationRef = useRef<Conversation | null>(null);

  // Load all conversations for the current user
  const loadConversations = useCallback(async () => {
    if (!user || !isAuthenticated) return;

    try {
      setIsLoading(true);
      
      // Use a single optimized query to get all conversation data
      const { data, error } = await supabase
        .rpc('get_user_conversations_with_participants', { p_user_id: user.id });

      if (error) {
        console.error('Error loading conversations:', error.message || error);
        return;
      }

      // Transform the data to match our Conversation interface
      const transformedConversations: Conversation[] = data.map((conv: any) => {
        // If there's a pending order update for this conversation, use it instead of the DB value
        // This prevents reloads from overwriting optimistic updates that are still being saved
        const pendingOrder = pendingOrderUpdates.current.get(conv.conversation_id);
        const displayOrder = pendingOrder !== undefined ? pendingOrder : (conv.display_order || undefined);
        
        return {
            id: conv.conversation_id,
            createdAt: conv.last_message_at,
            updatedAt: conv.last_message_at,
            lastMessageAt: conv.last_message_at,
        nickname: conv.nickname || undefined,
        participants: (conv.participants || []).map((p: any) => ({
              userId: p.user_id,
              displayName: p.display_name || 'Unknown',
              avatar: p.avatar,
              joinedAt: p.joined_at,
              lastReadAt: p.last_read_at,
              isOnline: false // We'll implement this later
            })),
            lastMessage: conv.last_message_content ? {
              id: '',
              conversationId: conv.conversation_id,
              senderId: conv.last_message_sender_id,
              senderName: conv.last_message_sender_name || 'Unknown',
              content: conv.last_message_content,
              attachments: [],
              createdAt: conv.last_message_at,
              isDeleted: false
            } : undefined,
            unreadCount: conv.unread_count || 0,
            isPinned: conv.is_pinned || false,
            displayOrder: displayOrder
        };
      });

      setConversations(transformedConversations);
      
      // Calculate total unread count (excluding current conversation)
      // Use ref to access current conversation without including it in dependency array
      const totalUnread = transformedConversations.reduce((sum, conv) => {
        // Don't count unread messages for the conversation we're currently viewing
        if (currentConversationRef.current && conv.id === currentConversationRef.current.id) {
          return sum;
        }
        return sum + (conv.unreadCount || 0);
      }, 0);
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, isAuthenticated]);

  // Load messages for a specific conversation with pagination
  const loadMessages = useCallback(async (conversationId: string, limit: number = 50, offset: number = 0) => {
    if (!user || !isAuthenticated) return;

    try {
      setIsLoading(true);
      // Only clear old messages on initial load (offset === 0)
      if (offset === 0) {
        setMessages([]);
      }
      // Use a single optimized query to get messages with all related data
      const { data: messagesData, error: messagesError } = await supabase
        .rpc('get_messages_with_details', { 
          p_conversation_id: conversationId,
          p_user_id: user.id,
          p_limit: limit,
          p_offset: offset
        });

      if (messagesError) {
        console.error('Error loading messages:', messagesError);
        return;
      }

      // Also load the active reset request for this conversation
      await loadActiveResetRequest(conversationId);

      // Transform the data to match our Message interface
      const messagesWithSenders: Message[] = messagesData.map((msg: any) => ({
            id: msg.id,
            conversationId: msg.conversation_id,
            senderId: msg.sender_id,
        senderName: msg.sender_name || 'Unknown',
        senderAvatar: msg.sender_avatar,
            content: msg.content,
        attachments: (msg.attachments && Array.isArray(msg.attachments) ? msg.attachments : []).map((att: any) => ({
              id: att.id,
              messageId: att.message_id,
          fileUrl: att.file_url,
              fileName: att.file_name,
              fileSize: att.file_size,
              fileType: att.file_type,
              createdAt: att.created_at
            })),
            createdAt: msg.created_at,
            isDeleted: msg.is_deleted,
            commissionId: msg.commission_id,
        commission: msg.commission ? {
          id: msg.commission.id,
          userId: msg.commission.user_id,
          taskComplexity: msg.commission.task_complexity,
          subject: msg.commission.subject,
          description: msg.commission.description,
          proposedAmount: msg.commission.proposed_amount,
          status: msg.commission.status,
          createdAt: msg.commission.created_at,
          updatedAt: msg.commission.updated_at,
          referenceNumber: msg.commission.reference_number,
          tags: msg.commission.tags || [],
          images: msg.commission.images || [],
          rejectionReason: msg.commission.rejection_reason,
          ownerName: msg.commission.owner_name,
          startedByAdminId: msg.commission.started_by_admin_id,
          startedByAdminName: msg.commission.started_by_admin_name,
          startedAt: msg.commission.started_at,
          progress: msg.commission.progress,
          completionFiles: msg.commission.completion_files || [],
          completedAt: msg.commission.completed_at,
          completedByAdminId: msg.commission.completed_by_admin_id,
          completedByAdminName: msg.commission.completed_by_admin_name,
          // Payment-related fields
          paymentStatus: msg.commission.payment_status,
          stripeProductId: msg.commission.stripe_product_id,
          stripePriceId: msg.commission.stripe_price_id,
          stripePaymentLinkUrl: msg.commission.stripe_payment_link_url,
          paidAt: msg.commission.paid_at,
          stripeSessionId: msg.commission.stripe_session_id,
          paymentType: msg.commission.payment_type || 'full'
        } : undefined,
            isOffer: msg.is_offer || false,
            offerPrice: msg.offer_price ? Number(msg.offer_price) : undefined,
            offerComments: msg.offer_comments || undefined,
            offerStatus: msg.offer_expired_at ? 'expired' : (msg.offer_status || undefined),
            offerRespondedAt: msg.offer_responded_at || undefined,
            offerExpiredAt: msg.offer_expired_at || undefined
      }));

      setMessages(messagesWithSenders);
      
      // If no messages loaded on initial load, wait 1.5 seconds before showing empty state
      if (offset === 0 && messagesWithSenders.length === 0) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, isAuthenticated]);

  // Upload file attachment
  const uploadAttachment = useCallback(async (file: File): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    try {
      setIsUploading(true);

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `attachments/${user.id}/${fileName}`;

      const { error } = await supabase.storage
        .from('message-attachments')
        .upload(filePath, file);

      if (error) {
        throw error;
      }

      // Get public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('message-attachments')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading attachment:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [user]);

  // Send a new message
  const sendMessage = useCallback(async (conversationId: string, content: string, attachments: File[] = [], commissionId?: string, isOffer?: boolean, offerPrice?: number, offerComments?: string) => {
    if (!user || !isAuthenticated || isSending) return;

    try {
      setIsSending(true);

      // Create the message
      const messageInsertData: any = {
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim() || null
      };

      // Add offer fields if this is an offer
      if (isOffer) {
        messageInsertData.is_offer = true;
        messageInsertData.offer_price = offerPrice;
        messageInsertData.offer_comments = offerComments || null;
        messageInsertData.offer_status = 'pending';
        // For offers, we need to link to the commission
        if (commissionId) {
          messageInsertData.commission_id = commissionId;
        }
      } else {
        // For regular commission references, add commission_id if it exists
        if (commissionId) {
          messageInsertData.commission_id = commissionId;
        }
      }

      let messageData: any;
      let messageError: any;

      const result = await supabase
        .from('messages')
        .insert(messageInsertData)
        .select()
        .single();
      
      messageData = result.data;
      messageError = result.error;

      if (messageError) {
        // If commission_id column doesn't exist, try without it
        if (messageError.code === 'PGRST204' && commissionId) {
          console.warn('Commission column not available, sending message without commission reference');
          const fallbackResult = await supabase
            .from('messages')
            .insert({
              conversation_id: conversationId,
              sender_id: user.id,
              content: content.trim() || null
            })
            .select()
            .single();
          
          if (fallbackResult.error) {
            console.error('Error sending message:', fallbackResult.error);
            return;
          }
          
          messageData = fallbackResult.data;
        } else {
          console.error('Error sending message:', messageError);
          return;
        }
      }

      // Upload attachments if any
      let uploadedAttachments: MessageAttachment[] = [];
      
      console.log('Processing attachments:', attachments.length, 'files');
      
      if (attachments.length > 0) {
        for (const file of attachments) {
          try {
            console.log('Uploading attachment:', file.name, file.size, file.type);
            const fileUrl = await uploadAttachment(file);
            console.log('Attachment uploaded, URL:', fileUrl);
            
            const { data: attachmentData, error: attachmentError } = await supabase
              .from('message_attachments')
              .insert({
                message_id: messageData.id,
                file_url: fileUrl,
                file_name: file.name,
                file_size: file.size,
                file_type: file.type
              })
              .select()
              .single();

            if (attachmentError) {
              console.error('Error saving attachment:', attachmentError);
              continue;
            }

            console.log('Attachment saved to database:', attachmentData);
            
            // Map database response to MessageAttachment interface
            const mappedAttachment: MessageAttachment = {
              id: attachmentData.id,
              messageId: attachmentData.message_id,
              fileUrl: attachmentData.file_url,
              fileName: attachmentData.file_name,
              fileSize: attachmentData.file_size,
              fileType: attachmentData.file_type,
              createdAt: attachmentData.created_at
            };
            
            uploadedAttachments.push(mappedAttachment);
          } catch (error) {
            console.error('Error uploading attachment:', error);
          }
        }
      }
      
      console.log('Final uploaded attachments:', uploadedAttachments.length, uploadedAttachments);

      // Get commission data if commissionId exists
      let commission = undefined;
      if (commissionId) {
        try {
          const { data: commissionData } = await supabase
            .from('commissions')
            .select('*')
            .eq('id', commissionId)
            .single();
          
          if (commissionData) {
            commission = {
              id: commissionData.id,
              userId: commissionData.user_id,
              taskComplexity: commissionData.task_complexity,
              subject: commissionData.subject,
              description: commissionData.description,
              proposedAmount: commissionData.proposed_amount,
              status: commissionData.status,
              createdAt: commissionData.created_at,
              updatedAt: commissionData.updated_at,
              referenceNumber: commissionData.reference_number,
              tags: commissionData.tags || [],
              images: commissionData.images || [],
              rejectionReason: commissionData.rejection_reason,
              ownerName: commissionData.owner_name,
              startedByAdminId: commissionData.started_by_admin_id,
              startedByAdminName: commissionData.started_by_admin_name,
              startedAt: commissionData.started_at,
              progress: commissionData.progress,
              completionFiles: commissionData.completion_files || [],
              completedAt: commissionData.completed_at,
              completedByAdminId: commissionData.completed_by_admin_id,
              completedByAdminName: commissionData.completed_by_admin_name,
              // Payment-related fields
              paymentStatus: commissionData.payment_status,
              stripeProductId: commissionData.stripe_product_id,
              stripePriceId: commissionData.stripe_price_id,
              stripePaymentLinkUrl: commissionData.stripe_payment_link_url,
              paidAt: commissionData.paid_at,
              stripeSessionId: commissionData.stripe_session_id,
              // stripeCheckoutSessionId: commissionData.stripe_checkout_session_id,
              // paymentAbandonedAt: commissionData.payment_abandoned_at,
              // productArchivedAt: commissionData.product_archived_at,
            };
          }
        } catch (error) {
          console.warn('Error loading commission data:', error);
        }
      }

      // Add the new message to local state with attachments, commission and offer fields (if applicable)
      const newMessage: Message = {
        id: messageData.id,
        conversationId: messageData.conversation_id,
        senderId: messageData.sender_id,
        senderName: user.displayName || 'You',
        senderAvatar: user.avatar,
        content: messageData.content,
        attachments: uploadedAttachments,
        createdAt: messageData.created_at,
        isDeleted: false,
        commissionId: commissionId,
        commission: commission,
        // ensure Offer UI is used immediately on sender side
        isOffer: !!isOffer,
        offerPrice: isOffer ? offerPrice : undefined,
        offerComments: isOffer ? (offerComments || undefined) : undefined,
        offerStatus: isOffer ? 'pending' : undefined
      };

      console.log('Adding message to local state:', {
        id: newMessage.id,
        attachments: uploadedAttachments.length,
        attachmentDetails: uploadedAttachments
      });

      setMessages(prev => {
        // Don't add if already exists (to prevent duplicates)
        if (prev.some(msg => msg.id === newMessage.id)) {
          console.log('Message already exists in local state, skipping duplicate');
          return prev;
        }
        console.log('Adding new message to local state:', newMessage.id, 'with', uploadedAttachments.length, 'attachments');
        return [...prev, newMessage];
      });

      // Update conversation list
      await loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  }, [user, isAuthenticated, isSending, uploadAttachment, loadConversations]);

  // Create a new conversation
  const createConversation = useCallback(async (participantIds: string[]): Promise<string | null> => {
    if (!user || !isAuthenticated) return null;

    try {
      const allParticipantIds = [user.id, ...participantIds];
      
      // First, try to find an existing conversation with the exact same participants (including hidden ones)
      const { data: existingConversationId, error: findError } = await supabase
        .rpc('find_conversation_by_participants', { p_user_ids: allParticipantIds });

      if (findError) {
        console.error('Error finding conversation by participants:', findError);
        return null;
      }

      if (existingConversationId) {
        // Found existing conversation, unhide it for the current user
        const { error: unhideError } = await supabase
          .rpc('unhide_conversation', { 
            p_conversation_id: existingConversationId, 
            p_user_id: user.id 
          });

        if (unhideError) {
          console.error('Error unhiding conversation:', unhideError);
          return null;
        }

        // Reload conversations to show the unhidden conversation
        await loadConversations();
        
        return existingConversationId;
      }

      // No existing conversation found, create a new one
      const { data: conversationData, error: conversationError } = await supabase
        .from('conversations')
        .insert({})
        .select()
        .single();

      if (conversationError) {
        console.error('Error creating conversation:', conversationError);
        console.error('Error details:', { code: conversationError.code, message: conversationError.message, hint: conversationError.hint });
        return null;
      }

      // Add participants (including current user)
      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert(
          allParticipantIds.map(participantId => ({
            conversation_id: conversationData.id,
            user_id: participantId
          }))
        );

      if (participantsError) {
        console.error('Error adding participants:', participantsError);
        console.error('Error details:', { code: participantsError.code, message: participantsError.message, hint: participantsError.hint });
        return null;
      }

      // Wait briefly for database consistency before reloading
      await new Promise(resolve => setTimeout(resolve, 500));

      // Reload conversations
      await loadConversations();
      
      return conversationData.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  }, [user, isAuthenticated, loadConversations]);

  // Mark conversation as read
  const markAsRead = useCallback(async (conversationId: string) => {
    if (!user || !isAuthenticated) return;

    try {
      const { error } = await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error marking as read:', error);
        return;
      }

      // Update local state
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, unreadCount: 0 }
          : conv
      ));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, [user, isAuthenticated]);

  // Delete a message
  const deleteMessage = useCallback(async (messageId: string) => {
    if (!user || !isAuthenticated) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_deleted: true })
        .eq('id', messageId)
        .eq('sender_id', user.id); // Only allow deleting own messages

      if (error) {
        console.error('Error deleting message:', error);
        return;
      }

      // Update local state
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }, [user, isAuthenticated]);

  // Hide a conversation (remove from user's view)
  const hideConversation = useCallback(async (conversationId: string) => {
    if (!user || !isAuthenticated) return;

    try {
      const { error } = await supabase
        .rpc('hide_conversation', {
          p_conversation_id: conversationId,
          p_user_id: user.id
        });

      if (error) {
        console.error('Error hiding conversation:', error);
        return;
      }

      // Remove conversation from local state
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      
      // If this was the current conversation, clear it
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error hiding conversation:', error);
    }
  }, [user, isAuthenticated, currentConversation]);

  // Update conversation nickname (shared/global)
  const updateConversationNickname = useCallback(async (conversationId: string, nickname: string) => {
    if (!user || !isAuthenticated) return;

    try {
      const { error } = await supabase
        .from('conversations')
        .update({ nickname: nickname.trim() || null })
        .eq('id', conversationId);

      if (error) {
        console.error('Error updating nickname:', error);
        return;
      }

      // Update local state immediately for responsiveness
      setConversations(prev => prev.map(conv => (
        conv.id === conversationId ? { ...conv, nickname: nickname.trim() || undefined } : conv
      )));

      // If this is current conversation, reflect there too
      if (currentConversation?.id === conversationId) {
        setCurrentConversation({ ...currentConversation, nickname: nickname.trim() || undefined });
      }
    } catch (error) {
      console.error('Error updating nickname:', error);
    }
  }, [user, isAuthenticated, currentConversation]);

  // Toggle pin conversation
  const togglePinConversation = useCallback(async (conversationId: string) => {
    if (!user || !isAuthenticated) return;

    try {
      // Get current pin status
      const conversation = conversations.find(c => c.id === conversationId);
      const newPinStatus = !conversation?.isPinned;

      // Update in database
      const { error } = await supabase
        .from('conversations')
        .update({ is_pinned: newPinStatus })
        .eq('id', conversationId);

      if (error) {
        console.error('Error toggling pin:', error);
        return;
      }

      // Update local state immediately for responsiveness
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId ? { ...conv, isPinned: newPinStatus } : conv
      ));

      // If this is current conversation, reflect there too
      if (currentConversation?.id === conversationId) {
        setCurrentConversation({ ...currentConversation, isPinned: newPinStatus });
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  }, [user, isAuthenticated, conversations, currentConversation]);

  // Update conversation display order
  // conversationOrders should contain ALL conversations in a section with sequential order numbers (0, 1, 2, 3, etc.)
  const updateConversationOrder = useCallback(async (conversationOrders: { conversationId: string; displayOrder: number }[]) => {
    if (!user || !isAuthenticated) return;

    // Track pending updates to prevent race conditions with loadConversations
    conversationOrders.forEach(({ conversationId, displayOrder }) => {
      pendingOrderUpdates.current.set(conversationId, displayOrder);
    });

    // Update local state immediately for instant feedback (optimistic update)
    // This ensures the UI reflects the new sequential order immediately
    setConversations(prev => {
      const updated = [...prev];
      conversationOrders.forEach(({ conversationId, displayOrder }) => {
        const index = updated.findIndex(c => c.id === conversationId);
        if (index !== -1) {
          updated[index] = { ...updated[index], displayOrder };
        }
      });
      return updated;
    });

    try {
      // Update ALL conversations in the section with sequential order numbers (0, 1, 2, 3, etc.)
      // This ensures clean sequential ordering in the database with no gaps
      const updates = conversationOrders.map(({ conversationId, displayOrder }) => 
        supabase
          .from('conversation_participants')
          .update({ display_order: displayOrder })
          .eq('conversation_id', conversationId)
          .eq('user_id', user.id)
      );

      const results = await Promise.all(updates);
      
      // Check for errors
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        // On error, remove pending updates and re-throw
        conversationOrders.forEach(({ conversationId }) => {
          pendingOrderUpdates.current.delete(conversationId);
        });
        console.error('Error updating conversation order:', errors);
        // Re-throw to allow caller to handle rollback
        throw new Error('Failed to update conversation order');
      }

      // Once save is complete, clear pending updates after a short delay
      // This ensures any in-flight loadConversations calls will have completed
      setTimeout(() => {
        conversationOrders.forEach(({ conversationId }) => {
          pendingOrderUpdates.current.delete(conversationId);
        });
      }, 100);

      // Optionally reload conversations to sync with database (can be removed if optimistic update is sufficient)
      // await loadConversations();
    } catch (error) {
      console.error('Error updating conversation order:', error);
      // Clear pending updates on error
      conversationOrders.forEach(({ conversationId }) => {
        pendingOrderUpdates.current.delete(conversationId);
      });
      // Re-throw to allow caller to handle rollback
      throw error;
    }
  }, [user, isAuthenticated]);

  // Set typing indicator
  const setTyping = useCallback((conversationId: string, isTyping: boolean) => {
    if (!user || !isAuthenticated) return;

    // Clear existing timeout
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }

    if (isTyping) {
      // Set typing indicator
      supabase.rpc('set_typing_indicator', {
        p_conversation_id: conversationId,
        p_user_id: user.id
      });

      // Auto-clear after 3 seconds
      typingTimeout.current = setTimeout(() => {
        supabase.rpc('clear_typing_indicator', {
          p_conversation_id: conversationId,
          p_user_id: user.id
        });
      }, 3000);
    } else {
      // Clear typing indicator immediately
      supabase.rpc('clear_typing_indicator', {
        p_conversation_id: conversationId,
        p_user_id: user.id
      });
    }
  }, [user, isAuthenticated]);

  // Search users for new conversations
  const searchUsers = useCallback(async (query: string): Promise<ConversationParticipant[]> => {
    if (!user || !isAuthenticated || !query.trim()) return [];

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar')
        .neq('id', user.id) // Exclude current user
        .or(`display_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(20);

      if (error) {
        console.error('Error searching users:', error);
        return [];
      }

      return data.map(profile => ({
        userId: profile.id,
        displayName: profile.display_name || 'Unknown',
        avatar: profile.avatar,
        joinedAt: new Date().toISOString(),
        isOnline: false // We'll implement online status later
      }));
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }, [user, isAuthenticated]);

  // Request conversation reset
  const requestConversationReset = useCallback(async (conversationId: string) => {
    if (!user || !isAuthenticated) return;

    try {
      const { error } = await supabase
        .rpc('request_conversation_reset', {
          p_conversation_id: conversationId,
          p_user_id: user.id
        });

      if (error) {
        console.error('Error requesting conversation reset:', error);
        throw error;
      }

      // Reload the active reset request for this conversation
      await loadActiveResetRequest(conversationId);
    } catch (error) {
      console.error('Error requesting conversation reset:', error);
      throw error;
    }
  }, [user, isAuthenticated]);

  // Accept conversation reset
  const acceptConversationReset = useCallback(async (resetRequestId: string) => {
    if (!user || !isAuthenticated) return;

    try {
      const { data, error } = await supabase
        .rpc('accept_conversation_reset', {
          p_reset_request_id: resetRequestId,
          p_user_id: user.id
        });

      if (error) {
        console.error('Error accepting conversation reset:', error);
        throw error;
      }

      // If all users accepted, reload messages and conversations
      if (data?.all_accepted) {
        setMessages([]);
        await loadConversations();
        setActiveResetRequest(null);
      } else {
        // Reload the active reset request to show updated acceptance count
        await loadActiveResetRequest(activeResetRequest?.conversationId || '');
      }
    } catch (error) {
      console.error('Error accepting conversation reset:', error);
      throw error;
    }
  }, [user, isAuthenticated, activeResetRequest, loadConversations]);

  // Cancel conversation reset
  const cancelConversationReset = useCallback(async (resetRequestId: string) => {
    if (!user || !isAuthenticated) return;

    try {
      const { error } = await supabase
        .rpc('cancel_conversation_reset', {
          p_reset_request_id: resetRequestId,
          p_user_id: user.id
        });

      if (error) {
        console.error('Error cancelling conversation reset:', error);
        throw error;
      }

      setActiveResetRequest(null);
    } catch (error) {
      console.error('Error cancelling conversation reset:', error);
      throw error;
    }
  }, [user, isAuthenticated]);

  // Respond to an offer (accept or reject)
  const respondToOffer = useCallback(async (messageId: string, status: 'accepted' | 'rejected') => {
    if (!user || !isAuthenticated) return;

    try {
      // Optimistically update UI immediately
      setMessages(prev => prev.map(m => m.id === messageId ? {
        ...m,
        offerStatus: status,
        offerRespondedAt: new Date().toISOString(),
        commission: (status === 'accepted' && m.commission && m.offerPrice)
          ? { ...m.commission, proposedAmount: m.offerPrice }
          : m.commission,
      } : m));

      // Try RPC first, fallback to direct update if RPC doesn't exist
      let rpcError: any = null;
      try {
        const { error } = await supabase.rpc('respond_to_offer', {
          p_message_id: messageId,
          p_status: status
        });
        rpcError = error;
      } catch (err) {
        rpcError = err;
      }

      if (rpcError) {
        console.warn('RPC failed, trying direct update:', rpcError);
        
        // Fallback: direct table update (may fail due to RLS)
        const { error: updateError } = await supabase
          .from('messages')
          .update({
            offer_status: status,
            offer_responded_at: new Date().toISOString()
          })
          .eq('id', messageId);

        if (updateError) {
          console.error('Error responding to offer (direct update):', updateError);
          throw updateError;
        }

        // If accepted, also update commission price
        if (status === 'accepted') {
          const message = messages.find(m => m.id === messageId);
          if (message?.commissionId && message?.offerPrice) {
            const { error: commissionError } = await supabase
              .from('commissions')
              .update({
                proposed_amount: message.offerPrice
              })
              .eq('id', message.commissionId);

            if (commissionError) {
              console.warn('Error updating commission price:', commissionError);
              // Don't throw - offer is already accepted
            }
          }
        }
      }

      // No full reload here; realtime UPDATE will sync others.
    } catch (error) {
      console.error('Error responding to offer:', error);
      // Best-effort correction on failure
      if (currentConversation) {
        await loadMessages(currentConversation.id);
      }
      throw error;
    }
  }, [user, isAuthenticated, currentConversation, loadMessages]);

  // Load active reset request for a conversation
  const loadActiveResetRequest = useCallback(async (conversationId: string) => {
    if (!user || !isAuthenticated || !conversationId) return;

    try {
      const { data, error } = await supabase
        .rpc('get_active_reset_request', {
          p_conversation_id: conversationId
        });

      if (error) {
        console.error('Error loading active reset request:', error);
        return;
      }

      if (data) {
        // Get the requester's name
        const { data: requester } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', data.requestedByUserId)
          .single();

        setActiveResetRequest({
          id: data.id,
          conversationId: data.conversationId,
          requestedByUserId: data.requestedByUserId,
          requestedByUserName: requester?.display_name || 'Unknown',
          createdAt: data.createdAt,
          expiresAt: data.expiresAt,
          status: data.status,
          acceptances: data.acceptances || [],
          totalParticipants: data.totalParticipants
        });
      } else {
        setActiveResetRequest(null);
      }
    } catch (error) {
      console.error('Error loading active reset request:', error);
      setActiveResetRequest(null);
    }
  }, [user, isAuthenticated]);

  // Set up realtime subscriptions with fallback to polling
  useEffect(() => {
    if (!user || !isAuthenticated) return;

    let pollInterval: NodeJS.Timeout | null = null;

    // Try to set up realtime subscription
    try {
      // Subscribe to messages
      messageSubscription.current = supabase
        .channel('db-messages-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
          },
          async (payload) => {
            const newMessage = payload.new as any;
            console.log('Real-time message received:', newMessage);
            
            // Skip processing if this message was sent by the current user
            // (to prevent duplicate messages from real-time subscription)
            if (newMessage.sender_id === user.id) {
              console.log('Skipping real-time message from current user to prevent duplicates');
              return;
            }
            
            // Check if this message is for a conversation the user is part of
            // Use a more efficient check by looking at current conversations
            const isUserInConversation = conversations.some(conv => conv.id === newMessage.conversation_id);
            
            if (!isUserInConversation) {
              console.log('User not in conversation, skipping message');
              return;
            }
            
              console.log('Processing real-time message for user');
            
            // Create a simplified message object for real-time updates
            const message: Message = {
              id: newMessage.id,
              conversationId: newMessage.conversation_id,
              senderId: newMessage.sender_id,
              senderName: newMessage.sender_name || 'Unknown',
              senderAvatar: newMessage.sender_avatar,
              content: newMessage.content,
              attachments: (newMessage.attachments && Array.isArray(newMessage.attachments) ? newMessage.attachments : []).map((att: any) => ({
                id: att.id,
                messageId: att.message_id,
                fileUrl: att.file_url,
                fileName: att.file_name,
                fileSize: att.file_size,
                fileType: att.file_type,
                createdAt: att.created_at
              })),
                createdAt: newMessage.created_at,
                isDeleted: newMessage.is_deleted,
                commissionId: newMessage.commission_id,
              commission: newMessage.commission ? {
                id: newMessage.commission.id,
                userId: newMessage.commission.user_id,
                taskComplexity: newMessage.commission.task_complexity,
                subject: newMessage.commission.subject,
                description: newMessage.commission.description,
                proposedAmount: newMessage.commission.proposed_amount,
                status: newMessage.commission.status,
                createdAt: newMessage.commission.created_at,
                updatedAt: newMessage.commission.updated_at,
                referenceNumber: newMessage.commission.reference_number,
                tags: newMessage.commission.tags || [],
                images: newMessage.commission.images || [],
                rejectionReason: newMessage.commission.rejection_reason,
                ownerName: newMessage.commission.owner_name,
                startedByAdminId: newMessage.commission.started_by_admin_id,
                startedByAdminName: newMessage.commission.started_by_admin_name,
                startedAt: newMessage.commission.started_at,
                progress: newMessage.commission.progress,
                completionFiles: newMessage.commission.completion_files || [],
                completedAt: newMessage.commission.completed_at,
                completedByAdminId: newMessage.commission.completed_by_admin_id,
                completedByAdminName: newMessage.commission.completed_by_admin_name,
                // Payment-related fields
                paymentStatus: newMessage.commission.payment_status,
                stripeProductId: newMessage.commission.stripe_product_id,
                stripePriceId: newMessage.commission.stripe_price_id,
                stripePaymentLinkUrl: newMessage.commission.stripe_payment_link_url,
                paidAt: newMessage.commission.paid_at,
                stripeSessionId: newMessage.commission.stripe_session_id
              } : undefined,
                isOffer: newMessage.is_offer || false,
                offerPrice: newMessage.offer_price ? Number(newMessage.offer_price) : undefined,
                offerComments: newMessage.offer_comments || undefined,
                offerStatus: newMessage.offer_expired_at ? 'expired' : (newMessage.offer_status || undefined),
                offerRespondedAt: newMessage.offer_responded_at || undefined,
              offerExpiredAt: newMessage.offer_expired_at || undefined,
              // Set loading states based on what data is missing
              isCommissionLoading: newMessage.commission_id && !newMessage.commission,
              isOfferLoading: newMessage.is_offer && !newMessage.commission,
              isAttachmentLoading: newMessage.attachments && newMessage.attachments.length === 0 && newMessage.attachments.some((att: any) => !att.file_url)
              };

              setMessages(prev => {
                // Only update if we're viewing this conversation
                if (currentConversation?.id === newMessage.conversation_id) {
                  // Don't add if already exists (to prevent duplicates)
                  if (prev.some(msg => msg.id === message.id)) {
                    console.log('Message already exists, skipping duplicate');
                    return prev;
                  }
                console.log('Adding new message to state:', message.id);
                  return [...prev, message];
                }
                return prev;
              });

            // If this message has loading states, try to fetch the full data
            if (message.isCommissionLoading || message.isOfferLoading || message.isAttachmentLoading) {
              console.log('Message has loading states, fetching full data...');
              // Trigger a reload of messages to get the complete data
              setTimeout(() => {
                loadMessages(currentConversation?.id || '', 50, 0);
              }, 1000);
            }

              // Reload conversations to update last message and unhide if needed
              // Only reload if this is not the current conversation (to avoid unnecessary updates)
              if (currentConversation?.id !== newMessage.conversation_id) {
                loadConversations();
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages'
          },
          async (payload) => {
            const updatedMessage = payload.new as any;
            console.log('Real-time message update received:', updatedMessage);
            
            // Check if this message is for a conversation the user is part of
            const { data: participantData, error: participantError } = await supabase
              .from('conversation_participants')
              .select('conversation_id')
              .eq('conversation_id', updatedMessage.conversation_id)
              .eq('user_id', user.id)
              .single();
            
            if (participantError || !participantData) {
              console.log('User not in conversation or error:', participantError);
              return;
            }
            
            // Update the message in state (particularly for offer status changes)
            setMessages(prev => {
              if (currentConversation?.id === updatedMessage.conversation_id) {
                return prev.map(msg => {
                  if (msg.id === updatedMessage.id) {
                    return {
                      ...msg,
                      offerStatus: updatedMessage.offer_expired_at ? 'expired' : (updatedMessage.offer_status || msg.offerStatus),
                      offerRespondedAt: updatedMessage.offer_responded_at || msg.offerRespondedAt,
                      offerExpiredAt: updatedMessage.offer_expired_at || msg.offerExpiredAt,
                      commission: (updatedMessage.offer_status === 'accepted' && msg.commission && (msg.offerPrice || updatedMessage.offer_price))
                        ? { ...msg.commission, proposedAmount: Number(msg.offerPrice || updatedMessage.offer_price) }
                        : msg.commission
                    };
                  }
                  return msg;
                });
              }
              return prev;
            });
          }
        )
        .subscribe((status) => {
          console.log('Message subscription status:', status);
          setConnectionStatus(status);
          
          // If realtime fails, fall back to polling
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            console.log('Realtime failed, falling back to polling. Status:', status);
            
            // Start polling for new messages every 2 seconds
            pollInterval = setInterval(async () => {
              if (currentConversation) {
                // Only reload if we have a current conversation
                await loadMessages(currentConversation.id);
              }
            }, 2000);
          }
        });
    } catch (error) {
      console.error('Realtime subscription failed, using polling fallback:', error);
      
      // Start polling for new messages every 2 seconds
      pollInterval = setInterval(async () => {
        if (currentConversation) {
          // Only reload if we have a current conversation
          await loadMessages(currentConversation.id);
        }
      }, 2000);
    }

    // Subscribe to message attachments
    const attachmentSubscription = supabase
      .channel('db-message-attachments-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_attachments'
        },
        async (payload) => {
          const newAttachment = payload.new as any;
          console.log('Real-time attachment received:', newAttachment);
          
          // Update the message in state with the new attachment
          setMessages(prev => prev.map(msg => {
            if (msg.id === newAttachment.message_id) {
              const updatedAttachments = [...msg.attachments, {
                id: newAttachment.id,
                messageId: newAttachment.message_id,
                fileUrl: newAttachment.file_url,
                fileName: newAttachment.file_name,
                fileSize: newAttachment.file_size,
                fileType: newAttachment.file_type,
                createdAt: newAttachment.created_at
              }];
              
              console.log('Updating message with new attachment:', msg.id, 'now has', updatedAttachments.length, 'attachments');
              
              return {
                ...msg,
                attachments: updatedAttachments
              };
            }
            return msg;
          }));
        }
      )
      .subscribe((status) => {
        console.log('Attachment subscription status:', status);
      });

    // Subscribe to typing indicators
    typingSubscription.current = supabase
      .channel('db-typing-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators'
        },
        (payload) => {
          const typingData = payload.new || payload.old;
          if (!typingData) return;

          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setTypingUsers(prev => {
              const filtered = prev.filter(t => !(t.conversationId === (typingData as any).conversation_id && t.userId === (typingData as any).user_id));
              return [...filtered, {
                conversationId: (typingData as any).conversation_id,
                userId: (typingData as any).user_id,
                userName: 'User', // We'll get the actual name later
                updatedAt: (typingData as any).updated_at
              }];
            });
          } else if (payload.eventType === 'DELETE') {
            setTypingUsers(prev => prev.filter(t => !(t.conversationId === (typingData as any).conversation_id && t.userId === (typingData as any).user_id)));
          }
        }
      )
      .subscribe((status) => {
        console.log('Typing subscription status:', status);
      });

    // Subscribe to reset requests
    resetRequestSubscription.current = supabase
      .channel('db-reset-requests-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_reset_requests'
        },
        async (payload) => {
          const newResetRequest = payload.new as any;
          console.log('Real-time reset request created:', newResetRequest);
          
          // Check if this reset request is for a conversation the user is part of
          const { data: participantData, error: participantError } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('conversation_id', newResetRequest.conversation_id)
            .eq('user_id', user.id)
            .single();
          
          if (participantError) {
            console.log('User not in conversation for reset request:', participantError);
            return;
          }
          
          if (participantData) {
            console.log('Processing real-time reset request for user');
            // Only load the active reset request if this is the current conversation
            if (currentConversation?.id === newResetRequest.conversation_id) {
              await loadActiveResetRequest(newResetRequest.conversation_id);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversation_reset_requests'
        },
        async (payload) => {
          const updatedResetRequest = payload.new as any;
          console.log('Real-time reset request updated:', updatedResetRequest);
          
          // Check if this reset request is for a conversation the user is part of
          const { data: participantData, error: participantError } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('conversation_id', updatedResetRequest.conversation_id)
            .eq('user_id', user.id)
            .single();
          
          if (participantError) {
            console.log('User not in conversation for reset request update:', participantError);
            return;
          }
          
          if (participantData) {
            console.log('Processing real-time reset request update for user');
            
            // Handle different status changes
            if (updatedResetRequest.status === 'accepted') {
              // Reset was accepted, clear messages and reload conversations
              setMessages([]);
              await loadConversations();
              setActiveResetRequest(null);
            } else if (updatedResetRequest.status === 'cancelled' || updatedResetRequest.status === 'expired') {
              // Reset was cancelled or expired, clear active reset request
              setActiveResetRequest(null);
            } else {
              // Other updates, only reload if this is the current conversation
              if (currentConversation?.id === updatedResetRequest.conversation_id) {
                await loadActiveResetRequest(updatedResetRequest.conversation_id);
              }
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_reset_acceptances'
        },
        async (payload) => {
          const newAcceptance = payload.new as any;
          console.log('Real-time reset request acceptance:', newAcceptance);
          
          // Get the reset request to find the conversation
          const { data: resetRequest, error: resetRequestError } = await supabase
            .from('conversation_reset_requests')
            .select('conversation_id')
            .eq('id', newAcceptance.reset_request_id)
            .single();
          
          if (resetRequestError || !resetRequest) {
            console.log('Could not find reset request for acceptance:', resetRequestError);
            return;
          }
          
          // Check if this reset request is for a conversation the user is part of
          const { data: participantData, error: participantError } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('conversation_id', resetRequest.conversation_id)
            .eq('user_id', user.id)
            .single();
          
          if (participantError) {
            console.log('User not in conversation for reset request acceptance:', participantError);
            return;
          }
          
          if (participantData) {
            console.log('Processing real-time reset request acceptance for user');
            // Only reload the active reset request if this is the current conversation
            if (currentConversation?.id === resetRequest.conversation_id) {
              await loadActiveResetRequest(resetRequest.conversation_id);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Reset request subscription status:', status);
      });

    // Cleanup function
    return () => {
      if (messageSubscription.current) {
        supabase.removeChannel(messageSubscription.current);
        messageSubscription.current = null;
      }
      if (attachmentSubscription) {
        supabase.removeChannel(attachmentSubscription);
      }
      if (typingSubscription.current) {
        supabase.removeChannel(typingSubscription.current);
        typingSubscription.current = null;
      }
      if (resetRequestSubscription.current) {
        supabase.removeChannel(resetRequestSubscription.current);
        resetRequestSubscription.current = null;
      }
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
        typingTimeout.current = null;
      }
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [user, isAuthenticated, loadConversations, currentConversation]);

  // Keep ref in sync with currentConversation state
  useEffect(() => {
    currentConversationRef.current = currentConversation;
  }, [currentConversation]);

  // Recalculate unread count when current conversation changes
  useEffect(() => {
    if (conversations.length > 0) {
      const totalUnread = conversations.reduce((sum, conv) => {
        // Don't count unread messages for the conversation we're currently viewing
        if (currentConversation && conv.id === currentConversation.id) {
          return sum;
        }
        return sum + (conv.unreadCount || 0);
      }, 0);
      setUnreadCount(totalUnread);
    }
  }, [currentConversation, conversations]);

  // Load conversations on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      loadConversations();
    }
  }, [isAuthenticated, user, loadConversations]);

  // Mark current conversation as read when messages change
  useEffect(() => {
    if (currentConversation && messages.length > 0) {
      markAsRead(currentConversation.id);
    }
  }, [currentConversation, messages, markAsRead]);

  const value: MessageContextType = {
    conversations,
    currentConversation,
    messages,
    typingUsers,
    isLoading,
    isSending,
    isUploading,
    unreadCount,
    activeResetRequest,
    connectionStatus,
    loadConversations,
    loadMessages,
    sendMessage,
    createConversation,
    markAsRead,
    uploadAttachment,
    deleteMessage,
    hideConversation,
    updateConversationNickname,
    togglePinConversation,
    updateConversationOrder,
    setTyping,
    setCurrentConversation,
    searchUsers,
    requestConversationReset,
    acceptConversationReset,
    cancelConversationReset,
    respondToOffer
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
}

export function useMessages() {
  const context = useContext(MessageContext);
  if (context === undefined) {
    console.error('MessageContext is undefined. This usually means the MessageProvider is not properly wrapping the component.');
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
}
