import { ENV } from "../_core/env";

/**
 * NIBSS Phoenix API Client
 * Handles all interactions with the NIBSS API
 */

export interface NibssOnboardResponse {
  apiKey: string;
  apiSecret: string;
  bankCode: string;
  bankName: string;
}

export interface NibssLoginResponse {
  token: string;
  fintech: {
    name: string;
    email: string;
    bankCode: string;
    bankName: string;
  };
}

export interface NibssAccountCreateResponse {
  message: string;
  accountNumber: string;
  bankCode: string;
  bankName: string;
  balance: number;
}

export interface NibssNameEnquiryResponse {
  accountNumber: string;
  accountName: string;
  bankName: string;
}

export interface NibssTransferResponse {
  message: string;
  transactionId: string;
  amount: number;
  from: string;
  to: string;
  status: string;
}

export interface NibssTransactionStatusResponse {
  transactionId: string;
  status: string;
  amount: number;
  from: string;
  to: string;
  timestamp: string;
}

export interface NibssAccountsResponse {
  accounts: Array<{
    accountNumber: string;
    accountName: string;
    balance: number;
  }>;
}

export interface NibssBalanceResponse {
  accountNumber: string;
  balance: number;
}

export interface NibssIdentityResponse {
  valid: boolean;
  bvn?: string;
  nin?: string;
  firstName: string;
  lastName: string;
  dob: string;
}

class NibssClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = ENV.nibssBaseUrl || "https://nibssbyphoenix.onrender.com";
  }

  private async makeRequest<T>(
    method: string,
    endpoint: string,
    body?: Record<string, unknown>,
    token?: string
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`NIBSS API Error: ${response.status} - ${errorText}`);
      }

      return await response.json() as T;
    } catch (error) {
      console.error(`[NIBSS Client] Request failed:`, error);
      throw error;
    }
  }

  /**
   * Onboard a fintech institution
   */
  async onboardFintech(name: string, email: string): Promise<NibssOnboardResponse> {
    return this.makeRequest<NibssOnboardResponse>(
      "POST",
      "/api/fintech/onboard",
      { name, email }
    );
  }

  /**
   * Authenticate and get JWT token
   */
  async login(apiKey: string, apiSecret: string): Promise<NibssLoginResponse> {
    return this.makeRequest<NibssLoginResponse>(
      "POST",
      "/api/auth/token",
      { apiKey, apiSecret }
    );
  }

  /**
   * Create a BVN record
   */
  async insertBvn(
    bvn: string,
    firstName: string,
    lastName: string,
    dob: string,
    phone: string,
    token: string
  ): Promise<{ message: string; bvn: string }> {
    return this.makeRequest(
      "POST",
      "/api/insertBvn",
      { bvn, firstName, lastName, dob, phone },
      token
    );
  }

  /**
   * Create a NIN record
   */
  async insertNin(
    nin: string,
    firstName: string,
    lastName: string,
    dob: string,
    token: string
  ): Promise<{ message: string; nin: string }> {
    return this.makeRequest(
      "POST",
      "/api/insertNin",
      { nin, firstName, lastName, dob },
      token
    );
  }

  /**
   * Validate a BVN
   */
  async validateBvn(bvn: string, token: string): Promise<NibssIdentityResponse> {
    return this.makeRequest<NibssIdentityResponse>(
      "POST",
      "/api/validateBvn",
      { bvn },
      token
    );
  }

  /**
   * Validate a NIN
   */
  async validateNin(nin: string, token: string): Promise<NibssIdentityResponse> {
    return this.makeRequest<NibssIdentityResponse>(
      "POST",
      "/api/validateNin",
      { nin },
      token
    );
  }

  /**
   * Create a bank account
   */
  async createAccount(
    kycType: "bvn" | "nin",
    kycID: string,
    dob: string,
    token: string
  ): Promise<NibssAccountCreateResponse> {
    return this.makeRequest<NibssAccountCreateResponse>(
      "POST",
      "/api/account/create",
      { kycType, kycID, dob },
      token
    );
  }

  /**
   * Get name enquiry for an account
   */
  async nameEnquiry(accountNumber: string, token: string): Promise<NibssNameEnquiryResponse> {
    return this.makeRequest<NibssNameEnquiryResponse>(
      "GET",
      `/api/account/name-enquiry/${accountNumber}`,
      undefined,
      token
    );
  }

  /**
   * Get all accounts for fintech
   */
  async getAllAccounts(token: string): Promise<NibssAccountsResponse> {
    return this.makeRequest<NibssAccountsResponse>(
      "GET",
      "/api/accounts",
      undefined,
      token
    );
  }

  /**
   * Get account balance
   */
  async getBalance(accountNumber: string, token: string): Promise<NibssBalanceResponse> {
    return this.makeRequest<NibssBalanceResponse>(
      "GET",
      `/api/account/balance/${accountNumber}`,
      undefined,
      token
    );
  }

  /**
   * Initiate a fund transfer
   */
  async transfer(
    from: string,
    to: string,
    amount: string,
    token: string
  ): Promise<NibssTransferResponse> {
    return this.makeRequest<NibssTransferResponse>(
      "POST",
      "/api/transfer",
      { from, to, amount },
      token
    );
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(
    transactionId: string,
    token: string
  ): Promise<NibssTransactionStatusResponse> {
    return this.makeRequest<NibssTransactionStatusResponse>(
      "GET",
      `/api/transaction/${transactionId}`,
      undefined,
      token
    );
  }
}

// Export singleton instance
export const nibssClient = new NibssClient();
