import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Commission } from '../types';
import { supabase } from '../lib/supabase';
import { AuthContext } from './AuthContext';
import { initiateCommissionPayment, initiateSecondPayment, scheduleProductArchival } from '../lib/stripe';

interface CommissionContextType {
  commissions: Commission[];
  isLoading: boolean;
  createCommission: (data: Omit<Commission, 'id' | 'createdAt' | 'updatedAt' | 'referenceNumber' | 'status' | 'tags'> & { tags?: string[] }) => Promise<Commission>;
  updateCommission: (id: string, updates: Partial<Commission>) => Promise<void>;
  deleteCommission: (id: string) => Promise<void>;
  deleteRelatedDrafts: (commissionId: string) => Promise<void>;
  getUserCommissions: (userId: string) => Commission[];
  getCommissionById: (id: string) => Commission | undefined;
  getCommissionByReferenceNumber: (refNumber: string) => Commission | undefined;
  loadUserCommissions: () => Promise<void>;
  getConversationCommissions: (participantIds: string[], isAdmin: boolean) => Commission[];
  updateProgress: (id: string, progress: number) => Promise<void>;
  completeProject: (id: string, fileUrls: string[], adminId?: string, adminName?: string) => Promise<void>;
  uploadCompletionFile: (file: File, commissionId: string) => Promise<string>;
  downloadFile: (fileUrl: string, fileName: string, commission?: Commission) => Promise<void>;
  initiatePayment: (commissionId: string) => Promise<string>;
  initiateSecondPayment: (commissionId: string) => Promise<string>;
  confirmPayment: (commissionId: string) => Promise<void>;
}

const CommissionContext = createContext<CommissionContextType | undefined>(undefined);

