import React, { useState, useEffect } from 'react';
import { X, Clock, CheckCircle, AlertCircle, User, Users } from 'lucide-react';
import { ConversationResetRequest } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface ResetConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  resetRequest: ConversationResetRequest;
  onAccept: () => void;
  onCancel: () => void;
}

export default function ResetConversationModal({
  isOpen,
  onClose,
  resetRequest,
  onAccept,
  onCancel
}: ResetConversationModalProps) {
  const { user } = useAuth();
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);

  // Calculate time remaining
  useEffect(() => {
    const updateTimeRemaining = () => {
      const now = new Date();
      const expiresAt = new Date(resetRequest.expiresAt);
      const diff = expiresAt.getTime() - now.getTime();

      if (diff <= 0) {
        setIsExpired(true);
        setTimeRemaining('Expired');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [resetRequest.expiresAt]);

  if (!isOpen) return null;

  const isRequester = user?.id === resetRequest.requestedByUserId;
  const hasAccepted = resetRequest.acceptances.some(acc => acc.userId === user?.id);
  const acceptedCount = resetRequest.acceptances.length;
  const totalParticipants = resetRequest.totalParticipants;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-600/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Reset Conversation</h3>
              <p className="text-sm text-gray-400">
                {isRequester ? 'You requested' : `${resetRequest.requestedByUserName} requested`} to reset this conversation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Time Remaining */}
          <div className="flex items-center space-x-2 text-sm">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300">
              {isExpired ? 'Request has expired' : `Time remaining: ${timeRemaining}`}
            </span>
          </div>

          {/* Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-300">Progress</span>
              <span className="text-sm text-gray-400">
                {acceptedCount}/{totalParticipants} users agreed
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(acceptedCount / totalParticipants) * 100}%` }}
              />
            </div>
          </div>

          {/* Participants List */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-300">Participants</span>
            </div>
            <div className="space-y-2">
              {resetRequest.acceptances.map((acceptance) => (
                <div
                  key={acceptance.userId}
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {acceptance.userName}
                        {acceptance.userId === resetRequest.requestedByUserId && (
                          <span className="ml-2 text-xs text-yellow-400">(Requester)</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400">
                        Accepted {new Date(acceptance.acceptedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
              ))}
            </div>
          </div>

          {/* Warning Message */}
          <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-300">Warning</p>
                <p className="text-sm text-red-200 mt-1">
                  This will permanently delete all messages and attachments in this conversation. 
                  The conversation will be reset to empty, but participants and nickname will be preserved.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-700">
          {isRequester ? (
            // Requester can cancel
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Close
              </button>
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
              >
                Cancel Request
              </button>
            </>
          ) : (
            // Other participants can accept or close
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                {hasAccepted ? 'Close' : 'Decline'}
              </button>
              {!hasAccepted && !isExpired && (
                <button
                  onClick={onAccept}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg transition-colors"
                >
                  Accept Reset
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
