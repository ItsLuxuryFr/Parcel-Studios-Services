# Parcel Studio - Implementation Notes

## Overview

Parcel Studio is a fully functional prototype for a Roblox commission marketplace and portfolio website. This implementation includes complete UI/UX flows, client-side validation, mock authentication, and local data persistence.

## Architecture

### Technology Stack
- **Frontend Framework**: React 18 with TypeScript
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Build Tool**: Vite
- **State Management**: React Context API

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Header.tsx      # Navigation header with auth state
│   ├── Footer.tsx      # Site footer with links
│   ├── ProjectCard.tsx # Expandable portfolio project card
│   └── CommissionCard.tsx # Commission request display card
├── contexts/           # React Context providers
│   ├── AuthContext.tsx # Authentication state and mock auth service
│   └── CommissionContext.tsx # Commission CRUD operations
├── data/              # Mock data and seed content
│   └── mockData.ts    # Sample projects, categories, commissions
├── pages/             # Route components
│   ├── Home.tsx       # Landing page
│   ├── Portfolio.tsx  # Portfolio index
│   ├── PortfolioCategory.tsx # Category-filtered projects
│   ├── Commissions.tsx # All commissions list
│   ├── NewCommission.tsx # Commission creation flow
│   ├── MyCommissions.tsx # User's commissions
│   ├── Login.tsx      # Login page
│   ├── Signup.tsx     # Registration page
│   ├── Onboarding.tsx # Post-signup onboarding
│   ├── Profile.tsx    # User profile management
│   ├── Privacy.tsx    # Privacy settings
│   └── Admin.tsx      # Admin commission management
├── types/             # TypeScript type definitions
│   └── index.ts       # All app types and interfaces
└── App.tsx            # Main app with routing setup
```

## Key Features Implemented

### 1. Authentication System (Mock)

**Location**: `src/contexts/AuthContext.tsx`

- Client-side authentication using localStorage
- User registration with validation
- Login/logout functionality
- Session persistence across page reloads
- User profile management

**To Replace with Real Auth**:
```typescript
// In AuthContext.tsx, replace localStorage operations with actual API calls
// Example with Supabase:
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Replace login function:
const login = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  // Handle response...
};
```

### 2. Portfolio System

**Components**:
- `src/pages/Portfolio.tsx` - Category overview
- `src/pages/PortfolioCategory.tsx` - Category detail view
- `src/components/ProjectCard.tsx` - Expandable project cards

**Features**:
- Four categories: Scripting (featured), VFX, Building, UI/UX
- Expandable/collapsible project cards with smooth animations
- Keyboard accessible with proper ARIA attributes
- Sample projects with thumbnails, videos, descriptions, tags

**Mock Data**: `src/data/mockData.ts` - `mockProjects` array

**To Integrate Real Data**:
```typescript
// Create a useProjects hook or service
import { useEffect, useState } from 'react';

