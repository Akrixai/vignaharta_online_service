// KWIKAPI Integration Library
// Handles all recharge and bill payment operations
// Based on KWIKAPI v2 API Documentation

import axios, { AxiosInstance } from 'axios';

const KWIKAPI_BASE_URL = process.env.KWIKAPI_BASE_URL || 'https://www.kwikapi.com';
const KWIKAPI_API_KEY = process.env.KWIKAPI_API_KEY || '';

interface KwikAPIResponse<T = any> {
  success?: boolean;
  status?: string;
  STATUS?: string;
  message?: string;
  response?: T;
  [key: string]: any;
}

class KwikAPIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: KWIKAPI_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  }

  private generateOrderId(): string {
    // Generate 1-14 digit unique order ID
    return `${Date.now()}${Math.floor(Math.random() * 1000)}`.substring(0, 14);
  }

  // ==================== MASTER DATA APIs ====================

  /**
   * Get Circle Codes (for mobile/DTH)
   * GET /api/v2/circle_codes.php
   */
  async getCircleCodes(): Promise<KwikAPIResponse> {
    try {
      const response = await this.client.get('/api/v2/circle_codes.php', {
        params: { api_key: KWIKAPI_API_KEY },
      });
      return {
        success: true,
        data: response.data.response || [],
      };
    } catch (error: any) {
      console.error('KWIKAPI Circle Codes Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get Biller/Operator Details
   * POST /api/v2/operatorFetch.php
   */
  async getOperatorDetails(opid: number): Promise<KwikAPIResponse> {
    try {
      const formData = new URLSearchParams();
      formData.append('api_key', KWIKAPI_API_KEY);
      formData.append('opid', opid.toString());

      const response = await this.client.post('/api/v2/operatorFetch.php', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      return {
        success: response.data.success || response.data.STATUS === 'SUCCESS',
        data: response.data,
      };
    } catch (error: any) {
      console.error('KWIKAPI Operator Details Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // ==================== BILL FETCH APIs ====================

  /**
   * Bill Validation (for postpaid, DTH, electricity, etc.)
   * GET /api/v2/bills/validation.php
   * Use only when bill_fetch = "YES" for the operator
   * This is the correct endpoint according to KwikAPI documentation
   */
  async fetchBillValidation(params: {
    number: string;
    amount: string;
    opid: number;
    order_id?: string;
    mobile: string;
    opt1?: string;
    opt2?: string;
    opt3?: string;
    opt4?: string;
    opt5?: string;
    opt6?: string;
    opt7?: string;
    opt8?: string;
    opt9?: string;
    opt10?: string;
  }): Promise<KwikAPIResponse> {
    try {
      console.log('📋 [KWIKAPI] Bill Validation Request for:', {
        operator_id: params.opid,
        account_number: params.number,
        mobile: params.mobile
      });

      const queryParams: any = {
        api_key: KWIKAPI_API_KEY,
        number: params.number,
        amount: params.amount || '10',
        opid: params.opid.toString(),
        order_id: params.order_id || this.generateOrderId(),
        opt8: params.opt8 || 'Bills', // Required literal - CRITICAL!
        mobile: params.mobile,
      };

      // Add optional parameters only if they have values
      if (params.opt1) queryParams.opt1 = params.opt1;
      if (params.opt2) queryParams.opt2 = params.opt2;
      if (params.opt3) queryParams.opt3 = params.opt3;
      if (params.opt4) queryParams.opt4 = params.opt4;
      if (params.opt5) queryParams.opt5 = params.opt5;
      if (params.opt6) queryParams.opt6 = params.opt6;
      if (params.opt7) queryParams.opt7 = params.opt7;
      if (params.opt9) queryParams.opt9 = params.opt9;
      if (params.opt10) queryParams.opt10 = params.opt10;

      console.log('📡 [KWIKAPI] Bill Validation API Call:', {
        url: '/api/v2/bills/validation.php',
        params: { ...queryParams, api_key: '***' }, // Hide API key in logs
        baseURL: KWIKAPI_BASE_URL
      });

      const response = await this.client.get('/api/v2/bills/validation.php', {
        params: queryParams,
        timeout: 30000, // 30 second timeout for bill validation
      });

      console.log('📦 [KWIKAPI] Bill Validation Response:', response.data);

      // Check if the response indicates success
      const isSuccess = response.data.status === 'SUCCESS' || response.data.STATUS === 'SUCCESS';
      
      if (isSuccess) {
        console.log('✅ [KWIKAPI] Bill validation successful:', {
          customer_name: response.data.customer_name || response.data.customername,
          due_amount: response.data.due_amount || response.data.dueamount,
          bill_number: response.data.bill_number || response.data.billnumber
        });
      } else {
        console.warn('⚠️ [KWIKAPI] Bill validation failed:', {
          status: response.data.status || response.data.STATUS,
          message: response.data.message || response.data.MESSAGE
        });
      }

      return {
        success: isSuccess,
        data: response.data,
        message: response.data.message || response.data.MESSAGE,
      };
    } catch (error: any) {
      console.error('❌ [KWIKAPI] Bill Validation Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        code: error.code
      });

      // Provide more specific error messages
      let errorMessage = 'Failed to validate bill details';
      
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        errorMessage = 'Network connection failed. Please check your internet connection and try again.';
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = 'Request timed out. Please try again.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Invalid API key. Please check KWIKAPI configuration.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. Please check KWIKAPI permissions.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'KWIKAPI server error. Please try again later.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      return {
        success: false,
        data: error.response?.data || {},
        message: errorMessage,
        debug_info: {
          error_code: error.code,
          status: error.response?.status,
          url: error.config?.url,
          baseURL: error.config?.baseURL
        }
      };
    }
  }

  /**
   * Bill Fetch v2 (for postpaid, DTH, electricity, etc.)
   * GET /api/v2/bills/validation.php
   * Use only when bill_fetch = "YES" for the operator
   * @deprecated Use fetchBillValidation instead
   */
  async fetchBill(params: {
    number: string;
    amount: string;
    opid: number;
    order_id?: string;
    mobile: string;
    opt1?: string;
    opt2?: string;
    opt3?: string;
    opt4?: string;
    opt5?: string;
    opt6?: string;
    opt7?: string;
    opt8?: string;
    opt9?: string;
    opt10?: string;
  }): Promise<KwikAPIResponse> {
    try {
      console.log('📋 [KWIKAPI] Bill Fetch Request for:', {
        operator_id: params.opid,
        account_number: params.number,
        mobile: params.mobile
      });

      const queryParams: any = {
        api_key: KWIKAPI_API_KEY,
        number: params.number,
        amount: params.amount || '10',
        opid: params.opid.toString(),
        order_id: params.order_id || this.generateOrderId(),
        opt8: params.opt8 || 'Bills', // Required literal - CRITICAL!
        mobile: params.mobile,
      };

      // Add optional parameters only if they have values
      if (params.opt1) queryParams.opt1 = params.opt1;
      if (params.opt2) queryParams.opt2 = params.opt2;
      if (params.opt3) queryParams.opt3 = params.opt3;
      if (params.opt4) queryParams.opt4 = params.opt4;
      if (params.opt5) queryParams.opt5 = params.opt5;
      if (params.opt6) queryParams.opt6 = params.opt6;
      if (params.opt7) queryParams.opt7 = params.opt7;
      if (params.opt9) queryParams.opt9 = params.opt9;
      if (params.opt10) queryParams.opt10 = params.opt10;

      console.log('📡 [KWIKAPI] Bill Fetch API Call:', {
        url: '/api/v2/bills/validation.php',
        params: { ...queryParams, api_key: '***' }, // Hide API key in logs
        baseURL: KWIKAPI_BASE_URL
      });

      const response = await this.client.get('/api/v2/bills/validation.php', {
        params: queryParams,
        timeout: 30000, // 30 second timeout for bill fetch
      });

      console.log('📦 [KWIKAPI] Bill Fetch Response:', response.data);

      // Check if the response indicates success
      const isSuccess = response.data.status === 'SUCCESS' || response.data.STATUS === 'SUCCESS';
      
      if (isSuccess) {
        console.log('✅ [KWIKAPI] Bill fetch successful:', {
          customer_name: response.data.customer_name || response.data.customername,
          due_amount: response.data.due_amount || response.data.dueamount,
          bill_number: response.data.bill_number || response.data.billnumber
        });
      } else {
        console.warn('⚠️ [KWIKAPI] Bill fetch failed:', {
          status: response.data.status || response.data.STATUS,
          message: response.data.message || response.data.MESSAGE
        });
      }

      return {
        success: isSuccess,
        data: response.data,
        message: response.data.message || response.data.MESSAGE,
      };
    } catch (error: any) {
      console.error('❌ [KWIKAPI] Bill Fetch Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        code: error.code
      });

      // Provide more specific error messages
      let errorMessage = 'Failed to fetch bill details';
      
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        errorMessage = 'Network connection failed. Please check your internet connection and try again.';
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = 'Request timed out. Please try again.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Invalid API key. Please check KWIKAPI configuration.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. Please check KWIKAPI permissions.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'KWIKAPI server error. Please try again later.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      return {
        success: false,
        data: error.response?.data || {},
        message: errorMessage,
        debug_info: {
          error_code: error.code,
          status: error.response?.status,
          url: error.config?.url,
          baseURL: error.config?.baseURL
        }
      };
    }
  }

  // ==================== WALLET APIs ====================

  /**
   * Wallet Balance Fetch
   * GET /api/v2/balance.php
   */
  async getWalletBalance(): Promise<KwikAPIResponse> {
    try {
      const response = await this.client.get('/api/v2/balance.php', {
        params: { api_key: KWIKAPI_API_KEY },
      });
      return {
        success: true,
        data: response.data.response || response.data,
      };
    } catch (error: any) {
      console.error('KWIKAPI Wallet Balance Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Transaction Status Fetch
   * GET /api/v2/status.php (or similar endpoint from collection)
   */
  async getTransactionStatus(order_id: string): Promise<KwikAPIResponse> {
    try {
      const response = await this.client.get('/api/v2/status.php', {
        params: {
          api_key: KWIKAPI_API_KEY,
          order_id: order_id,
        },
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('KWIKAPI Transaction Status Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Last 100 Transactions Fetch
   * POST /api/v2/transactions.php (or similar endpoint)
   */
  async getTransactions(filters?: {
    from_date?: string;
    to_date?: string;
    service_type?: string;
  }): Promise<KwikAPIResponse> {
    try {
      const formData = new URLSearchParams();
      formData.append('api_key', KWIKAPI_API_KEY);

      if (filters?.from_date) formData.append('from_date', filters.from_date);
      if (filters?.to_date) formData.append('to_date', filters.to_date);
      if (filters?.service_type) formData.append('service_type', filters.service_type);

      const response = await this.client.post('/api/v2/transactions.php', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('KWIKAPI Transactions Fetch Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // ==================== PAYMENT APIs ====================

  /**
   * Prepaid/DTH Recharge
   * GET /api/v2/recharge.php
   * According to KwikAPI documentation
   */
  async rechargePrepaid(params: {
    opid: number;
    number: string;
    amount: number;
    state_code?: string; // Circle code for prepaid
    order_id?: string;
    mobile?: string;
  }): Promise<KwikAPIResponse> {
    try {
      console.log('📱 [KWIKAPI] Prepaid Recharge Request:', {
        operator_id: params.opid,
        number: params.number,
        amount: params.amount,
        state_code: params.state_code
      });

      const queryParams: any = {
        api_key: KWIKAPI_API_KEY,
        opid: params.opid.toString(),
        number: params.number,
        amount: params.amount.toString(),
        state_code: params.state_code || '0', // Default state code
        order_id: params.order_id || this.generateOrderId(),
      };

      console.log('📡 [KWIKAPI] Prepaid Recharge API Call:', {
        url: '/api/v2/recharge.php',
        params: { ...queryParams, api_key: '***' }, // Hide API key in logs
        baseURL: KWIKAPI_BASE_URL
      });

      const response = await this.client.get('/api/v2/recharge.php', {
        params: queryParams,
        timeout: 45000, // 45 second timeout for recharge
      });

      console.log('📦 [KWIKAPI] Prepaid Recharge Response:', response.data);

      const isSuccess = response.data.status === 'SUCCESS' || response.data.STATUS === 'SUCCESS';
      
      if (isSuccess) {
        console.log('✅ [KWIKAPI] Prepaid recharge successful:', {
          order_id: response.data.order_id,
          operator_ref: response.data.opr_id || response.data.operator_ref,
          amount: response.data.amount,
          balance: response.data.balance
        });
      } else {
        console.warn('⚠️ [KWIKAPI] Prepaid recharge failed:', {
          status: response.data.status || response.data.STATUS,
          message: response.data.message || response.data.MESSAGE
        });
      }

      return {
        success: isSuccess,
        data: response.data,
        message: response.data.message || response.data.MESSAGE,
      };
    } catch (error: any) {
      console.error('❌ [KWIKAPI] Prepaid Recharge Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        code: error.code
      });

      // Provide more specific error messages
      let errorMessage = 'Failed to process prepaid recharge';
      
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        errorMessage = 'Network connection failed. Please check your internet connection and try again.';
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = 'Recharge request timed out. Please try again.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Invalid API key. Please check KWIKAPI configuration.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. Please check KWIKAPI permissions.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'KWIKAPI server error. Please try again later.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      return {
        success: false,
        data: error.response?.data || {},
        message: errorMessage,
        debug_info: {
          error_code: error.code,
          status: error.response?.status,
          url: error.config?.url,
          baseURL: error.config?.baseURL
        }
      };
    }
  }

  /**
   * DTH Recharge
   * Similar to prepaid but for DTH services
   */
  async rechargeDTH(params: {
    opid: number;
    number: string;
    amount: number;
    order_id?: string;
    mobile: string;
    opt1?: string;
    opt2?: string;
    opt3?: string;
    opt4?: string;
    opt5?: string;
    opt6?: string;
    opt7?: string;
    opt8?: string;
    opt9?: string;
    opt10?: string;
  }): Promise<KwikAPIResponse> {
    try {
      const queryParams = {
        api_key: KWIKAPI_API_KEY,
        opid: params.opid.toString(),
        number: params.number,
        amount: params.amount.toString(),
        order_id: params.order_id || this.generateOrderId(),
        mobile: params.mobile,
        ...(params.opt1 && { opt1: params.opt1 }),
        ...(params.opt2 && { opt2: params.opt2 }),
        ...(params.opt3 && { opt3: params.opt3 }),
        ...(params.opt4 && { opt4: params.opt4 }),
        ...(params.opt5 && { opt5: params.opt5 }),
        ...(params.opt6 && { opt6: params.opt7 }),
        ...(params.opt7 && { opt7: params.opt7 }),
        ...(params.opt8 && { opt8: params.opt8 }),
        ...(params.opt9 && { opt9: params.opt9 }),
        ...(params.opt10 && { opt10: params.opt10 }),
      };

      const response = await this.client.get('/api/v2/recharge.php', {
        params: queryParams,
      });

      return {
        success: response.data.status === 'SUCCESS' || response.data.STATUS === 'SUCCESS',
        data: response.data,
      };
    } catch (error: any) {
      console.error('KWIKAPI DTH Recharge Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Utility Bill Payments (Electricity, Gas, Water, Postpaid)
   * GET /api/v2/bills/payments.php
   * According to KwikAPI documentation
   */
  async payUtilityBill(params: {
    opid: number;
    number: string;
    amount: number;
    order_id?: string;
    refrence_id?: string; // From bill fetch response - CRITICAL for BBPS payments (note: typo in KWIKAPI)
    mobile: string;
    opt1?: string;
    opt2?: string;
    opt3?: string;
    opt4?: string;
    opt5?: string;
    opt6?: string;
    opt7?: string;
    opt8?: string;
    opt9?: string;
    opt10?: string;
  }): Promise<KwikAPIResponse> {
    try {
      console.log('💳 [KWIKAPI] Utility Bill Payment Request:', {
        operator_id: params.opid,
        account_number: params.number,
        amount: params.amount,
        refrence_id: params.refrence_id,
        mobile: params.mobile
      });

      const queryParams: any = {
        api_key: KWIKAPI_API_KEY,
        number: params.number,
        amount: params.amount.toString(),
        opid: params.opid.toString(),
        order_id: params.order_id || this.generateOrderId(),
        opt8: params.opt8 || 'Bills', // Required literal for utility payments
        mobile: params.mobile,
      };

      // Add refrence_id if provided (critical for BBPS payments)
      // Note: KWIKAPI uses "refrence_id" (typo in their API)
      if (params.refrence_id) {
        queryParams.refrence_id = params.refrence_id;
      }

      // Add optional parameters only if they have values
      if (params.opt1) queryParams.opt1 = params.opt1;
      if (params.opt2) queryParams.opt2 = params.opt2;
      if (params.opt3) queryParams.opt3 = params.opt3;
      if (params.opt4) queryParams.opt4 = params.opt4;
      if (params.opt5) queryParams.opt5 = params.opt5;
      if (params.opt6) queryParams.opt6 = params.opt6;
      if (params.opt7) queryParams.opt7 = params.opt7;
      if (params.opt9) queryParams.opt9 = params.opt9;
      if (params.opt10) queryParams.opt10 = params.opt10;

      console.log('📡 [KWIKAPI] Utility Payment API Call:', {
        url: '/api/v2/bills/payments.php',
        params: { ...queryParams, api_key: '***' }, // Hide API key in logs
        baseURL: KWIKAPI_BASE_URL
      });

      const response = await this.client.get('/api/v2/bills/payments.php', {
        params: queryParams,
        timeout: 45000, // 45 second timeout for utility payments
      });

      console.log('📦 [KWIKAPI] Utility Payment Response:', response.data);

      const isSuccess = response.data.status === 'SUCCESS' || response.data.STATUS === 'SUCCESS';
      
      if (isSuccess) {
        console.log('✅ [KWIKAPI] Utility payment successful:', {
          order_id: response.data.order_id,
          operator_ref: response.data.opr_id || response.data.operator_ref,
          amount: response.data.amount,
          balance: response.data.balance
        });
      } else {
        console.warn('⚠️ [KWIKAPI] Utility payment failed:', {
          status: response.data.status || response.data.STATUS,
          message: response.data.message || response.data.MESSAGE
        });
      }

      return {
        success: isSuccess,
        data: response.data,
        message: response.data.message || response.data.MESSAGE,
      };
    } catch (error: any) {
      console.error('❌ [KWIKAPI] Utility Payment Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        code: error.code
      });

      // Provide more specific error messages
      let errorMessage = 'Failed to process utility bill payment';
      
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        errorMessage = 'Network connection failed. Please check your internet connection and try again.';
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = 'Payment request timed out. Please try again.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Invalid API key. Please check KWIKAPI configuration.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. Please check KWIKAPI permissions.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'KWIKAPI server error. Please try again later.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      return {
        success: false,
        data: error.response?.data || {},
        message: errorMessage,
        debug_info: {
          error_code: error.code,
          status: error.response?.status,
          url: error.config?.url,
          baseURL: error.config?.baseURL
        }
      };
    }
  }

  /**
   * Postpaid Recharge (Use utility payment API for postpaid mobile)
   */
  async rechargePostpaid(params: {
    opid: number;
    number: string;
    amount: number;
    order_id?: string;
    mobile: string;
    ref_id?: string;
  }): Promise<KwikAPIResponse> {
    console.log('📱 [KWIKAPI] Processing postpaid mobile payment:', {
      opid: params.opid,
      number: params.number,
      amount: params.amount,
      ref_id: params.ref_id
    });

    // Use utility payment for postpaid mobile (no circle required)
    return this.payUtilityBill({
      opid: params.opid,
      number: params.number,
      amount: params.amount,
      order_id: params.order_id,
      mobile: params.mobile,
      ref_id: params.ref_id,
    });
  }

  /**
   * Electricity Bill Payment (wrapper for utility payment)
   */
  async payElectricityBill(params: {
    opid: number;
    consumer_number: string;
    amount: number;
    order_id?: string;
    ref_id?: string;
    mobile: string;
    circle?: string;
    opt1?: string;
    opt2?: string;
    opt3?: string;
  }): Promise<KwikAPIResponse> {
    return this.payUtilityBill({
      opid: params.opid,
      number: params.consumer_number,
      amount: params.amount,
      order_id: params.order_id,
      ref_id: params.ref_id,
      mobile: params.mobile,
      opt1: params.opt1 || params.circle,
      opt2: params.opt2,
      opt3: params.opt3,
    });
  }

  // ==================== PLANS APIs ====================

  /**
   * Fetch Prepaid/DTH Plans
   * POST /api/v2/recharge_plans.php
   */
  async fetchRechargePlans(params: {
    opid: number;
    state_code?: string; // Circle code for prepaid
  }): Promise<KwikAPIResponse> {
    try {
      const formData = new URLSearchParams();
      formData.append('api_key', KWIKAPI_API_KEY);
      formData.append('opid', params.opid.toString());

      if (params.state_code) {
        formData.append('state_code', params.state_code);
      }

      const response = await this.client.post('/api/v2/recharge_plans.php', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      console.log('KWIKAPI Plans Response:', JSON.stringify(response.data, null, 2));

      if (response.data.success) {
        // Parse plans from response
        const allPlans: any[] = [];
        const plansData = response.data.plans || {};

        // Iterate through all plan categories
        Object.keys(plansData).forEach((category) => {
          const categoryPlans = plansData[category];
          if (Array.isArray(categoryPlans)) {
            categoryPlans.forEach((plan: any) => {
              allPlans.push({
                plan_id: `${category}_${plan.rs}`,
                amount: parseFloat(plan.rs),
                validity: plan.validity || 'N/A',
                description: plan.desc || '',
                plan_type: plan.Type || category,
                category: category,
                data: plan.desc?.match(/(\d+\.?\d*\s*(GB|MB))/i)?.[0] || '',
                voice: plan.desc?.match(/(\d+\s*minutes)/i)?.[0] || '',
                sms: plan.desc?.match(/(\d+\s*SMS)/i)?.[0] || '',
              });
            });
          }
        });

        return {
          success: true,
          data: {
            operator: response.data.operator,
            circle: response.data.circle,
            message: response.data.message,
            plans: allPlans,
          },
        };
      }

      console.error('KWIKAPI Plans API returned success:false', response.data);
      return {
        success: false,
        data: { plans: [] },
        message: response.data.message || 'Failed to fetch plans',
      };
    } catch (error: any) {
      console.error('Fetch Recharge Plans Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      return {
        success: false,
        data: { plans: [] },
        message: error.response?.data?.message || error.message || 'Failed to fetch recharge plans',
      };
    }
  }

  /**
   * Fetch Prepaid Plans (wrapper)
   */
  async fetchPrepaidPlans(params: {
    opid: number;
    circle_code: string;
  }): Promise<KwikAPIResponse> {
    return this.fetchRechargePlans({
      opid: params.opid,
      state_code: params.circle_code,
    });
  }

  /**
   * Fetch DTH Plans using dedicated DTH_plans.php endpoint
   * POST /api/v2/DTH_plans.php
   * Required: api_key, opid
   */
  async fetchDTHPlans(params: {
    opid: number;
  }): Promise<KwikAPIResponse> {
    try {
      console.log('📺 [KWIKAPI] Fetching DTH plans for opid:', params.opid);

      const formData = new URLSearchParams();
      formData.append('api_key', KWIKAPI_API_KEY);
      formData.append('opid', params.opid.toString());

      const response = await fetch(`${KWIKAPI_BASE_URL}/DTH_plans.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const data = await response.json();
      console.log('📺 [KWIKAPI] DTH Plans Response:', data);

      return data;
    } catch (error: any) {
      console.error('❌ [KWIKAPI] DTH Plans Error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch DTH plans',
      };
    }
  }

  /**
   * Detect Operator from Mobile Number using KWIKAPI's Real-Time API
   * Uses operator_fetch_v2.php which supports MNP and circle changes
   */
  async detectOperator(mobile_number: string): Promise<KwikAPIResponse> {
    try {
      console.log('🔍 [KWIKAPI] Detecting operator for:', mobile_number);
      console.log('🔑 [KWIKAPI] API Key configured:', KWIKAPI_API_KEY ? `${KWIKAPI_API_KEY.substring(0, 6)}...` : 'NOT SET');

      if (!KWIKAPI_API_KEY) {
        console.error('❌ [KWIKAPI] API Key is not configured!');
        return {
          success: false,
          data: null,
          message: 'KWIKAPI API Key is not configured. Please check your .env file.',
        };
      }

      // Call KWIKAPI's operator_fetch_v2.php API
      const formData = new URLSearchParams();
      formData.append('api_key', KWIKAPI_API_KEY);
      formData.append('number', mobile_number);

      console.log('📡 [KWIKAPI] Calling operator_fetch_v2.php with number:', mobile_number);

      const response = await this.client.post('/api/v2/operator_fetch_v2.php', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      console.log('📦 [KWIKAPI] Full API Response:', JSON.stringify(response.data, null, 2));

      // Check if API returned success
      if (!response.data.success) {
        console.error('❌ [KWIKAPI] API returned success: false', response.data);
        return {
          success: false,
          data: null,
          message: response.data.message || 'KWIKAPI API returned an error',
        };
      }

      // Check if details exist
      if (!response.data.details) {
        console.error('❌ [KWIKAPI] No details in response:', response.data);
        return {
          success: false,
          data: null,
          message: 'No operator details found in KWIKAPI response',
        };
      }

      const details = response.data.details;
      console.log('🔍 [KWIKAPI] Details object:', JSON.stringify(details, null, 2));

      // Extract operator and circle (handle both old and new formats)
      // KWIKAPI v2 format: operator, Circle (most common)
      // Alternative formats: provider, opid, circle_code, circle_name
      const operatorName = details.operator || details.provider || details.Operator || '';
      const circleName = details.Circle || details.circle_name || details.circle || '';
      const kwikapi_opid = details.opid ? parseInt(details.opid) : null;
      const circleCodeFromAPI = details.circle_code || '';

      console.log('🏷️ [KWIKAPI] Extracted values:', {
        operatorName,
        circleName,
        kwikapi_opid,
        circleCodeFromAPI,
        allDetailsKeys: Object.keys(details)
      });

      if (!operatorName || !circleName) {
        console.error('❌ [KWIKAPI] Missing operator or circle in details:', details);
        return {
          success: false,
          data: null,
          message: `Missing data - Operator: ${operatorName || 'N/A'}, Circle: ${circleName || 'N/A'}`,
        };
      }

      // Map KWIKAPI operator names to our operator codes and database identifiers
      const operatorMapping: Record<string, { code: string; name: string; opid: number; db_operator_code: string }> = {
        'JIO': { code: 'JIO', name: 'Jio Prepaid', opid: 8, db_operator_code: 'JIO_OFFICIAL_181' },
        'RELIANCE JIO': { code: 'JIO', name: 'Jio Prepaid', opid: 8, db_operator_code: 'JIO_OFFICIAL_181' },
        'AIRTEL': { code: 'AIRTEL', name: 'Airtel Prepaid', opid: 1, db_operator_code: 'AIRTEL_OFFICIAL_177' },
        'IDEA': { code: 'VI', name: 'VI Prepaid', opid: 3, db_operator_code: 'VI_OFFICIAL_178' },
        'VODAFONE': { code: 'VI', name: 'VI Prepaid', opid: 3, db_operator_code: 'VI_OFFICIAL_178' },
        'VI': { code: 'VI', name: 'VI Prepaid', opid: 3, db_operator_code: 'VI_OFFICIAL_178' },
        'BSNL': { code: 'BSNL', name: 'BSNL', opid: 4, db_operator_code: 'BSNL' },
        'MTNL': { code: 'MTNL', name: 'MTNL', opid: 14, db_operator_code: 'MTNL' },
      };

      // Map circle names to circle codes (handle both formats)
      const circleMapping: Record<string, string> = {
        'Maharashtra': '4',
        'Maharashtra and Goa': '4',
        'Maharashtra (MH)': '4',
        'Delhi': '1',
        'Delhi NCR': '1',
        'Delhi (DL)': '1',
        'Mumbai': '2',
        'Mumbai (MUM)': '2',
        'Kolkata': '3',
        'Kolkata (KOL)': '3',
        'Tamil Nadu': '5',
        'Tamil Nadu (TN)': '5',
        'Karnataka': '6',
        'Karnataka (KA)': '6',
        'Andhra Pradesh': '7',
        'Andhra Pradesh (AP)': '7',
        'Kerala': '8',
        'Kerala (KL)': '8',
        'Punjab': '9',
        'Punjab (PB)': '9',
        'Haryana': '10',
        'Haryana (HR)': '10',
        'Uttar Pradesh (East)': '11',
        'Uttar Pradesh East (UP-E)': '11',
        'Uttar Pradesh (West)': '12',
        'Uttar Pradesh West (UP-W)': '12',
        'Rajasthan': '13',
        'Rajasthan (RJ)': '13',
        'Gujarat': '14',
        'Gujarat (GJ)': '14',
        'Madhya Pradesh': '15',
        'Madhya Pradesh (MP)': '15',
        'West Bengal': '16',
        'West Bengal (WB)': '16',
        'Bihar': '17',
        'Bihar (BR)': '17',
        'Bihar and Jharkhand': '17',
        'Orissa': '18',
        'Orissa (OR)': '18',
        'Assam': '19',
        'Assam (AS)': '19',
        'North East': '20',
        'North East (NE)': '20',
        'Himachal Pradesh': '21',
        'Himachal Pradesh (HP)': '21',
        'Jammu and Kashmir': '22',
        'Jammu and Kashmir (JK)': '22',
        'Chennai': '23',
        'Chennai (CHE)': '23',
      };

      const operatorUpper = operatorName.toUpperCase().trim();

      // Find operator by name mapping (this is the primary method since KWIKAPI doesn't return opid)
      let operatorInfo = operatorMapping[operatorUpper];

      if (!operatorInfo) {
        // Try partial matching for variations
        for (const [key, value] of Object.entries(operatorMapping)) {
          if (operatorUpper.includes(key) || key.includes(operatorUpper)) {
            operatorInfo = value;
            console.log(`✅ [KWIKAPI] Found operator by partial match: ${operatorUpper} -> ${key}`);
            break;
          }
        }
      }

      if (!operatorInfo) {
        // Fallback - create a generic entry
        console.warn(`⚠️ [KWIKAPI] Unknown operator: ${operatorUpper}, using fallback`);
        operatorInfo = {
          code: operatorUpper,
          name: operatorName,
          opid: 1, // Default to Airtel opid
          db_operator_code: operatorUpper
        };
      }

      // Find circle code - use API circle_code if available, otherwise map from name
      let circleCode = circleCodeFromAPI || '4'; // Default to Maharashtra
      const circleNameTrimmed = circleName.trim();

      // If no circle_code from API, try to map from circle name
      if (!circleCodeFromAPI) {
        for (const [circleName_key, code] of Object.entries(circleMapping)) {
          if (circleNameTrimmed.toLowerCase().includes(circleName_key.toLowerCase())) {
            circleCode = code;
            break;
          }
        }
      }

      console.log('✅ [KWIKAPI] Real-time operator detected successfully:', {
        mobile_number,
        operator: operatorInfo.name,
        operatorCode: operatorInfo.code,
        kwikapi_opid: operatorInfo.opid,
        db_operator_code: operatorInfo.db_operator_code,
        circle: circleNameTrimmed,
        circleCode,
        credit_balance: response.data.credit_balance,
        source: 'KWIKAPI Real-Time API'
      });

      return {
        success: true,
        data: {
          mobile_number,
          operator_code: operatorInfo.db_operator_code, // Use the database operator code for matching
          operator_name: operatorInfo.name,
          kwikapi_opid: operatorInfo.opid,
          circle_code: circleCode,
          circle_name: circleNameTrimmed,
          operator_type: 'PREPAID',
          confidence: 'high', // Real-time API = high confidence
          detection_method: 'kwikapi_realtime',
          api_response: response.data,
        },
      };

    } catch (error: any) {
      console.error('❌ [KWIKAPI] Operator Detection Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });

      return {
        success: false,
        data: null,
        message: error.response?.data?.message || error.message || 'Operator detection failed',
      };
    }
  }

  // Retry logic wrapper
  async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error: any) {
        if (i === maxRetries - 1) throw error;

        // Don't retry on client errors (4xx)
        if (error.response?.status >= 400 && error.response?.status < 500) {
          throw error;
        }

        await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
    throw new Error('Max retries exceeded');
  }
}

export const kwikapi = new KwikAPIClient();
export default kwikapi;
