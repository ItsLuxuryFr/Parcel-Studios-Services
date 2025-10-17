import { useState } from 'react';
import { Shield, Eye, EyeOff, Bell, Mail, Lock } from 'lucide-react';

export default function Privacy() {
  const [profileVisibility, setProfileVisibility] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [commissionUpdates, setCommissionUpdates] = useState(true);
  const [showEmail, setShowEmail] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3 mb-2">
            <Shield className="w-8 h-8 text-white" />
            <h1 className="text-4xl font-bold text-white">Privacy Settings</h1>
          </div>
          <p className="text-xl text-white/90">Manage your privacy and notification preferences</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-6">
          <div className="bg-slate-800 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Eye className="w-6 h-6 text-emerald-400" />
              <h2 className="text-2xl font-bold text-white">Profile Visibility</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-slate-700">
                <div className="flex-1">
                  <h3 className="text-white font-medium mb-1">Public Profile</h3>
                  <p className="text-slate-400 text-sm">
                    Allow others to view your profile information
                  </p>
                </div>
                <button
                  onClick={() => setProfileVisibility(!profileVisibility)}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    profileVisibility ? 'bg-emerald-500' : 'bg-slate-600'
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
                  <p className="text-slate-400 text-sm">
                    Display your email on your public profile
                  </p>
                </div>
                <button
                  onClick={() => setShowEmail(!showEmail)}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    showEmail ? 'bg-emerald-500' : 'bg-slate-600'
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

          <div className="bg-slate-800 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Bell className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-bold text-white">Notifications</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-slate-700">
                <div className="flex-1">
                  <h3 className="text-white font-medium mb-1">Email Notifications</h3>
                  <p className="text-slate-400 text-sm">
                    Receive notifications via email
                  </p>
                </div>
                <button
                  onClick={() => setEmailNotifications(!emailNotifications)}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    emailNotifications ? 'bg-emerald-500' : 'bg-slate-600'
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
                  <p className="text-slate-400 text-sm">
                    Get notified about commission status changes
                  </p>
                </div>
                <button
                  onClick={() => setCommissionUpdates(!commissionUpdates)}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    commissionUpdates ? 'bg-emerald-500' : 'bg-slate-600'
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

          <div className="bg-slate-800 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Lock className="w-6 h-6 text-red-400" />
              <h2 className="text-2xl font-bold text-white">Security</h2>
            </div>

            <div className="space-y-4">
              <div className="py-3 border-b border-slate-700">
                <h3 className="text-white font-medium mb-1">Change Password</h3>
                <p className="text-slate-400 text-sm mb-3">
                  Update your password to keep your account secure
                </p>
                <button className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                  Change Password
                </button>
              </div>

              <div className="py-3">
                <h3 className="text-white font-medium mb-1">Delete Account</h3>
                <p className="text-slate-400 text-sm mb-3">
                  Permanently delete your account and all associated data
                </p>
                <button className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm transition-colors border border-red-500/30">
                  Delete Account
                </button>
              </div>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <p className="text-blue-400 text-sm">
              <strong>Note:</strong> These are mock privacy settings for demonstration purposes. In a production
              environment, these settings would be persisted and enforced across the application.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
