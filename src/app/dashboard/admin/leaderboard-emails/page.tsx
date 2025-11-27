'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { showToast } from '@/lib/toast';
import { Mail, Send, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function LeaderboardEmailsPage() {
  const { data: session } = useSession();
  const [sending, setSending] = useState(false);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchEmailLogs();
  }, []);

  const fetchEmailLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/leaderboard/email-logs');
      const result = await response.json();
      
      if (result.success) {
        setEmailLogs(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching email logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmails = async () => {
    if (!confirm(`Send leaderboard emails to top 3 retailers for ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}?`)) {
      return;
    }

    try {
      setSending(true);
      const response = await fetch('/api/leaderboard/send-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          month: selectedMonth,
          year: selectedYear
        })
      });

      const result = await response.json();

      if (result.success) {
        showToast.success('Emails sent successfully!', {
          description: result.message
        });
        fetchEmailLogs();
      } else {
        showToast.error('Failed to send emails', {
          description: result.error
        });
      }
    } catch (error) {
      console.error('Error sending emails:', error);
      showToast.error('Failed to send emails');
    } finally {
      setSending(false);
    }
  };

  if (!session || session.user.role !== 'ADMIN') {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only administrators can access this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-8 text-white shadow-xl">
          <h1 className="text-4xl font-bold mb-3">🏆 Leaderboard Email Management</h1>
          <p className="text-purple-100 text-xl">
            Send congratulatory emails to top performing retailers
          </p>
        </div>

        {/* Send Emails Card */}
        <Card className="border-2 border-purple-200">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="flex items-center text-2xl">
              <Mail className="w-6 h-6 mr-2 text-purple-600" />
              Send Monthly Winner Emails
            </CardTitle>
            <CardDescription>
              Select month and year to send congratulatory emails to top 3 retailers
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Month
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {MONTH_NAMES.map((month, index) => (
                    <option key={index} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {[2024, 2025, 2026, 2027, 2028].map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={handleSendEmails}
                  disabled={sending}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Emails
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>Note:</strong> Emails will be sent to the top 3 retailers with beautiful, branded templates featuring their achievements, stats, and badges.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Email Send History
            </CardTitle>
            <CardDescription>
              View past leaderboard email campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading history...</p>
              </div>
            ) : emailLogs.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No emails sent yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {emailLogs.map((log) => (
                  <div key={log.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <Calendar className="w-5 h-5 text-purple-600 mr-2" />
                        <h3 className="font-semibold text-lg">
                          {MONTH_NAMES[log.month - 1]} {log.year}
                        </h3>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(log.sent_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {log.results?.map((result: any, index: number) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg ${
                            result.status === 'sent'
                              ? 'bg-green-50 border border-green-200'
                              : 'bg-red-50 border border-red-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">
                              {result.rank === 1 ? '🥇' : result.rank === 2 ? '🥈' : '🥉'} Rank {result.rank}
                            </span>
                            {result.status === 'sent' ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600" />
                            )}
                          </div>
                          <p className="text-sm font-medium text-gray-900">{result.name}</p>
                          <p className="text-xs text-gray-600">{result.email}</p>
                          {result.error && (
                            <p className="text-xs text-red-600 mt-1">{result.error}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        <Card className="border-2 border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">⚙️ Automated Monthly Emails</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-700 mb-4">
              To automatically send emails on the 1st of every month, set up a cron job or scheduled task:
            </p>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
              <code>
                # Run on 1st of every month at 9:00 AM<br />
                0 9 1 * * curl -X POST https://your-domain.com/api/leaderboard/send-emails \<br />
                &nbsp;&nbsp;-H "Authorization: Bearer YOUR_ADMIN_TOKEN" \<br />
                &nbsp;&nbsp;-H "Content-Type: application/json"
              </code>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
