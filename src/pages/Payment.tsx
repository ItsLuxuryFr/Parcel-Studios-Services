import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CreditCard, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useCommissions } from '../contexts/CommissionContext';
import { useAuth } from '../contexts/AuthContext';
import { Commission } from '../types';

export default function Payment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getCommissionById, getCommissionByReferenceNumber, initiatePayment, initiateSecondPayment } = useCommissions();
  const { isAuthenticated } = useAuth();
  
  const [commission, setCommission] = useState<Commission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const loadCommission = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const commissionId = searchParams.get('commission');
        if (!commissionId) {
          setError('No commission specified');
          return;
        }

        console.log('[DEBUG] Loading commission for payment:', commissionId);

        // Try to find commission by ID first, then by reference number
        let foundCommission = getCommissionById(commissionId);
        if (!foundCommission) {
          foundCommission = getCommissionByReferenceNumber(commissionId);
        }

        if (!foundCommission) {
          console.error('[DEBUG] Commission not found');
          setError('Commission not found');
          return;
        }

        console.log('[DEBUG] Commission found:', {
          id: foundCommission.id,
          status: foundCommission.status,
          paymentType: foundCommission.paymentType,
          paymentStatus: foundCommission.paymentStatus
        });

        // Allow payment if accepted, or if completed but awaiting second payment for split type
        const isEligibleForSecondPayment =
          foundCommission.status === 'completed' &&
          foundCommission.paymentType === 'split' &&
          foundCommission.paymentStatus === 'payment_started';

        console.log('[DEBUG] Eligibility check:', {
          status: foundCommission.status,
          isAccepted: foundCommission.status === 'accepted',
          isEligibleForSecondPayment
        });

        if (foundCommission.status !== 'accepted' && !isEligibleForSecondPayment) {
          console.warn('[DEBUG] Commission not eligible for payment');
          setError('This commission is not eligible for payment at this time');
          return;
        }

        // Check if already fully paid
        if (foundCommission.paymentStatus === 'completed') {
          console.warn('[DEBUG] Commission already fully paid');
          setError('This commission has already been paid');
          return;
        }

        setCommission(foundCommission);

        // Check if this is a second payment scenario
        const isSecondPaymentScenario = foundCommission.paymentStatus === 'payment_started' && 
                                        foundCommission.paymentType === 'split' &&
                                        foundCommission.status === 'completed';

        console.log('[DEBUG] Payment scenario:', {
          isSecondPaymentScenario,
          paymentStatus: foundCommission.paymentStatus,
          paymentType: foundCommission.paymentType,
          status: foundCommission.status
        });

        // If payment is payment_started and second payment link exists, use it
        if (isSecondPaymentScenario && foundCommission.secondPaymentLinkUrl) {
          console.log('[DEBUG] Using existing second payment link');
          setPaymentUrl(foundCommission.secondPaymentLinkUrl);
        }
        // If payment is pending, use existing payment link
        else if (foundCommission.paymentStatus === 'pending' && foundCommission.stripePaymentLinkUrl) {
          console.log('[DEBUG] Using existing first payment link');
          setPaymentUrl(foundCommission.stripePaymentLinkUrl);
        } else {
          // Initiate new payment
          try {
            console.log('[DEBUG] Initiating new payment flow');
            // For second payment scenario, initiate second payment
            if (isSecondPaymentScenario) {
              console.log('[DEBUG] Creating second payment session');
              const paymentLink = await initiateSecondPayment(foundCommission.id);
              setPaymentUrl(paymentLink);
            } else {
              // First payment
              console.log('[DEBUG] Creating first payment session');
              const paymentLink = await initiatePayment(foundCommission.id);
              setPaymentUrl(paymentLink);
            }
          } catch (paymentError: any) {
            console.error('[DEBUG] Error initiating payment:', paymentError);
            console.error('[DEBUG] Error message:', paymentError.message);
            console.error('[DEBUG] Error stack:', paymentError.stack);
            
            // Check if it's a Stripe configuration error
            if (paymentError.message.includes('not properly configured')) {
              setError('Payment system is currently being set up. Please try again in a few minutes or contact support.');
            } else if (paymentError.message) {
              // Show the actual error message to user
              setError(paymentError.message || 'Failed to initiate payment. Please try again.');
            } else {
              setError('Failed to initiate payment. Please try again.');
            }
          }
        }
      } catch (err) {
        console.error('[DEBUG] Error loading commission:', err);
        setError('Failed to load commission details');
      } finally {
        setIsLoading(false);
      }
    };

    loadCommission();
  }, [isAuthenticated, navigate, searchParams, getCommissionById, getCommissionByReferenceNumber, initiatePayment, initiateSecondPayment]);

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
          <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-300">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 mb-6">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Payment Error</h2>
            <p className="text-red-200">{error}</p>
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

  if (!commission) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-6 mb-6">
            <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Commission Not Found</h2>
            <p className="text-yellow-200">The requested commission could not be found.</p>
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
              <h1 className="text-2xl font-bold text-white">Payment</h1>
              <p className="text-gray-400">Complete your commission payment</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Commission Summary */}
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-purple-400" />
                <span>Commission Summary</span>
              </h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 text-sm">Reference Number</p>
                  <p className="text-white font-mono">{commission.referenceNumber}</p>
                </div>
                
                <div>
                  <p className="text-gray-400 text-sm">Project Title</p>
                  <p className="text-white font-semibold">{commission.subject}</p>
                </div>
                
                <div>
                  <p className="text-gray-400 text-sm">Description</p>
                  <p className="text-gray-300 text-sm leading-relaxed">{commission.description}</p>
                </div>
                
                <div>
                  <p className="text-gray-400 text-sm">
                    {(() => {
                      const isSecondPayment = commission.paymentStatus === 'payment_started' && commission.status === 'completed';
                      if (isSecondPayment) return 'Second Payment (50%)';
                      if (commission.paymentType === 'split') return 'First Payment (50%)';
                      return 'Payment Amount';
                    })()}
                  </p>
                  <p className="text-green-400 text-2xl font-bold">
                    ${(() => {
                      const isSecondPayment = commission.paymentStatus === 'payment_started' && commission.status === 'completed';
                      if (isSecondPayment || commission.paymentType === 'split') {
                        return (commission.proposedAmount * 0.5).toFixed(2);
                      }
                      return commission.proposedAmount.toFixed(2);
                    })()}
                  </p>
                  {commission.paymentType === 'split' && (
                    <p className="text-gray-500 text-sm mt-1">
                      Total: ${commission.proposedAmount.toFixed(2)}
                    </p>
                  )}
                  {(() => {
                    const isSecondPayment = commission.paymentStatus === 'payment_started' && commission.status === 'completed';
                    if (isSecondPayment) {
                      return (
                        <p className="text-yellow-400 text-sm mt-1">
                          First payment (50%) already completed
                        </p>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            </div>

            {/* Payment Status */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Payment Status</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  {commission.paymentStatus === 'completed' ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-green-400 font-medium">Payment Completed</span>
                    </>
                  ) : commission.paymentStatus === 'payment_started' ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-yellow-400" />
                      <span className="text-yellow-400 font-medium">First Payment Completed (50%)</span>
                    </>
                  ) : commission.paymentStatus === 'pending' ? (
                    <>
                      <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
                      <span className="text-yellow-400 font-medium">Payment Pending</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-400 font-medium">Payment Required</span>
                    </>
                  )}
                </div>
                {commission.paymentType === 'split' && commission.paymentStatus === 'payment_started' && (
                  <p className="text-yellow-300 text-sm">
                    {commission.status === 'completed' 
                      ? `Remaining: $${(commission.proposedAmount * 0.5).toFixed(2)}`
                      : `Remaining: $${(commission.proposedAmount * 0.5).toFixed(2)} (payable upon completion)`}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">Complete Payment</h2>
              
              {paymentUrl ? (
                <div className="space-y-4">
                  <p className="text-gray-300">
                    Click the button below to complete your payment securely through Stripe.
                  </p>
                  
                  <a
                    href={paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>Pay with Stripe</span>
                  </a>
                  
                  <p className="text-xs text-gray-500 text-center">
                    You will be redirected to Stripe's secure payment page
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-4" />
                  <p className="text-gray-300">Preparing payment...</p>
                </div>
              )}
            </div>

            {/* Payment Instructions */}
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <h3 className="text-blue-300 font-semibold mb-2">Payment Instructions</h3>
              <ul className="text-blue-200 text-sm space-y-1">
                <li>• You will be redirected to Stripe's secure payment page</li>
                <li>• Complete your payment using any major credit card</li>
                <li>• After successful payment, you'll be redirected back here</li>
                <li>• An admin will contact you within 24 hours to begin your project</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Success Button (shown after payment completion) */}
        {commission.paymentStatus === 'completed' && (
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/payment-confirmation')}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 mx-auto"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Continue to Confirmation</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
