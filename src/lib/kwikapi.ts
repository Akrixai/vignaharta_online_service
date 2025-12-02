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
   * Bill Fetch v2 (for postpaid, DTH, electricity, etc.)
   * GET /api/v2/bills/validation.php
   * Use only when bill_fetch = "YES" for the operator
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
      const queryParams = {
        api_key: KWIKAPI_API_KEY,
        number: params.number,
        amount: params.amount || '10',
        opid: params.opid.toString(),
        order_id: params.order_id || this.generateOrderId(),
        opt8: 'Bills', // Required literal
        mobile: params.mobile,
        ...(params.opt1 && { opt1: params.opt1 }),
        ...(params.opt2 && { opt2: params.opt2 }),
        ...(params.opt3 && { opt3: params.opt3 }),
        ...(params.opt4 && { opt4: params.opt4 }),
        ...(params.opt5 && { opt5: params.opt5 }),
        ...(params.opt6 && { opt6: params.opt6 }),
        ...(params.opt7 && { opt7: params.opt7 }),
        ...(params.opt9 && { opt9: params.opt9 }),
        ...(params.opt10 && { opt10: params.opt10 }),
      };

      const response = await this.client.get('/api/v2/bills/validation.php', {
        params: queryParams,
      });

      return {
        success: response.data.status === 'SUCCESS',
        data: response.data,
      };
    } catch (error: any) {
      console.error('KWIKAPI Bill Fetch Error:', error.response?.data || error.message);
      throw error;
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
   * From "Prepaid/DTH Recharge" collection entry
   * Endpoint path may vary - check your Postman collection
   */
  async rechargePrepaid(params: {
    opid: number;
    number: string;
    amount: number;
    circle?: string;
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
        ...(params.circle && { circle: params.circle }),
        ...(params.opt1 && { opt1: params.opt1 }),
        ...(params.opt2 && { opt2: params.opt2 }),
        ...(params.opt3 && { opt3: params.opt3 }),
        ...(params.opt4 && { opt4: params.opt4 }),
        ...(params.opt5 && { opt5: params.opt5 }),
        ...(params.opt6 && { opt6: params.opt6 }),
        ...(params.opt7 && { opt7: params.opt7 }),
        ...(params.opt8 && { opt8: params.opt8 }),
        ...(params.opt9 && { opt9: params.opt9 }),
        ...(params.opt10 && { opt10: params.opt10 }),
      };

      // Use GET or POST based on your Postman collection
      const response = await this.client.get('/api/v2/recharge.php', {
        params: queryParams,
      });

      return {
        success: response.data.status === 'SUCCESS' || response.data.STATUS === 'SUCCESS',
        data: response.data,
      };
    } catch (error: any) {
      console.error('KWIKAPI Prepaid Recharge Error:', error.response?.data || error.message);
      throw error;
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
        ...(params.opt6 && { opt6: params.opt6 }),
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
   * Utility Payments (Electricity, Gas, Water, Postpaid)
   * From "Utility Payments" collection entry
   * POST /api/v2/bills/pay.php (or similar)
   */
  async payUtilityBill(params: {
    opid: number;
    number: string;
    amount: number;
    order_id?: string;
    ref_id?: string; // From bill fetch response
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
        ...(params.ref_id && { ref_id: params.ref_id }),
        ...(params.opt1 && { opt1: params.opt1 }),
        ...(params.opt2 && { opt2: params.opt2 }),
        ...(params.opt3 && { opt3: params.opt3 }),
        ...(params.opt4 && { opt4: params.opt4 }),
        ...(params.opt5 && { opt5: params.opt5 }),
        ...(params.opt6 && { opt6: params.opt6 }),
        ...(params.opt7 && { opt7: params.opt7 }),
        ...(params.opt8 && { opt8: params.opt8 }),
        ...(params.opt9 && { opt9: params.opt9 }),
        ...(params.opt10 && { opt10: params.opt10 }),
      };

      // Check your Postman collection for exact endpoint
      const response = await this.client.get('/api/v2/bills/pay.php', {
        params: queryParams,
      });

      return {
        success: response.data.status === 'SUCCESS' || response.data.STATUS === 'SUCCESS',
        data: response.data,
      };
    } catch (error: any) {
      console.error('KWIKAPI Utility Payment Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Postpaid Recharge (Deprecated - use utility payments instead)
   */
  async rechargePostpaid(params: {
    opid: number;
    number: string;
    amount: number;
    circle?: string;
    order_id?: string;
    mobile: string;
    ref_id?: string;
  }): Promise<KwikAPIResponse> {
    // Use utility payment for postpaid
    return this.payUtilityBill({
      opid: params.opid,
      number: params.number,
      amount: params.amount,
      order_id: params.order_id,
      mobile: params.mobile,
      ref_id: params.ref_id,
      opt1: params.circle,
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
