import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Users, FolderOpen, Activity, DollarSign, TrendingUp, Gift, Clock } from 'lucide-react';
import { PromoService } from '../../lib/promoService';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 0,
    activeUsers: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [promoStats, setPromoStats] = useState<any>(null);
  const [recentRedemptions, setRecentRedemptions] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
    loadPromoStats();
  }, []);

  const loadStats = async () => {
    try {
      const profilesSnapshot = await getDocs(collection(db, 'profiles'));
      const projectsSnapshot = await getDocs(collection(db, 'projects'));

      const users = profilesSnapshot.docs.map(doc => doc.data());
      const proUsers = users.filter((u: any) => u.plan === 'pro').length;
      const enterpriseUsers = users.filter((u: any) => u.plan === 'enterprise').length;

      setStats({
        totalUsers: users.length,
        totalProjects: projectsSnapshot.size,
        activeUsers: users.filter((u: any) => {
          if (!u.createdAt) return false;
          const created = u.createdAt.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
          const daysSinceCreation = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceCreation <= 30;
        }).length,
        revenue: proUsers * 29 + enterpriseUsers * 299
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPromoStats = async () => {
    try {
      const status = await PromoService.checkCampaignStatus('FIRST100');
      setPromoStats(status);

      const redemptions = await PromoService.getRecentRedemptions('FIRST100', 5);
      setRecentRedemptions(redemptions);
    } catch (error) {
      console.error('Error loading promo stats:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'from-cyan-500 to-blue-600',
      change: '+12%'
    },
    {
      label: 'Total Projects',
      value: stats.totalProjects,
      icon: FolderOpen,
      color: 'from-purple-500 to-pink-500',
      change: '+23%'
    },
    {
      label: 'Active Users (30d)',
      value: stats.activeUsers,
      icon: Activity,
      color: 'from-green-500 to-emerald-500',
      change: '+8%'
    },
    {
      label: 'Monthly Revenue',
      value: `$${stats.revenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'from-orange-500 to-red-500',
      change: '+34%'
    }
  ];

  return (
    <div className="flex-1 overflow-auto gradient-background">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Monitor platform metrics and user activity</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                    <TrendingUp className="w-4 h-4" />
                    {stat.change}
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {promoStats && (
          <div className="mb-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">FIRST100 Campaign</h2>
                  <p className="text-sm text-gray-600">Promotional token distribution status</p>
                </div>
              </div>
              <div className={`px-4 py-2 rounded-lg font-semibold ${
                promoStats.isValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {promoStats.isValid ? 'Active' : 'Completed'}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                <div className="text-sm text-blue-600 font-medium mb-1">Total Slots</div>
                <div className="text-3xl font-bold text-blue-900">100</div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                <div className="text-sm text-green-600 font-medium mb-1">Claimed</div>
                <div className="text-3xl font-bold text-green-900">{100 - promoStats.remainingSlots}</div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                <div className="text-sm text-orange-600 font-medium mb-1">Remaining</div>
                <div className="text-3xl font-bold text-orange-900">{promoStats.remainingSlots}</div>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Campaign Progress</span>
                <span>{100 - promoStats.remainingSlots}/100 ({Math.round(((100 - promoStats.remainingSlots) / 100) * 100)}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${((100 - promoStats.remainingSlots) / 100) * 100}%` }}
                />
              </div>
            </div>

            {recentRedemptions.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Recent Redemptions</h3>
                <div className="space-y-2">
                  {recentRedemptions.map((redemption: any, index: number) => (
                    <div key={index} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {redemption.profile?.email || 'Unknown User'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {redemption.tokens_awarded?.toLocaleString()} tokens awarded
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-4 h-4" />
                        {new Date(redemption.redeemed_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  i
                </div>
                <div className="flex-1">
                  <p className="text-sm text-blue-900 font-medium mb-1">Campaign Details</p>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Token Amount: {promoStats.tokenAmount?.toLocaleString()} per user</li>
                    <li>• Campaign Code: FIRST100</li>
                    <li>• Signup URL: /login?promo=FIRST100</li>
                    <li>• Total Value Distributed: ${((100 - promoStats.remainingSlots) * promoStats.tokenAmount / 1000000).toFixed(2)}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {[
                { user: 'user@example.com', action: 'Created new project', time: '2m ago' },
                { user: 'dev@example.com', action: 'Upgraded to Pro', time: '15m ago' },
                { user: 'designer@example.com', action: 'Generated design', time: '1h ago' },
                { user: 'coder@example.com', action: 'Exported code', time: '2h ago' }
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <div className="font-medium text-gray-900">{activity.user}</div>
                    <div className="text-sm text-gray-600">{activity.action}</div>
                  </div>
                  <div className="text-xs text-gray-500">{activity.time}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Plan Distribution</h2>
            <div className="space-y-4">
              {[
                { plan: 'Free', count: stats.totalUsers - Math.floor(stats.totalUsers * 0.3), color: 'bg-gray-500' },
                { plan: 'Pro', count: Math.floor(stats.totalUsers * 0.25), color: 'bg-blue-500' },
                { plan: 'Enterprise', count: Math.floor(stats.totalUsers * 0.05), color: 'bg-purple-500' }
              ].map((item) => (
                <div key={item.plan}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{item.plan}</span>
                    <span className="text-sm text-gray-600">{item.count} users</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${item.color} h-2 rounded-full transition-all`}
                      style={{ width: `${(item.count / stats.totalUsers) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
