import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { useMessages } from '../contexts/MessageContext';
import { useAuth } from '../contexts/AuthContext';
import ConversationsList from './ConversationsList';
import MessageThread from './MessageThread';
import NewChatModal from './NewChatModal';
import UserProfileModal from './UserProfileModal';
import GroupParticipantsModal from './GroupParticipantsModal';

interface MessagesLayoutProps {
  isAdmin?: boolean;
  containerHeight?: 'screen' | 'full';
}

export default function MessagesLayout({ isAdmin = false, containerHeight = 'screen' }: MessagesLayoutProps) {
  const { 
    currentConversation, 
    setCurrentConversation, 
    loadMessages, 
    loadConversations,
    conversations
  } = useMessages();
  
  const { user } = useAuth();
  
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversation) {
      loadMessages(currentConversation.id);
    }
  }, [currentConversation, loadMessages]);

  // Handle window resize and mobile detection
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768; // md breakpoint
      setIsMobile(mobile);
      
      // Close mobile menu when switching to desktop
      if (!mobile) {
        setIsMobileMenuOpen(false);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile menu when conversation changes
  useEffect(() => {
    if (isMobile && currentConversation) {
      setIsMobileMenuOpen(false);
    }
  }, [currentConversation, isMobile]);

  const handleNewChat = () => {
    setShowNewChatModal(true);
  };

  const handleConversationCreated = async (conversationId: string) => {
    // Reload conversations to get the new one
    await loadConversations();
    
    // Find and set the newly created conversation as current
    const newConversation = conversations.find(c => c.id === conversationId);
    if (newConversation) {
      setCurrentConversation(newConversation);
    }
    
    setShowNewChatModal(false);
  };

  const handleViewProfile = (participant: any) => {
    setSelectedUser(participant);
    setShowProfileModal(true);
  };

  const handleCloseProfile = () => {
    setShowProfileModal(false);
    setSelectedUser(null);
  };

  const handleViewUsers = () => {
    setShowGroupModal(true);
  };

  const handleAddUsers = () => {
    setShowGroupModal(true);
  };

  const handleCloseGroupModal = () => {
    setShowGroupModal(false);
  };

  const handleUsersAdded = async (newConversationId: string) => {
    // Reload conversations to get the new one
    await loadConversations();
    
    // Find and set the newly created conversation as current
    const newConversation = conversations.find(c => c.id === newConversationId);
    if (newConversation) {
      setCurrentConversation(newConversation);
    }
    
    setShowGroupModal(false);
  };

  if (!user) {
    return (
      <div className={`${containerHeight === 'screen' ? 'h-screen' : 'h-full'} flex items-center justify-center bg-black`}>
        <div className="text-center text-gray-400">
          <h3 className="text-lg font-medium mb-2">Authentication Required</h3>
          <p className="text-sm">Please log in to access messages</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${containerHeight === 'screen' ? 'h-screen' : 'h-full'} bg-black flex overflow-hidden relative`}>
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="fixed top-4 left-4 z-50 p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg shadow-lg transition-colors"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      )}

      {/* Mobile Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Conversations Sidebar */}
      <div className={`
        flex-shrink-0 transition-transform duration-300 ease-in-out
        ${isMobile 
          ? `fixed left-0 top-0 h-full w-80 z-50 transform ${
              isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }` 
          : 'relative'
        }
      `}>
        <ConversationsList onNewChat={handleNewChat} />
      </div>
      
      {/* Main Chat Area */}
      <div className="flex-1 min-w-0">
        <MessageThread onViewProfile={handleViewProfile} onViewUsers={handleViewUsers} onAddUsers={handleAddUsers} />
      </div>
      
      {/* Modals */}
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onConversationCreated={handleConversationCreated}
      />
      
      {selectedUser && (
        <UserProfileModal
          isOpen={showProfileModal}
          onClose={handleCloseProfile}
          user={selectedUser}
          isAdmin={isAdmin}
        />
      )}
      
      {currentConversation && (
        <GroupParticipantsModal
          isOpen={showGroupModal}
          onClose={handleCloseGroupModal}
          conversation={currentConversation}
          onUsersAdded={handleUsersAdded}
        />
      )}
    </div>
  );
}
