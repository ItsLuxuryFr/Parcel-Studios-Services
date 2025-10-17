import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Image, FileText, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Onboarding() {
  const [displayName, setDisplayName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [bio, setBio] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, completeOnboarding } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    await completeOnboarding(
      displayName || user?.displayName || '',
      avatar,
      bio
    );

    setIsLoading(false);
    navigate('/');
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
                placeholder={user?.displayName || 'Your Name'}
              />
            </div>
            <p className="text-slate-400 text-sm mt-1">How you'll appear to others</p>
          </div>

          <div>
            <label htmlFor="avatar" className="block text-sm font-medium text-slate-300 mb-2">
              Avatar URL (Optional)
            </label>
            <div className="relative">
              <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="avatar"
                type="text"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-11 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
            <p className="text-slate-400 text-sm mt-1">Link to your profile picture</p>
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
