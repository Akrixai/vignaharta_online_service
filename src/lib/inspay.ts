import { env } from './env';

export interface InspayNewPanRequest {
  number: string;
  mode: 'EKYC' | 'ESIGN';
  orderid: string;
}

export interface InspayPanCorrectionRequest {
  number: string;
  mode: 'EKYC' | 'ESIGN';
  orderid: string;
}

export interface InspayIncompletePanRequest {
  orderid: string;
}

export interface InspayResponse {
  txid?: string;
  status: 'Success' | 'Failure';
  opid?: string;
  message: string;
  url?: string;
  number?: string;
  amount?: string;
  orderid?: string;
}

export interface InspayCallbackData {
  txid: string;
  status: 'Success' | 'Failure';
  opid: string;
}

class InspayService {
  private baseUrl = process.env.INSPAY_BASE_URL || 'https://connect.inspay.in/v4/nsdl';
  private username = process.env.INSPAY_USERNAME;
  private token = process.env.INSPAY_API_TOKEN;

  constructor() {
    if (!this.username || !this.token) {
      throw new Error('InsPay credentials not configured');
    }
  }

  private buildUrl(endpoint: string, params: Record<string, string>): string {
    const url = new URL(`${this.baseUrl}/${endpoint}`);
    url.searchParams.append('username', this.username!);
    url.searchParams.append('token', this.token!);
    
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    
    return url.toString();
  }

  async newPanRequest(data: InspayNewPanRequest): Promise<InspayResponse> {
    try {
      const url = this.buildUrl('new_pan', {
        number: data.number,
        mode: data.mode,
        orderid: data.orderid
      });

      console.log('🌐 InsPay API URL:', url.replace(this.token!, '[TOKEN_HIDDEN]'));
      console.log('📤 Request data:', data);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📊 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('📥 Raw API Response:', JSON.stringify(result, null, 2));
      
      return result as InspayResponse;
    } catch (error) {
      console.error('💥 InsPay New PAN API Error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to process new PAN request');
    }
  }

  async panCorrectionRequest(data: InspayPanCorrectionRequest): Promise<InspayResponse> {
    try {
      const url = this.buildUrl('correction', {
        number: data.number,
        mode: data.mode,
        orderid: data.orderid
      });

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result as InspayResponse;
    } catch (error) {
      console.error('InsPay PAN Correction API Error:', error);
      throw new Error('Failed to process PAN correction request');
    }
  }

  async incompletePanRequest(data: InspayIncompletePanRequest): Promise<InspayResponse> {
    try {
      const url = this.buildUrl('incomplete', {
        orderid: data.orderid
      });

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result as InspayResponse;
    } catch (error) {
      console.error('InsPay Incomplete PAN API Error:', error);
      throw new Error('Failed to process incomplete PAN request');
    }
  }

  generateOrderId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `PAN_${timestamp}_${random}`;
  }

  validateCallbackData(data: any): InspayCallbackData | null {
    if (!data.txid || !data.status || !data.opid) {
      return null;
    }

    return {
      txid: data.txid,
      status: data.status,
      opid: data.opid
    };
  }
}

export const inspayService = new InspayService();