export function CommissionProvider({ children }: { children: ReactNode }) {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Safely get auth context
  const authContext = useContext(AuthContext);
  const user = authContext?.user || null;
  const refreshUserProfile = authContext?.refreshUserProfile || (() => {});

  useEffect(() => {
    if (user) {
      loadUserCommissions();
    } else {
      setCommissions([]);
    }
  }, [user]);

  // Set up real-time subscriptions for commissions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`commissions:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'commissions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[Realtime] Commission event received:', payload.eventType, payload);
          
          if (payload.eventType === 'INSERT') {
            const newCommission = payload.new;
            const mappedCommission: Commission = {
              id: newCommission.id,
              userId: newCommission.user_id,
              taskComplexity: newCommission.task_complexity,
              subject: newCommission.subject,
              description: newCommission.description,
              proposedAmount: Number(newCommission.proposed_amount),
              status: newCommission.status,
              referenceNumber: newCommission.reference_number,
              createdAt: newCommission.created_at,
              updatedAt: newCommission.updated_at,
              tags: newCommission.tags || [],
              images: newCommission.images || [],
              rejectionReason: newCommission.rejection_reason,
              progress: newCommission.progress || 0,
              completionFiles: newCommission.completion_files || [],
              completedAt: newCommission.completed_at,
              completedByAdminId: newCommission.completed_by_admin_id,
              completedByAdminName: newCommission.completed_by_admin_name,
              paymentStatus: newCommission.payment_status || 'unpaid',
              stripeProductId: newCommission.stripe_product_id,
              stripePriceId: newCommission.stripe_price_id,
              stripePaymentLinkUrl: newCommission.stripe_payment_link_url,
              paidAt: newCommission.paid_at,
              amountPaid: newCommission.amount_paid || 0,
              stripeSessionId: newCommission.stripe_session_id,
              stripeCheckoutSessionId: newCommission.stripe_checkout_session_id,
              paymentAbandonedAt: newCommission.payment_abandoned_at,
              productArchivedAt: newCommission.product_archived_at,
              paymentType: newCommission.payment_type || 'full',
              secondPaymentStripePriceId: newCommission.second_payment_stripe_price_id,
              secondPaymentLinkUrl: newCommission.second_payment_link_url,
              secondPaymentCompletedAt: newCommission.second_payment_completed_at,
            };
            
            setCommissions(prev => {
              // Check if commission already exists (avoid duplicates)
              if (prev.find(c => c.id === mappedCommission.id)) {
                return prev;
              }
              return [...prev, mappedCommission];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedCommission = payload.new;
            const mappedCommission: Commission = {
              id: updatedCommission.id,
              userId: updatedCommission.user_id,
              taskComplexity: updatedCommission.task_complexity,
              subject: updatedCommission.subject,
              description: updatedCommission.description,
              proposedAmount: Number(updatedCommission.proposed_amount),
              status: updatedCommission.status,
              referenceNumber: updatedCommission.reference_number,
              createdAt: updatedCommission.created_at,
              updatedAt: updatedCommission.updated_at,
              tags: updatedCommission.tags || [],
              images: updatedCommission.images || [],
              rejectionReason: updatedCommission.rejection_reason,
              progress: updatedCommission.progress || 0,
              completionFiles: updatedCommission.completion_files || [],
              completedAt: updatedCommission.completed_at,
              completedByAdminId: updatedCommission.completed_by_admin_id,
              completedByAdminName: updatedCommission.completed_by_admin_name,
              paymentStatus: updatedCommission.payment_status || 'unpaid',
              stripeProductId: updatedCommission.stripe_product_id,
              stripePriceId: updatedCommission.stripe_price_id,
              stripePaymentLinkUrl: updatedCommission.stripe_payment_link_url,
              paidAt: updatedCommission.paid_at,
              amountPaid: updatedCommission.amount_paid || 0,
              stripeSessionId: updatedCommission.stripe_session_id,
              stripeCheckoutSessionId: updatedCommission.stripe_checkout_session_id,
              paymentAbandonedAt: updatedCommission.payment_abandoned_at,
              productArchivedAt: updatedCommission.product_archived_at,
              paymentType: updatedCommission.payment_type || 'full',
              secondPaymentStripePriceId: updatedCommission.second_payment_stripe_price_id,
              secondPaymentLinkUrl: updatedCommission.second_payment_link_url,
              secondPaymentCompletedAt: updatedCommission.second_payment_completed_at,
            };
            
            setCommissions(prev =>
              prev.map(comm =>
                comm.id === mappedCommission.id ? mappedCommission : comm
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setCommissions(prev => prev.filter(comm => comm.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      console.log('[Realtime] Cleaning up commission subscription');
      supabase.removeChannel(channel);
    };
  }, [user]);

  const createCommission = async (
    data: Omit<Commission, 'id' | 'createdAt' | 'updatedAt' | 'referenceNumber' | 'status' | 'tags' | 'images'> & { tags?: string[]; images?: string[] }
  ): Promise<Commission> => {
    // Refresh user profile to get latest mute status
    if (user) {
      await refreshUserProfile();
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_muted, muted_until, muted_reason')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error checking mute status:', profileError);
        throw new Error('Unable to verify account status');
      }

      if (profile.is_muted) {
        // Check if mute has expired
        if (profile.muted_until && new Date(profile.muted_until) < new Date()) {
          // Mute has expired, update the profile
          await supabase
            .from('profiles')
            .update({
              is_muted: false,
              muted_until: null,
              muted_reason: null,
              muted_by: null
            })
            .eq('id', user.id);
        } else {
          // User is still muted
          const muteMessage = profile.muted_until 
            ? `Your account is currently muted until ${new Date(profile.muted_until).toLocaleString()}. Reason: ${profile.muted_reason}`
            : `Your account is currently muted. Reason: ${profile.muted_reason}`;
          throw new Error(muteMessage);
        }
      }
    }

    // Generate a reference number as fallback
    const generateReferenceNumber = () => {
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `COM-${timestamp}-${random}`;
    };

    const insertData: any = {
      user_id: data.userId,
      task_complexity: data.taskComplexity,
      subject: data.subject,
      description: data.description,
      proposed_amount: data.proposedAmount,
      status: 'draft',
      tags: data.tags || [],
      reference_number: generateReferenceNumber(), // Add reference number manually
      payment_type: data.paymentType || 'full',
    };

    // Only include images if they exist
    if (data.images && data.images.length > 0) {
      insertData.images = data.images;
    }

    console.log('Creating commission with data:', insertData);
    const { data: insertedData, error } = await supabase
      .from('commissions')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Commission creation error:', error);
      // If the error is about images column not existing, try without images
      if (error.message && error.message.includes('images') && insertData.images) {
        console.log('Retrying without images column...');
        delete insertData.images;
        const { data: retryData, error: retryError } = await supabase
          .from('commissions')
          .insert(insertData)
          .select()
          .single();
        
        if (retryError) {
          console.error('Commission creation retry error:', retryError);
          throw retryError;
        }
        
        // Use the retry data
        const newCommission: Commission = {
          id: retryData.id,
          userId: retryData.user_id,
          taskComplexity: retryData.task_complexity,
          subject: retryData.subject,
          description: retryData.description,
          proposedAmount: Number(retryData.proposed_amount),
          status: retryData.status,
          referenceNumber: retryData.reference_number,
          createdAt: retryData.created_at,
          updatedAt: retryData.updated_at,
          tags: retryData.tags || [],
          images: [], // Empty array since column doesn't exist
          rejectionReason: retryData.rejection_reason,
          paymentType: retryData.payment_type || 'full',
        };

        setCommissions(prev => [...prev, newCommission]);
        return newCommission;
      }
      throw error;
    }

    const newCommission: Commission = {
      id: insertedData.id,
      userId: insertedData.user_id,
      taskComplexity: insertedData.task_complexity,
      subject: insertedData.subject,
      description: insertedData.description,
      proposedAmount: Number(insertedData.proposed_amount),
      status: insertedData.status,
      referenceNumber: insertedData.reference_number,
      createdAt: insertedData.created_at,
      updatedAt: insertedData.updated_at,
      tags: insertedData.tags || [],
      images: insertedData.images || [],
      rejectionReason: insertedData.rejection_reason,
      paymentType: insertedData.payment_type || 'full',
    };

    setCommissions(prev => [...prev, newCommission]);
    return newCommission;
  };

  const updateCommission = async (id: string, updates: Partial<Commission>) => {
    const updateData: any = {};
    if (updates.status) updateData.status = updates.status;
    if (updates.taskComplexity) updateData.task_complexity = updates.taskComplexity;
    if (updates.subject) updateData.subject = updates.subject;
    if (updates.description) updateData.description = updates.description;
    if (updates.proposedAmount !== undefined) updateData.proposed_amount = updates.proposedAmount;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.rejectionReason !== undefined) updateData.rejection_reason = updates.rejectionReason ?? null;
    if (updates.progress !== undefined) updateData.progress = updates.progress;
    if (updates.completionFiles !== undefined) updateData.completion_files = updates.completionFiles;
    if (updates.completedAt !== undefined) updateData.completed_at = updates.completedAt;
    if (updates.completedByAdminId !== undefined) updateData.completed_by_admin_id = updates.completedByAdminId;
    if (updates.completedByAdminName !== undefined) updateData.completed_by_admin_name = updates.completedByAdminName;
    if (updates.paymentType !== undefined) updateData.payment_type = updates.paymentType;
    
    // Only include images if they exist
    if (updates.images !== undefined) {
      updateData.images = updates.images;
    }

    const { error } = await supabase
      .from('commissions')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Commission update error:', error);
      // If the error is about images column not existing, try without images
      if (error.message && error.message.includes('images') && updateData.images !== undefined) {
        console.log('Retrying update without images column...');
        const { images, ...updateDataWithoutImages } = updateData;
        const { error: retryError } = await supabase
          .from('commissions')
          .update(updateDataWithoutImages)
          .eq('id', id);
        
        if (retryError) {
          console.error('Commission update retry error:', retryError);
          throw retryError;
        }
      } else {
        throw error;
      }
    }

    setCommissions(prev =>
      prev.map(comm =>
        comm.id === id ? { ...comm, ...updates, updatedAt: new Date().toISOString() } : comm
      )
    );
  };

  const deleteCommission = async (id: string) => {
    const { error } = await supabase
      .from('commissions')
      .delete()
      .eq('id', id);

    if (error) throw error;

    setCommissions(prev => prev.filter(comm => comm.id !== id));
  };

  const deleteRelatedDrafts = async (commissionId: string) => {
    if (!user) return;

    try {
      // Get the submitted commission directly from database to get its subject
      const { data: commissionData, error: fetchError } = await supabase
        .from('commissions')
        .select('subject')
        .eq('id', commissionId)
        .single();

      if (fetchError || !commissionData) {
        console.error('Error fetching commission:', fetchError);
        return;
      }

      // Delete all other draft commissions for this user with the same subject
      const { error } = await supabase
        .from('commissions')
        .delete()
        .eq('user_id', user.id)
        .eq('status', 'draft')
        .eq('subject', commissionData.subject)
        .neq('id', commissionId);

      if (error) {
        console.error('Error deleting related drafts:', error);
      } else {
        console.log('Deleted related drafts for commission:', commissionId);
      }

      // Refresh the commissions list
      await loadUserCommissions();
    } catch (error) {
      console.error('Error deleting related drafts:', error);
    }
  };

  const loadUserCommissions = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {    
        setCommissions([]);
        return;
      }

      const { data, error } = await supabase
        .from('commissions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: Commission[] = (data || []).map(item => ({
        id: item.id,
        userId: item.user_id,
        taskComplexity: item.task_complexity,
        subject: item.subject,
        description: item.description,
        proposedAmount: Number(item.proposed_amount),
        status: item.status,
        referenceNumber: item.reference_number,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        tags: item.tags || [],
        images: item.images || [], // Will be empty array if column doesn't exist
        rejectionReason: item.rejection_reason,
        progress: item.progress || 0,
        completionFiles: item.completion_files || [],
        completedAt: item.completed_at,
        completedByAdminId: item.completed_by_admin_id,
        completedByAdminName: item.completed_by_admin_name,
        paymentStatus: item.payment_status || 'unpaid',
        stripeProductId: item.stripe_product_id,
        stripePriceId: item.stripe_price_id,
        stripePaymentLinkUrl: item.stripe_payment_link_url,
        paidAt: item.paid_at,
        amountPaid: item.amount_paid || 0,
        stripeSessionId: item.stripe_session_id,
        stripeCheckoutSessionId: item.stripe_checkout_session_id,
        paymentAbandonedAt: item.payment_abandoned_at,
        productArchivedAt: item.product_archived_at,
        paymentType: item.payment_type || 'full',
        secondPaymentStripePriceId: item.second_payment_stripe_price_id,
        secondPaymentLinkUrl: item.second_payment_link_url,
        secondPaymentCompletedAt: item.second_payment_completed_at,
      }));

      setCommissions(mapped);
    } catch (error) {
      console.error('Error loading commissions:', error);
      setCommissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getUserCommissions = (userId: string) => {
    return commissions.filter(comm => comm.userId === userId);
  };

  const getCommissionById = (id: string) => {
    return commissions.find(comm => comm.id === id);
  };

  const getCommissionByReferenceNumber = (refNumber: string) => {
    return commissions.find(comm => comm.referenceNumber === refNumber);
  };

  const getConversationCommissions = (participantIds: string[], isAdmin: boolean): Commission[] => {
    if (isAdmin) {
      // Admins can see all commissions from conversation participants
      return commissions.filter(commission => 
        participantIds.includes(commission.userId) && 
        commission.status !== 'archived'
      );
    } else {
      // Non-admins can only see their own commissions
      return commissions.filter(commission => 
        commission.userId === user?.id && 
        commission.status !== 'archived'
      );
    }
  };

  const updateProgress = async (id: string, progress: number) => {
    await updateCommission(id, { progress });
  };

  const completeProject = async (id: string, fileUrls: string[], adminId?: string, adminName?: string) => {
    console.log('[DEBUG] completeProject called for commission:', id);
    
    // First, get the commission to check its payment status and type
    const commission = getCommissionById(id);
    console.log('[DEBUG] Commission payment details:', {
      paymentType: commission?.paymentType,
      paymentStatus: commission?.paymentStatus,
      status: commission?.status
    });

    // Update the commission status to completed
    await updateCommission(id, {
      status: 'completed',
      progress: 100,
      completionFiles: fileUrls,
      completedAt: new Date().toISOString(),
      completedByAdminId: adminId,
      completedByAdminName: adminName
    });

    // Check if this is a split payment type and payment is started
    if (commission?.paymentType === 'split' && commission.paymentStatus === 'payment_started') {
      console.log('[DEBUG] Split payment detected - commission marked as completed');
      console.log('[DEBUG] Second payment button will now be available for user');
      console.log('[DEBUG] User needs to pay remaining 50% to download files');
      
      // Note: We don't create the second payment here automatically
      // It will be created when user clicks the pay button in CommissionDetailsModal
      // The second payment product/price will be created lazily via initiateSecondPayment
    } else if (commission?.paymentType === 'split' && commission.paymentStatus === 'completed') {
      console.log('[DEBUG] Split payment commission completed - both payments already made');
    } else if (commission?.paymentType === 'full' && commission.paymentStatus === 'completed') {
      console.log('[DEBUG] Full payment commission completed - payment already made');
    } else {
      console.log('[DEBUG] Commission completed - no second payment required');
    }
  };

  const uploadCompletionFile = async (file: File, commissionId: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${commissionId}/${Date.now()}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('commission-completions')
      .upload(fileName, file);

    if (error) {
      console.error('Error uploading file:', error);
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('commission-completions')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const downloadFile = async (fileUrl: string, fileName: string, commission?: Commission) => {
    try {
      // Check if user is admin - admins can always download files
      // Use user from top-level context, not calling useContext here (would break Rules of Hooks)
      const isAdmin = user?.isAdmin || false;

      // If not admin, check payment status for the commission
      if (!isAdmin && commission) {
        if (commission.paymentStatus !== 'completed') {
          throw new Error('Payment must be completed before downloading completion files');
        }
      }

      const response = await fetch(fileUrl);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  };

  const initiatePayment = async (commissionId: string): Promise<string> => {
    try {
      const commission = getCommissionById(commissionId);
      if (!commission) {
        throw new Error('Commission not found');
      }

      if (commission.paymentStatus === 'completed') {
        throw new Error('Commission has already been paid');
      }

      if (commission.paymentStatus === 'pending') {
        // Return existing payment link if already initiated
        if (commission.stripePaymentLinkUrl) {
          return commission.stripePaymentLinkUrl;
        }
      }

      // Create Stripe product, price, and payment link
      const { productId, priceId, paymentLinkUrl } = await initiateCommissionPayment(commission);

      // Update commission with Stripe IDs and payment link
      await updateCommission(commissionId, {
        paymentStatus: 'pending',
        stripeProductId: productId,
        stripePriceId: priceId,
        stripePaymentLinkUrl: paymentLinkUrl
      });

      return paymentLinkUrl;
    } catch (error) {
      console.error('Error initiating payment:', error);
      throw error;
    }
  };

  const initiateSecondPaymentFlow = async (commissionId: string): Promise<string> => {
    try {
      const commission = getCommissionById(commissionId);
      if (!commission) {
        throw new Error('Commission not found');
      }

      if (commission.paymentType !== 'split') {
        throw new Error('Second payment is only available for split payment type commissions');
      }

      if (commission.paymentStatus !== 'payment_started') {
        throw new Error('First payment must be completed before initiating second payment');
      }

      // Create second payment
      const { priceId, paymentLinkUrl } = await initiateSecondPayment(commission);

      // Update commission with second payment price ID and link
      await updateCommission(commissionId, {
        secondPaymentStripePriceId: priceId,
        secondPaymentLinkUrl: paymentLinkUrl,
      });

      return paymentLinkUrl;
    } catch (error) {
      console.error('Error initiating second payment:', error);
      throw error;
    }
  };

  const confirmPayment = async (commissionId: string): Promise<void> => {
    try {
      // Refresh commission data from database to get latest payment status
      await loadUserCommissions();
      
      const commission = getCommissionById(commissionId);
      if (!commission) {
        throw new Error('Commission not found');
      }

      // If payment is already confirmed by webhook, schedule archival
      if (commission.paymentStatus === 'completed' && commission.paidAt) {
        if (commission.stripeProductId) {
          scheduleProductArchival(commission.stripeProductId, commission.paidAt);
        }
        return;
      }

      // If not paid yet, wait for webhook or show error
      throw new Error('Payment not yet confirmed. Please wait a moment and refresh the page.');
    } catch (error) {
      console.error('Error confirming payment:', error);
      throw error;
    }
  };

  return (
    <CommissionContext.Provider
      value={{
        commissions,
        isLoading,
        createCommission,
        updateCommission,
        deleteCommission,
        deleteRelatedDrafts,
        getUserCommissions,
        getCommissionById,
        getCommissionByReferenceNumber,
        loadUserCommissions,
        getConversationCommissions,
        updateProgress,
        completeProject,
        uploadCompletionFile,
        downloadFile,
        initiatePayment,
        initiateSecondPayment: initiateSecondPaymentFlow,
        confirmPayment,
      }}
    >
      {children}
    </CommissionContext.Provider>
  );
}

export function useCommissions() {
  const context = useContext(CommissionContext);
  if (!context) {
    throw new Error('useCommissions must be used within a CommissionProvider');
  }
  return context;
}
