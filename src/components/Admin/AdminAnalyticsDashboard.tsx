import React, { useState, useEffect } from 'react';
import { BarChart3, Users, UserPlus, TrendingUp, Clock, Eye, MousePointer, CheckCircle, ArrowRight, Activity, Calendar } from 'lucide-react';
import { getAnalyticsSummary, getTopPages, getDailyVisitors } from '../../lib/analyticsService';

interface AnalyticsSummary {
  totalVisitors: number;
  totalSignups: number;
  conversionRate: number;
  getStartedClicks: number;
  signupPageViews: number;
  avgTimeToConversionMinutes: number;
  funnel: {
    visitors: number;
    getStartedClicks: number;
    signupPageViews: number;
    signups: number;
  };
}

interface PageStats {
  name: string;
  count: number;
}

interface DailyVisitor {
  date: string;
  visitors: number;
}

export const AdminAnalyticsDashboard: React.FC = () => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [topPages, setTopPages] = useState<PageStats[]>([]);
  const [dailyVisitors, setDailyVisitors] = useState<DailyVisitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const [summaryData, pagesData, visitorsData] = await Promise.all([
        getAnalyticsSummary(startDate, endDate),
        getTopPages(startDate, endDate),
        getDailyVisitors(days),
      ]);

      setSummary(summaryData);
      setTopPages(pagesData);
      setDailyVisitors(visitorsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00FFF0]"></div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-white/60">No analytics data available</p>
      </div>
    );
  }

  const maxVisitors = Math.max(...dailyVisitors.map(d => d.visitors), 1);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <BarChart3 className="w-10 h-10 text-[#00FFF0]" />
              Analytics Dashboard
            </h1>
            <p className="text-white/60">Track landing page performance and signup conversions</p>
          </div>

          <div className="flex gap-2">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  dateRange === range
                    ? 'bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] text-white'
                    : 'glass-panel border border-white/20 text-white/60 hover:text-white hover:border-white/40'
                }`}
              >
                {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="glass-panel rounded-2xl p-6 border border-white/20 hover:border-[#00FFF0]/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <Activity className="w-5 h-5 text-white/40" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{summary.totalVisitors.toLocaleString()}</div>
            <div className="text-white/60 text-sm">Total Visitors</div>
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-white/20 hover:border-[#00FFF0]/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-green-400" />
              </div>
              <CheckCircle className="w-5 h-5 text-white/40" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{summary.totalSignups.toLocaleString()}</div>
            <div className="text-white/60 text-sm">Total Signups</div>
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-white/20 hover:border-[#00FFF0]/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00FFF0]/20 to-[#8A2BE2]/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[#00FFF0]" />
              </div>
              <ArrowRight className="w-5 h-5 text-white/40" />
            </div>
            <div className="text-3xl font-bold bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] bg-clip-text text-transparent mb-1">
              {summary.conversionRate.toFixed(2)}%
            </div>
            <div className="text-white/60 text-sm">Conversion Rate</div>
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-white/20 hover:border-[#00FFF0]/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-400" />
              </div>
              <Calendar className="w-5 h-5 text-white/40" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {summary.avgTimeToConversionMinutes > 0 ? `${summary.avgTimeToConversionMinutes}m` : 'N/A'}
            </div>
            <div className="text-white/60 text-sm">Avg. Time to Convert</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="glass-panel rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <MousePointer className="w-6 h-6 text-[#00FFF0]" />
              Conversion Funnel
            </h2>

            <div className="space-y-4">
              {[
                { label: 'Landing Page Visitors', value: summary.funnel.visitors, icon: Eye, color: 'blue' },
                { label: 'Get Started Clicks', value: summary.funnel.getStartedClicks, icon: MousePointer, color: 'cyan' },
                { label: 'Signup Page Views', value: summary.funnel.signupPageViews, icon: Users, color: 'purple' },
                { label: 'Completed Signups', value: summary.funnel.signups, icon: CheckCircle, color: 'green' },
              ].map((step, idx) => {
                const Icon = step.icon;
                const percentage = summary.funnel.visitors > 0
                  ? ((step.value / summary.funnel.visitors) * 100).toFixed(1)
                  : '0.0';

                return (
                  <div key={idx} className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-5 h-5 text-${step.color}-400`} />
                        <span className="text-white font-semibold">{step.label}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-white/60 text-sm">{percentage}%</span>
                        <span className="text-white font-bold">{step.value.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r from-${step.color}-500 to-${step.color}-600 transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 p-4 glass-panel border border-white/10 rounded-xl">
              <div className="text-white/60 text-sm mb-2">Funnel Drop-off Analysis</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/70">Visitors to Get Started</span>
                  <span className="text-white font-semibold">
                    {summary.funnel.visitors > 0
                      ? `${((summary.funnel.getStartedClicks / summary.funnel.visitors) * 100).toFixed(1)}%`
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Get Started to Signup Page</span>
                  <span className="text-white font-semibold">
                    {summary.funnel.getStartedClicks > 0
                      ? `${((summary.funnel.signupPageViews / summary.funnel.getStartedClicks) * 100).toFixed(1)}%`
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Signup Page to Completion</span>
                  <span className="text-white font-semibold">
                    {summary.funnel.signupPageViews > 0
                      ? `${((summary.funnel.signups / summary.funnel.signupPageViews) * 100).toFixed(1)}%`
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Eye className="w-6 h-6 text-[#00FFF0]" />
              Top Pages
            </h2>

            <div className="space-y-3">
              {topPages.slice(0, 8).map((page, idx) => {
                const maxCount = Math.max(...topPages.map(p => p.count), 1);
                const percentage = ((page.count / maxCount) * 100).toFixed(0);

                return (
                  <div key={idx} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold capitalize">{page.name}</span>
                      <span className="text-white/60">{page.count.toLocaleString()} views</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] transition-all duration-500 group-hover:opacity-80"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {topPages.length === 0 && (
              <div className="text-center text-white/40 py-8">
                No page data available yet
              </div>
            )}
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-[#00FFF0]" />
            Daily Visitors Trend
          </h2>

          <div className="relative h-64">
            <div className="absolute inset-0 flex items-end justify-around gap-1">
              {dailyVisitors.map((day, idx) => {
                const height = maxVisitors > 0 ? (day.visitors / maxVisitors) * 100 : 0;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center group">
                    <div className="relative w-full">
                      <div
                        className="w-full bg-gradient-to-t from-[#00FFF0] to-[#8A2BE2] rounded-t-lg transition-all duration-300 group-hover:opacity-80 cursor-pointer"
                        style={{ height: `${height}%`, minHeight: '4px' }}
                        title={`${day.date}: ${day.visitors} visitors`}
                      />
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        {day.visitors} visitors
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between items-center mt-4 text-xs text-white/40">
            {dailyVisitors.length > 0 && (
              <>
                <span>{new Date(dailyVisitors[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <span>{new Date(dailyVisitors[dailyVisitors.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </>
            )}
          </div>
        </div>

        <div className="mt-8 glass-panel rounded-2xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4">Key Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 glass-panel border border-white/10 rounded-xl">
              <div className="text-white/60 text-sm mb-1">Best Performing Page</div>
              <div className="text-white font-bold capitalize">
                {topPages.length > 0 ? topPages[0].name : 'N/A'}
              </div>
            </div>
            <div className="p-4 glass-panel border border-white/10 rounded-xl">
              <div className="text-white/60 text-sm mb-1">Peak Visitor Day</div>
              <div className="text-white font-bold">
                {dailyVisitors.length > 0
                  ? new Date(dailyVisitors.reduce((max, day) => day.visitors > max.visitors ? day : max).date).toLocaleDateString()
                  : 'N/A'}
              </div>
            </div>
            <div className="p-4 glass-panel border border-white/10 rounded-xl">
              <div className="text-white/60 text-sm mb-1">Get Started CTR</div>
              <div className="text-white font-bold">
                {summary.funnel.visitors > 0
                  ? `${((summary.funnel.getStartedClicks / summary.funnel.visitors) * 100).toFixed(2)}%`
                  : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
