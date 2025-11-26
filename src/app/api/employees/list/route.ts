import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// GET - List employees created by current user (hierarchical)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;

    // Get all employees created by this user
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
        created_at
      `)
      .eq('parent_employee_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;

    // Get hierarchy data and documents separately for each employee
    const employeesWithHierarchy = await Promise.all(
      (employees || []).map(async (emp) => {
        const { data: hierarchy } = await supabaseAdmin
          .from('employee_hierarchy')
          .select('level, path, designation, territory_state, territory_district, territory_area')
          .eq('employee_id', emp.id)
          .single();
        
        // Get employee documents
        const { data: documents } = await supabaseAdmin
          .from('employee_documents')
          .select('document_type, file_url')
          .eq('user_id', emp.id);
        
        // Map documents to specific fields
        const docMap: Record<string, string> = {};
        documents?.forEach(doc => {
          if (doc.document_type === 'AADHAR') docMap.aadhar_card_url = doc.file_url;
          if (doc.document_type === 'PANCARD') docMap.pan_card_url = doc.file_url;
          if (doc.document_type === 'PHOTO') docMap.photo_url = doc.file_url;
          if (doc.document_type === 'IMAGE') docMap.other_documents_url = doc.file_url;
        });
        
        return {
          ...emp,
          ...docMap,
          employee_hierarchy: hierarchy
        };
      })
    );

    return NextResponse.json({ 
      success: true,
      employees: employeesWithHierarchy || []
    });
  } catch (error: any) {
    console.error('Error fetching employees:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}
