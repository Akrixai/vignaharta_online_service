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
        is_active,
        created_at
      `)
      .eq('parent_employee_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;

    // Get hierarchy data separately for each employee
    const employeesWithHierarchy = await Promise.all(
      (employees || []).map(async (emp) => {
        const { data: hierarchy } = await supabaseAdmin
          .from('employee_hierarchy')
          .select('level, path, designation, territory_state, territory_district, territory_area')
          .eq('employee_id', emp.id)
          .single();
        
        return {
          ...emp,
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
