import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, DollarSign } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCommissions } from '../contexts/CommissionContext';
import { TaskComplexity } from '../types';

export default function NewCommission() {
  const [step, setStep] = useState(1);
  const [taskComplexity, setTaskComplexity] = useState<TaskComplexity | ''>('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [proposedAmount, setProposedAmount] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submittedCommission, setSubmittedCommission] = useState<any>(null);

  const { user, isAuthenticated } = useAuth();
  const { createCommission } = useCommissions();
  const navigate = useNavigate();

  const complexityOptions = [
    {
      value: 'easy' as TaskComplexity,
      label: 'Easy',
      description: 'Simple tasks, minor modifications',
      price: '$50 - $150',
      color: 'emerald',
    },
    {
      value: 'medium' as TaskComplexity,
      label: 'Medium',
      description: 'Moderate complexity, standard features',
      price: '$150 - $350',
      color: 'blue',
    },
    {
      value: 'hard' as TaskComplexity,
      label: 'Hard',
      description: 'Complex systems, custom solutions',
      price: '$350 - $750',
      color: 'orange',
    },
    {
      value: 'extreme' as TaskComplexity,
      label: 'Extreme',
      description: 'Advanced systems, large projects',
      price: '$750+',
      color: 'red',
    },
  ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!taskComplexity) {
      setError('Please select a task complexity level.');
      return;
    }

    if (!subject.trim()) {
      setError('Please provide a subject for your commission.');
      return;
    }

    if (!description.trim()) {
      setError('Please provide a description of your commission.');
      return;
    }

    if (description.length > 3000) {
      setError('Description must be 3000 characters or less.');
      return;
    }

    const amount = parseFloat(proposedAmount);
    if (!proposedAmount || isNaN(amount) || amount <= 0) {
      setError('Please provide a valid proposed payment amount.');
      return;
    }

    setIsLoading(true);

    try {
      const commission = await createCommission({
        taskComplexity,
        subject: subject.trim(),
        description: description.trim(),
        proposedAmount: amount,
        userId: user!.id,
      });

      setSubmittedCommission(commission);
      setStep(3);
    } catch (err) {
      setError('Failed to create commission. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto" />
          <h2 className="text-3xl font-bold text-white">Authentication Required</h2>
          <p className="text-slate-400">
            You need to be signed in to submit a commission request.
          </p>
          <div className="flex space-x-4">
            <button
              onClick={() => navigate('/login')}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 3 && submittedCommission) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500/10 rounded-full">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-4xl font-bold text-white">Commission Submitted!</h2>
          <p className="text-xl text-slate-400">
            Your commission request has been received and is under review.
          </p>

          <div className="bg-slate-800 rounded-xl p-6 text-left space-y-4">
            <div className="flex justify-between items-center border-b border-slate-700 pb-4">
              <span className="text-slate-400">Reference Number</span>
              <span className="text-white font-mono font-semibold">
                {submittedCommission.referenceNumber}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-700 pb-4">
              <span className="text-slate-400">Subject</span>
              <span className="text-white font-semibold">{submittedCommission.subject}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-700 pb-4">
              <span className="text-slate-400">Complexity</span>
              <span className="text-white font-semibold capitalize">
                {submittedCommission.taskComplexity}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Proposed Amount</span>
              <span className="text-emerald-400 font-bold text-xl">
                ${submittedCommission.proposedAmount.toFixed(2)}
              </span>
            </div>
          </div>

          <p className="text-slate-400">
            You'll receive a response within 1-2 business days. Check your commission status in your account.
          </p>

          <div className="flex space-x-4">
            <button
              onClick={() => navigate('/my-commissions')}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              View My Commissions
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">New Commission Request</h1>
          <p className="text-slate-400">Tell us about your project requirements</p>
        </div>

        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 1 ? 'bg-emerald-500' : 'bg-slate-700'} text-white font-semibold`}>
              1
            </div>
            <div className={`w-16 h-1 ${step >= 2 ? 'bg-emerald-500' : 'bg-slate-700'}`} />
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 2 ? 'bg-emerald-500' : 'bg-slate-700'} text-white font-semibold`}>
              2
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {step === 1 && (
            <div className="bg-slate-800 rounded-xl p-8 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Task Complexity</h2>
                <p className="text-slate-400 mb-6">
                  Select the complexity level that best matches your project requirements
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {complexityOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTaskComplexity(option.value)}
                      className={`text-left p-6 rounded-xl border-2 transition-all ${
                        taskComplexity === option.value
                          ? `border-${option.color}-400 bg-${option.color}-500/10`
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <h3 className={`text-xl font-bold mb-1 ${
                        taskComplexity === option.value ? `text-${option.color}-400` : 'text-white'
                      }`}>
                        {option.label}
                      </h3>
                      <p className="text-slate-400 text-sm mb-3">{option.description}</p>
                      <p className={`font-semibold ${
                        taskComplexity === option.value ? `text-${option.color}-400` : 'text-slate-300'
                      }`}>
                        {option.price}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!taskComplexity) {
                    setError('Please select a task complexity level.');
                  } else {
                    setError('');
                    setStep(2);
                  }
                }}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="bg-slate-800 rounded-xl p-8 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Project Details</h2>
                <p className="text-slate-400 mb-6">
                  Provide information about your commission request
                </p>

                <div className="space-y-6">
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-slate-300 mb-2">
                      Subject
                    </label>
                    <input
                      id="subject"
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Brief title for your project"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2">
                      Description
                      <span className="text-slate-500 ml-2">
                        ({description.length}/3000 characters)
                      </span>
                    </label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      maxLength={3000}
                      rows={8}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                      placeholder="Detailed description of your project requirements, features needed, and any specific technical details..."
                      required
                    />
                    {description.length >= 2900 && (
                      <p className="text-yellow-400 text-sm mt-1">
                        Approaching character limit
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="proposedAmount" className="block text-sm font-medium text-slate-300 mb-2">
                      Proposed Payment Amount (USD)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        id="proposedAmount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={proposedAmount}
                        onChange={(e) => setProposedAmount(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-11 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <p className="text-slate-400 text-sm mt-1">
                      Suggested range for {taskComplexity}: {complexityOptions.find(o => o.value === taskComplexity)?.price}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setError('');
                  }}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  {isLoading ? 'Submitting...' : 'Submit Commission'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
