import { useState, FormEvent, KeyboardEvent, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, DollarSign, X, Tag, Upload, Trash2, Layers, File, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCommissions } from '../contexts/CommissionContext';
import BulkCommissionsModal from '../components/BulkCommissionsModal';
import { supabase } from '../lib/supabase';
import { TaskComplexity, PaymentType } from '../types';

export default function NewCommission() {
  const [step, setStep] = useState(1);
  const [taskComplexity, setTaskComplexity] = useState<TaskComplexity | ''>('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [proposedAmount, setProposedAmount] = useState('');
  const [paymentType, setPaymentType] = useState<PaymentType>('full');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [files, setFiles] = useState<{url: string, name: string, type: string}[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submittedCommission, setSubmittedCommission] = useState<any>(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [draftCommissionId, setDraftCommissionId] = useState<string | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSavingRef = useRef(false); // Prevent concurrent auto-saves

  const { user, isAuthenticated } = useAuth();
  const { createCommission, updateCommission, deleteRelatedDrafts } = useCommissions();
  const navigate = useNavigate();

  // Store latest values in refs to avoid stale closures
  const latestValues = useRef({ subject, description, taskComplexity, proposedAmount, paymentType, tags, files, draftCommissionId });

  // Update refs whenever values change
  useEffect(() => {
    latestValues.current = { subject, description, taskComplexity, proposedAmount, paymentType, tags, files, draftCommissionId };
  }, [subject, description, taskComplexity, proposedAmount, paymentType, tags, files, draftCommissionId]);

  // Debounced auto-save effect - saves only after user stops typing for 1 second
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    
    // Only auto-save if we have at least 3 characters in the subject field
    if (subject.trim().length < 3) return;
    
    const timeoutId = setTimeout(async () => {
      // Prevent concurrent auto-saves
      if (isSavingRef.current) {
        console.log('[Auto-save] Save already in progress, skipping...');
        return;
      }
      
      setIsAutoSaving(true);
      isSavingRef.current = true;
      
      try {
        const values = latestValues.current;
        
        // Update existing draft if we have one
        if (values.draftCommissionId) {
          console.log('[Auto-save] Updating draft:', values.draftCommissionId);
          await updateCommission(values.draftCommissionId, {
            taskComplexity: values.taskComplexity || undefined,
            subject: values.subject.trim() || undefined,
            description: values.description.trim() || undefined,
            proposedAmount: values.proposedAmount ? parseFloat(values.proposedAmount) : undefined,
            paymentType: values.paymentType,
            tags: values.tags,
            images: values.files.length > 0 ? values.files.map(f => f.url) : undefined,
          });
        } else {
          // Create new draft only if we don't have one yet
          console.log('[Auto-save] Creating new draft...');
          const draft = await createCommission({
            taskComplexity: values.taskComplexity || 'easy',
            subject: values.subject.trim() || 'Draft Commission',
            description: values.description.trim() || '',
            proposedAmount: values.proposedAmount ? parseFloat(values.proposedAmount) : 0,
            paymentType: values.paymentType,
            userId: user.id,
            tags: values.tags,
            images: values.files.length > 0 ? values.files.map(f => f.url) : undefined,
          });
          setDraftCommissionId(draft.id);
          console.log('[Auto-save] Draft created:', draft.id);
        }
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setIsAutoSaving(false);
        isSavingRef.current = false;
      }
    }, 1000); // Save 1 second after user stops typing

    return () => clearTimeout(timeoutId);
  }, [subject, description, taskComplexity, proposedAmount, paymentType, tags, files]); // Only watch form values, not functions

  const complexityOptions = [
    {
      value: 'easy' as TaskComplexity,
      label: 'Easy',
      description: 'Simple tasks, minor modifications',
      price: '$5 - $50',
      color: 'emerald',
    },
    {
      value: 'medium' as TaskComplexity,
      label: 'Medium',
      description: 'Moderate complexity, standard features',
      price: '$50 - $150',
      color: 'blue',
    },
    {
      value: 'hard' as TaskComplexity,
      label: 'Hard',
      description: 'Complex systems, custom solutions',
      price: '$150 - $350',
      color: 'orange',
    },
    {
      value: 'extreme' as TaskComplexity,
      label: 'Complex',
      description: 'Advanced systems, large projects',
      price: '$350+',
      color: 'red',
    },
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles) return;

    const newFiles: {url: string, name: string, type: string}[] = [];
    const maxFiles = 4;
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    // Allowed file types
    const allowedTypes = [
      'image/png', 'image/jpeg', 'image/jpg', 'image/gif',
      'application/pdf',
      'application/octet-stream' // For RBXL, RBXM files
    ];
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.rblx', '.rbxl', '.rbxlx', '.rbxm', '.rbxlx'];

    Array.from(uploadedFiles).forEach((file) => {
      if (files.length + newFiles.length >= maxFiles) {
        setError(`Maximum ${maxFiles} files allowed`);
        return;
      }

      if (file.size > maxSize) {
        setError('File size must be less than 5MB');
        return;
      }

      // Check file type and extension
      const isValidType = allowedTypes.includes(file.type) || 
        allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
      
      if (!isValidType) {
        setError('Please select only PNG, JPG, GIF, PDF, RBXL, or RBXM files');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          newFiles.push({
            url: result,
            name: file.name,
            type: file.type
          });
          if (newFiles.length === uploadedFiles.length || files.length + newFiles.length === maxFiles) {
            setFiles([...files, ...newFiles]);
            setError('');
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

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
      let commission;
      
      if (draftCommissionId) {
        // Update existing draft to submitted
        await updateCommission(draftCommissionId, {
          taskComplexity,
          subject: subject.trim(),
          description: description.trim(),
          proposedAmount: amount,
          paymentType,
          tags,
          images: files.length > 0 ? files.map(f => f.url) : undefined,
          status: 'submitted'
        });
        
        // Get the updated commission
        const { data: updatedCommission } = await supabase
          .from('commissions')
          .select('*')
          .eq('id', draftCommissionId)
          .single();
        
        commission = {
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
        };
      } else {
        // Create new commission
        commission = await createCommission({
          taskComplexity,
          subject: subject.trim(),
          description: description.trim(),
          proposedAmount: amount,
          paymentType,
          userId: user!.id,
          tags,
          images: files.length > 0 ? files.map(f => f.url) : undefined,
        });

        await updateCommission(commission.id, { status: 'submitted' });
        commission = { ...commission, status: 'submitted' };
      }

      // Delete all other drafts with the same subject for this user
      await deleteRelatedDrafts(commission.id);

      setSubmittedCommission(commission);
      setStep(3);
    } catch (err: any) {
      console.error('Commission creation error:', err);
      setError(err.message || 'Failed to create commission. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6 animate-fade-in">
          <div className="inline-block">
            <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <AlertCircle className="w-10 h-10 text-purple-400" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white">Authentication Required</h2>
          <p className="text-purple-300">
            You need to be signed in to submit a commission request.
          </p>
          <div className="flex space-x-4">
            <button
              onClick={() => navigate('/login')}
              className="flex-1 btn-primary glow-purple hover:scale-105 transition-all duration-300"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="flex-1 btn-secondary hover:scale-105 transition-all duration-300"
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
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-2xl w-full text-center space-y-6 animate-fade-in">
          <div className="inline-block">
            <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <CheckCircle2 className="w-10 h-10 text-purple-400" />
            </div>
          </div>
          <h2 className="text-4xl font-bold text-white">Commission Submitted!</h2>
          <p className="text-xl text-purple-300">
            Your commission request has been received and is under review.
          </p>

          <div className="glass-dark rounded-xl p-6 text-left space-y-4 border border-purple-500/20">
            <div className="flex justify-between items-center border-b border-purple-500/20 pb-4">
              <span className="text-purple-300">Reference Number</span>
              <span className="text-white font-mono font-semibold">
                {submittedCommission.referenceNumber}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-purple-500/20 pb-4">
              <span className="text-purple-300">Subject</span>
              <span className="text-white font-semibold">{submittedCommission.subject}</span>
            </div>
            <div className="flex justify-between items-center border-b border-purple-500/20 pb-4">
              <span className="text-purple-300">Complexity</span>
              <span className="text-white font-semibold capitalize">
                {submittedCommission.taskComplexity}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-purple-300">Proposed Amount</span>
              <span className="text-purple-400 font-bold text-xl">
                ${submittedCommission.proposedAmount.toFixed(2)}
              </span>
            </div>
          </div>

          <p className="text-purple-300">
            You'll receive a response within 1-2 business hours. Check your commission status in your account.
          </p>

          <div className="flex space-x-4">
            <button
              onClick={() => navigate('/commissions')}
              className="flex-1 btn-primary glow-purple hover:scale-105 transition-all duration-300"
            >
              View My Commissions
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 btn-secondary hover:scale-105 transition-all duration-300"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-white mb-2">New Commission Request</h1>
          <p className="text-purple-300">Tell us about your project requirements</p>
          {isAutoSaving && (
            <div className="mt-4 flex items-center justify-center space-x-2 text-yellow-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
              <span className="text-sm">Auto-saving draft...</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 1 ? 'bg-purple-500' : 'bg-purple-700/50'} text-white font-semibold transition-all duration-300 ${step >= 1 ? 'animate-pulse' : ''}`}>
              1
            </div>
            <div className={`w-16 h-1 ${step >= 2 ? 'bg-purple-500' : 'bg-purple-700/50'} transition-all duration-300`} />
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 2 ? 'bg-purple-500' : 'bg-purple-700/50'} text-white font-semibold transition-all duration-300 ${step >= 2 ? 'animate-pulse' : ''}`}>
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
            <div className="glass-dark rounded-xl p-8 space-y-6 border border-purple-500/20 animate-fade-in-up">
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Task Complexity</h2>
                <p className="text-purple-300 mb-6">
                  Select the complexity level that best matches your project requirements
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {complexityOptions.map((option, index) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTaskComplexity(option.value)}
                      className={`text-left p-6 rounded-xl border-2 transition-all duration-300 hover:scale-105 animate-fade-in-up ${
                        taskComplexity === option.value
                          ? `border-purple-400 bg-purple-500/10 shadow-lg shadow-purple-500/20`
                          : 'border-purple-500/30 hover:border-purple-400 hover:bg-purple-500/5'
                      }`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <h3 className={`text-xl font-bold mb-1 ${
                        taskComplexity === option.value ? 'text-purple-400' : 'text-white'
                      }`}>
                        {option.label}
                      </h3>
                      <p className="text-purple-300 text-sm mb-3">{option.description}</p>
                      <p className={`font-semibold ${
                        taskComplexity === option.value ? 'text-purple-400' : 'text-purple-200'
                      }`}>
                        {option.price}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
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
                  className="w-full btn-primary glow-purple hover:scale-105 transition-all duration-300"
                >
                  Continue
                </button>
                
                {user?.isAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsBulkModalOpen(true)}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 hover:scale-105"
                  >
                    <Layers className="w-5 h-5" />
                    <span>Bulk Create Commissions</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="glass-dark rounded-xl p-8 space-y-6 border border-purple-500/20 animate-fade-in-up">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Project Details</h2>
                <p className="text-purple-300 mb-6">
                  Provide information about your commission request
                </p>

                <div className="space-y-6">
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-purple-300 mb-2">
                      Subject
                    </label>
                    <input
                      id="subject"
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="input-field focus:ring-purple-500/20 focus:border-purple-500/50"
                      placeholder="Brief title for your project"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-purple-300 mb-2">
                      Description
                      <span className="text-purple-400 ml-2">
                        ({description.length}/3000 characters)
                      </span>
                    </label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      maxLength={3000}
                      rows={8}
                      className="input-field focus:ring-purple-500/20 focus:border-purple-500/50 resize-none"
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
                    <label htmlFor="proposedAmount" className="block text-sm font-medium text-purple-300 mb-2">
                      Proposed Payment Amount (USD)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                      <input
                        id="proposedAmount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={proposedAmount}
                        onChange={(e) => setProposedAmount(e.target.value)}
                        className="input-field pl-11 focus:ring-purple-500/20 focus:border-purple-500/50"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <p className="text-purple-300 text-sm mt-1">
                      Suggested range for {taskComplexity}: {complexityOptions.find(o => o.value === taskComplexity)?.price}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-purple-300 mb-2">
                      Payment Type
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="paymentType"
                          value="full"
                          checked={paymentType === 'full'}
                          onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                          className="w-5 h-5 text-purple-500 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                        />
                        <span className="text-white font-medium">100% upfront</span>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="paymentType"
                          value="split"
                          checked={paymentType === 'split'}
                          onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                          className="w-5 h-5 text-purple-500 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                        />
                        <span className="text-white font-medium">50% upfront & 50% upon completion</span>
                      </label>
                    </div>
                    <p className="text-purple-300 text-sm mt-2">
                      Choose how you'd like to structure the payment for this commission
                    </p>
                  </div>

                  <div>
                    <label htmlFor="tags" className="block text-sm font-medium text-purple-300 mb-2">
                      Tags (Optional)
                    </label>
                    <div className="space-y-3">
                      <div className="relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                        <input
                          id="tags"
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const trimmedTag = tagInput.trim().toLowerCase();
                              if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 10) {
                                setTags([...tags, trimmedTag]);
                                setTagInput('');
                              }
                            }
                          }}
                          className="input-field pl-11 focus:ring-purple-500/20 focus:border-purple-500/50"
                          placeholder="Type a tag and press Enter"
                        />
                      </div>
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center space-x-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-purple-500/30 transition-colors"
                            >
                              <span>{tag}</span>
                              <button
                                type="button"
                                onClick={() => setTags(tags.filter((_, i) => i !== index))}
                                className="hover:text-purple-100 transition-colors hover:scale-110"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-purple-300 text-sm">
                        Add tags to help categorize your commission (e.g., scripting, ui, vfx, combat)
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-purple-300 mb-2">
                      Files (Optional)
                    </label>
                    <div className="space-y-4">
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-purple-500/30 rounded-lg p-6 text-center cursor-pointer hover:border-purple-500/50 hover:bg-purple-500/5 transition-all duration-300"
                      >
                        <Upload className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                        <p className="text-purple-300 text-sm mb-1">
                          Click to upload files or images or drag and drop
                        </p>
                        <p className="text-purple-400 text-xs">
                          PNG, PDF, RBXL, RBXM up to 5MB each (max 4 files)
                        </p>
                      </div>
                      
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".png,.jpg,.jpeg,.gif,.pdf,.rbxl,.rbxlx,.rbxm,.rbxlx"
                        onChange={handleFileUpload}
                        className="hidden"
                      />

                      {files.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {files.map((file, index) => (
                            <div key={index} className="relative group">
                              {file.type.startsWith('image/') ? (
                                <img
                                  src={file.url}
                                  alt={file.name}
                                  className="w-full h-32 object-cover rounded-lg border border-purple-500/20"
                                />
                              ) : (
                                <div className="w-full h-32 bg-gray-800 rounded-lg border border-purple-500/20 flex flex-col items-center justify-center p-4">
                                  {file.type === 'application/pdf' ? (
                                    <FileText className="w-8 h-8 text-red-400 mb-2" />
                                  ) : (
                                    <File className="w-8 h-8 text-blue-400 mb-2" />
                                  )}
                                  <p className="text-white text-xs text-center truncate w-full">
                                    {file.name}
                                  </p>
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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
                  className="flex-1 btn-secondary hover:scale-105 transition-all duration-300"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 btn-primary glow-purple hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isLoading ? 'Submitting...' : 'Submit Commission'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Bulk Commissions Modal */}
      {user && (
        <BulkCommissionsModal
          isOpen={isBulkModalOpen}
          onClose={() => setIsBulkModalOpen(false)}
          user={user}
        />
      )}
    </div>
  );
}
