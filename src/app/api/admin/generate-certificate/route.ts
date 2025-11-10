import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { UserRole } from '@/types';

// POST - Admin generates certificate for a user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user_id, user_role } = await request.json();

    if (!user_id || !user_role) {
      return NextResponse.json({
        error: 'User ID and role are required'
      }, { status: 400 });
    }

    // Get user data
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user_id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 });
    }

    const userCreationDate = new Date(userData.created_at);
    const issueDate = userCreationDate.toISOString().split('T')[0];
    const year = userCreationDate.getFullYear();

    if (user_role === 'EMPLOYEE') {
      // Check if certificate already exists
      const { data: existingCert } = await supabaseAdmin
        .from('employee_certificates')
        .select('*')
        .eq('user_id', user_id)
        .eq('is_active', true)
        .single();

      if (existingCert) {
        return NextResponse.json({
          success: true,
          message: 'Certificate already exists',
          certificate: existingCert
        });
      }

      // Generate certificate number
      const { data: existingCerts } = await supabaseAdmin
        .from('employee_certificates')
        .select('certificate_number')
        .like('certificate_number', `VOS-EMP-${year}-%`)
        .order('certificate_number', { ascending: false });

      let sequenceNumber = 1;
      if (existingCerts && existingCerts.length > 0) {
        const sequenceNumbers = existingCerts
          .map(cert => {
            const parts = cert.certificate_number.split('-');
            return parseInt(parts[3]) || 0;
          })
          .filter(num => !isNaN(num));

        if (sequenceNumbers.length > 0) {
          sequenceNumber = Math.max(...sequenceNumbers) + 1;
        }
      }

      const certificateNumber = `VOS-EMP-${year}-${String(sequenceNumber).padStart(5, '0')}`;
      const digitalSignature = `VOS-EMP-SIG-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

      const { data: certificate, error: createError } = await supabaseAdmin
        .from('employee_certificates')
        .insert({
          user_id: user_id,
          employee_name: userData.name,
          employee_id: userData.employee_id || null,
          department: userData.department || null,
          branch: userData.branch || null,
          certificate_number: certificateNumber,
          issue_date: issueDate,
          company_name: 'Vignaharta Janseva',
          digital_signature: digitalSignature,
          is_active: true
        })
        .select()
        .single();

      if (createError) {
        return NextResponse.json({
          error: 'Failed to create employee certificate'
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Employee certificate generated successfully',
        certificate
      });

    } else if (user_role === 'RETAILER') {
      // Check if certificate already exists
      const { data: existingCert } = await supabaseAdmin
        .from('retailer_certificates')
        .select('*')
        .eq('user_id', user_id)
        .eq('is_active', true)
        .single();

      if (existingCert) {
        return NextResponse.json({
          success: true,
          message: 'Certificate already exists',
          certificate: existingCert
        });
      }

      // Generate certificate number
      const { data: existingCerts } = await supabaseAdmin
        .from('retailer_certificates')
        .select('certificate_number')
        .like('certificate_number', `VOS-${year}-%`)
        .order('certificate_number', { ascending: false });

      let sequenceNumber = 1;
      if (existingCerts && existingCerts.length > 0) {
        const sequenceNumbers = existingCerts
          .map(cert => {
            const parts = cert.certificate_number.split('-');
            return parseInt(parts[2]) || 0;
          })
          .filter(num => !isNaN(num));

        if (sequenceNumbers.length > 0) {
          sequenceNumber = Math.max(...sequenceNumbers) + 1;
        }
      }

      const certificateNumber = `VOS-${year}-${String(sequenceNumber).padStart(5, '0')}`;
      const digitalSignature = `VOS-SIG-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      const branch = userData.city || userData.state || 'Main Branch';

      const { data: certificate, error: createError } = await supabaseAdmin
        .from('retailer_certificates')
        .insert({
          user_id: user_id,
          retailer_name: userData.name,
          branch: branch,
          certificate_number: certificateNumber,
          issue_date: issueDate,
          company_name: 'Vignaharta Janseva',
          digital_signature: digitalSignature,
          is_active: true
        })
        .select()
        .single();

      if (createError) {
        return NextResponse.json({
          error: 'Failed to create retailer certificate'
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Retailer certificate generated successfully',
        certificate
      });
    }

    return NextResponse.json({
      error: 'Invalid user role'
    }, { status: 400 });

  } catch (error) {
    console.error('Certificate generation error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
