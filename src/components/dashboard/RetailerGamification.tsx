'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  total_applications: number;
  total_earnings: number;
  total_commissions: number;
  points: number;
  badge_type: string | null;
  badge_icon: string | null;
  users: {
    id: string;
    name: string;
    email: string;
    profile_photo_url: string | null;
  };
}

interface GamificationData {
  topRetailers: LeaderboardEntry[];
  currentUserRank: LeaderboardEntry | null;
  month: number;
  year: number;
}

export default function RetailerGamification() {
  const [data, setData] = useState<GamificationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
    // Refresh every 5 minutes
    const interval = setInterval(fetchLeaderboard, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/leaderboard');
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'from-yellow-400 to-yellow-600';
      case 2: return 'from-gray-300 to-gray-500';
      case 3: return 'from-orange-400 to-orange-600';
      default: return 'from-blue-400 to-blue-600';
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center justify-between">
          <span className="text-2xl font-bold">🏆 Top Performers</span>
          <span className="text-sm font-normal">
            {getMonthName(data.month)} {data.year}
          </span>
        </CardTitle>
        <p className="text-purple-100 text-sm">
          Real-time leaderboard updates every 5 minutes
        </p>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {/* Top 3 Retailers */}
        {data.topRetailers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No data available for this month yet.</p>
            <p className="text-sm text-gray-500 mt-2">Start applying for services to appear on the leaderboard!</p>
          </div>
        ) : (
          <>
            {data.topRetailers.map((retailer, index) => (
              <div
                key={retailer.user_id}
                className={`relative overflow-hidden rounded-xl bg-gradient-to-r ${getRankColor(retailer.rank)} p-4 text-white shadow-lg transform hover:scale-105 transition-all duration-300`}
              >
                {/* Rank Badge */}
                <div className="absolute top-2 right-2 text-4xl opacity-20">
                  {retailer.badge_icon || getRankBadge(retailer.rank)}
                </div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {retailer.users.profile_photo_url ? (
                        <img
                          src={retailer.users.profile_photo_url}
                          alt={retailer.users.name}
                          className="w-12 h-12 rounded-full border-2 border-white shadow-lg"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-white/30 flex items-center justify-center text-xl font-bold">
                          {retailer.users.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-lg">{retailer.users.name}</h3>
                        <p className="text-xs opacity-90">Rank #{retailer.rank}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold">{retailer.badge_icon || getRankBadge(retailer.rank)}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white/20 rounded-lg p-2">
                      <div className="text-2xl font-bold">{retailer.total_applications}</div>
                      <div className="text-xs opacity-90">Applications</div>
                    </div>
                    <div className="bg-white/20 rounded-lg p-2">
                      <div className="text-lg font-bold">{formatCurrency(retailer.total_commissions)}</div>
                      <div className="text-xs opacity-90">Commission</div>
                    </div>
                    <div className="bg-white/20 rounded-lg p-2">
                      <div className="text-2xl font-bold">{retailer.points}</div>
                      <div className="text-xs opacity-90">Points</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Current User Rank (if not in top 3) */}
            {data.currentUserRank && data.currentUserRank.rank > 3 && (
              <div className="mt-6 pt-6 border-t-2 border-purple-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Your Ranking</h4>
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-4 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg">You</h3>
                      <p className="text-xs opacity-90">Rank #{data.currentUserRank.rank}</p>
                    </div>
                    <div className="text-3xl">🎯</div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white/20 rounded-lg p-2">
                      <div className="text-2xl font-bold">{data.currentUserRank.total_applications}</div>
                      <div className="text-xs opacity-90">Applications</div>
                    </div>
                    <div className="bg-white/20 rounded-lg p-2">
                      <div className="text-lg font-bold">{formatCurrency(data.currentUserRank.total_commissions)}</div>
                      <div className="text-xs opacity-90">Commission</div>
                    </div>
                    <div className="bg-white/20 rounded-lg p-2">
                      <div className="text-2xl font-bold">{data.currentUserRank.points}</div>
                      <div className="text-xs opacity-90">Points</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Motivational Message */}
            <div className="mt-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">💪</span>
                <div>
                  <h4 className="font-semibold text-green-800">Keep Going!</h4>
                  <p className="text-sm text-green-700">
                    {data.currentUserRank && data.currentUserRank.rank <= 3
                      ? "You're in the top 3! Maintain your position!"
                      : "Process more applications to climb the leaderboard!"}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
