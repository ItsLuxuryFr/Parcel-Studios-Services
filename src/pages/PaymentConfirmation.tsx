import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowLeft, MessageCircle, Clock, User, AlertCircle } from 'lucide-react';
import { useCommissions } from '../contexts/CommissionContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Commission } from '../types';

export default function PaymentConfirmation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getCommissionById, getCommissionByReferenceNumber, loadUserCommissions } = useCommissions();
  const { isAuthenticated } = useAuth();

  const [commission, setCommission] = useState<Commission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setPaymentVerified] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [amountPaid, setAmountPaid] = useState<number | null>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const loadCommission = async () => {
      try {
        setIsLoading(true);

        const commissionId = searchParams.get('commission');
        const sessionId = searchParams.get('session_id');
        
        if (!commissionId) {
          navigate('/commissions');
          return;
        }

        console.log('[DEBUG] Loading commission for payment confirmation:', commissionId);

        // Poll for updated payment status (webhook might take a moment)
        let commissionData = null;
        let attempts = 0;
        const maxAttempts = 10; // Wait up to 10 seconds
        
        while (attempts < maxAttempts) {
          attempts++;
          console.log(`[DEBUG] Fetching payment status (attempt ${attempts}/${maxAttempts})`);
          
          const { data, error } = await supabase
            .from('commissions')
            .select('id, subject, reference_number, proposed_amount, payment_status, payment_type, amount_paid, paid_at, status')
            .eq('id', commissionId)
            .single();

          if (error) {
            console.error('[DEBUG] Error fetching commission:', error);
            navigate('/commissions');
            return;
          }

          commissionData = data;
          
          console.log('[DEBUG] Current payment status:', {
            paymentStatus: commissionData.payment_status,
            paymentType: commissionData.payment_type,
            attempt: attempts
          });

          // If payment has been processed, check if we need to wait for webhook
          // For split payments that are payment_started, we need to wait for webhook to update to completed
          // For split payments that just completed, wait for webhook to update status to 'completed'
          const needsWebhookUpdate = commissionData.payment_type === 'split' && 
                                       commissionData.payment_status === 'payment_started' && 
                                       commissionData.status === 'completed';
          
          if (needsWebhookUpdate) {
            console.log('[DEBUG] Waiting for webhook to update second payment to completed status');
            // Continue polling to wait for webhook
          } 
          // Only break if status is actually completed or fully paid (not payment_started)
          else if (commissionData.payment_status === 'completed') {
            console.log('[DEBUG] Payment status is completed, stopping polling');
            break;
          }
          // Also break if it's not unpaid and not pending (covers 'payment_started' for first payment)
          else if (commissionData.payment_status !== 'unpaid' && commissionData.payment_status !== 'pending' && commissionData.payment_status !== 'payment_started') {
            console.log('[DEBUG] Payment status updated to:', commissionData.payment_status);
            break;
          }

          // Wait 1 second before next attempt
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        if (!commissionData) {
          setVerificationError('Payment not found or not completed.');
          return;
        }

        // If still unpaid after polling, check if we have a session ID to verify
        if (commissionData.payment_status === 'unpaid' || commissionData.payment_status === 'pending') {
          if (sessionId) {
            console.log('[DEBUG] Payment still not updated, verifying with Stripe');
            await verifyPaymentWithStripe(commissionId, sessionId);
            
            // Wait a moment for database update to complete
            console.log('[DEBUG] Waiting for database update to complete...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Refresh data after verification - retry a few times
            let retryCount = 0;
            while (retryCount < 5) {
              console.log(`[DEBUG] Fetching updated commission data (attempt ${retryCount + 1}/5)`);
              const { data: refreshedData, error: refreshError } = await supabase
                .from('commissions')
                .select('id, subject, reference_number, proposed_amount, payment_status, payment_type, amount_paid, paid_at, status')
                .eq('id', commissionId)
                .single();
              
              if (refreshError) {
                console.error('[DEBUG] Error refreshing data:', refreshError);
                break;
              }
              
              if (refreshedData && refreshedData.payment_status !== 'unpaid' && refreshedData.payment_status !== 'pending') {
                console.log('[DEBUG] Payment status updated:', refreshedData.payment_status);
                commissionData = refreshedData;
                break;
              }
              
              if (retryCount < 4) {
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
              retryCount++;
            }
            
            if (retryCount >= 5) {
              console.error('[DEBUG] Failed to get updated payment status after verification');
            }
          } else {
            setVerificationError('Payment not found or not completed.');
            return;
          }
        }

        if (!commissionData) {
          setVerificationError('Could not fetch commission data.');
          return;
        }

        const finalCommissionData = commissionData;

        setCommission({
          // minimal mapping to our UI Commission where used
          id: commissionId,
          subject: finalCommissionData.subject,
          proposedAmount: finalCommissionData.proposed_amount ?? 0,
          referenceNumber: finalCommissionData.reference_number,
          paymentStatus: finalCommissionData.payment_status,
          paymentType: finalCommissionData.payment_type,
          paidAt: finalCommissionData.paid_at,
          status: finalCommissionData.status
        } as unknown as Commission);
        setAmountPaid(typeof finalCommissionData.amount_paid === 'number' ? finalCommissionData.amount_paid : null);

        console.log('[DEBUG] Final commission data:', {
          paymentStatus: finalCommissionData.payment_status,
          paymentType: finalCommissionData.payment_type,
          amountPaid: finalCommissionData.amount_paid
        });

        // Mark as verified if payment is in a completed state
        // For second payment of split, the status might still be payment_started initially, but will be updated by webhook
        const isSecondPaymentCase = finalCommissionData.payment_type === 'split' && 
                                      finalCommissionData.payment_status === 'payment_started' && 
                                      finalCommissionData.status === 'completed';
        
        if (finalCommissionData.payment_status === 'completed' || 
            finalCommissionData.payment_status === 'payment_started' || 
            finalCommissionData.payment_status === 'paid' ||
            isSecondPaymentCase) {
          console.log('[DEBUG] Payment verified', { isSecondPaymentCase, status: finalCommissionData.payment_status });
          setPaymentVerified(true);
          
          // If this is a second payment case, manually update the database to mark it as completed
          if (isSecondPaymentCase && finalCommissionData.payment_status !== 'completed') {
            console.log('[DEBUG] Second payment detected - manually updating database to completed');
            try {
              // Calculate total amount (existing amount + new payment)
              const existingAmount = finalCommissionData.amount_paid || 0;
              const sessionId = searchParams.get('session_id');
              
              // Get the payment amount from the session
              const { data: { session } } = await supabase.auth.getSession();
              const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-payment`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({
                  action: 'verify-session',
                  data: {
                    session_id: sessionId,
                    commission_id: commissionId
                  }
                })
              });
              
              if (response.ok) {
                const result = await response.json();
                console.log('[DEBUG] Verification result:', result);
                
                // If verification was successful and updated the database, wait for it
                if (result.updated) {
                  console.log('[DEBUG] Database updated by verification function');
                  // Wait a bit and refresh
                  await new Promise(resolve => setTimeout(resolve, 1000));
                }
              }
            } catch (error) {
              console.error('[DEBUG] Error manually updating second payment:', error);
              // Continue anyway - webhook will eventually update it
            }
          }
          
          // Refresh commission context so it shows updated status when user navigates back
          // Only refresh once to prevent infinite loop
          if (!hasLoadedRef.current) {
            console.log('[DEBUG] Refreshing commission context');
            console.log('[DEBUG] Before refresh - payment status:', finalCommissionData.payment_status);
            await loadUserCommissions();
            
            // After refresh, check the updated status
            console.log('[DEBUG] After refresh - fetching commission from context');
            const refreshedCommission = getCommissionById(commissionId);
            console.log('[DEBUG] Refreshed commission payment status:', refreshedCommission?.paymentStatus);
            console.log('[DEBUG] Refreshed commission full data:', refreshedCommission);
            
            hasLoadedRef.current = true;
          }
        }
      } catch (err) {
        console.error('[DEBUG] Error loading commission:', err);
        navigate('/commissions');
      } finally {
        setIsLoading(false);
      }
    };

    const verifyPaymentWithStripe = async (commissionId: string, sessionId: string) => {
      try {
        console.log('[VERIFY] Starting payment verification...', { commissionId, sessionId });
        
        // Call Edge Function to verify the session with Stripe
        const { data: { session } } = await supabase.auth.getSession();
        
        console.log('[VERIFY] Calling Edge Function to verify payment');
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            action: 'verify-session',
            data: {
              session_id: sessionId,
              commission_id: commissionId
            }
          })
        });

        console.log('[VERIFY] Edge Function response status:', response.status);
        
        if (response.ok) {
          const result = await response.json();
          console.log('[VERIFY] Verification result:', result);
          
          console.log('[VERIFY] Full verification result:', result);
          
          if (result.payment_status === 'paid') {
            if (result.error) {
              console.error('[VERIFY] Database update error:', result.error);
              console.warn('[VERIFY] Payment verified with Stripe but database update failed');
            } else {
              console.log('[VERIFY] Payment verified and database updated');
            }
            setPaymentVerified(true);
            return true;
          } else {
            console.error('[VERIFY] Payment status not paid:', result.payment_status);
            setVerificationError('Payment not completed. Please try again.');
            return false;
          }
        } else {
          const errorData = await response.json();
          console.error('[VERIFY] Payment verification failed:', errorData);
          setVerificationError('Payment verification failed. Please contact support.');
          return false;
        }
      } catch (error) {
        console.error('[VERIFY] Error verifying payment:', error);
        setVerificationError('Unable to verify payment. Please contact support.');
        return false;
      }
    };

    loadCommission();
  }, [isAuthenticated, navigate, searchParams, getCommissionById, getCommissionByReferenceNumber]); // Removed loadUserCommissions to prevent infinite loop

  const handleBackToCommissions = () => {
    navigate('/commissions');
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading confirmation...</p>
        </div>
      </div>
    );
  }

  if (!commission) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-2">Commission Not Found</h2>
            <p className="text-red-200">The requested commission could not be found.</p>
          </div>
          <button
            onClick={handleBackToCommissions}
            className="btn-primary inline-flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Commissions</span>
          </button>
        </div>
      </div>
    );
  }

  if (verificationError) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 mb-6">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Payment Verification Failed</h2>
            <p className="text-red-200">{verificationError}</p>
          </div>
          <button
            onClick={handleBackToCommissions}
            className="btn-primary inline-flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Commissions</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackToCommissions}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Payment Confirmed</h1>
              <p className="text-gray-400">Your commission payment has been processed</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Success Message */}
          <div className="space-y-6">
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-white mb-4">Payment Confirmed!</h2>
                {amountPaid !== null ? (
                (() => {
                  // Determine payment type based on the current status
                  // If it's split and status is payment_started, and the commission is completed, this means we just completed the second payment
                  const wasPaymentStartedBefore = commission.paymentStatus === 'payment_started' && commission.status === 'completed';
                  const isNowCompleted = commission.paymentStatus === 'completed';
                  
                  const isFirstPaymentForSplit = commission.paymentType === 'split' && commission.paymentStatus === 'payment_started' && commission.status !== 'completed';
                  const isSecondPaymentForSplit = commission.paymentType === 'split' && (isNowCompleted || wasPaymentStartedBefore);
                  const isFullPayment = commission.paymentType === 'full' && commission.paymentStatus === 'completed';
                  
                  console.log('[DEBUG] Payment confirmation details:', {
                    isFirstPaymentForSplit,
                    isSecondPaymentForSplit,
                    isFullPayment,
                    paymentType: commission.paymentType,
                    paymentStatus: commission.paymentStatus,
                    status: commission.status,
                    wasPaymentStartedBefore,
                    isNowCompleted
                  });
                  
                  if (isFirstPaymentForSplit) {
                    return (
                      <div className="space-y-2">
                        <p className="text-green-200 text-lg">
                          Your first payment of <span className="font-bold text-green-100">${amountPaid.toFixed(2)}</span> has been successfully processed.
                        </p>
                        <p className="text-yellow-200 text-sm">
                          You'll pay the remaining 50% once the work is completed.
                        </p>
                      </div>
                    );
                  } else if (isSecondPaymentForSplit) {
                    return (
                      <div className="space-y-2">
                        <p className="text-green-200 text-lg">
                          Your second payment of <span className="font-bold text-green-100">${amountPaid.toFixed(2)}</span> has been successfully processed.
                        </p>
                        <p className="text-green-200 text-sm">
                          All payments complete! You can now download your files.
                        </p>
                      </div>
                    );
                  } else if (isFullPayment) {
                    return (
                      <p className="text-green-200 text-lg">
                        Your payment of <span className="font-bold text-green-100">${amountPaid.toFixed(2)}</span> has been successfully processed. Your commission will start soon.
                      </p>
                    );
                  } else {
                    return (
                      <p className="text-green-200 text-lg">
                        Payment processed successfully.
                      </p>
                    );
                  }
                })()
              ) : null}
            </div>

            {/* Commission Details */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">Commission Details</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 text-sm">Reference Number</p>
                  <p className="text-white font-mono text-lg">{commission.referenceNumber || ''}</p>
                </div>
                
                <div>
                  <p className="text-gray-400 text-sm">Project Title</p>
                  <p className="text-white font-semibold">{commission.subject}</p>
                </div>
                
                <div>
                  <p className="text-gray-400 text-sm">Amount Paid</p>
                  <>
                    <p className="text-green-400 text-2xl font-bold">
                      ${amountPaid !== null ? amountPaid.toFixed(2) : '0.00'}
                    </p>
                    {commission.paymentType === 'split' && commission.proposedAmount > 0 && amountPaid !== null && (
                      <p className="text-gray-400 text-sm mt-1">
                        Total: ${commission.proposedAmount.toFixed(2)} 
                        (50% remaining: ${(commission.proposedAmount * 0.5).toFixed(2)})
                      </p>
                    )}
                  </>
                </div>
                
                {commission.paidAt && (
                  <div>
                    <p className="text-gray-400 text-sm">Payment Date</p>
                    <p className="text-white">{new Date(commission.paidAt).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="space-y-6">
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                <MessageCircle className="w-5 h-5 text-blue-400" />
                <span>What Happens Next?</span>
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-500/20 rounded-full p-2 mt-1">
                    <User className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Admin Introduction</h4>
                    <p className="text-blue-200 text-sm">
                      An admin will contact you within 24 hours to introduce themselves and discuss your project requirements in detail.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-500/20 rounded-full p-2 mt-1">
                    <Clock className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Timeline Discussion</h4>
                    <p className="text-blue-200 text-sm">
                      Your assigned admin will provide an estimated timeline for project completion and keep you updated throughout the process.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-500/20 rounded-full p-2 mt-1">
                    <MessageCircle className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Ongoing Communication</h4>
                    <p className="text-blue-200 text-sm">
                      You'll receive regular updates and can communicate with your admin through the messaging system.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Notes */}
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-3">Important Notes</h3>
              <ul className="text-yellow-200 text-sm space-y-2">
                <li>• Check your messages regularly for updates from your admin</li>
                <li>• Keep your commission reference number for future reference</li>
                <li>• Contact support if you don't hear from an admin within 24 hours</li>
                <li>• All project files will be delivered through the platform</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => navigate('/messages')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
              >
                <MessageCircle className="w-5 h-5" />
                <span>View Messages</span>
              </button>
              
              <button
                onClick={handleBackToCommissions}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to My Commissions</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
