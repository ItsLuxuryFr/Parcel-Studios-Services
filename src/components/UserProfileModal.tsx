import React from 'react';
import { X, User, Mail, Calendar, Shield, Ban, VolumeX } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    userId: string;
    displayName: string;
    avatar?: string;
    email?: string;
    bio?: string;
    joinDate?: string;
    isOnline?: boolean;
  };
  isAdmin?: boolean;
}

export default function UserProfileModal({ 
  isOpen, 
  onClose, 
  user, 
  isAdmin = false 
}: UserProfileModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 glass-dark rounded-xl border border-purple-500/20 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-purple-500/20">
          <h2 className="text-xl font-bold text-white">User Profile</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Avatar and Basic Info */}
          <div className="text-center mb-6">
            <div className="relative inline-block mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center mx-auto">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.displayName}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-2xl">
                    {user.displayName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              {user.isOnline && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-black rounded-full"></div>
              )}
            </div>
            
            <h3 className="text-xl font-bold text-white mb-1">{user.displayName}</h3>
            <p className="text-sm text-gray-400">@{user.userId.slice(0, 8)}</p>
            {user.isOnline ? (
              <span className="inline-block mt-2 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                Online
              </span>
            ) : (
              <span className="inline-block mt-2 px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full">
                Offline
              </span>
            )}
          </div>

          {/* User Details */}
          <div className="space-y-4 mb-6">
            {user.email && (
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">{user.email}</span>
              </div>
            )}
            
            {user.joinDate && (
              <div className="flex items-center space-x-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">
                  Joined {new Date(user.joinDate).toLocaleDateString()}
                </span>
              </div>
            )}
            
            {user.bio && (
              <div className="flex items-start space-x-3">
                <User className="w-4 h-4 text-gray-400 mt-0.5" />
                <p className="text-sm text-gray-300">{user.bio}</p>
              </div>
            )}
          </div>

          {/* Admin Actions */}
          {isAdmin && (
            <div className="border-t border-purple-500/20 pt-4">
              <h4 className="text-sm font-medium text-gray-300 mb-3">Admin Actions</h4>
              <div className="space-y-2">
                <button className="w-full flex items-center space-x-2 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                  <Ban className="w-4 h-4" />
                  <span className="text-sm">Ban User</span>
                </button>
                <button className="w-full flex items-center space-x-2 px-3 py-2 text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors">
                  <VolumeX className="w-4 h-4" />
                  <span className="text-sm">Mute User</span>
                </button>
                <button className="w-full flex items-center space-x-2 px-3 py-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm">View Moderation History</span>
                </button>
              </div>
            </div>
          )}

          {/* Close Button */}
          <div className="mt-6">
            <button
              onClick={onClose}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
