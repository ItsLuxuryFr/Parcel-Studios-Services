import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Search, MessageSquare, Plus, MoreVertical, Trash2, Pin } from 'lucide-react';
import { useMessages } from '../contexts/MessageContext';
import { useAuth } from '../contexts/AuthContext';
import { formatTimestamp, truncateMessage, formatConversationTitle } from '../lib/messageHelpers';

interface ConversationsListProps {
  onNewChat: () => void;
}

export default function ConversationsList({ onNewChat }: ConversationsListProps) {
  const { 
    conversations, 
    currentConversation, 
    setCurrentConversation, 
    unreadCount,
    hideConversation,
    togglePinConversation,
    updateConversationOrder,
    loadConversations
  } = useMessages();
  
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [showMenuFor, setShowMenuFor] = useState<string | null>(null);
  
  // Drag state
  const [draggedConversation, setDraggedConversation] = useState<string | null>(null);
  const [placeholderIndex, setPlaceholderIndex] = useState<number | null>(null);
  const [placeholderSection, setPlaceholderSection] = useState<'pinned' | 'unpinned' | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [dragStartPosition, setDragStartPosition] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Refs for drag calculations
  const conversationsContainerRef = useRef<HTMLDivElement>(null);
  const pinnedSectionRef = useRef<HTMLDivElement>(null);
  const unpinnedSectionRef = useRef<HTMLDivElement>(null);
  const conversationRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter and sort conversations based on search query and pin status
  const { pinnedConversations, unpinnedConversations } = useMemo(() => {
    let result = conversations;
    
    // Filter by search query if present
    if (debouncedSearchQuery.trim() && user) {
      result = conversations.filter(conv => {
      const title = formatConversationTitle(conv.participants, user.id);
      const lastMessage = conv.lastMessage?.content || '';
      
      return title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
             lastMessage.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      });
    }
    
    // Separate pinned and unpinned FIRST to avoid ordering conflicts
    // This ensures each section can have independent displayOrder sequences (0, 1, 2...)
    const pinned = result.filter(conv => conv.isPinned);
    const unpinned = result.filter(conv => !conv.isPinned);
    
    // Sort function: by display_order if available, then by last message time
    const sortConversations = (a: any, b: any) => {
      // If both have display_order, sort by that
      if (a.displayOrder !== undefined && b.displayOrder !== undefined) {
        return a.displayOrder - b.displayOrder;
      }
      // If only one has display_order, prioritize it
      if (a.displayOrder !== undefined) return -1;
      if (b.displayOrder !== undefined) return 1;
      // Otherwise sort by last message time (most recent first)
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    };
    
    // Sort each section independently
    const sortedPinned = pinned.sort(sortConversations);
    const sortedUnpinned = unpinned.sort(sortConversations);
    
    return { pinnedConversations: sortedPinned, unpinnedConversations: sortedUnpinned };
  }, [conversations, debouncedSearchQuery, user]);

  const handleConversationSelect = (conversation: any) => {
    setCurrentConversation(conversation);
  };

  const handleHideConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent conversation selection
    setShowMenuFor(null);
    await hideConversation(conversationId);
  };

  const handleTogglePin = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent conversation selection
    setShowMenuFor(null);
    await togglePinConversation(conversationId);
  };

  const handleMenuToggle = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent conversation selection
    setShowMenuFor(showMenuFor === conversationId ? null : conversationId);
  };

  // Close menu when clicking outside
  const handleClickOutside = () => {
    setShowMenuFor(null);
  };

  // Calculate placeholder position based on mouse Y
  const calculatePlaceholderPosition = useCallback((mouseY: number, section: 'pinned' | 'unpinned') => {
    // Get the appropriate section
    const sectionRef = section === 'pinned' ? pinnedSectionRef : unpinnedSectionRef;
    const sectionElement = sectionRef.current;
    if (!sectionElement) return null;

    // Find which conversation item we're over
    // Filter out placeholder elements (they have the bg-blue-600/20 class pattern)
    const allItems = Array.from(sectionElement.children) as HTMLDivElement[];
    const conversationItems = allItems.filter(item => {
      // Exclude placeholder divs - they have both placeholder classes
      // A placeholder has both bg-blue-600/20 AND border-blue-500/30
      return !(item.classList.contains('bg-blue-600/20') && 
               item.classList.contains('border-blue-500/30'));
    });
    
    let insertIndex = 0;

    for (let i = 0; i < conversationItems.length; i++) {
      const item = conversationItems[i];
      const itemRect = item.getBoundingClientRect();
      const itemCenterY = itemRect.top + itemRect.height / 2;

      if (mouseY < itemCenterY) {
        insertIndex = i;
        break;
      }
      insertIndex = i + 1;
    }

    // Constrain to section bounds
    if (insertIndex < 0) insertIndex = 0;
    if (insertIndex > conversationItems.length) insertIndex = conversationItems.length;

    return insertIndex;
  }, []);

  // Handle mouse down - prepare for potential drag
  const handleMouseDown = useCallback((e: React.MouseEvent, conversationId: string, isPinned: boolean) => {
    // Don't start drag if clicking on buttons
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="button"]')) {
      return;
    }

    // Always clear any previous drag state when starting a new potential drag
    if (draggedConversation) {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
      setDraggedConversation(null);
      setIsDragging(false);
      setPlaceholderIndex(null);
      setPlaceholderSection(null);
      setDragPosition({ x: 0, y: 0 });
      setDragStartPosition({ x: 0, y: 0 });
      setDragOffset({ x: 0, y: 0 });
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    // Get the conversation element to calculate offset
    const conversationElement = conversationRefs.current.get(conversationId);
    if (conversationElement) {
      const rect = conversationElement.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      setDragOffset({ x: offsetX, y: offsetY });
    } else {
      // Fallback to center if element not found
      setDragOffset({ x: 160, y: 36 }); // Approximate center of conversation item
    }

    // Store initial position to detect movement
    const startPos = { x: e.clientX, y: e.clientY };
    setDragStartPosition(startPos);
    setDragPosition(startPos);
    setDraggedConversation(conversationId);
    setPlaceholderSection(isPinned ? 'pinned' : 'unpinned');

    // Set a timer to allow drag after a longer hold
    // If released before this, it will be a click
    clickTimerRef.current = setTimeout(() => {
      // After 800ms, allow drag to start on movement
      // Movement threshold will still apply
    }, 800);
  }, [draggedConversation]);

  // Handle mouse move during drag
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggedConversation || !placeholderSection) return;

    const DRAG_THRESHOLD = 5; // pixels of movement needed to start drag
    const currentPos = { x: e.clientX, y: e.clientY };
    const deltaX = Math.abs(currentPos.x - dragStartPosition.x);
    const deltaY = Math.abs(currentPos.y - dragStartPosition.y);
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Start dragging if moved beyond threshold (allow immediate drag on movement)
    if (!isDragging && distance > DRAG_THRESHOLD) {
      // Clear click timer since we're dragging
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
      setIsDragging(true);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    }

    if (isDragging || distance > DRAG_THRESHOLD) {
      // Update drag position for visual feedback
      setDragPosition(currentPos);

      const newIndex = calculatePlaceholderPosition(e.clientY, placeholderSection);
      if (newIndex !== null) {
        setPlaceholderIndex(newIndex);
      }
    }
  }, [isDragging, draggedConversation, placeholderSection, dragStartPosition, calculatePlaceholderPosition]);

  // Handle mouse up - end drag
  const handleMouseUp = useCallback(async () => {
    // Clear click timer
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }

    // If we were actually dragging, complete the drag operation
    if (isDragging && draggedConversation && placeholderIndex !== null && placeholderSection) {
      // Continue with drag completion logic below
    } else {
      // Just a click, not a drag - reset state immediately
      // The onClick handler will handle the click
      resetDragState();
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      return;
    }

    if (!isDragging || !draggedConversation || placeholderIndex === null || !placeholderSection) {
      resetDragState();
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      return;
    }

    // Get the conversations for the dragged section
    const sectionConversations = placeholderSection === 'pinned' ? pinnedConversations : unpinnedConversations;
    const draggedConv = sectionConversations.find(c => c.id === draggedConversation);
    
    if (!draggedConv) {
      resetDragState();
      return;
    }

    // Calculate new order
    const currentIndex = sectionConversations.findIndex(c => c.id === draggedConversation);
    if (currentIndex === -1) {
      resetDragState();
      return;
    }

    // Adjust placeholderIndex: if dragging down (placeholderIndex > currentIndex),
    // we need to account for the fact that removing the item will shift indices
    // The placeholderIndex is calculated based on the array with the dragged item still visible,
    // but after removal, indices shift. When dragging down, subtract 1.
    let adjustedPlaceholderIndex = placeholderIndex;
    if (placeholderIndex > currentIndex) {
      adjustedPlaceholderIndex = placeholderIndex - 1;
    }

    // Create new order array by moving the dragged conversation to its new position
    const newOrder = [...sectionConversations];
    const [removed] = newOrder.splice(currentIndex, 1);
    newOrder.splice(adjustedPlaceholderIndex, 0, removed);

    // Assign sequential order numbers (0, 1, 2, 3...) to ALL conversations in this section
    // This ensures clean sequential ordering with no gaps
    const orders = newOrder.map((conv, index) => ({
      conversationId: conv.id,
      displayOrder: index  // Sequential order: 0, 1, 2, 3, etc.
    }));

    // Reset drag state immediately (before async save)
    resetDragState();

    // Save to database in background
    updateConversationOrder(orders).catch((error) => {
      console.error('Error updating conversation order:', error);
      // On error, reload conversations from database to restore actual state
      // This is safer than trying to revert optimistically
      loadConversations().catch((reloadError) => {
        console.error('Error reloading conversations after failed order update:', reloadError);
      });
    });
  }, [isDragging, draggedConversation, placeholderIndex, placeholderSection, pinnedConversations, unpinnedConversations, updateConversationOrder, loadConversations]);

  // Reset drag state
  const resetDragState = useCallback(() => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
    setDraggedConversation(null);
    setIsDragging(false);
    setPlaceholderIndex(null);
    setPlaceholderSection(null);
    setDragPosition({ x: 0, y: 0 });
    setDragStartPosition({ x: 0, y: 0 });
    setDragOffset({ x: 0, y: 0 });
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  // Set up global mouse event listeners when a conversation is selected for potential dragging
  useEffect(() => {
    if (draggedConversation) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedConversation, handleMouseMove, handleMouseUp]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, []);

  // Get dragged conversation data for ghost element
  const draggedConversationData = useMemo(() => {
    if (!draggedConversation) return null;
    const allConversations = [...pinnedConversations, ...unpinnedConversations];
    return allConversations.find(c => c.id === draggedConversation);
  }, [draggedConversation, pinnedConversations, unpinnedConversations]);

  return (
    <div className="w-80 bg-black border-r border-purple-500/20 flex flex-col h-full" onClick={handleClickOutside}>
      {/* Header */}
      <div className="p-4 border-b border-purple-500/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Messages</h2>
          <button
            onClick={onNewChat}
            className="p-2 rounded-lg bg-purple-600 hover:bg-purple-500 transition-colors"
            title="New Chat"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-purple-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20"
          />
        </div>
      </div>

      {/* Dragging Ghost Element */}
      {isDragging && draggedConversationData && (
        <div
          className="fixed pointer-events-none z-50 w-80"
          style={{
            left: `${dragPosition.x - dragOffset.x}px`,
            top: `${dragPosition.y - dragOffset.y}px`,
          }}
        >
          <div className="p-3 rounded-lg bg-purple-600/20 border border-purple-500/30 shadow-2xl backdrop-blur-sm">
            {(() => {
              const otherParticipants = draggedConversationData.participants.filter(p => p.userId !== user?.id);
              const otherParticipant = otherParticipants[0];
              const title = formatConversationTitle(draggedConversationData.participants, user?.id || '', draggedConversationData.nickname);
              const lastMessage = draggedConversationData.lastMessage;
              const hasUnread = (draggedConversationData.unreadCount || 0) > 0;

              return (
                <div className="flex items-start space-x-3">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                      {otherParticipant?.avatar ? (
                        <img
                          src={otherParticipant.avatar}
                          alt={title}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-semibold text-lg">
                          {title.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    
                    {/* Online Status Indicator */}
                    {otherParticipant?.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-black rounded-full"></div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-white font-medium text-sm truncate">
                        {title}
                      </h3>
                      <span className="text-xs text-gray-400">
                        {lastMessage ? formatTimestamp(lastMessage.createdAt) : formatTimestamp(draggedConversationData.lastMessageAt)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-400 truncate">
                      {lastMessage ? (
                        <>
                          <span className={hasUnread ? 'text-white font-medium' : 'text-gray-400'}>
                            {lastMessage.senderName}: 
                          </span>
                          {' '}
                          <span className={hasUnread ? 'text-white' : 'text-gray-400'}>
                            {truncateMessage(lastMessage.content || '', 30)}
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-500 italic">No messages yet</span>
                      )}
                    </p>
                  </div>

                  {/* Unread Count Badge */}
                  {hasUnread && (
                    <div className="absolute top-2 bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium right-2">
                      {draggedConversationData.unreadCount}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto select-none" ref={conversationsContainerRef}>
        {(pinnedConversations.length === 0 && unpinnedConversations.length === 0) ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-sm">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </p>
            {!searchQuery && (
              <button
                onClick={onNewChat}
                className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm"
              >
                Start a conversation
              </button>
            )}
          </div>
        ) : (
          <div className="p-2">
            {/* Pinned Conversations */}
            {pinnedConversations.length > 0 && (
              <div ref={pinnedSectionRef}>
                {pinnedConversations.map((conversation, index) => {
                  // Insert placeholder before this item if needed
                  const showPlaceholderBefore = placeholderSection === 'pinned' && placeholderIndex === index;
                  
                  return (
                    <React.Fragment key={`fragment-${conversation.id}`}>
                      {showPlaceholderBefore && (
                        <div
                          className="relative p-3 rounded-lg mb-1 bg-blue-600/20 border border-blue-500/30"
                          style={{ height: '72px' }}
                        />
                      )}
                      <div
                        ref={(el) => {
                          if (el) conversationRefs.current.set(conversation.id, el);
                          else conversationRefs.current.delete(conversation.id);
                        }}
                        onMouseDown={(e) => handleMouseDown(e, conversation.id, true)}
                        onClick={(e) => {
                          if (isDragging) {
                            e.stopPropagation();
                            e.preventDefault();
                            return;
                          }
                          e.stopPropagation();
                          handleConversationSelect(conversation);
                        }}
                        className={`
                          relative rounded-lg cursor-pointer transition-all duration-200 group
                          ${isDragging && draggedConversation === conversation.id ? 'opacity-0 cursor-grabbing h-0 p-0 m-0 mb-0 overflow-hidden' : 'p-3 mb-1'}
                          ${currentConversation?.id === conversation.id 
                            ? 'bg-purple-600/20 border border-purple-500/30 glow-purple' 
                            : 'hover:bg-purple-500/10 border border-transparent'
                          }
                        `}
                      >
                        {(() => {
                          const otherParticipants = conversation.participants.filter(p => p.userId !== user?.id);
                          const otherParticipant = otherParticipants[0];
                          const title = formatConversationTitle(conversation.participants, user?.id || '', conversation.nickname);
                          const lastMessage = conversation.lastMessage;
                          const hasUnread = (conversation.unreadCount || 0) > 0;

                          return (
                            <>
                      {/* Blur overlay on hover */}
                      <div className="group-hover:backdrop-blur-sm group-hover:bg-black/20 transition-all duration-200 rounded-lg">
                        <div className="flex items-start space-x-3">
                          {/* Avatar */}
                          <div className="relative flex-shrink-0">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                              {otherParticipant?.avatar ? (
                                <img
                                  src={otherParticipant.avatar}
                                  alt={title}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-white font-semibold text-lg">
                                  {title.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            
                            {/* Online Status Indicator */}
                            {otherParticipant?.isOnline && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-black rounded-full"></div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                             <div className="flex items-center justify-between mb-1">
                               <h3 className="text-white font-medium text-sm truncate">
                                 {title}
                               </h3>
                               <div
                                 className={
                                   hasUnread
                                     ? 'flex flex-col items-end space-y-3'
                                     : 'flex items-center space-x-2'
                                 }
                               >
                                 {hasUnread && (
                                   <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                 )}
                                 <span className="text-xs text-gray-400 group-hover:opacity-0 transition-opacity duration-200">
                                   {lastMessage ? formatTimestamp(lastMessage.createdAt) : formatTimestamp(conversation.lastMessageAt)}
                                 </span>
                               </div>
                             </div>
                            
                            <p className="text-sm text-gray-400 truncate">
                              {lastMessage ? (
                                <>
                                  <span className={hasUnread ? 'text-white font-medium' : 'text-gray-400'}>
                                    {lastMessage.senderName}: 
                                  </span>
                                  {' '}
                                  <span className={hasUnread ? 'text-white' : 'text-gray-400'}>
                                    {truncateMessage(lastMessage.content || '', 30)}
                                  </span>
                                </>
                              ) : (
                                <span className="text-gray-500 italic">No messages yet</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Ellipsis menu button */}
                      <button
                        onClick={(e) => handleMenuToggle(conversation.id, e)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-full hover:bg-gray-700/50"
                        title="More options"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>

                      {/* Dropdown menu */}
                      {showMenuFor === conversation.id && (
                        <div 
                          className="absolute top-8 right-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 min-w-[120px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={(e) => handleTogglePin(conversation.id, e)}
                            className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 flex items-center space-x-2"
                          >
                            <Pin className="w-4 h-4" />
                            <span>Unpin</span>
                          </button>
                          <button
                            onClick={(e) => handleHideConversation(conversation.id, e)}
                            className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center space-x-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}

                      {/* Pin Indicator */}
                      {conversation.isPinned && (
                        <div className="absolute -top-1 -left-1 z-10">
                          <Pin className="w-6 h-6" strokeWidth={2} style={{ color: '#9c7b6e', transform: 'rotate(-15deg)' }} />
                        </div>
                      )}

                      {/* Unread Count Badge */}
                      {hasUnread && (
                        <div className="absolute top-2 bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium right-12">
                          {conversation.unreadCount}
                        </div>
                      )}
                            </>
                          );
                        })()}
                      </div>
                    </React.Fragment>
                  );
                })}
                
                {/* Show placeholder at end of pinned section if needed */}
                {placeholderSection === 'pinned' && placeholderIndex === pinnedConversations.length && (
                  <div
                    className="relative p-3 rounded-lg mb-1 bg-blue-600/20 border border-blue-500/30"
                    style={{ height: '72px' }}
                  />
                )}
              </div>
            )}
            
            {/* Divider between pinned and unpinned */}
            {pinnedConversations.length > 0 && unpinnedConversations.length > 0 && (
              <div className="flex justify-center my-2">
                <div className="border-t-2 border-gray-600/50 w-4/5"></div>
              </div>
            )}

            {/* Unpinned Conversations */}
            <div ref={unpinnedSectionRef}>
              {unpinnedConversations.map((conversation, index) => {
                // Insert placeholder before this item if needed
                const showPlaceholderBefore = placeholderSection === 'unpinned' && placeholderIndex === index;
                
                const isSelected = currentConversation?.id === conversation.id;
                const otherParticipants = conversation.participants.filter(p => p.userId !== user?.id);
                const otherParticipant = otherParticipants[0];
                const title = formatConversationTitle(conversation.participants, user?.id || '', conversation.nickname);
                const lastMessage = conversation.lastMessage;
                const hasUnread = (conversation.unreadCount || 0) > 0;

                return (
                  <React.Fragment key={`fragment-${conversation.id}`}>
                    {showPlaceholderBefore && (
                      <div
                        className="relative p-3 rounded-lg mb-1 bg-blue-600/20 border border-blue-500/30"
                        style={{ height: '72px' }}
                      />
                    )}
                    <div
                      ref={(el) => {
                        if (el) conversationRefs.current.set(conversation.id, el);
                        else conversationRefs.current.delete(conversation.id);
                      }}
                      onMouseDown={(e) => handleMouseDown(e, conversation.id, false)}
                      onClick={(e) => {
                        // Only prevent click if we were actually dragging
                        if (isDragging) {
                          e.stopPropagation();
                          e.preventDefault();
                          return;
                        }
                        // If not dragging, allow normal click
                        e.stopPropagation();
                        handleConversationSelect(conversation);
                      }}
                      className={`
                        relative rounded-lg cursor-pointer transition-all duration-200 group
                        ${isDragging && draggedConversation === conversation.id ? 'opacity-0 cursor-grabbing h-0 p-0 m-0 mb-0 overflow-hidden' : 'p-3 mb-1'}
                        ${isSelected 
                          ? 'bg-purple-600/20 border border-purple-500/30 glow-purple' 
                          : 'hover:bg-purple-500/10 border border-transparent'
                        }
                      `}
                    >
                  {/* Blur overlay on hover */}
                  <div className="group-hover:backdrop-blur-sm group-hover:bg-black/20 transition-all duration-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                          {otherParticipant?.avatar ? (
                            <img
                              src={otherParticipant.avatar}
                              alt={title}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-semibold text-lg">
                              {title.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        
                        {/* Online Status Indicator */}
                        {otherParticipant?.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-black rounded-full"></div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                         <div className="flex items-center justify-between mb-1">
                           <h3 className="text-white font-medium text-sm truncate">
                             {title}
                           </h3>
                           <div
                             className={
                               hasUnread
                                 ? 'flex flex-col items-end space-y-3'
                                 : 'flex items-center space-x-2'
                             }
                           >
                             {hasUnread && (
                               <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                             )}
                             <span className="text-xs text-gray-400 group-hover:opacity-0 transition-opacity duration-200">
                               {lastMessage ? formatTimestamp(lastMessage.createdAt) : formatTimestamp(conversation.lastMessageAt)}
                             </span>
                           </div>
                         </div>
                        
                        <p className="text-sm text-gray-400 truncate">
                          {lastMessage ? (
                            <>
                              <span className={hasUnread ? 'text-white font-medium' : 'text-gray-400'}>
                                {lastMessage.senderName}: 
                              </span>
                              {' '}
                              <span className={hasUnread ? 'text-white' : 'text-gray-400'}>
                                {truncateMessage(lastMessage.content || '', 30)}
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-500 italic">No messages yet</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Ellipsis menu button */}
                  <button
                    onClick={(e) => handleMenuToggle(conversation.id, e)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-full hover:bg-gray-700/50"
                    title="More options"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </button>

                  {/* Dropdown menu */}
                  {showMenuFor === conversation.id && (
                    <div 
                      className="absolute top-8 right-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 min-w-[120px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => handleTogglePin(conversation.id, e)}
                        className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 flex items-center space-x-2"
                      >
                        <Pin className="w-4 h-4" />
                        <span>Pin</span>
                      </button>
                      <button
                        onClick={(e) => handleHideConversation(conversation.id, e)}
                        className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center space-x-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}

                      {/* Unread Count Badge */}
                      {hasUnread && (
                        <div className="absolute top-2 bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium right-8">
                          {conversation.unreadCount}
                        </div>
                      )}
                    </div>
                  </React.Fragment>
                );
              })}
              
              {/* Show placeholder at end of unpinned section if needed */}
              {placeholderSection === 'unpinned' && placeholderIndex === unpinnedConversations.length && (
                <div
                  className="relative p-3 rounded-lg mb-1 bg-blue-600/20 border border-blue-500/30"
                  style={{ height: '72px' }}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-purple-500/20">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>{pinnedConversations.length + unpinnedConversations.length} conversation{(pinnedConversations.length + unpinnedConversations.length) !== 1 ? 's' : ''}</span>
          {unreadCount > 0 && (
            <span className="text-purple-400 font-medium">
              {unreadCount} unread
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
