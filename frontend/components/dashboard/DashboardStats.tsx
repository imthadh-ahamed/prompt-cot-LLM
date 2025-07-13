'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Zap, Users } from 'lucide-react';
import { DashboardStats as DashboardStatsType } from '@/types';
import { analyticsApi } from '@/lib/api';

export function DashboardStats() {
  const [stats, setStats] = useState<DashboardStatsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await analyticsApi.getDashboardData();
      setStats(data);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {['total-experiments', 'average-rating', 'recent-activity', 'providers-used'].map((key) => (
          <div key={key} className="card">
            <div className="card-content">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="card">
        <div className="card-content">
          <div className="text-center py-8">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
            <p className="text-gray-500">Failed to load dashboard statistics.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-5">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Experiments</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total_experiments}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Average Rating</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.average_rating.toFixed(1)}
                  <span className="text-sm text-gray-500 ml-1">/ 5</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full">
                <Zap className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Recent Activity</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.recent_activity}
                  <span className="text-sm text-gray-500 ml-1">this week</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Providers Used</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {Object.keys(stats.provider_stats).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Provider Stats */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold">Usage by Provider</h2>
        </div>
        <div className="card-content">
          <div className="space-y-4">
            {Object.entries(stats.provider_stats).map(([provider, count]) => {
              const percentage = (count / stats.total_experiments) * 100;
              return (
                <div key={provider} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      provider === 'openai' ? 'bg-green-500' :
                      provider === 'anthropic' ? 'bg-orange-500' :
                      'bg-yellow-500'
                    }`}></div>
                    <span className="font-medium capitalize">{provider}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          provider === 'openai' ? 'bg-green-500' :
                          provider === 'anthropic' ? 'bg-orange-500' :
                          'bg-yellow-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-16 text-right">
                      {count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button className="btn-outline p-4 h-auto">
              <div className="text-center">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                <div className="font-medium">Export All Data</div>
                <div className="text-sm text-gray-500">Download experiment history</div>
              </div>
            </button>
            
            <button className="btn-outline p-4 h-auto">
              <div className="text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                <div className="font-medium">View Analytics</div>
                <div className="text-sm text-gray-500">Detailed performance metrics</div>
              </div>
            </button>
            
            <button className="btn-primary p-4 h-auto">
              <div className="text-center">
                <Zap className="w-8 h-8 mx-auto mb-2 text-white" />
                <div className="font-medium">New Experiment</div>
                <div className="text-sm text-blue-100">Start testing prompts</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
