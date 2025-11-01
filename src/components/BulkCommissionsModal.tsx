import { useState } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { useCommissions } from '../contexts/CommissionContext';
import { User, TaskComplexity } from '../types';

interface BulkCommissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

const QUANTITY_OPTIONS = [1, 3, 5, 10, 25, 50];

const ROBOX_COMMISSION_TEMPLATES = [
  {
    subjects: [
      'Roblox Gun System',
      'Obby Game Script',
      'Combat System',
      'Admin Commands Panel',
      'VFX Effects Package',
      'Custom UI Framework',
      'DataStore System',
      'Anti-Cheat System',
      'Trading System',
      'Leaderboard System',
      'Shop System',
      'Inventory System',
      'Vehicle System',
      'Building Tools',
      'Animation System'
    ],
    descriptions: [
      'BULK: Create a comprehensive gun system with realistic ballistics, recoil patterns, and multiple weapon types. Include damage calculation, hit detection, and visual effects.',
      'BULK: Develop a complete obby game with multiple levels, checkpoints, and difficulty progression. Include timer system, leaderboards, and power-ups.',
      'BULK: Build a robust combat system with melee and ranged weapons, health management, damage calculation, and special abilities.',
      'BULK: Design an admin commands panel with user management, server moderation tools, and real-time monitoring capabilities.',
      'BULK: Create stunning VFX effects including particle systems, lighting effects, and environmental animations for enhanced gameplay.',
      'BULK: Build a custom UI framework with responsive design, animations, and modular components for easy integration.',
      'BULK: Implement a secure DataStore system for player data persistence with proper error handling and data validation.',
      'BULK: Develop an anti-cheat system to detect and prevent common exploits and cheating methods.',
      'BULK: Create a comprehensive trading system allowing players to exchange items with proper validation and security.',
      'BULK: Build a dynamic leaderboard system with multiple categories, real-time updates, and ranking algorithms.',
      'BULK: Design a complete shop system with currency management, item purchasing, and inventory integration.',
      'BULK: Create an inventory system with item management, sorting, filtering, and drag-and-drop functionality.',
      'BULK: Develop a vehicle system with physics, controls, customization options, and multiplayer synchronization.',
      'Build advanced building tools with undo/redo functionality, copy/paste, and collaborative building features.',
      'BULK: Create an animation system with character animations, cutscenes, and procedural animation generation.'
    ],
    tags: [
      'scripting', 'combat', 'ui', 'vfx', 'building', 'animation', 'data', 'security',
      'multiplayer', 'physics', 'tools', 'systems', 'roblox', 'gameplay', 'optimization'
    ]
  }
];

export default function BulkCommissionsModal({ isOpen, onClose, user }: BulkCommissionsModalProps) {
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [progress, setProgress] = useState(0);
  const { createCommission, updateCommission } = useCommissions();

  if (!isOpen) return null;

  const generateRandomCommission = () => {
    const template = ROBOX_COMMISSION_TEMPLATES[0];
    const randomSubject = template.subjects[Math.floor(Math.random() * template.subjects.length)];
    const randomDescription = template.descriptions[Math.floor(Math.random() * template.descriptions.length)];
    
    // Randomize task complexity
    const complexities: TaskComplexity[] = ['easy', 'medium', 'hard', 'extreme'];
    const randomComplexity = complexities[Math.floor(Math.random() * complexities.length)];
    
    // Generate price based on complexity
    let minPrice, maxPrice;
    switch (randomComplexity) {
      case 'easy':
        minPrice = 5;
        maxPrice = 50;
        break;
      case 'medium':
        minPrice = 50;
        maxPrice = 150;
        break;
      case 'hard':
        minPrice = 150;
        maxPrice = 350;
        break;
      case 'extreme':
        minPrice = 350;
        maxPrice = 1000;
        break;
    }
    
    const proposedAmount = Math.floor(Math.random() * (maxPrice - minPrice + 1)) + minPrice;
    
    // Generate random tags (2-4 tags)
    const numTags = Math.floor(Math.random() * 3) + 2;
    const shuffledTags = [...template.tags].sort(() => 0.5 - Math.random());
    const selectedTags = shuffledTags.slice(0, numTags);
    
    return {
      subject: randomSubject,
      description: randomDescription,
      taskComplexity: randomComplexity,
      proposedAmount,
      tags: selectedTags
    };
  };

  const handleCreateCommissions = async () => {
    setIsCreating(true);
    setProgress(0);
    
    try {
      const commissions = [];
      
      for (let i = 0; i < selectedQuantity; i++) {
        const commissionData = generateRandomCommission();
        
        const commission = await createCommission({
          ...commissionData,
          userId: user.id,
        });
        
        // Update to submitted status
        await updateCommission(commission.id, { status: 'submitted' });
        
        commissions.push(commission);
        setProgress(((i + 1) / selectedQuantity) * 100);
      }
      
      // Close modal after successful creation
      onClose();
    } catch (error) {
      console.error('Error creating bulk commissions:', error);
      alert('Failed to create commissions. Please try again.');
    } finally {
      setIsCreating(false);
      setProgress(0);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-fade-in">
      <div className="glass-dark rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-purple-500/20 animate-scale-in">
        <div className="sticky top-0 glass-dark border-b border-purple-500/20 px-6 py-4 flex justify-between items-center rounded-t-xl">
          <h2 className="text-2xl font-bold text-white">Bulk Commission Creation</h2>
          <button
            onClick={handleClose}
            disabled={isCreating}
            className="text-purple-400 hover:text-purple-300 transition-colors hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="text-center">
            <p className="text-purple-300 mb-4">
              Generate {selectedQuantity} Roblox-themed commission{selectedQuantity !== 1 ? 's' : ''} with randomized data
            </p>
          </div>

          {/* Quantity Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Select Quantity</h3>
            <div className="space-y-3">
              {QUANTITY_OPTIONS.map((quantity) => (
                <button
                  key={quantity}
                  onClick={() => setSelectedQuantity(quantity)}
                  disabled={isCreating}
                  className={`w-full p-4 rounded-lg border-2 transition-all duration-300 text-left ${
                    selectedQuantity === quantity
                      ? 'border-purple-400 bg-purple-500/10 shadow-lg shadow-purple-500/20'
                      : 'border-purple-500/30 hover:border-purple-400 hover:bg-purple-500/5'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold text-lg">{quantity} Commission{quantity !== 1 ? 's' : ''}</span>
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      selectedQuantity === quantity
                        ? 'border-purple-400 bg-purple-400'
                        : 'border-purple-500/50'
                    }`} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Progress Bar (shown during creation) */}
          {isCreating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">Creating Commissions...</span>
                <span className="text-purple-400 font-bold">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className="h-3 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white">Preview</h3>
            <div className="glass rounded-lg p-4 border border-purple-500/20">
              <p className="text-purple-300 text-sm mb-2">
                Each commission will include:
              </p>
              <ul className="text-purple-300 text-sm space-y-1">
                <li>• Randomized Roblox-themed subject</li>
                <li>• Detailed project description</li>
                <li>• Random task complexity (easy, medium, hard, extreme)</li>
                <li>• Price based on complexity level</li>
                <li>• 2-4 relevant tags</li>
                <li>• Status: Submitted</li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={handleClose}
              disabled={isCreating}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateCommissions}
              disabled={isCreating}
              className="flex-1 bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span>Create {selectedQuantity} Commission{selectedQuantity !== 1 ? 's' : ''}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
