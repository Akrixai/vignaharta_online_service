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
  txid?: string | number; // InsPay returns number, but we convert to string
  status: 'Success' | 'Failure';
  opid?: string;
  message: string;
  url?: string;
  number?: string;
  amount?: string | number; // InsPay returns string, but could be number
  orderid?: string;
}

export interface InspayCallbackData {
  txid: string;
  status: 'Success' | 'Failure';
  opid: string;
}

class InspayService {
  private baseUrl = process.env.INSPAY_PROXY_URL || 'https://api.akrixsolutions.in';
  private username = process.env.INSPAY_USERNAME;
  private token = process.env.INSPAY_API_TOKEN;

  constructor() {
    if (!this.username || !this.token) {
      throw new Error('InsPay credentials not configured');
    }
  }

  private buildUrl(endpoint: string, params: Record<string, string>): string {
    const url = new URL(`${this.baseUrl}/${endpoint}.php`);
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
      
      // Validate InsPay response format
      if (!this.validateInspayResponse(result)) {
        throw new Error('Invalid response format from InsPay API');
      }
      
      // Normalize the response to ensure consistent types
      const normalizedResult: InspayResponse = {
        ...result,
        txid: result.txid ? String(result.txid) : undefined, // Convert to string
        amount: result.amount ? String(result.amount) : undefined, // Convert to string
        message: this.getErrorMessage(result.message) // Get user-friendly error message
      };
      
      return normalizedResult;
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
      
      // Validate InsPay response format
      if (!this.validateInspayResponse(result)) {
        throw new Error('Invalid response format from InsPay API');
      }
      
      // Normalize the response to ensure consistent types
      const normalizedResult: InspayResponse = {
        ...result,
        txid: result.txid ? String(result.txid) : undefined,
        amount: result.amount ? String(result.amount) : undefined,
        message: this.getErrorMessage(result.message)
      };
      
      return normalizedResult;
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
      
      // Validate InsPay response format
      if (!this.validateInspayResponse(result)) {
        throw new Error('Invalid response format from InsPay API');
      }
      
      // Normalize the response to ensure consistent types
      const normalizedResult: InspayResponse = {
        ...result,
        txid: result.txid ? String(result.txid) : undefined,
        amount: result.amount ? String(result.amount) : undefined,
        message: this.getErrorMessage(result.message)
      };
      
      return normalizedResult;
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
      txid: String(data.txid), // Ensure txid is string
      status: data.status,
      opid: data.opid
    };
  }

  /**
   * Validates InsPay API response format
   */
  validateInspayResponse(response: any): boolean {
    // Must have status field
    if (!response.status) {
      console.error('❌ InsPay response missing status field');
      return false;
    }

    // Status must be Success or Failure
    if (!['Success', 'Failure'].includes(response.status)) {
      console.error('❌ InsPay response has invalid status:', response.status);
      return false;
    }

    // Must have message field
    if (!response.message) {
      console.error('❌ InsPay response missing message field');
      return false;
    }

    // For Success responses, must have txid and url
    if (response.status === 'Success') {
      if (!response.txid) {
        console.error('❌ InsPay Success response missing txid');
        return false;
      }
      if (!response.url) {
        console.error('❌ InsPay Success response missing url');
        return false;
      }
    }

    return true;
  }

  /**
   * Handles common InsPay error messages
   */
  getErrorMessage(inspayMessage: string): string {
    const errorMappings: Record<string, string> = {
      'Please enter correct Mobile number, it must be 10 digit': 'Invalid mobile number. Please enter a valid 10-digit mobile number.',
      'Low balance in API': 'Service temporarily unavailable. Please try again later.',
      'URL Expired, please try again with a new request': 'This application has expired. Please start a new application.',
      'Invalid username or token': 'Service configuration error. Please contact support.',
      'Order ID already exists': 'This order ID already exists. Please try with a different order ID.'
    };

    return errorMappings[inspayMessage] || inspayMessage;
  }
}

export const inspayService = new InspayService();