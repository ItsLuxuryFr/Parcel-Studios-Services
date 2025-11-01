import { useState } from 'react';
import { Shield, Eye, EyeOff, Bell, Mail, Lock } from 'lucide-react';

export default function Privacy() {
  const [profileVisibility, setProfileVisibility] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [commissionUpdates, setCommissionUpdates] = useState(true);
  const [showEmail, setShowEmail] = useState(false);

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
          <div className="flex items-center space-x-3 mb-2 animate-fade-in">
            <Shield className="w-8 h-8 text-white" />
            <h1 className="text-4xl font-bold text-white">Privacy Settings</h1>
          </div>
          <p className="text-xl text-white/90 animate-fade-in">Manage your privacy and notification preferences</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center space-x-3 mb-6">
              <Eye className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">Profile Visibility</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-purple-500/20">
                <div className="flex-1">
                  <h3 className="text-white font-medium mb-1">Public Profile</h3>
                  <p className="text-gray-400 text-sm">
                    Allow others to view your profile information
                  </p>
                </div>
                <button
                  onClick={() => setProfileVisibility(!profileVisibility)}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    profileVisibility ? 'bg-purple-500' : 'bg-gray-700'
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                      profileVisibility ? 'translate-x-6' : ''
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex-1">
                  <h3 className="text-white font-medium mb-1">Show Email Address</h3>
                  <p className="text-gray-400 text-sm">
                    Display your email on your public profile
                  </p>
                </div>
                <button
                  onClick={() => setShowEmail(!showEmail)}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    showEmail ? 'bg-purple-500' : 'bg-gray-700'
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                      showEmail ? 'translate-x-6' : ''
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-3 mb-6">
              <Bell className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">Notifications</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-purple-500/20">
                <div className="flex-1">
                  <h3 className="text-white font-medium mb-1">Email Notifications</h3>
                  <p className="text-gray-400 text-sm">
                    Receive notifications via email
                  </p>
                </div>
                <button
                  onClick={() => setEmailNotifications(!emailNotifications)}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    emailNotifications ? 'bg-purple-500' : 'bg-gray-700'
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                      emailNotifications ? 'translate-x-6' : ''
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex-1">
                  <h3 className="text-white font-medium mb-1">Commission Updates</h3>
                  <p className="text-gray-400 text-sm">
                    Get notified about commission status changes
                  </p>
                </div>
                <button
                  onClick={() => setCommissionUpdates(!commissionUpdates)}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    commissionUpdates ? 'bg-purple-500' : 'bg-gray-700'
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                      commissionUpdates ? 'translate-x-6' : ''
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-3 mb-6">
              <Lock className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">Security</h2>
            </div>

            <div className="space-y-4">
              <div className="py-3 border-b border-purple-500/20">
                <h3 className="text-white font-medium mb-1">Change Password</h3>
                <p className="text-gray-400 text-sm mb-3">
                  Update your password to keep your account secure
                </p>
                <button className="btn-secondary">
                  Change Password
                </button>
              </div>

              <div className="py-3">
                <h3 className="text-white font-medium mb-1">Delete Account</h3>
                <p className="text-gray-400 text-sm mb-3">
                  Permanently delete your account and all associated data
                </p>
                <button className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm transition-colors border border-red-500/30">
                  Delete Account
                </button>
              </div>
            </div>
          </div>

          <div className="glass border border-purple-500/30 rounded-xl p-4">
            <p className="text-purple-300 text-sm">
              <strong>Note:</strong> These are mock privacy settings for demonstration purposes. In a production
              environment, these settings would be persisted and enforced across the application.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
