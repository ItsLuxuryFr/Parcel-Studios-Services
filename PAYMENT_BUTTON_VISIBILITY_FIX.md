# Payment Button Visibility and Status Fix

## Problem
1. Payment status was not being set when commission status changed to "accepted"
2. Pay Now button was not showing when commission status was "started" (in_progress)
3. Button visibility logic only checked for `paymentStatus === 'unpaid'` but not for `null` or `undefined` values

## Root Causes
1. When accepting a commission, `paymentStatus` was not explicitly set to 'unpaid'
2. Payment button visibility logic didn't account for commissions where `paymentStatus` was `null` or `undefined` (default state before payment)
3. When starting a project, the `paymentStatus` was preserved but the display logic wasn't showing buttons for missing payment status

## Solutions Implemented

### 1. Fixed Payment Status Initialization (Admin.tsx)
**File:** `src/pages/Admin.tsx`

**Changes:**
- Modified `handleAccept` function to explicitly set `paymentStatus` to 'unpaid' when accepting a commission
- Updated local state to include the payment status change
- Ensured both database and UI state are synchronized

```typescript
const handleAccept = async () => {
  if (selectedCommission) {
    const updates: Partial<Commission> = { 
      status: 'accepted',
      paymentStatus: 'unpaid' as any
    };
    await updateCommission(selectedCommission.id, updates);
    // Update local state...
  }
};
```

### 2. Fixed Pay Now Button Visibility Logic
**Files:** 
- `src/components/CommissionDetailsModal.tsx`
- `src/pages/Commissions.tsx`

**Changes:**
- Updated button visibility condition to check for both `'unpaid'` and falsy values (`null` or `undefined`)
- Now shows Pay Now button when `paymentStatus === 'unpaid'` OR when `!paymentStatus` (null/undefined)

**Before:**
```typescript
{commission.paymentStatus === 'unpaid' && (
  <button>Pay Now</button>
)}
```

**After:**
```typescript
{(commission.paymentStatus === 'unpaid' || !commission.paymentStatus) && (
  <button>Pay Now</button>
)}
```

### 3. Ensured Payment Status Preservation
**File:** `src/pages/Admin.tsx`

**Changes:**
- Added comment to clarify that `handleStartProject` preserves existing payment status
- When starting a project (status changes to 'in_progress'), the `paymentStatus` is maintained from the previous state

## Expected Behavior

### Commission Flow
1. **Commission Created** → `paymentStatus` = `null` or `undefined`
2. **Commission Accepted** → `paymentStatus` = `'unpaid'` ✅ (Now set explicitly)
3. **Project Started** → `paymentStatus` = `'unpaid'` (preserved)
4. **User Clicks Pay Now** → Payment initiated
5. **Payment Completed** → `paymentStatus` = `'paid'` or `'half_paid'` (depending on payment type)

### Button Visibility
- ✅ Pay Now button shows when `paymentStatus` is `'unpaid'`, `null`, or `undefined`
- ✅ Pay Now button shows for commissions with status `'accepted'`, `'in_progress'`, or `'completed'`
- ✅ Pay Final 50% button shows when `paymentStatus` is `'half_paid'` and status is `'completed'`
- ✅ Button hidden when `paymentStatus` is `'paid'`

### Payment Status Display
- **'paid'** → Green dot + "Payment Completed"
- **'half_paid'** → Orange dot + "50% Paid - Final Payment Required"
- **'pending'** → Yellow dot + "Payment Pending"
- **'unpaid'** or **null/undefined** → Gray dot + "Payment Required"

## Testing
1. Accept a commission → verify `paymentStatus` is set to 'unpaid'
2. Start a project → verify payment status is preserved
3. Check Pay Now button appears for commissions with unpaid status
4. Complete payment → verify status updates correctly
5. For split payments, verify final payment button appears when project is completed

---

## Additional Fix Required

### **Missing Field Mappings in CommissionContext.tsx** ✅

**File:** `src/contexts/CommissionContext.tsx`

**Problem:**
The `updateCommission` function was missing mappings for payment-related fields, so updates to `paymentStatus` were never saved to the database.

**Solution:**
Added missing field mappings to the `updateCommission` function:
- `paymentStatus` → `payment_status`
- `stripeProductId` → `stripe_product_id`
- `stripePriceId` → `stripe_price_id`
- `stripePaymentLinkUrl` → `stripe_payment_link_url`
- `paidAt` → `paid_at`
- `stripeSessionId` → `stripe_session_id`
- `stripeCheckoutSessionId` → `stripe_checkout_session_id`
- `paymentAbandonedAt` → `payment_abandoned_at`
- `productArchivedAt` → `product_archived_at`

Now when `handleAccept()` in Admin.tsx sets `paymentStatus: 'unpaid'`, it actually saves to the database.

---

## Additional Fix: Admin.tsx Loading Payment Status

**File:** `src/pages/Admin.tsx`

**Problem:**
When loading commissions in Admin.tsx, the `payment_status` field from the database was being read without a default value:
```typescript
paymentStatus: item.payment_status,  // Could be null/undefined
```

**Solution:**
Added default value fallback to match CommissionContext behavior:
```typescript
paymentStatus: item.payment_status || 'unpaid',
```

Also added reload after accepting to ensure payment status is fresh from the database:
```typescript
await updateCommission(selectedCommission.id, updates);
await loadAllCommissions();  // Reload to get fresh payment status
```

**Result:**
- Commissions with null/undefined payment_status show as 'unpaid'
- Pay Now button appears correctly
- Payment status is refreshed after accepting

