import { useState, FormEvent, useEffect } from 'react';
import { User as UserIcon, Mail, Calendar, Edit2, Save, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ImageUpload from '../components/ImageUpload';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [isSaving, setIsSaving] = useState(false);
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null);

  // Update local state when user changes
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setBio(user.bio || '');
      setAvatar(user.avatar || '');
    }
  }, [user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setAvatarUploadError(null);

    try {
      await updateProfile({
        displayName,
        bio,
        avatar,
      });

      setIsSaving(false);
      setIsEditing(false);
    } catch (error: any) {
      setAvatarUploadError(error.message || 'Failed to save profile');
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDisplayName(user?.displayName || '');
    setBio(user?.bio || '');
    setAvatar(user?.avatar || '');
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white">Please log in to view your profile</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="relative overflow-hidden py-20 md:py-28">
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-transparent to-purple-800/20 animate-gradient-shift" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(168, 85, 247, 0.25) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(147, 51, 234, 0.25) 0%, transparent 50%)',
        }} />
        
        {/* Floating Orbs */}
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <h1 className="text-4xl font-bold text-white mb-2 animate-fade-in">Profile</h1>
          <p className="text-xl text-white/90 animate-fade-in">Manage your personal information</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card p-8">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <UserIcon className="w-10 h-10 text-gray-400" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{user.displayName}</h2>
                <p className="text-gray-400">{user.email}</p>
              </div>
            </div>

            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-2">
                  Display Name
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Profile Image
                </label>
                <ImageUpload
                  currentAvatarUrl={user?.avatar}
                  userId={user.id}
                  onUploadComplete={(url) => {
                    setAvatar(url);
                    setAvatarUploadError(null);
                  }}
                  onError={(error) => {
                    setAvatarUploadError(error);
                  }}
                  disabled={isSaving}
                />
                {avatarUploadError && (
                  <p className="text-sm text-red-400 mt-2">{avatarUploadError}</p>
                )}
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-2">
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="input-field resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 btn-secondary flex items-center justify-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 btn-primary flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center space-x-2 text-gray-400 mb-2">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm font-medium">Email</span>
                  </div>
                  <p className="text-white">{user.email}</p>
                </div>

                <div>
                  <div className="flex items-center space-x-2 text-gray-400 mb-2">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm font-medium">Member Since</span>
                  </div>
                  <p className="text-white">
                    {new Date(user.joinDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {bio && (
                <div>
                  <div className="text-gray-400 mb-2 text-sm font-medium">Bio</div>
                  <p className="text-white whitespace-pre-wrap">{bio}</p>
                </div>
              )}

              {!bio && (
                <div className="text-center py-8 glass rounded-lg">
                  <p className="text-gray-400">No bio added yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
