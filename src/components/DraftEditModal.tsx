import { useState, useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle2, DollarSign, X, Tag, Upload, Trash2, File, FileText } from 'lucide-react';
import { useCommissions } from '../contexts/CommissionContext';
import { Commission, TaskComplexity, PaymentType } from '../types';

interface DraftEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  commission: Commission;
}

export default function DraftEditModal({ isOpen, onClose, commission }: DraftEditModalProps) {
  const [step, setStep] = useState(1);
  const [taskComplexity, setTaskComplexity] = useState<TaskComplexity>(commission.taskComplexity);
  const [subject, setSubject] = useState(commission.subject);
  const [description, setDescription] = useState(commission.description);
  const [proposedAmount, setProposedAmount] = useState(commission.proposedAmount.toString());
  const [paymentType, setPaymentType] = useState<PaymentType>(commission.paymentType || 'full');
  const [tags, setTags] = useState<string[]>(commission.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [files, setFiles] = useState<{url: string, name: string, type: string}[]>(
    commission.images?.map((url, index) => ({
      url,
      name: `file-${index + 1}`,
      type: url.startsWith('data:image') ? 'image/png' : 'application/octet-stream'
    })) || []
  );
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { updateCommission } = useCommissions();

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

  // Auto-save logic
  const saveDraft = async () => {
    if (!subject.trim() && !description.trim() && !taskComplexity && !proposedAmount) return;
    
    setIsSaving(true);
    
    try {
      await updateCommission(commission.id, {
        taskComplexity: taskComplexity || undefined,
        subject: subject.trim() || undefined,
        description: description.trim() || undefined,
        proposedAmount: proposedAmount ? parseFloat(proposedAmount) : undefined,
        paymentType,
        tags,
        images: files.length > 0 ? files.map(f => f.url) : undefined,
      });
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // 10-second interval auto-save
  useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      saveDraft();
    }, 10000);

    return () => clearInterval(interval);
  }, [isOpen, subject, description, taskComplexity, proposedAmount, paymentType, tags, files]);

  // Save on close
  const handleClose = async () => {
    await saveDraft();
    onClose();
  };

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

  const handleConfirm = async () => {
    await saveDraft();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-fade-in" onClick={handleClose}>
      <div className="glass-dark rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-purple-500/20 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 glass-dark border-b border-purple-500/20 px-6 py-4 flex justify-between items-center rounded-t-xl">
          <h2 className="text-2xl font-bold text-white">Edit Draft Commission</h2>
          <div className="flex items-center space-x-4">
            {isSaving && (
              <div className="flex items-center space-x-2 text-yellow-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
                <span className="text-sm">Saving...</span>
              </div>
            )}
            <button
              onClick={handleClose}
              className="text-purple-400 hover:text-purple-300 transition-colors hover:scale-110"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-3xl font-bold text-white mb-2">Edit Commission Draft</h1>
            <p className="text-purple-300">Modify your draft commission details</p>
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

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-start space-x-3 mb-6">
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
                          onKeyDown={(e) => {
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
                  type="button"
                  onClick={handleConfirm}
                  className="flex-1 btn-primary glow-purple hover:scale-105 transition-all duration-300"
                >
                  Confirm Changes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
