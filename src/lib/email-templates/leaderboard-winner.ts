interface LeaderboardEmailData {
  rank: number;
  name: string;
  totalApplications: number;
  totalCommissions: number;
  points: number;
  month: string;
  year: number;
  badge: string;
}

export function getLeaderboardWinnerEmailTemplate(data: LeaderboardEmailData): string {
  const rankColors = {
    1: { bg: '#FFD700', text: '#8B6914', gradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' },
    2: { bg: '#C0C0C0', text: '#4A4A4A', gradient: 'linear-gradient(135deg, #C0C0C0 0%, #808080 100%)' },
    3: { bg: '#CD7F32', text: '#5C3A1E', gradient: 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)' }
  };

  const rankTitles = {
    1: '🥇 GOLD CHAMPION',
    2: '🥈 SILVER STAR',
    3: '🥉 BRONZE ACHIEVER'
  };

  const color = rankColors[data.rank as keyof typeof rankColors];
  const title = rankTitles[data.rank as keyof typeof rankTitles];

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Congratulations - Top Performer!</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
          
          <!-- Header with Confetti -->
          <tr>
            <td style="background: ${color.gradient}; padding: 40px 30px; text-align: center; position: relative;">
              <div style="font-size: 60px; margin-bottom: 10px; animation: bounce 1s infinite;">
                ${data.badge}
              </div>
              <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">
                CONGRATULATIONS!
              </h1>
              <p style="color: white; margin: 10px 0 0 0; font-size: 18px; font-weight: 600;">
                ${title}
              </p>
            </td>
          </tr>

          <!-- Winner Announcement -->
          <tr>
            <td style="padding: 40px 30px; text-align: center; background: linear-gradient(to bottom, #f8f9fa 0%, #ffffff 100%);">
              <h2 style="color: #2d3748; margin: 0 0 20px 0; font-size: 28px;">
                🎉 ${data.name} 🎉
              </h2>
              <p style="color: #4a5568; font-size: 18px; line-height: 1.6; margin: 0;">
                You've secured <strong style="color: ${color.text};">Rank #${data.rank}</strong> in our monthly leaderboard for
                <strong>${data.month} ${data.year}</strong>!
              </p>
            </td>
          </tr>

          <!-- Stats Cards -->
          <tr>
            <td style="padding: 0 30px 40px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="33%" style="padding: 0 5px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 15px; padding: 25px; text-align: center; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                      <div style="font-size: 36px; font-weight: bold; color: white; margin-bottom: 5px;">
                        ${data.totalApplications}
                      </div>
                      <div style="color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 600;">
                        Applications
                      </div>
                    </div>
                  </td>
                  <td width="33%" style="padding: 0 5px;">
                    <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 15px; padding: 25px; text-align: center; box-shadow: 0 4px 15px rgba(245, 87, 108, 0.3);">
                      <div style="font-size: 36px; font-weight: bold; color: white; margin-bottom: 5px;">
                        ₹${data.totalCommissions.toLocaleString()}
                      </div>
                      <div style="color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 600;">
                        Commission
                      </div>
                    </div>
                  </td>
                  <td width="33%" style="padding: 0 5px;">
                    <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); border-radius: 15px; padding: 25px; text-align: center; box-shadow: 0 4px 15px rgba(79, 172, 254, 0.3);">
                      <div style="font-size: 36px; font-weight: bold; color: white; margin-bottom: 5px;">
                        ${data.points}
                      </div>
                      <div style="color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 600;">
                        Points
                      </div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Achievement Badge -->
          <tr>
            <td style="padding: 0 30px 40px 30px;">
              <div style="background: ${color.gradient}; border-radius: 15px; padding: 30px; text-align: center; border: 3px solid ${color.bg};">
                <div style="font-size: 48px; margin-bottom: 15px;">
                  ${data.badge}
                </div>
                <h3 style="color: white; margin: 0 0 10px 0; font-size: 24px; text-shadow: 1px 1px 2px rgba(0,0,0,0.2);">
                  Outstanding Performance!
                </h3>
                <p style="color: rgba(255,255,255,0.95); margin: 0; font-size: 16px; line-height: 1.6;">
                  Your dedication and hard work have earned you a place among the top performers. 
                  Keep up the excellent work!
                </p>
              </div>
            </td>
          </tr>

          <!-- Call to Action -->
          <tr>
            <td style="padding: 0 30px 40px 30px; text-align: center;">
              <a href="https://akrixsolutions.in" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 18px 50px; border-radius: 50px; font-size: 18px; font-weight: bold; box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4); transition: transform 0.3s;">
                🚀 Continue Your Success
              </a>
            </td>
          </tr>

          <!-- Motivational Quote -->
          <tr>
            <td style="padding: 0 30px 40px 30px;">
              <div style="background: linear-gradient(to right, #ffecd2 0%, #fcb69f 100%); border-left: 5px solid #f5576c; border-radius: 10px; padding: 25px;">
                <p style="color: #2d3748; font-size: 16px; font-style: italic; margin: 0; line-height: 1.6;">
                  "Success is not final, failure is not fatal: it is the courage to continue that counts."
                </p>
                <p style="color: #4a5568; font-size: 14px; margin: 10px 0 0 0; text-align: right;">
                  - Winston Churchill
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%); padding: 40px 30px; text-align: center;">
              <div style="margin-bottom: 20px;">
                <a href="https://akrixsolutions.in" style="display: inline-block; margin-bottom: 15px;">
                  <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 15px 30px; border-radius: 50px; box-shadow: 0 4px 15px rgba(240, 147, 251, 0.4);">
                    <span style="color: white; font-size: 20px; font-weight: bold; text-decoration: none;">
                      🚀 Powered by Akrix Solutions
                    </span>
                  </div>
                </a>
              </div>
              <p style="color: #a0aec0; font-size: 14px; margin: 0 0 10px 0;">
                Visit us at <a href="https://akrixsolutions.in" style="color: #667eea; text-decoration: none; font-weight: 600;">akrixsolutions.in</a>
              </p>
              <p style="color: #718096; font-size: 12px; margin: 0;">
                © ${data.year} Akrix Solutions. All rights reserved.
              </p>
              <div style="margin-top: 20px;">
                <a href="https://akrixsolutions.in" style="color: #667eea; text-decoration: none; margin: 0 10px; font-size: 12px;">About Us</a>
                <span style="color: #4a5568;">|</span>
                <a href="https://akrixsolutions.in" style="color: #667eea; text-decoration: none; margin: 0 10px; font-size: 12px;">Contact</a>
                <span style="color: #4a5568;">|</span>
                <a href="https://akrixsolutions.in" style="color: #667eea; text-decoration: none; margin: 0 10px; font-size: 12px;">Support</a>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export function getLeaderboardWinnerEmailSubject(rank: number, month: string, year: number): string {
  const rankEmojis = {
    1: '🥇',
    2: '🥈',
    3: '🥉'
  };

  const rankTitles = {
    1: 'GOLD CHAMPION',
    2: 'SILVER STAR',
    3: 'BRONZE ACHIEVER'
  };

  return `${rankEmojis[rank as keyof typeof rankEmojis]} Congratulations! You're ${rankTitles[rank as keyof typeof rankTitles]} - ${month} ${year}`;
}
