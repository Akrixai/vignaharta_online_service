import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// GET - List all employees with documents (Admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied. Admin only.' }, { status: 403 });
    }

    // Get all employees (EMPLOYEE and RETAILER roles)
    const { data: employees, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        name,
        email,
        phone,
        designation,
        role,
        parent_employee_id,
        territory_state,
        territory_district,
        territory_area,
        employee_id,
        department,
        address,
        city,
        state,
        pincode,
        date_of_birth,
        gender,
        branch,
        is_active,
        created_at,
        updated_at
      `)
      .in('role', ['EMPLOYEE', 'RETAILER'])
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }

    // Get documents for all employees
    const employeesWithDocuments = await Promise.all(
      (employees || []).map(async (emp) => {
        // Get employee documents
        const { data: documents, error: docError } = await supabaseAdmin
          .from('employee_documents')
          .select('id, document_type, file_url, file_name, uploaded_at')
          .eq('user_id', emp.id)
          .order('uploaded_at', { ascending: false });
        
        if (docError) {
          console.error(`Error fetching documents for employee ${emp.id}:`, docError);
        }
        
        return {
          ...emp,
          documents: documents || []
        };
      })
    );

    return NextResponse.json({ 
      success: true,
      employees: employeesWithDocuments,
      total: employeesWithDocuments.length
    });
  } catch (error: any) {
    console.error('Error fetching all employees:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Failed to fetch employees'
    }, { status: 500 });
  }
}
