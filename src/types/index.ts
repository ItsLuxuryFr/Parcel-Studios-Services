export type TaskComplexity = 'easy' | 'medium' | 'hard' | 'extreme';

export type CommissionStatus = 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected' | 'completed';

export type PortfolioCategoryType = 'scripting' | 'vfx' | 'building' | 'uiux';

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  joinDate: string;
  onboardingCompleted: boolean;
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
}

export interface PortfolioCategory {
  id: PortfolioCategoryType;
  name: string;
  description: string;
  featured?: boolean;
  experienceYears?: number;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, displayName: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  completeOnboarding: (displayName: string, avatar: string, bio: string) => Promise<void>;
}
