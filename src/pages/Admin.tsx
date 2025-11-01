import { useState, useEffect, useRef } from 'react';
import { Shield, RefreshCw, X, TrendingUp, Clock, CheckCircle, XCircle, Search, Filter, Eye, EyeOff, Trash2, AlertTriangle, Settings, Users, BarChart3, User, LogOut, Briefcase, ArrowLeft, Ban, VolumeX, UserX, LayoutDashboard, ArrowRight, Upload, Download, File, Check, MessageSquare, Edit2, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCommissions } from '../contexts/CommissionContext';
import { useAuth } from '../contexts/AuthContext';
import { MessageProvider } from '../contexts/MessageContext';
import MessagesLayout from '../components/MessagesLayout';
import ImageUpload from '../components/ImageUpload';
import { Commission, CommissionStatus, UserModeration } from '../types';
import { isAdmin } from '../data/adminList';

export default function Admin() {
  const { updateCommission, deleteCommission, updateProgress, completeProject, uploadCompletionFile, downloadFile } = useCommissions();
  const { user, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'commissions' | 'users' | 'activity' | 'messages'>('commissions');
  const [showExpandedProjects, setShowExpandedProjects] = useState(false);
  
  // Project search and filter state
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [projectFilterComplexity, setProjectFilterComplexity] = useState<'all' | 'easy' | 'medium' | 'hard' | 'expert'>('all');
  const [projectSortBy, setProjectSortBy] = useState<'created' | 'updated' | 'amount' | 'subject'>('updated');
  const [projectSortOrder, setProjectSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Commission-related state
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<CommissionStatus | 'all'>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const autoUpdatedCommissions = useRef<Set<string>>(new Set());

  // User-related state
  const [users, setUsers] = useState<UserModeration[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserModeration | null>(null);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showMuteDialog, setShowMuteDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState('');
  const [muteReason, setMuteReason] = useState('');
  const [muteDuration, setMuteDuration] = useState('');
  const [isModerating, setIsModerating] = useState(false);
  
  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editingDisplayName, setEditingDisplayName] = useState('');
  const [editingBio, setEditingBio] = useState('');
  const [editingAvatar, setEditingAvatar] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileEditError, setProfileEditError] = useState<string | null>(null);

  // Progress and completion state
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionFiles, setCompletionFiles] = useState<File[]>([]);
  const [uploadedFileUrls, setUploadedFileUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleLogout = () => {
    logout();
    setAccountMenuOpen(false);
  };

  // Check if user is authenticated and is an admin
  if (!isAuthenticated || !user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400 mb-6">
            You don't have permission to access the admin panel.
          </p>
          <a
            href="/"
            className="btn-primary"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (activeTab === 'commissions') {
      loadAllCommissions();
    } else if (activeTab === 'users') {
      loadAllUsers();
    } else if (activeTab === 'activity') {
      loadAllCommissions();
    }
  }, [activeTab]);

  // Handle URL parameters for commission search
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    
    if (searchParam) {
      // Set the search query and switch to commissions tab
      setSearchQuery(searchParam);
      setActiveTab('commissions');
    }
  }, []);

  // Debounced user search
  useEffect(() => {
    if (activeTab === 'users') {
      const timeoutId = setTimeout(() => {
        if (userSearchQuery.trim()) {
          searchUsers(userSearchQuery);
        } else {
          loadAllUsers();
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [userSearchQuery, activeTab]);

  const loadAllCommissions = async () => {
    setIsLoading(true);
    try {
      // Check if user is admin using the admin list
      const isUserAdmin = user?.isAdmin;
      console.log('Loading commissions for admin user:', isUserAdmin);
      
      let { data, error } = await supabase
        .from('commissions')
        .select(`
          *,
          profiles!commissions_user_id_fkey (
            display_name,
            email
          )
        `)
        .neq('status', 'draft')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading commissions:', error);
        throw error;
      }

      console.log('Loaded commissions:', data?.length || 0);

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
        images: item.images || [],
        rejectionReason: item.rejection_reason,
        ownerName: item.profiles?.display_name || item.profiles?.email || 'Unknown User',
        startedByAdminId: item.started_by_admin_id,
        startedByAdminName: undefined, // Will be populated separately if needed
        startedAt: item.started_at,
        // Payment-related fields
        paymentStatus: item.payment_status,
        stripeProductId: item.stripe_product_id,
        stripePriceId: item.stripe_price_id,
        stripePaymentLinkUrl: item.stripe_payment_link_url,
        paidAt: item.paid_at,
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
      
      // Load admin information for commissions that have been started
      const commissionsWithAdmins = mapped.filter(c => c.startedByAdminId);
      if (commissionsWithAdmins.length > 0) {
        await loadAdminNames(commissionsWithAdmins);
      }
    } catch (error) {
      console.error('Error loading commissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAdminNames = async (commissions: Commission[]) => {
    try {
      const adminIds = [...new Set(commissions.map(c => c.startedByAdminId).filter(Boolean))];
      
      if (adminIds.length === 0) return;

      const { data: adminData, error } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .in('id', adminIds);

      if (error) throw error;

      const adminMap = new Map(adminData?.map(admin => [admin.id, admin]) || []);

      setCommissions(prev => prev.map(commission => {
        if (commission.startedByAdminId && adminMap.has(commission.startedByAdminId)) {
          const admin = adminMap.get(commission.startedByAdminId);
          return {
            ...commission,
            startedByAdminName: admin?.display_name || admin?.email
          };
        }
        return commission;
      }));
    } catch (error) {
      console.error('Error loading admin names:', error);
    }
  };

  useEffect(() => {
    if (selectedCommission &&
        selectedCommission.status !== 'in_review' &&
        selectedCommission.status !== 'archived' &&
        selectedCommission.status !== 'accepted' &&
        selectedCommission.status !== 'in_progress' &&
        selectedCommission.status !== 'completed' &&
        !autoUpdatedCommissions.current.has(selectedCommission.id)) {
      autoUpdatedCommissions.current.add(selectedCommission.id);
      handleStatusChange(selectedCommission.id, 'in_review');
    }
  }, [selectedCommission?.id]);

  const handleStatusChange = async (commissionId: string, newStatus: CommissionStatus, reason?: string) => {
    setIsUpdating(commissionId);
    try {
      const updates: Partial<Commission> = { status: newStatus };
      if (reason) {
        updates.rejectionReason = reason;
      } else if (newStatus !== 'rejected') {
        // Clear rejection reason if status is not rejected
        updates.rejectionReason = undefined;
      }
      await updateCommission(commissionId, updates);

      // Update local state instead of reloading all commissions
      setCommissions(prev => prev.map(commission => 
        commission.id === commissionId 
          ? { 
              ...commission, 
              status: newStatus, 
              rejectionReason: newStatus === 'rejected' ? reason : undefined 
            }
          : commission
      ));

      if (selectedCommission && selectedCommission.id === commissionId) {
        setSelectedCommission({ 
          ...selectedCommission, 
          status: newStatus, 
          rejectionReason: newStatus === 'rejected' ? reason : undefined 
        });
      }
    } catch (error) {
      console.error('Error updating commission status:', error);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleAccept = async () => {
    if (selectedCommission) {
      await handleStatusChange(selectedCommission.id, 'accepted');
    }
  };

  const handleStartProject = async () => {
    if (selectedCommission && user) {
      try {
        setIsUpdating(selectedCommission.id);
        
        // Update commission status to in_progress and add admin tracking
        const { error } = await supabase
          .from('commissions')
          .update({
            status: 'in_progress',
            started_by_admin_id: user.id,
            started_at: new Date().toISOString()
          })
          .eq('id', selectedCommission.id);

        if (error) throw error;

        // Update selected commission with new data
        const updatedCommission = { 
          ...selectedCommission, 
          status: 'in_progress' as CommissionStatus,
          startedByAdminId: user.id,
          startedByAdminName: user.displayName,
          startedAt: new Date().toISOString()
        };
        setSelectedCommission(updatedCommission);

        // Update the commission in the commissions list
        setCommissions(prev => prev.map(commission => 
          commission.id === selectedCommission.id 
            ? updatedCommission 
            : commission
        ));
      } catch (error) {
        console.error('Error starting project:', error);
      } finally {
        setIsUpdating(null);
      }
    }
  };

  const handleReject = () => {
    setShowRejectDialog(true);
  };

  const confirmReject = async () => {
    if (selectedCommission && rejectionReason.trim()) {
      await handleStatusChange(selectedCommission.id, 'rejected', rejectionReason);
      setShowRejectDialog(false);
      setRejectionReason('');
    }
  };

  const cancelReject = () => {
    setShowRejectDialog(false);
    setRejectionReason('');
  };

  // Progress and completion handlers
  const handleProgressChange = async (commissionId: string, progress: number) => {
    try {
      await updateProgress(commissionId, progress);
      
      // Update local state
      setCommissions(prev => prev.map(commission => 
        commission.id === commissionId 
          ? { ...commission, progress }
          : commission
      ));

      if (selectedCommission && selectedCommission.id === commissionId) {
        setSelectedCommission({ ...selectedCommission, progress });
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleCompleteProject = () => {
    setShowCompletionModal(true);
    setCompletionFiles([]);
    setUploadedFileUrls([]);
  };

  const handleFileUpload = (files: FileList) => {
    const newFiles = Array.from(files);
    setCompletionFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const removeFile = (index: number) => {
    setCompletionFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (!selectedCommission || completionFiles.length === 0) return;

    setIsUploading(true);
    try {
      const fileUrls: string[] = [];
      
      for (const file of completionFiles) {
        const url = await uploadCompletionFile(file, selectedCommission.id);
        fileUrls.push(url);
      }

      setUploadedFileUrls(fileUrls);
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const finalizeCompletion = async () => {
    if (!selectedCommission || uploadedFileUrls.length === 0) return;

    try {
      await completeProject(
        selectedCommission.id, 
        uploadedFileUrls, 
        user?.id, 
        user?.displayName
      );
      
      // Update local state
      const updatedCommission = {
        ...selectedCommission,
        status: 'completed' as CommissionStatus,
        progress: 100,
        completionFiles: uploadedFileUrls,
        completedAt: new Date().toISOString(),
        completedByAdminId: user?.id,
        completedByAdminName: user?.displayName
      };
      
      setSelectedCommission(updatedCommission);
      setCommissions(prev => prev.map(commission => 
        commission.id === selectedCommission.id 
          ? updatedCommission 
          : commission
      ));

      setShowCompletionModal(false);
      setCompletionFiles([]);
      setUploadedFileUrls([]);
    } catch (error) {
      console.error('Error completing project:', error);
    }
  };

  const handleDownloadFile = async (fileUrl: string, fileName: string) => {
    try {
      await downloadFile(fileUrl, fileName);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handleDelete = async (commissionId: string) => {
    if (window.confirm('Are you sure you want to permanently delete this archived commission? This action cannot be undone.')) {
      try {
        await deleteCommission(commissionId);
        await loadAllCommissions();
      } catch (error) {
        console.error('Error deleting commission:', error);
      }
    }
  };

  const handleCloseModal = () => {
    setSelectedCommission(null);
  };

  const allTags = Array.from(new Set(commissions.flatMap(c => c.tags || [])));

  const filteredCommissions = commissions.filter(c => {
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchesSearch = !searchQuery ||
      c.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTags = selectedTags.length === 0 ||
      selectedTags.some(tag => c.tags?.includes(tag));
    const matchesHidden = showHidden || c.status !== 'archived';
    return matchesStatus && matchesSearch && matchesTags && matchesHidden;
  });

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setFilterStatus('all');
    setSearchQuery('');
    setSelectedTags([]);
  };

  const hasActiveFilters = filterStatus !== 'all' || searchQuery !== '' || selectedTags.length > 0;

  // User management functions
  const loadAllUsers = async () => {
    setIsLoadingUsers(true);
    try {
      // First try a simple query to see if we can access profiles at all
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Profiles query result:', { profiles, profilesError });
      if (profilesError) {
        console.error('Error loading profiles:', profilesError);
        throw profilesError;
      }

      // Get commission counts for each user
      const { data: commissionCounts, error: countsError } = await supabase
        .from('commissions')
        .select('user_id')
        .in('user_id', profiles?.map(p => p.id) || []);

      if (countsError) throw countsError;

      // Get ban information for each user
      const { data: banData, error: banError } = await supabase
        .from('banned_users')
        .select('email, reason, banned_at, expires_at, banned_by')
        .eq('is_active', true)
        .in('email', profiles?.map(p => p.email) || []);

      if (banError) throw banError;

      const commissionCountMap = new Map();
      commissionCounts?.forEach(c => {
        commissionCountMap.set(c.user_id, (commissionCountMap.get(c.user_id) || 0) + 1);
      });

      const banMap = new Map();
      banData?.forEach(b => {
        banMap.set(b.email, {
          reason: b.reason,
          bannedAt: b.banned_at,
          expiresAt: b.expires_at,
          bannedBy: b.banned_by
        });
      });

      const mappedUsers: UserModeration[] = (profiles || []).map(profile => ({
        id: profile.id,
        email: profile.email,
        displayName: profile.display_name || '',
        avatar: profile.avatar || undefined,
        bio: profile.bio || undefined,
        joinDate: profile.created_at,
        isMuted: profile.is_muted || false, // Will be false if column doesn't exist
        mutedUntil: profile.muted_until || undefined,
        mutedReason: profile.muted_reason || undefined,
        isBanned: banMap.has(profile.email),
        banInfo: banMap.get(profile.email),
        commissionCount: commissionCountMap.get(profile.id) || 0,
      }));

      setUsers(mappedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const searchUsers = async (query: string) => {
    setIsLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`display_name.ilike.%${query}%,email.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get commission counts and ban info (same as loadAllUsers)
      const { data: commissionCounts, error: countsError } = await supabase
        .from('commissions')
        .select('user_id')
        .in('user_id', data?.map(p => p.id) || []);

      if (countsError) throw countsError;

      const { data: banData, error: banError } = await supabase
        .from('banned_users')
        .select('email, reason, banned_at, expires_at, banned_by')
        .eq('is_active', true)
        .in('email', data?.map(p => p.email) || []);

      if (banError) throw banError;

      const commissionCountMap = new Map();
      commissionCounts?.forEach(c => {
        commissionCountMap.set(c.user_id, (commissionCountMap.get(c.user_id) || 0) + 1);
      });

      const banMap = new Map();
      banData?.forEach(b => {
        banMap.set(b.email, {
          reason: b.reason,
          bannedAt: b.banned_at,
          expiresAt: b.expires_at,
          bannedBy: b.banned_by
        });
      });

      const mappedUsers: UserModeration[] = (data || []).map(profile => ({
        id: profile.id,
        email: profile.email,
        displayName: profile.display_name || '',
        avatar: profile.avatar || undefined,
        bio: profile.bio || undefined,
        joinDate: profile.created_at,
        isMuted: profile.is_muted || false, // Will be false if column doesn't exist
        mutedUntil: profile.muted_until || undefined,
        mutedReason: profile.muted_reason || undefined,
        isBanned: banMap.has(profile.email),
        banInfo: banMap.get(profile.email),
        commissionCount: commissionCountMap.get(profile.id) || 0,
      }));

      setUsers(mappedUsers);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser || !banReason.trim()) return;

    setIsModerating(true);
    try {
      const durationHours = banDuration === 'permanent' ? null : parseInt(banDuration);
      
      const { error } = await supabase.rpc('ban_user', {
        target_user_id: selectedUser.id,
        reason: banReason,
        duration_hours: durationHours
      });

      if (error) throw error;

      await loadAllUsers();
      setShowBanDialog(false);
      setBanReason('');
      setBanDuration('');
      setSelectedUser(null);
    } catch (error) {
      console.error('Error banning user:', error);
    } finally {
      setIsModerating(false);
    }
  };

  const handleMuteUser = async () => {
    if (!selectedUser || !muteReason.trim()) return;

    setIsModerating(true);
    try {
      const durationHours = parseInt(muteDuration);
      
      const { error } = await supabase.rpc('mute_user', {
        target_user_id: selectedUser.id,
        reason: muteReason,
        duration_hours: durationHours
      });

      if (error) throw error;

      await loadAllUsers();
      setShowMuteDialog(false);
      setMuteReason('');
      setMuteDuration('');
      setSelectedUser(null);
    } catch (error) {
      console.error('Error muting user:', error);
    } finally {
      setIsModerating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setIsModerating(true);
    try {
      const { error } = await supabase.rpc('delete_user_completely', {
        target_user_id: selectedUser.id
      });

      if (error) throw error;

      await loadAllUsers();
      setShowDeleteDialog(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setIsModerating(false);
    }
  };

  const handleUnbanUser = async (userId: string) => {
    setIsModerating(true);
    try {
      const { error } = await supabase.rpc('unban_user', {
        target_user_id: userId
      });

      if (error) throw error;

      await loadAllUsers();
    } catch (error) {
      console.error('Error unbanning user:', error);
    } finally {
      setIsModerating(false);
    }
  };

  const handleUnmuteUser = async (userId: string) => {
    setIsModerating(true);
    try {
      const { error } = await supabase.rpc('unmute_user', {
        target_user_id: userId
      });

      if (error) throw error;

      await loadAllUsers();
    } catch (error) {
      console.error('Error unmuting user:', error);
    } finally {
      setIsModerating(false);
    }
  };

  const handleEditProfile = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Prevent modal from closing
    }
    if (selectedUser) {
      console.log('Entering edit mode for user:', selectedUser.id);
      setEditingDisplayName(selectedUser.displayName);
      setEditingBio(selectedUser.bio || '');
      setEditingAvatar(selectedUser.avatar || '');
      setIsEditingProfile(true);
      setProfileEditError(null);
    }
  };

  const handleCancelEditProfile = () => {
    setIsEditingProfile(false);
    setEditingDisplayName('');
    setEditingBio('');
    setEditingAvatar('');
    setProfileEditError(null);
  };

  const handleSaveProfile = async () => {
    if (!selectedUser) return;

    setIsSavingProfile(true);
    setProfileEditError(null);

    try {
      console.log('Saving profile for user:', selectedUser.id);
      console.log('Updated values:', {
        display_name: editingDisplayName.trim(),
        bio: editingBio.trim() || null,
        avatar: editingAvatar || null,
      });

      const { data, error } = await supabase
        .from('profiles')
        .update({
          display_name: editingDisplayName.trim(),
          bio: editingBio.trim() || null,
          avatar: editingAvatar || null,
        })
        .eq('id', selectedUser.id)
        .select();

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      console.log('Profile updated successfully:', data);

      // Reload users to get updated data
      await loadAllUsers();
      
      // Update selectedUser to show new values
      const updatedUser = {
        ...selectedUser,
        displayName: editingDisplayName.trim(),
        bio: editingBio.trim() || undefined,
        avatar: editingAvatar || undefined,
      };
      setSelectedUser(updatedUser);
      
      setIsEditingProfile(false);
      setProfileEditError(null);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      const errorMessage = error.message || error.error_description || 'Failed to update profile';
      setProfileEditError(errorMessage);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Update editing state when selectedUser changes
  useEffect(() => {
    if (selectedUser && isEditingProfile) {
      setEditingDisplayName(selectedUser.displayName);
      setEditingBio(selectedUser.bio || '');
      setEditingAvatar(selectedUser.avatar || '');
    } else if (!selectedUser) {
      setIsEditingProfile(false);
    }
  }, [selectedUser, isEditingProfile]);

  const stats = {
    total: commissions.filter(c => c.status !== 'archived').length,
    submitted: commissions.filter(c => c.status === 'submitted').length,
    inReview: commissions.filter(c => c.status === 'in_review').length,
    accepted: commissions.filter(c => c.status === 'accepted').length,
    inProgress: commissions.filter(c => c.status === 'in_progress').length,
    approved: commissions.filter(c => c.status === 'approved').length,
    rejected: commissions.filter(c => c.status === 'rejected').length,
    completed: commissions.filter(c => c.status === 'completed').length,
  };

  // Filter projects for current admin
  const myInProgressProjects = commissions.filter(
    c => c.status === 'in_progress' && c.startedByAdminId === user?.id
  );

  const statusOptions: { value: CommissionStatus; label: string }[] = [
    { value: 'draft', label: 'Draft' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'in_review', label: 'In Review' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'completed', label: 'Completed' },
    { value: 'archived', label: 'Archived' },
  ];

  // Filter and sort projects for the expanded view
  const filteredAndSortedProjects = myInProgressProjects
    .filter(project => {
      const matchesSearch = !projectSearchQuery ||
        project.subject.toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
        project.referenceNumber.toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
        project.ownerName?.toLowerCase().includes(projectSearchQuery.toLowerCase());
      
      const matchesComplexity = projectFilterComplexity === 'all' || project.taskComplexity === projectFilterComplexity;
      
      return matchesSearch && matchesComplexity;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (projectSortBy) {
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'updated':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'amount':
          comparison = a.proposedAmount - b.proposedAmount;
          break;
        case 'subject':
          comparison = a.subject.localeCompare(b.subject);
          break;
        default:
          comparison = 0;
      }
      
      return projectSortOrder === 'asc' ? comparison : -comparison;
    });

  const hasProjectFilters = projectSearchQuery !== '' || projectFilterComplexity !== 'all';

  const clearProjectFilters = () => {
    setProjectSearchQuery('');
    setProjectFilterComplexity('all');
    setProjectSortBy('updated');
    setProjectSortOrder('desc');
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [detailPanelTab, setDetailPanelTab] = useState<'info' | 'details' | 'documents' | 'activity'>('info');

  return (
    <div className="h-screen flex flex-row bg-black overflow-hidden relative">

      {/* Left Sidebar - Permanent on Desktop */}
      <div className="hidden lg:flex lg:flex-col w-56 bg-[#0a0a0a] border-r border-[#2a2a2a] flex-shrink-0">
        {/* Logo Section */}
        <div className="p-6 border-b border-[#2a2a2a]">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-white" />
            <div>
              <h1 className="text-white font-bold text-lg">Parcel Studios</h1>
              <p className="text-gray-400 text-xs">Since 2022</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('commissions')}
            className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 text-left flex items-center space-x-3 ${
              activeTab === 'commissions' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
            }`}
          >
            <Briefcase className="w-5 h-5" />
            <span>Commissions</span>
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 text-left flex items-center space-x-3 ${
              activeTab === 'users' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Users</span>
          </button>
          <button 
            onClick={() => setActiveTab('activity')}
            className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 text-left flex items-center space-x-3 ${
              activeTab === 'activity' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Activity</span>
          </button>
          <button 
            onClick={() => setActiveTab('messages')}
            className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 text-left flex items-center space-x-3 ${
              activeTab === 'messages' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span>Messages</span>
          </button>
        </nav>

        {/* Bottom Action Button */}
        <div className="p-4 border-t border-[#2a2a2a]">
          <button className="w-full bg-[#9c7b6e] hover:bg-[#8a6a5d] text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2">
            <ArrowRight className="w-5 h-5" />
            <span>Create Request</span>
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Mobile Menu */}
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-[#0a0a0a] border-r border-[#2a2a2a] flex flex-col z-50 lg:hidden transform transition-transform duration-300 ease-in-out shadow-2xl">
            <div className="p-6 border-b border-[#2a2a2a] flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Shield className="w-8 h-8 text-white" />
                <div>
                  <h1 className="text-white font-bold text-lg">Parcel Studios</h1>
                  <p className="text-gray-400 text-xs">Since 2022</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-[#1a1a1a] text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <nav className="flex-1 p-4 space-y-2">
              <button 
                onClick={() => { setActiveTab('commissions'); setSidebarOpen(false); }}
                className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 text-left flex items-center space-x-3 ${
                  activeTab === 'commissions' 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                    : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                }`}
              >
                <Briefcase className="w-5 h-5" />
                <span>Commissions</span>
              </button>
              <button 
                onClick={() => { setActiveTab('users'); setSidebarOpen(false); }}
                className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 text-left flex items-center space-x-3 ${
                  activeTab === 'users' 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                    : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                }`}
              >
                <Users className="w-5 h-5" />
                <span>Users</span>
              </button>
              <button 
                onClick={() => { setActiveTab('activity'); setSidebarOpen(false); }}
                className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 text-left flex items-center space-x-3 ${
                  activeTab === 'activity' 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                    : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>Activity</span>
              </button>
              <button 
                onClick={() => { setActiveTab('messages'); setSidebarOpen(false); }}
                className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 text-left flex items-center space-x-3 ${
                  activeTab === 'messages' 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                    : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                }`}
              >
                <MessageSquare className="w-5 h-5" />
                <span>Messages</span>
              </button>
            </nav>

            <div className="p-4 border-t border-[#2a2a2a]">
              <button className="w-full bg-[#9c7b6e] hover:bg-[#8a6a5d] text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2">
                <ArrowRight className="w-5 h-5" />
                <span>Create Request</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main Content Wrapper */}
      <div className="flex flex-1 flex-col overflow-hidden relative z-0">

        {/* Simplified Top Bar */}
        <div className="bg-[#0a0a0a] border-b border-[#2a2a2a] px-4 py-3 flex items-center justify-between flex-shrink-0">
          {/* Mobile Menu Toggle + Title */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-[#1a1a1a] text-gray-400 transition-colors"
              aria-label="Toggle menu"
            >
              <Settings className="w-5 h-5" />
            </button>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              {activeTab === 'commissions' ? 'Commissions' : 
               activeTab === 'users' ? 'Users' : 
               activeTab === 'activity' ? 'Activity Dashboard' : 
               activeTab === 'messages' ? 'Messages' : 'Dashboard'}
            </h2>
          </div>

          {/* Right Section - Search + User Menu */}
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-lg hover:bg-[#1a1a1a] text-gray-400 hover:text-white transition-colors">
              <Search className="w-5 h-5" />
            </button>
            
            <Link
              to="/"
              className="hidden md:flex items-center space-x-2 text-gray-400 hover:text-white transition-all text-sm px-3 py-2 rounded-lg hover:bg-[#1a1a1a]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Link>
            
            <div className="h-6 w-px bg-[#2a2a2a]"></div>
            
            <div className="relative">
              <button
                onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-all text-sm px-3 py-2 rounded-lg hover:bg-[#1a1a1a]"
                aria-expanded={accountMenuOpen}
                aria-haspopup="true"
              >
                <span className="hidden sm:inline max-w-[120px] truncate">{user?.displayName || 'Account'}</span>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
              </button>
              
              {accountMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setAccountMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-2xl z-40 py-2">
                    <div className="px-4 py-3 border-b border-[#2a2a2a]">
                      <p className="text-white font-semibold truncate">{user?.displayName}</p>
                      <p className="text-gray-400 text-sm truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-gray-300 hover:bg-[#2a2a2a] transition-colors flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-row overflow-hidden min-w-0">

          {/* Scrollable Tab Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden bg-black/20 p-3 sm:p-4 lg:p-6">
            {activeTab === 'commissions' ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 hover:border-[#3a3a3a] transition-all duration-200">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                  <span className="text-xl sm:text-2xl font-bold text-white">{stats.total}</span>
                </div>
                <p className="text-gray-400 text-xs sm:text-sm font-medium">Total</p>
              </div>

              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 hover:border-[#3a3a3a] transition-all duration-200">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0" />
                  <span className="text-xl sm:text-2xl font-bold text-white">{stats.submitted}</span>
                </div>
                <p className="text-blue-300 text-xs sm:text-sm font-medium">Submitted</p>
              </div>

              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 hover:border-[#3a3a3a] transition-all duration-200">
                <div className="flex items-center justify-between mb-2">
                  <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 flex-shrink-0" />
                  <span className="text-xl sm:text-2xl font-bold text-white">{stats.inReview}</span>
                </div>
                <p className="text-yellow-300 text-xs sm:text-sm font-medium">In Review</p>
              </div>

              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 hover:border-[#3a3a3a] transition-all duration-200">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0" />
                  <span className="text-xl sm:text-2xl font-bold text-white">{stats.accepted}</span>
                </div>
                <p className="text-green-300 text-xs sm:text-sm font-medium">Accepted</p>
              </div>

              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 hover:border-[#3a3a3a] transition-all duration-200">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0" />
                  <span className="text-xl sm:text-2xl font-bold text-white">{stats.inProgress}</span>
                </div>
                <p className="text-blue-300 text-xs sm:text-sm font-medium">In Progress</p>
              </div>

              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 hover:border-[#3a3a3a] transition-all duration-200">
                <div className="flex items-center justify-between mb-2">
                  <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0" />
                  <span className="text-xl sm:text-2xl font-bold text-white">{stats.rejected}</span>
                </div>
                <p className="text-red-300 text-xs sm:text-sm font-medium">Rejected</p>
              </div>

              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 hover:border-[#3a3a3a] transition-all duration-200">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0" />
                  <span className="text-xl sm:text-2xl font-bold text-white">{stats.completed}</span>
                </div>
                <p className="text-green-300 text-xs sm:text-sm font-medium">Completed</p>
              </div>
            </div>

            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 mb-4 sm:mb-6 space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search by subject, description, or reference number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white pl-9 sm:pl-10 pr-9 sm:pr-10 py-2 sm:py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 text-sm sm:text-base"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setShowHidden(!showHidden)}
                  className={`inline-flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
                    showHidden
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-[#0a0a0a] text-gray-300 hover:bg-[#1a1a1a] border border-[#2a2a2a]'
                  }`}
                >
                  {showHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  <span className="text-xs sm:text-sm">{showHidden ? 'Hide Archived' : 'Show Archived'}</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as CommissionStatus | 'all')}
                    className="bg-[#0a0a0a] border border-[#2a2a2a] text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm min-w-[140px]"
                  >
                    <option value="all">All Statuses</option>
                    <option value="draft">Draft</option>
                    <option value="submitted">Submitted</option>
                    <option value="in_review">In Review</option>
                    <option value="accepted">Accepted</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                {allTags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-gray-400 text-xs sm:text-sm">Tags:</span>
                    {allTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                          selectedTags.includes(tag)
                            ? 'bg-blue-600 text-white border border-blue-500'
                            : 'bg-[#0a0a0a] text-gray-300 border border-[#2a2a2a] hover:border-[#3a3a3a] hover:bg-[#1a1a1a]'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center space-x-1 text-gray-400 hover:text-white text-xs sm:text-sm font-medium transition-colors px-2 py-1 rounded-lg hover:bg-purple-500/10"
                  >
                    <X className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Clear Filters</span>
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between text-xs sm:text-sm pt-2 border-t border-purple-500/10">
                <p className="text-gray-400">
                  <span className="font-semibold text-white">{filteredCommissions.length}</span> commission{filteredCommissions.length !== 1 ? 's' : ''} found
                  {hasActiveFilters && <span className="ml-2 text-purple-400">(filtered)</span>}
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-12 card">
                <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-3" />
                <p className="text-gray-400">Loading commissions...</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {filteredCommissions.length > 0 ? (
                  filteredCommissions.map((commission) => (
                    <div
                      key={commission.id}
                      className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 hover:border-blue-500/50 hover:bg-[#1f1f1f] transition-all duration-200 cursor-pointer group"
                      onClick={() => setSelectedCommission(commission)}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0 w-full sm:w-auto">
                          <div className="flex items-center space-x-2 mb-2 flex-wrap gap-2">
                            <span className={`${
                              commission.status === 'draft' ? 'bg-gray-600' :
                              commission.status === 'submitted' ? 'bg-blue-600' :
                              commission.status === 'in_review' ? 'bg-yellow-600' :
                              commission.status === 'accepted' ? 'bg-emerald-600' :
                              commission.status === 'in_progress' ? 'bg-blue-600' :
                              commission.status === 'approved' ? 'bg-emerald-600' :
                              commission.status === 'rejected' ? 'bg-red-600' :
                              commission.status === 'archived' ? 'bg-slate-600' :
                              'bg-purple-600'
                            } text-white text-xs px-2.5 sm:px-3 py-1 rounded-full font-semibold capitalize shadow-sm`}>
                              {commission.status.replace('_', ' ')}
                            </span>
                            <span className={`${
                              commission.taskComplexity === 'easy' ? 'bg-green-900/30 text-green-400 border-green-500/30' :
                              commission.taskComplexity === 'medium' ? 'bg-blue-900/30 text-blue-400 border-blue-500/30' :
                              commission.taskComplexity === 'hard' ? 'bg-orange-900/30 text-orange-400 border-orange-500/30' :
                              'bg-red-900/30 text-red-400 border-red-500/30'
                            } text-xs px-2.5 sm:px-3 py-1 rounded-full capitalize border`}>
                              {commission.taskComplexity}
                            </span>
                            <span className="text-slate-400 font-mono text-xs px-2 py-1 bg-slate-900/30 rounded">
                              {commission.referenceNumber}
                            </span>
                          </div>

                          <h3 className="text-lg sm:text-xl font-bold text-white mb-2 line-clamp-1">{commission.subject}</h3>
                          <p className="text-gray-400 text-xs sm:text-sm mb-2">
                            <span className="text-gray-500">Owner:</span> <span className="text-white font-medium">{commission.ownerName || 'Unknown User'}</span>
                          </p>
                          <p className="text-gray-400 text-sm line-clamp-2 mb-3">{commission.description}</p>

                          {commission.tags && commission.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3">
                              {commission.tags.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 sm:py-1 rounded text-xs font-medium"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {commission.images && commission.images.length > 0 && (
                            <div className="mb-3">
                              <div className="flex items-center space-x-2">
                                <div className="relative">
                                  <img
                                    src={commission.images[0]}
                                    alt="Commission preview"
                                    className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-lg border border-purple-500/20 hover:border-purple-400/40 transition-colors"
                                  />
                                </div>
                                {commission.images.length > 1 && (
                                  <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-purple-500/20 border border-purple-500/30 rounded-lg">
                                    <span className="text-purple-300 text-xs sm:text-sm font-semibold">
                                      +{commission.images.length - 1}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-xs text-gray-400">
                            <span>Created: <span className="text-gray-300">{new Date(commission.createdAt).toLocaleDateString()}</span></span>
                            <span>Updated: <span className="text-gray-300">{new Date(commission.updatedAt).toLocaleDateString()}</span></span>
                          </div>
                        </div>

                        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start w-full sm:w-auto space-x-3 sm:space-x-0 sm:space-y-3">
                          <div className="text-[#9c7b6e] font-bold text-xl sm:text-2xl whitespace-nowrap">
                            ${commission.proposedAmount.toFixed(2)}
                          </div>
                          <div className="flex items-center space-x-2">
                            <div onClick={(e) => e.stopPropagation()}>
                              <select
                                value={commission.status}
                                onChange={(e) => handleStatusChange(commission.id, e.target.value as CommissionStatus)}
                                disabled={isUpdating === commission.id}
                                className="bg-[#0a0a0a] border border-[#2a2a2a] text-white text-xs sm:text-sm px-2 sm:px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 min-w-[120px] sm:min-w-[140px]"
                              >
                                {statusOptions.map(option => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {commission.status === 'archived' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(commission.id);
                                }}
                                className="text-red-400 hover:text-red-300 transition-colors p-1.5 sm:p-2 hover:bg-red-900/20 rounded-lg"
                                title="Delete permanently"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                </div>
              ))
                ) : (
                  <div className="text-center py-12 card">
                    <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">No commissions found</p>
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="mt-4 text-purple-400 hover:text-purple-300 font-semibold"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
              </>
            ) : activeTab === 'users' ? (
              <>
                {/* Users Tab Content */}
                <div className="card mb-6 space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="w-full bg-black/40 border border-purple-500/20 text-white pl-10 pr-10 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
                    />
                    {userSearchQuery && (
                      <button
                        onClick={() => setUserSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <p className="text-gray-400">
                      {users.length} user{users.length !== 1 ? 's' : ''} found
                      {userSearchQuery && <span className="ml-2 text-purple-400">(filtered)</span>}
                    </p>
                  </div>
                </div>

                {isLoadingUsers ? (
                  <div className="text-center py-12 card">
                    <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-3" />
                    <p className="text-gray-400">Loading users...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {users.length > 0 ? (
                      users.map((user) => (
                        <div
                          key={user.id}
                          className="card hover:border-purple-500/50 transition-all cursor-pointer"
                          onClick={() => setSelectedUser(user)}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start space-x-4">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/30">
                                {user.avatar ? (
                                  <img
                                    src={user.avatar}
                                    alt={user.displayName}
                                    className="w-12 h-12 rounded-full object-cover"
                                  />
                                ) : (
                                  <User className="w-6 h-6 text-white" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-2 flex-wrap">
                                  <h3 className="text-xl font-bold text-white">{user.displayName}</h3>
                                  {user.isBanned && (
                                    <span className="bg-red-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                                      Banned
                                    </span>
                                  )}
                                  {user.isMuted && (
                                    <span className="bg-yellow-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                                      Muted
                                    </span>
                                  )}
                                  {isAdmin(user.id) && (
                                    <span className="bg-purple-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                                      Admin
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-400 text-sm mb-1">{user.email}</p>
                                {user.bio && (
                                  <p className="text-gray-400 text-sm line-clamp-2 mb-2">{user.bio}</p>
                                )}
                                <div className="flex items-center space-x-4 text-xs text-gray-400">
                                  <span>Joined: {new Date(user.joinDate).toLocaleDateString()}</span>
                                  <span>Commissions: {user.commissionCount}</span>
                                </div>
                                {user.isBanned && user.banInfo && (
                                  <div className="mt-2 p-2 bg-red-900/20 border border-red-500/30 rounded text-xs">
                                    <p className="text-red-300 font-medium">Ban Reason: {user.banInfo.reason}</p>
                                    <p className="text-red-400">
                                      Banned: {new Date(user.banInfo.bannedAt).toLocaleDateString()}
                                      {user.banInfo.expiresAt && (
                                        <span> • Expires: {new Date(user.banInfo.expiresAt).toLocaleDateString()}</span>
                                      )}
                                    </p>
                                  </div>
                                )}
                                {user.isMuted && user.mutedReason && (
                                  <div className="mt-2 p-2 bg-yellow-900/20 border border-yellow-500/30 rounded text-xs">
                                    <p className="text-yellow-300 font-medium">Mute Reason: {user.mutedReason}</p>
                                    {user.mutedUntil && (
                                      <p className="text-yellow-400">
                                        Until: {new Date(user.mutedUntil).toLocaleDateString()}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 card">
                        <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 text-lg">No users found</p>
                        {userSearchQuery && (
                          <button
                            onClick={() => setUserSearchQuery('')}
                            className="mt-4 text-purple-400 hover:text-purple-300 font-semibold"
                          >
                            Clear search
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : activeTab === 'messages' ? (
              <MessageProvider>
                <MessagesLayout isAdmin={true} containerHeight="full" />
              </MessageProvider>
            ) : activeTab === 'activity' ? (
              <>
                {!showExpandedProjects ? (
                  // Activity Dashboard
                  <div className="space-y-6">
                    {/* Current Projects Card */}
                    <div 
                      className="card cursor-pointer hover:border-purple-500/50 transition-all"
                      onClick={() => myInProgressProjects.length > 0 && setShowExpandedProjects(true)}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <Briefcase className="w-6 h-6 text-purple-400" />
                          <h3 className="text-xl font-bold text-white">Current Projects</h3>
                          <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm font-semibold">
                            {myInProgressProjects.length}
                          </span>
                        </div>
                        {myInProgressProjects.length > 0 && (
                          <div className="flex items-center space-x-2 text-purple-400">
                            <span>View All</span>
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      
                      {myInProgressProjects.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                          {myInProgressProjects.slice(0, 3).map((project) => (
                            <div
                              key={project.id}
                              className="bg-black/40 border border-purple-500/20 rounded-lg p-3 sm:p-4 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-200 cursor-pointer group"
                              onClick={() => setSelectedCommission(project)}
                            >
                              <div className="flex items-start justify-between mb-2 gap-2">
                                <h4 className="text-white font-semibold text-sm line-clamp-1 flex-1">{project.subject}</h4>
                                <span className={`${
                                  project.taskComplexity === 'easy' ? 'bg-green-900/30 text-green-400 border-green-500/30' :
                                  project.taskComplexity === 'medium' ? 'bg-blue-900/30 text-blue-400 border-blue-500/30' :
                                  project.taskComplexity === 'hard' ? 'bg-orange-900/30 text-orange-400 border-orange-500/30' :
                                  'bg-red-900/30 text-red-400 border-red-500/30'
                                } text-xs px-2 py-1 rounded-full capitalize border flex-shrink-0`}>
                                  {project.taskComplexity}
                                </span>
                              </div>
                              <p className="text-gray-400 text-xs mb-2 font-mono">{project.referenceNumber}</p>
                              <p className="text-gray-300 text-xs mb-2">Client: <span className="text-white font-medium">{project.ownerName}</span></p>
                              <p className="text-purple-400 font-bold text-base sm:text-lg">${project.proposedAmount.toFixed(2)}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Briefcase className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                          <p className="text-gray-400">No projects in progress</p>
                          <p className="text-gray-500 text-sm">Start working on accepted commissions to see them here</p>
                        </div>
                      )}
                    </div>

                    {/* Placeholder Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {/* Recent Activity Card */}
                      <div className="card hover:scale-[1.02] transition-transform duration-200">
                        <div className="flex items-center space-x-3 mb-4">
                          <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 flex-shrink-0" />
                          <h3 className="text-base sm:text-lg font-bold text-white">Recent Activity</h3>
                        </div>
                        <div className="text-center py-6 sm:py-8">
                          <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-gray-600 mx-auto mb-3" />
                          <p className="text-gray-400 text-sm sm:text-base">Coming Soon</p>
                          <p className="text-gray-500 text-xs sm:text-sm">Activity feed will appear here</p>
                        </div>
                      </div>

                      {/* Statistics Card */}
                      <div className="card hover:scale-[1.02] transition-transform duration-200">
                        <div className="flex items-center space-x-3 mb-4">
                          <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 flex-shrink-0" />
                          <h3 className="text-base sm:text-lg font-bold text-white">Statistics</h3>
                        </div>
                        <div className="text-center py-6 sm:py-8">
                          <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-gray-600 mx-auto mb-3" />
                          <p className="text-gray-400 text-sm sm:text-base">Coming Soon</p>
                          <p className="text-gray-500 text-xs sm:text-sm">Performance metrics will appear here</p>
                        </div>
                      </div>

                      {/* Quick Actions Card */}
                      <div className="card hover:scale-[1.02] transition-transform duration-200">
                        <div className="flex items-center space-x-3 mb-4">
                          <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 flex-shrink-0" />
                          <h3 className="text-base sm:text-lg font-bold text-white">Quick Actions</h3>
                        </div>
                        <div className="text-center py-6 sm:py-8">
                          <Settings className="w-10 h-10 sm:w-12 sm:h-12 text-gray-600 mx-auto mb-3" />
                          <p className="text-gray-400 text-sm sm:text-base">Coming Soon</p>
                          <p className="text-gray-500 text-xs sm:text-sm">Quick access tools will appear here</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Expanded Projects View
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-bold text-white">All My Projects</h3>
                      <button
                        onClick={() => setShowExpandedProjects(false)}
                        className="flex items-center space-x-2 text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Dashboard</span>
                      </button>
                    </div>

                    {/* Search and Filter Controls */}
                    <div className="card space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search projects by subject, description, reference number, or client..."
                          value={projectSearchQuery}
                          onChange={(e) => setProjectSearchQuery(e.target.value)}
                          className="w-full bg-black/40 border border-purple-500/20 text-white pl-10 pr-10 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
                        />
                        {projectSearchQuery && (
                          <button
                            onClick={() => setProjectSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center space-x-2">
                          <Filter className="w-5 h-5 text-gray-400" />
                          <select
                            value={projectFilterComplexity}
                            onChange={(e) => setProjectFilterComplexity(e.target.value as 'all' | 'easy' | 'medium' | 'hard' | 'expert')}
                            className="bg-black/40 border border-purple-500/20 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                          >
                            <option value="all">All Complexities</option>
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                            <option value="expert">Expert</option>
                          </select>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="text-gray-400 text-sm">Sort by:</span>
                          <select
                            value={projectSortBy}
                            onChange={(e) => setProjectSortBy(e.target.value as 'created' | 'updated' | 'amount' | 'subject')}
                            className="bg-black/40 border border-purple-500/20 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                          >
                            <option value="updated">Last Updated</option>
                            <option value="created">Created Date</option>
                            <option value="amount">Amount</option>
                            <option value="subject">Subject</option>
                          </select>
                        </div>

                        <div className="flex items-center space-x-2">
                          <select
                            value={projectSortOrder}
                            onChange={(e) => setProjectSortOrder(e.target.value as 'asc' | 'desc')}
                            className="bg-black/40 border border-purple-500/20 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                          >
                            <option value="desc">Descending</option>
                            <option value="asc">Ascending</option>
                          </select>
                        </div>

                        {hasProjectFilters && (
                          <button
                            onClick={clearProjectFilters}
                            className="inline-flex items-center space-x-1 text-gray-400 hover:text-white text-sm font-medium transition-colors"
                          >
                            <X className="w-4 h-4" />
                            <span>Clear Filters</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <p className="text-gray-400">
                          {filteredAndSortedProjects.length} project{filteredAndSortedProjects.length !== 1 ? 's' : ''} found
                          {hasProjectFilters && <span className="ml-2 text-purple-400">(filtered)</span>}
                        </p>
                      </div>
                    </div>

                    {myInProgressProjects.length > 0 ? (
                      <div className="space-y-4">
                        {filteredAndSortedProjects.length > 0 ? (
                          filteredAndSortedProjects.map((project) => (
                          <div
                            key={project.id}
                            className="card hover:border-purple-500/50 transition-all cursor-pointer"
                            onClick={() => setSelectedCommission(project)}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-2 flex-wrap">
                                  <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                                    In Progress
                                  </span>
                                  <span className={`${
                                    project.taskComplexity === 'easy' ? 'bg-green-900/30 text-green-400 border-green-500/30' :
                                    project.taskComplexity === 'medium' ? 'bg-blue-900/30 text-blue-400 border-blue-500/30' :
                                    project.taskComplexity === 'hard' ? 'bg-orange-900/30 text-orange-400 border-orange-500/30' :
                                    'bg-red-900/30 text-red-400 border-red-500/30'
                                  } text-xs px-3 py-1 rounded-full capitalize border`}>
                                    {project.taskComplexity}
                                  </span>
                                  <span className="text-slate-400 font-mono text-xs">
                                    {project.referenceNumber}
                                  </span>
                                </div>

                                <h3 className="text-xl font-bold text-white mb-2">{project.subject}</h3>
                                <p className="text-gray-400 text-sm mb-2">
                                  <span className="text-gray-500">Client:</span> {project.ownerName || 'Unknown User'}
                                </p>
                                <p className="text-gray-400 text-sm line-clamp-2 mb-3">{project.description}</p>

                                {project.tags && project.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mb-3">
                                    {project.tags.map((tag, idx) => (
                                      <span
                                        key={idx}
                                        className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-1 rounded text-xs font-medium"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                <div className="flex items-center space-x-4 text-xs text-gray-400">
                                  <span>Started: {project.startedAt ? new Date(project.startedAt).toLocaleDateString() : 'Unknown'}</span>
                                  <span>Updated: {new Date(project.updatedAt).toLocaleDateString()}</span>
                                </div>
                              </div>

                              <div className="flex flex-col items-end space-y-3">
                                <div className="text-purple-400 font-bold text-2xl whitespace-nowrap">
                                  ${project.proposedAmount.toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                        ) : (
                          <div className="text-center py-12 card">
                            <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400 text-lg">No projects found</p>
                            <p className="text-gray-500 text-sm">Try adjusting your search or filter criteria</p>
                            {hasProjectFilters && (
                              <button
                                onClick={clearProjectFilters}
                                className="mt-4 text-purple-400 hover:text-purple-300 font-semibold"
                              >
                                Clear all filters
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12 card">
                        <Briefcase className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 text-lg">No projects in progress</p>
                        <p className="text-gray-500">Start working on accepted commissions to see them here</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : null}
          </div>

          {/* Right Detail Panel */}
          {(selectedCommission || selectedUser) && (
            <div className="w-full lg:w-[480px] bg-[#0a0a0a] border-l border-[#2a2a2a] flex flex-col overflow-hidden fixed lg:relative inset-0 lg:inset-auto z-50 lg:z-auto">
              {/* Panel Header */}
              <div className="bg-[#0a0a0a] border-b border-[#2a2a2a] px-4 py-3 flex items-center justify-between flex-shrink-0">
                <h3 className="text-lg font-bold text-white">
                  {selectedCommission ? selectedCommission.referenceNumber : selectedUser ? 'User Details' : 'Details'}
                </h3>
                <button
                  onClick={() => {
                    setSelectedCommission(null);
                    setSelectedUser(null);
                  }}
                  className="p-2 rounded-lg hover:bg-[#1a1a1a] text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b border-[#2a2a2a] px-4 bg-[#0a0a0a] flex-shrink-0">
                <button
                  onClick={() => setDetailPanelTab('info')}
                  className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                    detailPanelTab === 'info'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  {selectedCommission ? 'Commission Info' : 'User Info'}
                </button>
                <button
                  onClick={() => setDetailPanelTab('details')}
                  className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                    detailPanelTab === 'details'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  Details
                </button>
                <button
                  onClick={() => setDetailPanelTab('documents')}
                  className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                    detailPanelTab === 'documents'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  Documents
                </button>
                <button
                  onClick={() => setDetailPanelTab('activity')}
                  className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                    detailPanelTab === 'activity'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  Activity
                </button>
              </div>

              {/* Panel Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedCommission && (
                  <>
                    {detailPanelTab === 'info' && (
                      <div className="space-y-4">
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Subject</p>
                          <p className="text-white font-semibold">{selectedCommission.subject}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Description</p>
                          <p className="text-white">{selectedCommission.description}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Status</p>
                          <span className={`inline-block ${
                            selectedCommission.status === 'submitted' ? 'bg-blue-600' :
                            selectedCommission.status === 'in_review' ? 'bg-yellow-600' :
                            selectedCommission.status === 'accepted' ? 'bg-emerald-600' :
                            selectedCommission.status === 'in_progress' ? 'bg-blue-600' :
                            selectedCommission.status === 'rejected' ? 'bg-red-600' :
                            'bg-purple-600'
                          } text-white text-xs px-3 py-1 rounded-full font-semibold capitalize`}>
                            {selectedCommission.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Amount</p>
                          <p className="text-white font-bold text-xl">${selectedCommission.proposedAmount.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Client</p>
                          <p className="text-white">{selectedCommission.ownerName || 'Unknown'}</p>
                        </div>
                      </div>
                    )}
                    {detailPanelTab === 'details' && (
                      <div className="space-y-4">
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Complexity</p>
                          <span className={`inline-block ${
                            selectedCommission.taskComplexity === 'easy' ? 'bg-green-900/30 text-green-400 border-green-500/30' :
                            selectedCommission.taskComplexity === 'medium' ? 'bg-blue-900/30 text-blue-400 border-blue-500/30' :
                            selectedCommission.taskComplexity === 'hard' ? 'bg-orange-900/30 text-orange-400 border-orange-500/30' :
                            'bg-red-900/30 text-red-400 border-red-500/30'
                          } text-xs px-3 py-1 rounded-full capitalize border`}>
                            {selectedCommission.taskComplexity}
                          </span>
                        </div>
                        {selectedCommission.tags && selectedCommission.tags.length > 0 && (
                          <div>
                            <p className="text-gray-400 text-sm mb-2">Tags</p>
                            <div className="flex flex-wrap gap-2">
                              {selectedCommission.tags.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-1 rounded text-xs font-medium"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Created</p>
                          <p className="text-white">{new Date(selectedCommission.createdAt).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Updated</p>
                          <p className="text-white">{new Date(selectedCommission.updatedAt).toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                    {detailPanelTab === 'documents' && (
                      <div className="space-y-4">
                        {selectedCommission.images && selectedCommission.images.length > 0 ? (
                          <div>
                            <p className="text-gray-400 text-sm mb-2">Images</p>
                            <div className="grid grid-cols-2 gap-2">
                              {selectedCommission.images.map((img, idx) => (
                                <img
                                  key={idx}
                                  src={img}
                                  alt={`Attachment ${idx + 1}`}
                                  className="w-full h-32 object-cover rounded-lg border border-[#2a2a2a]"
                                />
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-400 text-sm">No documents available</p>
                        )}
                      </div>
                    )}
                    {detailPanelTab === 'activity' && (
                      <div className="space-y-4">
                        {selectedCommission.progress !== undefined && (
                          <div>
                            <p className="text-gray-400 text-sm mb-2">Progress</p>
                            <div className="space-y-2">
                              <div className="w-full bg-[#1a1a1a] rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${selectedCommission.progress || 0}%` }}
                                />
                              </div>
                              <p className="text-white font-semibold">{selectedCommission.progress || 0}%</p>
                            </div>
                          </div>
                        )}
                        {selectedCommission.startedByAdminName && (
                          <div>
                            <p className="text-gray-400 text-sm mb-1">Started By</p>
                            <p className="text-white">{selectedCommission.startedByAdminName}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
                
                {selectedUser && (
                  <>
                    {detailPanelTab === 'info' && (
                      <div className="space-y-4">
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Display Name</p>
                          <p className="text-white font-semibold">{selectedUser.displayName}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Email</p>
                          <p className="text-white">{selectedUser.email}</p>
                        </div>
                        {selectedUser.bio && (
                          <div>
                            <p className="text-gray-400 text-sm mb-1">Bio</p>
                            <p className="text-white">{selectedUser.bio}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {detailPanelTab === 'details' && (
                      <div className="space-y-4">
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Status</p>
                          <div className="space-y-2">
                            {selectedUser.isBanned && (
                              <span className="inline-block bg-red-900/30 text-red-400 border border-red-500/30 px-3 py-1 rounded-full text-xs font-semibold">
                                Banned
                              </span>
                            )}
                            {selectedUser.isMuted && (
                              <span className="inline-block bg-yellow-900/30 text-yellow-400 border border-yellow-500/30 px-3 py-1 rounded-full text-xs font-semibold">
                                Muted
                              </span>
                            )}
                            {!selectedUser.isBanned && !selectedUser.isMuted && (
                              <span className="inline-block bg-green-900/30 text-green-400 border border-green-500/30 px-3 py-1 rounded-full text-xs font-semibold">
                                Active
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Joined</p>
                          <p className="text-white">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedCommission && !showRejectDialog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-3 sm:px-4 py-4" onClick={handleCloseModal}>
          <div className="card max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto overflow-x-hidden shadow-2xl shadow-purple-900/50" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-black/60 backdrop-blur-xl border-b border-purple-500/20 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center z-10">
              <h2 className="text-xl sm:text-2xl font-bold text-white">Commission Details</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-purple-500/20 rounded-lg"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div className="flex items-center space-x-3 flex-wrap">
                <span className={`${
                  selectedCommission.status === 'draft' ? 'bg-gray-600' :
                  selectedCommission.status === 'submitted' ? 'bg-blue-600' :
                  selectedCommission.status === 'in_review' ? 'bg-yellow-600' :
                  selectedCommission.status === 'accepted' ? 'bg-emerald-600' :
                  selectedCommission.status === 'in_progress' ? 'bg-blue-600' :
                  selectedCommission.status === 'approved' ? 'bg-emerald-600' :
                  selectedCommission.status === 'rejected' ? 'bg-red-600' :
                  selectedCommission.status === 'archived' ? 'bg-slate-600' :
                  'bg-purple-600'
                } text-white text-sm px-3 py-1.5 rounded-full font-semibold capitalize`}>
                  {selectedCommission.status.replace('_', ' ')}
                </span>
                <span className={`${
                  selectedCommission.taskComplexity === 'easy' ? 'bg-green-900/30 text-green-400 border-green-500/30' :
                  selectedCommission.taskComplexity === 'medium' ? 'bg-blue-900/30 text-blue-400 border-blue-500/30' :
                  selectedCommission.taskComplexity === 'hard' ? 'bg-orange-900/30 text-orange-400 border-orange-500/30' :
                  'bg-red-900/30 text-red-400 border-red-500/30'
                } text-sm px-3 py-1.5 rounded-full capitalize border`}>
                  {selectedCommission.taskComplexity}
                </span>
              </div>

              <div>
                <p className="text-gray-400 text-sm mb-1">Reference Number</p>
                <p className="text-white font-mono text-lg">{selectedCommission.referenceNumber}</p>
              </div>

              <div>
                <p className="text-gray-400 text-sm mb-1">Owner</p>
                <p className="text-white text-lg font-semibold">{selectedCommission.ownerName || 'Unknown User'}</p>
              </div>

              <div>
                <p className="text-gray-400 text-sm mb-1">Subject</p>
                <p className="text-white text-xl font-semibold">{selectedCommission.subject}</p>
              </div>

              <div>
                <p className="text-gray-400 text-sm mb-1">Description</p>
                <p className="text-white leading-relaxed whitespace-pre-wrap">{selectedCommission.description}</p>
              </div>

              {selectedCommission.tags && selectedCommission.tags.length > 0 && (
                <div>
                  <p className="text-gray-400 text-sm mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedCommission.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1.5 rounded-lg text-sm font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedCommission.images && selectedCommission.images.length > 0 && (
                <div>
                  <p className="text-gray-400 text-sm mb-2">Images</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedCommission.images.map((image, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={image}
                          alt={`Commission image ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-purple-500/20 hover:border-purple-400/40 transition-colors duration-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-gray-400 text-sm mb-1">Proposed Amount</p>
                <p className="text-purple-400 text-3xl font-bold">${selectedCommission.proposedAmount.toFixed(2)}</p>
              </div>

              {selectedCommission.paymentType && (
                <div>
                  <p className="text-gray-400 text-sm mb-1">Payment Type</p>
                  <p className="text-white font-semibold">
                    {selectedCommission.paymentType === 'full' 
                      ? '100% upfront' 
                      : '50% upfront & 50% upon completion'}
                  </p>
                </div>
              )}

              {/* Payment Status - Show for accepted commissions */}
              {selectedCommission.status === 'accepted' && (
                <div>
                  <p className="text-gray-400 text-sm mb-3">Payment Status</p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      {selectedCommission.paymentStatus === 'completed' ? (
                        <>
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-green-400 font-medium">Payment Completed</span>
                          {selectedCommission.paidAt && (
                            <span className="text-green-300 text-sm ml-2">
                              (Paid on {new Date(selectedCommission.paidAt).toLocaleDateString()})
                            </span>
                          )}
                        </>
                      ) : selectedCommission.paymentStatus === 'payment_started' ? (
                        <>
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <span className="text-yellow-400 font-medium">First Payment Completed (50%)</span>
                        </>
                      ) : selectedCommission.paymentStatus === 'pending' ? (
                        <>
                          <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                          <span className="text-yellow-400 font-medium">Payment Pending</span>
                        </>
                      ) : (
                        <>
                          <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                          <span className="text-gray-400 font-medium">Payment Required</span>
                        </>
                      )}
                    </div>
                    {selectedCommission.paymentType === 'split' && selectedCommission.paymentStatus === 'payment_started' && (
                      <p className="text-yellow-300 text-sm">
                        Remaining: ${(selectedCommission.proposedAmount * 0.5).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {selectedCommission.rejectionReason && (
                <div>
                  <p className="text-gray-400 text-sm mb-1">Rejection Reason</p>
                  <p className="text-red-300 bg-red-900/20 border border-red-500/30 p-3 rounded-lg">{selectedCommission.rejectionReason}</p>
                </div>
              )}

              {selectedCommission.status === 'in_progress' && selectedCommission.startedByAdminName && (
                <div>
                  <p className="text-gray-400 text-sm mb-1">Project Started By</p>
                  <p className="text-blue-300 bg-blue-900/20 border border-blue-500/30 p-3 rounded-lg">
                    {selectedCommission.startedByAdminName}
                    {selectedCommission.startedAt && (
                      <span className="block text-sm text-blue-400 mt-1">
                        Started: {new Date(selectedCommission.startedAt).toLocaleString()}
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Progress Section - Only show for in_progress commissions */}
              {selectedCommission.status === 'in_progress' && (
                <div>
                  <p className="text-gray-400 text-sm mb-3">Progress</p>
                  <div className="space-y-4">
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">Project Progress</span>
                        <span className="text-purple-400 font-bold text-lg">
                          {selectedCommission.progress || 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${selectedCommission.progress || 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Progress Slider - Only editable in All My Projects tab */}
                    {activeTab === 'activity' && (
                      <div className="space-y-2">
                        <label className="text-gray-400 text-sm">Update Progress</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={selectedCommission.progress || 0}
                          onChange={(e) => handleProgressChange(selectedCommission.id, parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>0%</span>
                          <span>50%</span>
                          <span>100%</span>
                        </div>
                      </div>
                    )}

                    {/* Complete Project Button - Only show when progress is 100% and in All My Projects tab */}
                    {activeTab === 'activity' && (selectedCommission.progress || 0) === 100 && (
                      <button
                        onClick={handleCompleteProject}
                        className="w-full bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                      >
                        <Check className="w-5 h-5" />
                        <span>Complete Project</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Completed By - Show for completed commissions */}
              {selectedCommission.status === 'completed' && selectedCommission.completedByAdminName && (
                <div>
                  <p className="text-gray-400 text-sm mb-1">Completed By</p>
                  <p className="text-green-300 bg-green-900/20 border border-green-500/30 p-3 rounded-lg">
                    {selectedCommission.completedByAdminName}
                    {selectedCommission.completedAt && (
                      <span className="block text-sm text-green-400 mt-1">
                        Completed: {new Date(selectedCommission.completedAt).toLocaleString()}
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Completion Files - Show for completed commissions */}
              {selectedCommission.status === 'completed' && selectedCommission.completionFiles && selectedCommission.completionFiles.length > 0 && (
                <div>
                  <p className="text-gray-400 text-sm mb-3">Completion Files</p>
                  <div className="space-y-2">
                    {selectedCommission.completionFiles.map((fileUrl, index) => {
                      const fileName = fileUrl.split('/').pop() || `file-${index + 1}`;
                      return (
                        <div key={index} className="flex items-center justify-between bg-gray-800/50 border border-gray-600/30 rounded-lg p-3">
                          <div className="flex items-center space-x-3">
                            <File className="w-5 h-5 text-purple-400" />
                            <span className="text-white text-sm">{fileName}</span>
                          </div>
                          <button
                            onClick={() => handleDownloadFile(fileUrl, fileName)}
                            className="text-purple-400 hover:text-purple-300 transition-colors p-1"
                            title="Download file"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <p className="text-gray-400 text-sm mb-3">Actions</p>
                <div className="flex items-center space-x-3">
                  {selectedCommission.status === 'in_review' && (
                    <>
                      <button
                        onClick={handleAccept}
                        disabled={isUpdating === selectedCommission.id}
                        className="flex-1 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-semibold transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={handleReject}
                        disabled={isUpdating === selectedCommission.id}
                        className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-semibold transition-colors"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {selectedCommission.status === 'accepted' && (
                    <button
                      onClick={handleStartProject}
                      disabled={isUpdating === selectedCommission.id}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-semibold transition-colors"
                    >
                      {isUpdating === selectedCommission.id ? 'Starting...' : 'Start Project'}
                    </button>
                  )}
                  {selectedCommission.status !== 'in_review' && selectedCommission.status !== 'accepted' && (
                    <select
                      value={selectedCommission.status}
                      onChange={(e) => handleStatusChange(selectedCommission.id, e.target.value as CommissionStatus)}
                      disabled={isUpdating === selectedCommission.id}
                      className="bg-black/40 border border-purple-500/20 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 flex-1"
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                  {isUpdating === selectedCommission.id && (
                    <RefreshCw className="w-5 h-5 text-purple-400 animate-spin" />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-400 pt-4 border-t border-purple-500/20">
                <div>
                  <span className="block">Created</span>
                  <span className="text-white">{new Date(selectedCommission.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="block">Updated</span>
                  <span className="text-white">{new Date(selectedCommission.updatedAt).toLocaleString()}</span>
                </div>
              </div>

              {selectedCommission.status === 'archived' && (
                <div className="pt-4 border-t border-purple-500/20">
                  <button
                    onClick={() => {
                      handleDelete(selectedCommission.id);
                      setSelectedCommission(null);
                    }}
                    className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Permanently</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showRejectDialog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4" onClick={cancelReject}>
          <div className="card max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-4">Reject Commission</h3>
            <p className="text-gray-400 text-sm mb-4">Please provide a reason for rejecting this commission:</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full bg-black/40 border border-purple-500/20 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-gray-400 min-h-[120px]"
            />
            <div className="flex items-center space-x-3 mt-6">
              <button
                onClick={cancelReject}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={!rejectionReason.trim()}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg font-semibold transition-colors"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4" onClick={() => setSelectedUser(null)}>
          <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-black/40 backdrop-blur-xl border-b border-purple-500/20 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">User Details</h2>
              <div className="flex items-center space-x-2">
                {!isEditingProfile && (
                  <button
                    onClick={handleEditProfile}
                    className="text-purple-400 hover:text-purple-300 transition-colors p-1"
                    title="Edit Profile"
                    type="button"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsEditingProfile(false);
                    setSelectedUser(null);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {isEditingProfile ? (
                <>
                  {/* Edit Mode */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Profile Image
                      </label>
                      <ImageUpload
                        currentAvatarUrl={editingAvatar || undefined}
                        userId={selectedUser.id}
                        onUploadComplete={(url) => {
                          setEditingAvatar(url);
                          setProfileEditError(null);
                        }}
                        onError={(error) => {
                          setProfileEditError(error);
                        }}
                        disabled={isSavingProfile}
                      />
                    </div>

                    <div>
                      <label htmlFor="editDisplayName" className="block text-sm font-medium text-gray-300 mb-2">
                        Display Name
                      </label>
                      <input
                        id="editDisplayName"
                        type="text"
                        value={editingDisplayName}
                        onChange={(e) => setEditingDisplayName(e.target.value)}
                        className="w-full bg-black/40 border border-purple-500/20 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
                        placeholder="Display Name"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="editBio" className="block text-sm font-medium text-gray-300 mb-2">
                        Bio
                      </label>
                      <textarea
                        id="editBio"
                        value={editingBio}
                        onChange={(e) => setEditingBio(e.target.value)}
                        rows={4}
                        className="w-full bg-black/40 border border-purple-500/20 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400 resize-none"
                        placeholder="User bio..."
                      />
                    </div>

                    {profileEditError && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                        <p className="text-red-400 text-sm">{profileEditError}</p>
                      </div>
                    )}

                    <div className="flex items-center space-x-3 pt-4 border-t border-purple-500/20">
                      <button
                        onClick={handleCancelEditProfile}
                        disabled={isSavingProfile}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                      >
                        <X className="w-4 h-4" />
                        <span>Cancel</span>
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        disabled={isSavingProfile || !editingDisplayName.trim()}
                        className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                      >
                        {isSavingProfile ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>Save Changes</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* View Mode */}
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/30 overflow-hidden">
                      {selectedUser.avatar ? (
                        <img
                          src={selectedUser.avatar}
                          alt={selectedUser.displayName}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-8 h-8 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2 flex-wrap">
                        <h3 className="text-2xl font-bold text-white">{selectedUser.displayName}</h3>
                        {selectedUser.isBanned && (
                          <span className="bg-red-600 text-white text-sm px-3 py-1 rounded-full font-semibold">
                            Banned
                          </span>
                        )}
                        {selectedUser.isMuted && (
                          <span className="bg-yellow-600 text-white text-sm px-3 py-1 rounded-full font-semibold">
                            Muted
                          </span>
                        )}
                        {isAdmin(selectedUser.id) && (
                          <span className="bg-purple-600 text-white text-sm px-3 py-1 rounded-full font-semibold">
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-lg">{selectedUser.email}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-400 mt-2">
                        <span>Joined: {new Date(selectedUser.joinDate).toLocaleDateString()}</span>
                        <span>Commissions: {selectedUser.commissionCount}</span>
                      </div>
                    </div>
                  </div>

                  {selectedUser.bio && (
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Bio</p>
                      <p className="text-white leading-relaxed">{selectedUser.bio}</p>
                    </div>
                  )}
                </>
              )}

              {selectedUser.isBanned && selectedUser.banInfo && (
                <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                  <h4 className="text-red-300 font-semibold mb-2">Ban Information</h4>
                  <p className="text-red-300 mb-1"><strong>Reason:</strong> {selectedUser.banInfo.reason}</p>
                  <p className="text-red-400 text-sm">
                    <strong>Banned:</strong> {new Date(selectedUser.banInfo.bannedAt).toLocaleString()}
                    {selectedUser.banInfo.expiresAt && (
                      <span> • <strong>Expires:</strong> {new Date(selectedUser.banInfo.expiresAt).toLocaleString()}</span>
                    )}
                  </p>
                </div>
              )}

              {selectedUser.isMuted && selectedUser.mutedReason && (
                <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                  <h4 className="text-yellow-300 font-semibold mb-2">Mute Information</h4>
                  <p className="text-yellow-300 mb-1"><strong>Reason:</strong> {selectedUser.mutedReason}</p>
                  {selectedUser.mutedUntil && (
                    <p className="text-yellow-400 text-sm">
                      <strong>Until:</strong> {new Date(selectedUser.mutedUntil).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons - Only show in view mode */}
              {!isEditingProfile && (
                <div className="pt-4 border-t border-purple-500/20">
                  <div className="flex items-center space-x-3">
                  {!isAdmin(selectedUser.id) && (
                    <>
                      {selectedUser.isBanned ? (
                        <button
                          onClick={() => handleUnbanUser(selectedUser.id)}
                          disabled={isModerating}
                          className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                        >
                          <Ban className="w-4 h-4" />
                          <span>Unban User</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowBanDialog(true)}
                          disabled={isModerating}
                          className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                        >
                          <Ban className="w-4 h-4" />
                          <span>Ban User</span>
                        </button>
                      )}

                      {selectedUser.isMuted ? (
                        <button
                          onClick={() => handleUnmuteUser(selectedUser.id)}
                          disabled={isModerating}
                          className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                        >
                          <VolumeX className="w-4 h-4" />
                          <span>Unmute User</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowMuteDialog(true)}
                          disabled={isModerating}
                          className="flex-1 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                        >
                          <VolumeX className="w-4 h-4" />
                          <span>Mute User</span>
                        </button>
                      )}

                      <button
                        onClick={() => setShowDeleteDialog(true)}
                        disabled={isModerating}
                        className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                      >
                        <UserX className="w-4 h-4" />
                        <span>Delete User</span>
                      </button>
                    </>
                  )}
                  {isAdmin(selectedUser.id) && (
                    <div className="flex-1 text-center text-gray-400 py-2">
                      Admin users cannot be moderated
                    </div>
                  )}
                </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Ban Dialog */}
      {showBanDialog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4" onClick={() => setShowBanDialog(false)}>
          <div className="card max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-4">Ban User</h3>
            <p className="text-gray-400 text-sm mb-4">Please provide a reason and duration for banning this user:</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Reason</label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Enter ban reason..."
                  className="w-full bg-black/40 border border-purple-500/20 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-gray-400 min-h-[100px]"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Duration</label>
                <select
                  value={banDuration}
                  onChange={(e) => setBanDuration(e.target.value)}
                  className="w-full bg-black/40 border border-purple-500/20 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Select duration...</option>
                  <option value="1">1 hour</option>
                  <option value="24">1 day</option>
                  <option value="168">1 week</option>
                  <option value="720">1 month</option>
                  <option value="permanent">Permanent</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowBanDialog(false);
                  setBanReason('');
                  setBanDuration('');
                }}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleBanUser}
                disabled={!banReason.trim() || !banDuration || isModerating}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg font-semibold transition-colors"
              >
                {isModerating ? 'Banning...' : 'Ban User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mute Dialog */}
      {showMuteDialog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4" onClick={() => setShowMuteDialog(false)}>
          <div className="card max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-4">Mute User</h3>
            <p className="text-gray-400 text-sm mb-4">Please provide a reason and duration for muting this user:</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Reason</label>
                <textarea
                  value={muteReason}
                  onChange={(e) => setMuteReason(e.target.value)}
                  placeholder="Enter mute reason..."
                  className="w-full bg-black/40 border border-purple-500/20 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 placeholder-gray-400 min-h-[100px]"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Duration (hours)</label>
                <select
                  value={muteDuration}
                  onChange={(e) => setMuteDuration(e.target.value)}
                  className="w-full bg-black/40 border border-purple-500/20 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="">Select duration...</option>
                  <option value="1">1 hour</option>
                  <option value="24">1 day</option>
                  <option value="168">1 week</option>
                  <option value="720">1 month</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowMuteDialog(false);
                  setMuteReason('');
                  setMuteDuration('');
                }}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleMuteUser}
                disabled={!muteReason.trim() || !muteDuration || isModerating}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg font-semibold transition-colors"
              >
                {isModerating ? 'Muting...' : 'Mute User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4" onClick={() => setShowDeleteDialog(false)}>
          <div className="card max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-4">Delete User</h3>
            <p className="text-gray-400 text-sm mb-4">
              Are you sure you want to permanently delete this user? This action will:
            </p>
            <ul className="text-gray-300 text-sm mb-6 space-y-1">
              <li>• Delete the user's account and profile</li>
              <li>• Delete all their commissions</li>
              <li>• The user can create a new account with the same email</li>
              <li>• This action cannot be undone</li>
            </ul>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={isModerating}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg font-semibold transition-colors"
              >
                {isModerating ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completion Files Upload Modal */}
      {showCompletionModal && selectedCommission && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4" onClick={() => setShowCompletionModal(false)}>
          <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-black/40 backdrop-blur-xl border-b border-purple-500/20 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Complete Project</h2>
              <button
                onClick={() => setShowCompletionModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white mb-2">{selectedCommission.subject}</h3>
                <p className="text-gray-400">Upload completion files for this project</p>
              </div>

              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-purple-400 bg-purple-500/10' 
                    : 'border-gray-600 hover:border-purple-500/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 mb-2">Drag and drop your files here or</p>
                <label className="text-purple-400 hover:text-purple-300 cursor-pointer font-medium">
                  click here to browse
                  <input
                    type="file"
                    multiple
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                    className="hidden"
                  />
                </label>
                <p className="text-gray-500 text-sm mt-2">Supports all file types</p>
              </div>

              {/* Uploaded Files List */}
              {completionFiles.length > 0 && (
                <div>
                  <h4 className="text-white font-semibold mb-3">Files to Upload</h4>
                  <div className="space-y-2">
                    {completionFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-800/50 border border-gray-600/30 rounded-lg p-3">
                        <div className="flex items-center space-x-3">
                          <File className="w-5 h-5 text-purple-400" />
                          <span className="text-white text-sm">{file.name}</span>
                          <span className="text-gray-400 text-xs">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-red-400 hover:text-red-300 transition-colors p-1"
                          title="Remove file"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Uploaded Files URLs (after upload) */}
              {uploadedFileUrls.length > 0 && (
                <div>
                  <h4 className="text-white font-semibold mb-3">Uploaded Files</h4>
                  <div className="space-y-2">
                    {uploadedFileUrls.map((url, index) => {
                      const fileName = url.split('/').pop() || `file-${index + 1}`;
                      return (
                        <div key={index} className="flex items-center justify-between bg-green-800/20 border border-green-500/30 rounded-lg p-3">
                          <div className="flex items-center space-x-3">
                            <File className="w-5 h-5 text-green-400" />
                            <span className="text-white text-sm">{fileName}</span>
                            <Check className="w-4 h-4 text-green-400" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 pt-4 border-t border-purple-500/20">
                <button
                  onClick={() => setShowCompletionModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                
                {completionFiles.length > 0 && uploadedFileUrls.length === 0 && (
                  <button
                    onClick={uploadFiles}
                    disabled={isUploading}
                    className="flex-1 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                  >
                    {isUploading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Upload Files</span>
                      </>
                    )}
                  </button>
                )}

                {uploadedFileUrls.length > 0 && (
                  <button
                    onClick={finalizeCompletion}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white px-6 py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Complete Project</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Dropdown - Rendered outside all containers */}
      {accountMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setAccountMenuOpen(false)}
          />
          <div className="fixed right-6 top-20 w-48 glass rounded-xl shadow-2xl shadow-purple-500/20 py-2 z-[9999] animate-fade-in">
            <Link
              to="/profile"
              className="flex items-center space-x-2 px-4 py-2.5 text-gray-300 hover:bg-purple-500/20 hover:text-purple-200 transition-all mx-2 rounded-lg"
              onClick={() => setAccountMenuOpen(false)}
            >
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">Profile</span>
            </Link>
            <Link
              to="/privacy"
              className="flex items-center space-x-2 px-4 py-2.5 text-gray-300 hover:bg-purple-500/20 hover:text-purple-200 transition-all mx-2 rounded-lg"
              onClick={() => setAccountMenuOpen(false)}
            >
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium">Privacy Settings</span>
            </Link>
            <Link
              to="/commissions"
              className="flex items-center space-x-2 px-4 py-2.5 text-gray-300 hover:bg-purple-500/20 hover:text-purple-200 transition-all mx-2 rounded-lg"
              onClick={() => setAccountMenuOpen(false)}
            >
              <Briefcase className="w-4 h-4" />
              <span className="text-sm font-medium">My Commissions</span>
            </Link>
            <div className="border-t border-purple-500/20 my-2" />
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2.5 text-gray-300 hover:bg-purple-500/20 hover:text-purple-200 transition-all w-full text-left mx-2 rounded-lg"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Log Out</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
