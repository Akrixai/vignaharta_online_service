import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { supabaseAdmin } from './supabase';
import bcrypt from 'bcryptjs';
import { UserRole } from '@/types';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        role: { label: 'Role', type: 'text' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || !credentials?.role) {
          return null;
        }

        try {
          // Check if input is email or phone number
          const isPhone = /^\d{10}$/.test(credentials.email);
          
          // Query by email or phone with role filter
          let query = supabaseAdmin
            .from('users')
            .select(`
              id,
              email,
              name,
              phone,
              role,
              designation,
              password_hash,
              is_active,
              address,
              city,
              state,
              pincode,
              date_of_birth,
              gender,
              occupation,
              employee_id,
              department,
              profile_photo_url,
              territory_state,
              territory_district,
              territory_area,
              parent_employee_id,
              created_at,
              wallets (
                id,
                balance
              )
            `);
          
          if (isPhone) {
            query = query.eq('phone', credentials.email);
          } else {
            query = query.eq('email', credentials.email);
          }
          
          // Add role filter
          query = query.eq('role', credentials.role.toUpperCase());
          
          const { data: users, error } = await query;

          if (error) {
            console.error('Database query error:', error);
            throw new Error(`Database error: ${error.message}`);
          }

          if (!users || users.length === 0) {
            console.error('No user found with provided credentials');
            throw new Error('User not found');
          }

          // If multiple users found (shouldn't happen but handle it), take the first one
          const user = users[0];

          if (error) {
            throw new Error(`Database error: ${error.message}`);
          }

          if (!user) {
            throw new Error('User not found');
          }

          // Check if user is active
          if (!user.is_active) {
            throw new Error('User account is not active');
          }

          // Check if role matches (case insensitive)
          const userRole = user.role?.toUpperCase();
          const credentialsRole = credentials.role?.toUpperCase();

          if (userRole !== credentialsRole) {
            throw new Error(`Role mismatch. Expected ${credentialsRole}, got ${userRole}`);
          }

          // Verify password - NEVER LOG PASSWORDS OR VALIDATION RESULTS IN PRODUCTION
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password_hash);

          if (!isPasswordValid) {
            throw new Error('Invalid password');
          }

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            designation: user.designation,
            phone: user.phone,
            address: user.address,
            city: user.city,
            state: user.state,
            pincode: user.pincode,
            dateOfBirth: user.date_of_birth,
            gender: user.gender,
            occupation: user.occupation,
            employeeId: user.employee_id,
            department: user.department,
            territoryState: user.territory_state,
            territoryDistrict: user.territory_district,
            territoryArea: user.territory_area,
            parentEmployeeId: user.parent_employee_id,
            wallet: user.wallets?.[0] || null,
            createdAt: user.created_at,
            isActive: user.is_active,
            profile_photo_url: user.profile_photo_url
          };
        } catch (error) {
          // Return null to trigger CredentialsSignin error
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const userData = user as any;
        token.role = userData.role;
        token.designation = userData.designation;
        token.phone = userData.phone;
        token.address = userData.address;
        token.city = userData.city;
        token.state = userData.state;
        token.pincode = userData.pincode;
        token.dateOfBirth = userData.dateOfBirth;
        token.gender = userData.gender;
        token.occupation = userData.occupation;
        token.employeeId = userData.employeeId;
        token.department = userData.department;
        token.territoryState = userData.territoryState;
        token.territoryDistrict = userData.territoryDistrict;
        token.territoryArea = userData.territoryArea;
        token.parentEmployeeId = userData.parentEmployeeId;
        token.wallet = userData.wallet;
        token.createdAt = userData.createdAt;
        token.isActive = userData.isActive;
        token.profile_photo_url = userData.profile_photo_url;
      }
      
      // Handle token updates (e.g., profile photo changes)
      if (trigger === 'update' && session) {
        if (session.profile_photo_url !== undefined) {
          token.profile_photo_url = session.profile_photo_url;
        }
      }
      
      return token;
    },
    async session({ session, token, trigger, newSession }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as UserRole;
        (session.user as any).designation = token.designation as string;
        session.user.phone = token.phone as string;
        session.user.address = token.address as string;
        session.user.city = token.city as string;
        session.user.state = token.state as string;
        session.user.pincode = token.pincode as string;
        session.user.dateOfBirth = token.dateOfBirth as string;
        session.user.gender = token.gender as string;
        session.user.occupation = token.occupation as string;
        session.user.employeeId = token.employeeId as string;
        session.user.department = token.department as string;
        (session.user as any).territoryState = token.territoryState as string;
        (session.user as any).territoryDistrict = token.territoryDistrict as string;
        (session.user as any).territoryArea = token.territoryArea as string;
        (session.user as any).parentEmployeeId = token.parentEmployeeId as string;
        session.user.wallet = token.wallet as any;
        session.user.createdAt = token.createdAt as string;
        session.user.isActive = token.isActive as boolean;
        (session.user as any).profile_photo_url = token.profile_photo_url as string;
      }
      
      // Handle session updates (e.g., profile photo changes)
      if (trigger === 'update' && newSession) {
        if (newSession.profile_photo_url !== undefined) {
          (session.user as any).profile_photo_url = newSession.profile_photo_url;
        }
      }
      
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
