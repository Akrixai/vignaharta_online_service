import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { getLeaderboardWinnerEmailTemplate, getLeaderboardWinnerEmailSubject } from '@/lib/email-templates/leaderboard-winner';

// Create admin client to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only admin can trigger this
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { month, year } = body;

    const targetMonth = month || new Date().getMonth() + 1;
    const targetYear = year || new Date().getFullYear();

    // Get top 3 retailers
    const { data: leaderboardData, error: queryError } = await supabaseAdmin.rpc('get_monthly_leaderboard', {
      target_month: targetMonth,
      target_year: targetYear
    });

    if (queryError) throw queryError;

    if (!leaderboardData || leaderboardData.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No leaderboard data available for this month'
      });
    }

    const top3 = leaderboardData.slice(0, 3);
    const emailResults = [];

    // Send emails to top 3
    for (const retailer of top3) {
      try {
        const emailData = {
          rank: retailer.rank,
          name: retailer.name,
          totalApplications: retailer.total_applications,
          totalCommissions: parseFloat(retailer.total_commissions),
          points: retailer.points,
          month: MONTH_NAMES[targetMonth - 1],
          year: targetYear,
          badge: retailer.badge_icon
        };

        const htmlContent = getLeaderboardWinnerEmailTemplate(emailData);
        const subject = getLeaderboardWinnerEmailSubject(retailer.rank, MONTH_NAMES[targetMonth - 1], targetYear);

        await transporter.sendMail({
          from: `"Vighnaharta Online Services" <${process.env.SMTP_USER}>`,
          to: retailer.email,
          subject: subject,
          html: htmlContent,
        });

        emailResults.push({
          rank: retailer.rank,
          name: retailer.name,
          email: retailer.email,
          status: 'sent'
        });

        // Log the email sent
        console.log(`Leaderboard email sent to ${retailer.name} (Rank ${retailer.rank})`);

      } catch (emailError) {
        console.error(`Failed to send email to ${retailer.name}:`, emailError);
        emailResults.push({
          rank: retailer.rank,
          name: retailer.name,
          email: retailer.email,
          status: 'failed',
          error: emailError instanceof Error ? emailError.message : 'Unknown error'
        });
      }
    }

    // Store email log in database
    try {
      await supabaseAdmin.from('leaderboard_email_logs').insert({
        month: targetMonth,
        year: targetYear,
        recipients: top3.map(r => ({
          user_id: r.user_id,
          rank: r.rank,
          name: r.name,
          email: r.email
        })),
        sent_at: new Date().toISOString(),
        results: emailResults
      });
    } catch (logError) {
      console.error('Failed to log email send:', logError);
    }

    return NextResponse.json({
      success: true,
      message: `Emails sent to top ${emailResults.filter(r => r.status === 'sent').length} retailers`,
      data: {
        month: MONTH_NAMES[targetMonth - 1],
        year: targetYear,
        results: emailResults
      }
    });

  } catch (error: any) {
    console.error('Error sending leaderboard emails:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send emails' },
      { status: 500 }
    );
  }
}
