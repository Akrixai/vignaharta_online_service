'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface LeaderboardEntry {
  id: string;
  user_id: string;
  month: number;
  year: number;
  total_applications: number;
  total_earnings: number;
  rank: number;
  badge_type: string;
  users: {
    name: string;
    city: string;
    state: string;
  };
}

const BADGE_CONFIG = {
  GOLD: {
    icon: '🏆',
    color: 'from-yellow-400 to-yellow-600',
    title: 'Gold Champion',
    description: 'Top Performer'
  },
  SILVER: {
    icon: '🥈',
    color: 'from-gray-300 to-gray-500',
    title: 'Silver Star',
    description: 'Outstanding Performance'
  },
  BRONZE: {
    icon: '🥉',
    color: 'from-orange-400 to-orange-600',
    title: 'Bronze Achiever',
    description: 'Excellent Work'
  },
  RISING_STAR: {
    icon: '⭐',
    color: 'from-blue-400 to-blue-600',
    title: 'Rising Star',
    description: 'Fast Growing'
  },
  TOP_PERFORMER: {
    icon: '💎',
    color: 'from-purple-400 to-purple-600',
    title: 'Top Performer',
    description: 'Consistent Excellence'
  }
};

export default function LeaderboardPage() {
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedMonth, selectedYear]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/leaderboard?month=${selectedMonth}&year=${selectedYear}&limit=10`
      );
      const data = await response.json();
      setLeaderboard(data.leaderboard || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeConfig = (badgeType: string) => {
    return BADGE_CONFIG[badgeType as keyof typeof BADGE_CONFIG] || BADGE_CONFIG.TOP_PERFORMER;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🏆 Monthly Leaderboard
          </h1>
          <p className="text-xl text-gray-600">
            Celebrating our top-performing retailers
          </p>
        </div>

        {/* Month/Year Selector */}
        <div className="flex justify-center gap-4 mb-8">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
              <option key={month} value={month}>
                {new Date(2024, month - 1).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
          >
            {[2024, 2025, 2026].map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto"></div>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No data available for this period</p>
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {leaderboard.slice(0, 3).map((entry, index) => {
                const badge = getBadgeConfig(entry.badge_type);
                const heights = ['h-80', 'h-96', 'h-72'];
                const orders = [2, 1, 3];
                
                return (
                  <div
                    key={entry.id}
                    className={`order-${orders[index]} transform transition-all duration-300 hover:scale-105`}
                  >
                    <div className={`bg-gradient-to-br ${badge.color} rounded-2xl p-6 text-white shadow-2xl ${heights[index]} flex flex-col justify-between`}>
                      <div className="text-center">
                        <div className="text-6xl mb-4 animate-bounce">{badge.icon}</div>
                        <div className="text-7xl font-bold mb-2">#{entry.rank}</div>
                        <h3 className="text-2xl font-bold mb-2">{entry.users.name}</h3>
                        <p className="text-sm opacity-90">{entry.users.city}, {entry.users.state}</p>
                      </div>
                      <div className="space-y-2 bg-white/20 rounded-lg p-4">
                        <div className="flex justify-between">
                          <span>Applications:</span>
                          <span className="font-bold">{entry.total_applications}</span>
                        </div>
                        <div className="text-center mt-4">
                          <div className="text-xs opacity-90">{badge.title}</div>
                          <div className="text-sm font-bold">{badge.description}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rest of Leaderboard */}
            {leaderboard.length > 3 && (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-6">
                  <h2 className="text-2xl font-bold">Top Performers</h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {leaderboard.slice(3).map((entry) => {
                    const badge = getBadgeConfig(entry.badge_type);
                    return (
                      <div key={entry.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="text-3xl font-bold text-gray-400 w-12">
                              #{entry.rank}
                            </div>
                            <div className="text-4xl">{badge.icon}</div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">{entry.users.name}</h3>
                              <p className="text-sm text-gray-600">{entry.users.city}, {entry.users.state}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-red-600">{entry.total_applications}</div>
                            <div className="text-sm text-gray-600">Applications</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Call to Action */}
        <div className="mt-12 text-center bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-2xl p-8">
          <h3 className="text-2xl font-bold mb-4">Want to be on the leaderboard?</h3>
          <p className="text-lg mb-6">Join our network and start earning today!</p>
          <button
            onClick={() => router.push('/register')}
            className="bg-white text-red-600 px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors"
          >
            Become a Retailer
          </button>
        </div>
      </div>
    </div>
  );
}
