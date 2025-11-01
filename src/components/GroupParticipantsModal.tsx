import React, { useState, useEffect } from 'react';
import { X, Users, UserPlus, Search, Check } from 'lucide-react';
import { useMessages } from '../contexts/MessageContext';
import { useAuth } from '../contexts/AuthContext';

interface GroupParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: {
    id: string;
    participants: Array<{
      userId: string;
      displayName: string;
      avatar?: string;
      isOnline?: boolean;
    }>;
  };
  onUsersAdded: (newConversationId: string) => void;
}

export default function GroupParticipantsModal({ 
  isOpen, 
  onClose, 
  conversation,
  onUsersAdded 
}: GroupParticipantsModalProps) {
  const { searchUsers, createConversation } = useMessages();
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedUsers([]);
    }
  }, [isOpen]);

  // Search users when query changes
  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchUsers(searchQuery);
        // Filter out users already in the conversation
        const existingUserIds = conversation.participants.map(p => p.userId);
        const filteredResults = results.filter(user => !existingUserIds.includes(user.userId));
        setSearchResults(filteredResults);
      } catch (error) {
        console.error('Error searching users:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, conversation.participants, searchUsers]);

  const handleUserSelect = (user: any) => {
    setSelectedUsers(prev => {
      if (prev.some(u => u.userId === user.userId)) {
        return prev.filter(u => u.userId !== user.userId);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleAddUsers = async () => {
    if (selectedUsers.length === 0) return;

    setIsCreating(true);
    try {
      // Get all existing participant IDs (excluding current user)
      const existingParticipantIds = conversation.participants
        .filter(p => p.userId !== user?.id)
        .map(p => p.userId);
      
      // Add new user IDs
      const allParticipantIds = [...existingParticipantIds, ...selectedUsers.map(u => u.userId)];
      
      // Create new conversation
      const newConversationId = await createConversation(allParticipantIds);
      
      if (newConversationId) {
        onUsersAdded(newConversationId);
        onClose();
      }
    } catch (error) {
      console.error('Error creating group conversation:', error);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  const otherParticipants = conversation.participants.filter(p => p.userId !== user?.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 glass-dark rounded-xl border border-purple-500/20 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-purple-500/20">
          <div className="flex items-center space-x-3">
            <Users className="w-6 h-6 text-purple-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Group Participants</h2>
              <p className="text-sm text-gray-400">
                {conversation.participants.length} member{conversation.participants.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Current Participants */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Current Members</h3>
            <div className="space-y-3">
              {conversation.participants.map((participant) => (
                <div key={participant.userId} className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                      {participant.avatar ? (
                        <img
                          src={participant.avatar}
                          alt={participant.displayName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-semibold text-sm">
                          {participant.displayName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    {participant.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-black rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">
                      {participant.displayName}
                      {participant.userId === user?.id && (
                        <span className="ml-2 px-2 py-1 bg-purple-600/20 text-purple-400 text-xs rounded-full">
                          You
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Users Section */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Add Members</h3>
            
            {/* Search Input */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users to add..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-purple-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20"
              />
            </div>

            {/* Search Results */}
            {searchQuery && (
              <div className="mb-4 max-h-48 overflow-y-auto">
                {isSearching ? (
                  <div className="text-center py-4 text-gray-400">
                    <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-2">
                    {searchResults.map((user) => (
                      <button
                        key={user.userId}
                        onClick={() => handleUserSelect(user)}
                        className="w-full flex items-center space-x-3 p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.displayName}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-semibold text-xs">
                              {user.displayName.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-white font-medium">{user.displayName}</p>
                        </div>
                        {selectedUsers.some(u => u.userId === user.userId) && (
                          <Check className="w-5 h-5 text-purple-400" />
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-400">
                    No users found
                  </div>
                )}
              </div>
            )}

            {/* Selected Users */}
            {selectedUsers.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-2">Selected users:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((user) => (
                    <div
                      key={user.userId}
                      className="flex items-center space-x-2 bg-purple-600/20 text-purple-300 px-3 py-1 rounded-full text-sm"
                    >
                      <span>{user.displayName}</span>
                      <button
                        onClick={() => handleUserSelect(user)}
                        className="hover:text-purple-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Users Button */}
            <button
              onClick={handleAddUsers}
              disabled={selectedUsers.length === 0 || isCreating}
              className="w-full flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              <UserPlus className="w-5 h-5" />
              <span>
                {isCreating 
                  ? 'Creating Group...' 
                  : `Add ${selectedUsers.length} User${selectedUsers.length !== 1 ? 's' : ''}`
                }
              </span>
            </button>

            {/* Info Message */}
            <p className="text-xs text-gray-400 mt-3 text-center">
              A new group conversation will be created with {conversation.participants.length + selectedUsers.length} members
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
