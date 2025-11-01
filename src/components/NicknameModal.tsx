import React, { useEffect, useState } from 'react';

interface NicknameModalProps {
  isOpen: boolean;
  initialValue: string;
  onClose: () => void;
  onConfirm: (nickname: string) => Promise<void> | void;
}

export default function NicknameModal({ isOpen, initialValue, onClose, onConfirm }: NicknameModalProps) {
  const [nickname, setNickname] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) setNickname(initialValue);
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setIsSaving(true);
      await onConfirm(nickname);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-gray-900 border border-purple-500/20 rounded-xl shadow-lg w-full max-w-md p-4">
        <h3 className="text-white text-lg font-semibold mb-3">Change Nickname</h3>
        <p className="text-gray-400 text-sm mb-4">Set a shared name for this conversation.</p>
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Enter nickname"
          className="w-full px-3 py-2 bg-gray-800 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
        <div className="flex justify-end space-x-2 mt-4">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-3 py-2 text-sm rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSaving}
            className="px-3 py-2 text-sm rounded-lg bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-60"
          >
            {isSaving ? 'Saving...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}