export function useProjects(category?: string) {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    // Replace with actual API call
    fetch(`/api/projects?category=${category}`)
      .then(res => res.json())
      .then(data => setProjects(data));
  }, [category]);

  return projects;
}
```

### 3. Commission Request Flow

**Pages**:
- `src/pages/NewCommission.tsx` - Multi-step commission form
- `src/pages/Commissions.tsx` - All commissions with filtering
- `src/pages/MyCommissions.tsx` - User's commissions
- `src/pages/Admin.tsx` - Admin management panel

**Validation Rules**:
- Task complexity: Required (Easy/Medium/Hard/Extreme)
- Subject: Required, non-empty string
- Description: Required, max 3000 characters with real-time counter
- Proposed amount: Required, numeric, positive value

**Commission States**:
- Draft - User created but not finalized
- Submitted - Sent for review
- In Review - Being evaluated
- Approved - Accepted
- Rejected - Declined
- Completed - Finished

**To Integrate Real Backend**:
```typescript
// In CommissionContext.tsx, replace localStorage with API calls
const createCommission = async (data) => {
  const response = await fetch('/api/commissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
};
```

### 4. Payment UI (Mock)

**Location**: Currently integrated into commission confirmation flow

The payment interface is designed but not implemented. The confirmation screen after commission submission is where payment would be triggered.

**To Implement Real Payments**:
```typescript
// Install Stripe: npm install @stripe/stripe-js
// Create payment component:

import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('your_publishable_key');

const handlePayment = async (amount: number) => {
  // 1. Create payment intent on your backend
  const response = await fetch('/api/create-payment-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  });
  const { clientSecret } = await response.json();

  // 2. Confirm payment with Stripe
  const stripe = await stripePromise;
  const result = await stripe.confirmCardPayment(clientSecret, {
    payment_method: {
      card: cardElement,
    },
  });

  return result;
};
```

## Form Validation

All forms include comprehensive client-side validation:

### Registration Form
- Email: Required, valid email format
- Password: Required, minimum 6 characters
- Confirm Password: Must match password
- Display Name: Required

### Commission Form
- Complexity: Required selection
- Subject: Required, non-empty
- Description: Required, 3000 char max (enforced with `maxLength` attribute)
- Amount: Required, numeric, positive

### Profile Form
- Display Name: Required
- Avatar: Optional URL
- Bio: Optional

## Data Persistence

### Current Implementation (LocalStorage)
- User sessions: `parcel_studio_user`
- All users: `parcel_studio_users`
- Commissions: `parcel_studio_commissions`

### Migrating to Supabase

Since Supabase is already configured in the project, here's how to migrate:

#### 1. Create Database Tables

```sql
-- Users table (Supabase auth handles this)
-- Just add custom fields to auth.users metadata

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  short_caption TEXT,
  description TEXT,
  thumbnail_url TEXT,
  video_url TEXT,
  images TEXT[],
  tags TEXT[],
  skills TEXT[],
  completion_date DATE,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Commissions table
CREATE TABLE commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  task_complexity TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  proposed_amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  reference_number TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view projects"
  ON projects FOR SELECT
  USING (true);

CREATE POLICY "Users can view own commissions"
  ON commissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create commissions"
  ON commissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

#### 2. Update Context Providers

```typescript
// In CommissionContext.tsx
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const createCommission = async (data) => {
  const { data: commission, error } = await supabase
    .from('commissions')
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return commission;
};
```

## Accessibility Features

- All interactive elements are keyboard accessible
- Proper ARIA attributes on expandable sections
- Focus management in forms
- Skip-to-content functionality ready to implement
- Semantic HTML throughout
- Color contrast ratios meet WCAG AA standards

## Animations

Subtle animations implemented throughout:
- Fade-in for expanded content
- Hover scale effects on cards and buttons
- Smooth color transitions
- Loading states with visual feedback

## Responsive Design

All pages are fully responsive with breakpoints:
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## Environment Variables

Required variables (already configured):
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

## Running the Project

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Testing Accounts

To test the application, you can create accounts through the signup flow. All data is stored locally in browser storage.

## Future Enhancements

### Phase 1: Backend Integration
1. Replace localStorage with Supabase database
2. Implement real authentication with Supabase Auth
3. Add email verification flow
4. Implement password reset

### Phase 2: Payment Integration
1. Set up Stripe account
2. Create backend API for payment intents
3. Implement Stripe Checkout or Elements
4. Add payment history page
5. Implement refund flows

### Phase 3: Advanced Features
1. Real-time commission status updates
2. Direct messaging between users and admin
3. File uploads for project assets
4. Review and rating system
5. Commission revision requests
6. Portfolio filtering and search
7. Email notifications for commission updates

### Phase 4: Polish
1. Add loading skeletons
2. Implement error boundaries
3. Add toast notifications
4. Optimize images with lazy loading
5. Add analytics tracking
6. SEO optimization
7. Performance monitoring

## Notes

- All forms include client-side validation before submission
- Character limits are enforced with `maxLength` attribute and visual feedback
- Status badges use distinct colors for easy identification
- The admin panel is accessible at `/admin` (mock only - needs real auth guards)
- All monetary values are handled as numbers and formatted consistently
- Dates are displayed in localized formats

## Mock Data Locations

To modify sample content:
- Portfolio projects: `src/data/mockData.ts` - `mockProjects`
- Portfolio categories: `src/data/mockData.ts` - `portfolioCategories`
- Sample commissions: `src/data/mockData.ts` - `mockCommissions`

## Contact & Support

This is a prototype implementation. All functionality works end-to-end with mock data and can be easily integrated with real backend services by following the patterns outlined above.
