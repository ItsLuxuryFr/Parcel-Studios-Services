import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, FileText, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import ImageUpload from '../components/ImageUpload';

export default function Onboarding() {
  const { user, completeOnboarding } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [bio, setBio] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null);

  // Check if user is authenticated, redirect to login if not
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        console.log('No authenticated user, redirecting to login');
        navigate('/login');
      }
    };
    checkAuth();
  }, [navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    const finalUsername = user?.username || '';
    const finalDisplayName = displayName.trim();
    
    if (!finalUsername) {
      setError('Username not found. Please sign up again.');
      return;
    }
    
    if (!finalDisplayName) {
      setError('Please enter a display name.');
      return;
    }
    
    setIsLoading(true);

    try {
      // Check if display name is already taken
      const { data: existingDisplayNames, error: displayNameError } = await supabase
        .from('profiles')
        .select('id')
        .eq('display_name', finalDisplayName);

      if (displayNameError) {
        console.error('Error checking display name:', displayNameError);
      } else if (existingDisplayNames && existingDisplayNames.length > 0) {
        setError('The display name is taken.');
        setIsLoading(false);
        return;
      }

      await completeOnboarding(
        finalUsername,
        finalDisplayName,
        avatar,
        bio
      );
      navigate('/');
    } catch (error: any) {
      console.error('Onboarding error:', error);
      console.log('Error message:', error.message);
      console.log('Error details:', error);
      
      if (error.message && (
        error.message.includes('duplicate key value violates unique constraint') ||
        error.message.includes('unique_display_name') ||
        error.message.includes('display_name') && error.message.includes('unique') ||
        error.message.includes('duplicate') ||
        error.message.includes('already exists') ||
        error.message.includes('unique constraint') ||
        error.message.includes('violates unique constraint')
      )) {
        setError('The display name is taken.');
      } else {
        setError(error.message || 'Failed to complete onboarding. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/10 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Complete Your Profile</h2>
          <p className="text-slate-400">Tell us a bit about yourself to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-800 rounded-xl p-8 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start space-x-3">
              <div className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5">⚠</div>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-slate-300 mb-2">
              Display Name
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-11 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Your Display Name"
                required
              />
            </div>
            <p className="text-slate-400 text-sm mt-1">How you'll appear to others</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Profile Image (Optional)
            </label>
            {user?.id && (
              <ImageUpload
                currentAvatarUrl={undefined}
                userId={user.id}
                onUploadComplete={(url) => {
                  setAvatar(url);
                  setAvatarUploadError(null);
                }}
                onError={(error) => {
                  setAvatarUploadError(error);
                }}
                disabled={isLoading}
              />
            )}
            {avatarUploadError && (
              <p className="text-sm text-red-400 mt-2">{avatarUploadError}</p>
            )}
            {!user?.id && (
              <p className="text-slate-400 text-sm">Please wait while we load your account...</p>
            )}
            <p className="text-slate-400 text-sm mt-1">Upload a profile picture (optional but recommended)</p>
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-slate-300 mb-2">
              Bio (Optional)
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-11 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                placeholder="Tell us about yourself and your Roblox projects..."
              />
            </div>
            <p className="text-slate-400 text-sm mt-1">A brief introduction about yourself</p>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              Skip for Now
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors"
            >
              {isLoading ? 'Saving...' : 'Complete Setup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
