import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, User, MessageSquare } from 'lucide-react';
import { useMessages } from '../contexts/MessageContext';
import { useAuth } from '../contexts/AuthContext';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: (conversationId: string) => void;
}

export default function NewChatModal({ isOpen, onClose, onConversationCreated }: NewChatModalProps) {
  const { searchUsers, createConversation, conversations } = useMessages();
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchUsers(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching users:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchUsers]);

  // Show all users in search results (no filtering based on existing conversations)
  const availableUsers = useMemo(() => {
    return searchResults;
  }, [searchResults]);

  const handleUserSelect = (selectedUser: any) => {
    // Check if user is already selected
    if (selectedUsers.some(u => u.userId === selectedUser.userId)) {
      return;
    }
    
    setSelectedUsers(prev => [...prev, selectedUser]);
  };

  const handleUserRemove = (userId: string) => {
    setSelectedUsers(prev => prev.filter(u => u.userId !== userId));
  };

  const handleStartConversation = async () => {
    if (selectedUsers.length === 0 || isCreating) return;

    setIsCreating(true);
    try {
      const participantIds = selectedUsers.map(u => u.userId);
      const conversationId = await createConversation(participantIds);
      
      if (conversationId) {
        onConversationCreated(conversationId);
        handleClose();
      } else {
        // Show error feedback
        alert('Failed to create conversation. Please try again.');
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Failed to create conversation. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUsers([]);
    setIsCreating(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 glass-dark rounded-xl border border-purple-500/20 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-purple-500/20">
          <h2 className="text-xl font-bold text-white">New Chat</h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Search Input */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-purple-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20"
              autoFocus
            />
          </div>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Selected Users</h3>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <div
                    key={user.userId}
                    className="flex items-center space-x-2 bg-purple-600/20 border border-purple-500/30 rounded-lg px-3 py-2"
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.displayName}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-xs font-semibold">
                          {user.displayName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-white">{user.displayName}</span>
                    <button
                      onClick={() => handleUserRemove(user.userId)}
                      className="p-1 hover:bg-purple-500/30 rounded transition-colors"
                    >
                      <X className="w-3 h-3 text-gray-300" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {searchQuery && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-300 mb-3">
                {isSearching ? 'Searching...' : 'Search Results'}
              </h3>
              
              {isSearching ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                </div>
              ) : availableUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No users found</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableUsers.map((user) => (
                    <button
                      key={user.userId}
                      onClick={() => handleUserSelect(user)}
                      disabled={selectedUsers.some(u => u.userId === user.userId)}
                      className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-800/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.displayName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-semibold">
                            {user.displayName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-white font-medium">{user.displayName}</p>
                        <p className="text-sm text-gray-400">@{user.userId.slice(0, 8)}</p>
                      </div>
                      {selectedUsers.some(u => u.userId === user.userId) && (
                        <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center">
                          <X className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Start Conversation Button */}
          {selectedUsers.length > 0 && (
            <button
              onClick={handleStartConversation}
              disabled={isCreating}
              className="w-full flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{isCreating ? 'Creating...' : 'Start Conversation'}</span>
            </button>
          )}

          {/* Empty State */}
          {!searchQuery && selectedUsers.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Start a new conversation</h3>
              <p className="text-sm">Search for users to start chatting with them</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
