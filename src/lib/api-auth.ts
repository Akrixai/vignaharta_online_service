import jwt from 'jsonwebtoken';
import { supabaseAdmin } from './supabase';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'EMPLOYEE' | 'RETAILER' | 'CUSTOMER';
  designation?: string;
}

/**
 * Verify JWT token and return user data
 */
export async function verifyAuth(authHeader: string): Promise<AuthUser | null> {
  try {
    // Extract token from "Bearer <token>"
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return null;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any;
    
    if (!decoded || !decoded.sub) {
      return null;
    }

    // Fetch user from database
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role, designation')
      .eq('id', decoded.sub)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'ADMIN' | 'EMPLOYEE' | 'RETAILER' | 'CUSTOMER',
      designation: user.designation
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

/**
 * Check if user has required role
 */
export function hasRole(user: AuthUser | null, roles: string[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

/**
 * Check if user is admin
 */
export function isAdmin(user: AuthUser | null): boolean {
  return user?.role === 'ADMIN';
}

/**
 * Check if user is admin or employee
 */
export function isAdminOrEmployee(user: AuthUser | null): boolean {
  return user?.role === 'ADMIN' || user?.role === 'EMPLOYEE';
}
