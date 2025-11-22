import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// GET - Get organization hierarchy tree for current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;

    // Recursive function to build hierarchy tree
    async function buildHierarchyTree(parentId: string): Promise<any[]> {
      const { data: children, error } = await supabaseAdmin
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
        .eq('parent_employee_id', parentId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error || !children) return [];

      const tree = [];
      for (const child of children) {
        // Get hierarchy data separately
        const { data: hierarchy } = await supabaseAdmin
          .from('employee_hierarchy')
          .select('level, path')
          .eq('employee_id', child.id)
          .single();
        
        const subChildren = await buildHierarchyTree(child.id);
        tree.push({
          ...child,
          employee_hierarchy: hierarchy,
          children: subChildren,
          childCount: subChildren.length
        });
      }

      return tree;
    }

    // Build tree starting from current user
    const hierarchyTree = await buildHierarchyTree(user.id);

    // Get current user's info
    const { data: currentUser } = await supabaseAdmin
      .from('users')
      .select('id, name, email, designation, role')
      .eq('id', user.id)
      .single();
    
    // Get hierarchy data separately
    const { data: currentUserHierarchy } = await supabaseAdmin
      .from('employee_hierarchy')
      .select('level, path')
      .eq('employee_id', user.id)
      .single();
    
    const currentUserWithHierarchy = currentUser ? {
      ...currentUser,
      employee_hierarchy: currentUserHierarchy
    } : null;

    return NextResponse.json({ 
      success: true,
      currentUser: currentUserWithHierarchy,
      hierarchy: hierarchyTree,
      totalEmployees: countEmployees(hierarchyTree)
    });
  } catch (error: any) {
    console.error('Error fetching hierarchy:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}

function countEmployees(tree: any[]): number {
  let count = tree.length;
  for (const node of tree) {
    if (node.children && node.children.length > 0) {
      count += countEmployees(node.children);
    }
  }
  return count;
}
