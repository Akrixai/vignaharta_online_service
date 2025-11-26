'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, Lock } from 'lucide-react';
import Link from 'next/link';

export default function SharedServicePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;
  
  const [loading, setLoading] = useState(true);
  const [service, setService] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (token) {
      fetchService();
    }
  }, [token]);

  useEffect(() => {
    if (service && session?.user) {
      checkAccessAndRedirect();
    }
  }, [service, session]);

  const fetchService = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/public/service/${token}`);
      const data = await response.json();
      
      if (data.success) {
        setService(data.data);
      } else {
        setError(data.error || 'Service not found');
      }
    } catch (err) {
      console.error('Error fetching service:', err);
      setError('Failed to load service');
    } finally {
      setLoading(false);
    }
  };

  const checkAccessAndRedirect = () => {
    if (!service || !session?.user) return;

    const userRole = session.user.role;
    const showToCustomer = service.show_to_customer;
    
    // Debug logging
    console.log('=== Access Check Debug ===');
    console.log('Service:', service.name);
    console.log('show_to_customer value:', showToCustomer);
    console.log('show_to_customer type:', typeof showToCustomer);
    console.log('User role:', userRole);
    
    const isCustomerService = showToCustomer === true;
    const isRetailerService = showToCustomer === false || showToCustomer === null || showToCustomer === undefined;
    
    console.log('isCustomerService:', isCustomerService);
    console.log('isRetailerService:', isRetailerService);
    console.log('========================');

    // Admin can access everything
    if (userRole === 'ADMIN') {
      setShowForm(true);
      return;
    }

    // Check if user role matches service type
    if (isCustomerService && userRole === 'CUSTOMER') {
      // Customer accessing customer service - OK
      setShowForm(true);
    } else if (isRetailerService && (userRole === 'RETAILER' || userRole === 'EMPLOYEE')) {
      // Retailer/Employee accessing retailer service - OK
      setShowForm(true);
    } else {
      // Role mismatch
      const serviceType = isCustomerService ? 'customers' : 'retailers/employees';
      setError(`This service is for ${serviceType} only. Your account type: ${userRole}. Debug: show_to_customer=${showToCustomer}`);
    }
  };

  // Redirect to application page if authorized
  useEffect(() => {
    if (showForm && service && session?.user) {
      // Redirect to the appropriate services page with the service pre-selected
      const targetPath = session.user.role === 'CUSTOMER' 
        ? `/dashboard/services?service=${service.id}`
        : `/dashboard/services?service=${service.id}`;
      
      router.push(targetPath);
    }
  }, [showForm, service, session, router]);

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-red-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading service...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-red-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader className="bg-red-50">
            <CardTitle className="flex items-center text-red-900">
              <AlertCircle className="w-6 h-6 mr-2" />
              Access Error
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-gray-700 mb-4">{error}</p>
            <div className="flex gap-2">
              <Button
                onClick={() => router.push('/login')}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                Go to Login
              </Button>
              <Button
                onClick={() => router.push('/')}
                variant="outline"
                className="flex-1"
              >
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-red-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
            <CardTitle className="flex items-center text-indigo-900">
              <Lock className="w-6 h-6 mr-2" />
              Login Required
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {service && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">{service.name}</h3>
                <p className="text-sm text-blue-700">{service.description}</p>
                <p className="text-lg font-bold text-blue-900 mt-2">₹{service.price}</p>
              </div>
            )}
            
            <p className="text-gray-700 mb-4">
              Please login to access this service application form.
            </p>
            
            <Link href={`/login?redirect=/share/service/${token}`}>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                Login to Continue
              </Button>
            </Link>
            
            <p className="text-sm text-gray-600 text-center mt-4">
              Don't have an account?{' '}
              <Link href="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">
                Register here
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-red-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-gray-600">Redirecting to application form...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
