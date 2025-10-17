import { Link } from 'react-router-dom';
import { Plus, Briefcase } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCommissions } from '../contexts/CommissionContext';
import CommissionCard from '../components/CommissionCard';

export default function MyCommissions() {
  const { user } = useAuth();
  const { getUserCommissions } = useCommissions();

  const myCommissions = user ? getUserCommissions(user.id) : [];

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="bg-gradient-to-r from-emerald-500 to-blue-500 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3 mb-2">
            <Briefcase className="w-8 h-8 text-white" />
            <h1 className="text-4xl font-bold text-white">My Commissions</h1>
          </div>
          <p className="text-xl text-white/90">
            Manage your commission requests and track their status
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-white">
            Your Commissions ({myCommissions.length})
          </h2>

          <Link
            to="/commissions/new"
            className="inline-flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>New Commission</span>
          </Link>
        </div>

        {myCommissions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myCommissions.map(commission => (
              <CommissionCard key={commission.id} commission={commission} showActions />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-slate-800 rounded-xl">
            <Briefcase className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Commissions Yet</h3>
            <p className="text-slate-400 mb-6">
              You haven't submitted any commission requests yet
            </p>
            <Link
              to="/commissions/new"
              className="inline-flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Create Your First Commission</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
