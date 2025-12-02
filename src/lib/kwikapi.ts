// KWIKAPI Integration Library
// Handles all recharge and bill payment operations

import axios, { AxiosInstance } from 'axios';

const KWIKAPI_BASE_URL = process.env.KWIKAPI_BASE_URL || 'https://api.kwikapi.com/v3';
const KWIKAPI_API_KEY = process.env.KWIKAPI_API_KEY || '';

interface KwikAPIHeaders {
  'Content-Type': string;
  'Authorization': string;
  'X-Request-ID': string;
}

class KwikAPIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: KWIKAPI_BASE_URL,
      timeout: 30000,
    });
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getHeaders(): KwikAPIHeaders {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${KWIKAPI_API_KEY}`,
      'X-Request-ID': this.generateRequestId(),
    };
  }

  // Wallet Balance API
  async getWalletBalance() {
    try {
      const response = await this.client.get('/wallet/balance', {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error: any) {
      console.error('KWIKAPI Wallet Balance Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Prepaid Recharge API
  async rechargePrepaid(params: {
    operator_code: string;
    mobile_number: string;
    amount: number;
    circle_code: string;
    plan_id?: string;
    transaction_ref: string;
    customer_name?: string;
    email?: string;
    callback_url?: string;
  }) {
    try {
      const response = await this.client.post('/recharge/prepaid', params, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error: any) {
      console.error('KWIKAPI Prepaid Recharge Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Postpaid Recharge API
  async rechargePostpaid(params: {
    operator_code: string;
    mobile_number: string;
    amount: number;
    circle_code: string;
    customer_account_id?: string;
    transaction_ref: string;
    customer_name?: string;
    email?: string;
    payment_mode?: string;
  }) {
    try {
      const response = await this.client.post('/recharge/postpaid', params, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error: any) {
      console.error('KWIKAPI Postpaid Recharge Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // DTH Recharge API
  async rechargeDTH(params: {
    operator_code: string;
    dth_number: string;
    amount: number;
    plan_id: string;
    transaction_ref: string;
    customer_name?: string;
    email?: string;
  }) {
    try {
      const response = await this.client.post('/recharge/dth', params, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error: any) {
      console.error('KWIKAPI DTH Recharge Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Electricity Bill Payment API
  async payElectricityBill(params: {
    operator_code: string;
    consumer_number: string;
    amount: number;
    circle_code: string;
    bill_month?: string;
    bill_year?: string;
    transaction_ref: string;
    customer_name?: string;
    email?: string;
  }) {
    try {
      const response = await this.client.post('/bill/electricity', params, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error: any) {
      console.error('KWIKAPI Electricity Bill Payment Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Fetch Electricity Bill
  async fetchElectricityBill(params: {
    operator_code: string;
    consumer_number: string;
    circle_code: string;
  }) {
    try {
      const response = await this.client.get('/bill/electricity/fetch', {
        params,
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error: any) {
      console.error('KWIKAPI Bill Fetch Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Fetch Prepaid Plans
  async fetchPrepaidPlans(params: {
    operator_code: string;
    circle_code: string;
    min_amount?: number;
    max_amount?: number;
    validity?: string;
  }) {
    try {
      const response = await this.client.get('/plans/prepaid', {
        params,
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error: any) {
      console.error('KWIKAPI Prepaid Plans Fetch Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Fetch DTH Plans
  async fetchDTHPlans(params: {
    operator_code: string;
    min_amount?: number;
    max_amount?: number;
    category?: string;
  }) {
    try {
      const response = await this.client.get('/plans/dth', {
        params,
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error: any) {
      console.error('KWIKAPI DTH Plans Fetch Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Operator Detection
  async detectOperator(mobile_number: string) {
    try {
      const response = await this.client.get('/operator/check', {
        params: { mobile_number },
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error: any) {
      console.error('KWIKAPI Operator Detection Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Transaction Status Check
  async getTransactionStatus(transaction_id: string) {
    try {
      const response = await this.client.get('/transaction/status', {
        params: { transaction_id },
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error: any) {
      console.error('KWIKAPI Transaction Status Error:', error.response?.data || error.message);
      throw error;
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
