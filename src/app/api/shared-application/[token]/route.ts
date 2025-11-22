import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Access shareable application link
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Fetch the shareable link
    const { data: link, error: linkError } = await supabase
      .from('shareable_application_links')
      .select(`
        *,
        scheme:schemes(*)
      `)
      .eq('link_token', params.token)
      .single();

    if (linkError || !link) {
      return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 });
    }

    // Check if link is active
    if (!link.is_active) {
      return NextResponse.json({ error: 'This link has been deactivated' }, { status: 403 });
    }

    // Check expiration
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This link has expired' }, { status: 403 });
    }

    // Check max access count
    if (link.max_access_count && link.access_count >= link.max_access_count) {
      return NextResponse.json({ error: 'This link has reached its maximum access limit' }, { status: 403 });
    }

    // If user is not logged in, return link info with login required flag
    if (!session) {
      return NextResponse.json({
        requiresLogin: true,
        link: {
          title: link.title,
          description: link.description,
          scheme: link.scheme
        }
      });
    }

    // Check if user has permission
    const hasRolePermission = link.allowed_roles.includes(session.user.role);
    const hasUserPermission = link.allowed_user_ids.length === 0 || link.allowed_user_ids.includes(session.user.id);

    if (!hasRolePermission && !hasUserPermission) {
      return NextResponse.json({ 
        error: 'You do not have permission to access this application',
        message: 'This link is restricted to specific users or roles. Please contact the administrator.'
      }, { status: 403 });
    }

    // Increment access count
    await supabase
      .from('shareable_application_links')
      .update({ 
        access_count: link.access_count + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', link.id);

    return NextResponse.json({
      success: true,
      link: {
        title: link.title,
        description: link.description,
        scheme: link.scheme
      }
    });
  } catch (error: any) {
    console.error('Error accessing shareable link:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
