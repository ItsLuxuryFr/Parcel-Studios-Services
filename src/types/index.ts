export type TaskComplexity = 'easy' | 'medium' | 'hard' | 'extreme';

export type CommissionStatus = 'draft' | 'submitted' | 'in_review' | 'accepted' | 'in_progress' | 'approved' | 'rejected' | 'completed' | 'archived';

export type PaymentStatus = 'unpaid' | 'pending' | 'payment_started' | 'completed'; // Payment status: unpaid, pending (in checkout), payment_started (50% for split), completed (100% or second half done)

export type PaymentType = 'full' | 'split'; // Payment type: 'full' = 100% upfront, 'split' = 50% upfront & 50% upon completion

export type PortfolioCategoryType = 'scripting' | 'vfx' | 'building' | 'uiux';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  joinDate: string;
  onboardingCompleted: boolean;
  isAdmin?: boolean;
}

export interface Profile {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  onboardingCompleted: boolean;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  onboardingCompleted: boolean;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  onboardingCompleted: boolean;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  category: PortfolioCategoryType;
  title: string;
  shortCaption: string;
  description: string;
  thumbnailUrl: string;
  videoUrl?: string;
  images: string[];
  tags: string[];
  skills: string[];
  completionDate: string;
  featured?: boolean;
}

export interface Commission {
  id: string;
  userId: string;
  taskComplexity: TaskComplexity;
  subject: string;
  description: string;
  proposedAmount: number;
  status: CommissionStatus;
  createdAt: string;
  updatedAt: string;
  referenceNumber: string;
  tags: string[];
  images?: string[];
  rejectionReason?: string;
  ownerName?: string;
  startedByAdminId?: string;
  startedByAdminName?: string;
  startedAt?: string;
  progress?: number;
  completionFiles?: string[];
  completedAt?: string;
  completedByAdminId?: string;
  completedByAdminName?: string;
  paymentStatus?: PaymentStatus;
  amountPaid?: number;
  stripeProductId?: string;
  stripePriceId?: string;
  stripePaymentLinkUrl?: string;
  paidAt?: string;
  stripeSessionId?: string;
  stripeCheckoutSessionId?: string;
  paymentAbandonedAt?: string;
  productArchivedAt?: string;
  paymentType?: PaymentType;
  secondPaymentStripePriceId?: string;
  secondPaymentLinkUrl?: string;
  secondPaymentCompletedAt?: string;
}

export interface PortfolioCategory {
  id: PortfolioCategoryType;
  name: string;
  description: string;
  featured?: boolean;
  experienceYears?: number;
}

export interface UserModeration {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  joinDate: string;
  isMuted: boolean;
  mutedUntil?: string;
  mutedReason?: string;
  isBanned: boolean;
  banInfo?: BanInfo;
  commissionCount: number;
}

export interface BanInfo {
  reason: string;
  bannedAt: string;
  expiresAt?: string;
  bannedBy: string;
}

export interface Conversation {
  id: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  nickname?: string;
  participants: ConversationParticipant[];
  lastMessage?: Message;
  unreadCount?: number;
  isPinned?: boolean;
  displayOrder?: number;
}

export interface ConversationParticipant {
  userId: string;
  displayName: string;
  avatar?: string;
  joinedAt: string;
  lastReadAt?: string;
  isOnline?: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string | null;
  attachments: MessageAttachment[];
  createdAt: string;
  isDeleted: boolean;
  commissionId?: string;
  commission?: Commission;
  isOffer?: boolean;
  offerPrice?: number;
  offerComments?: string;
  offerStatus?: 'pending' | 'accepted' | 'rejected' | 'expired';
  offerRespondedAt?: string;
  offerExpiredAt?: string;
  // Loading states
  isCommissionLoading?: boolean;
  isOfferLoading?: boolean;
  isAttachmentLoading?: boolean;
}

export interface MessageAttachment {
  id: string;
  messageId: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  createdAt: string;
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  userName: string;
  updatedAt: string;
}

export interface ConversationResetRequest {
  id: string;
  conversationId: string;
  requestedByUserId: string;
  requestedByUserName: string;
  createdAt: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  acceptances: ResetAcceptance[];
  totalParticipants: number;
}

export interface ResetAcceptance {
  userId: string;
  userName: string;
  acceptedAt: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean; message?: string }>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  completeOnboarding: (username: string, displayName: string, avatar: string, bio: string) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}
