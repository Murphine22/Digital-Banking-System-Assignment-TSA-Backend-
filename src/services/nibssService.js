import axios from 'axios';

const NIBSS_BASE_URL = process.env.NIBSS_BASE_URL || 'https://nibssbyphoenix.onrender.com';

class NIBSSService {
  constructor() {
    this.client = axios.create({
      baseURL: NIBSS_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Fintech Onboarding - Register bank with NIBSS
   */
  async onboardFintech(name, email) {
    try {
      const response = await this.client.post('/api/fintech/onboard', {
        name,
        email
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Fintech onboarding failed');
    }
  }

  /**
   * Login - Authenticate fintech and get JWT token
   */
  async login(apiKey, apiSecret) {
    try {
      const response = await this.client.post('/api/auth/token', {
        apiKey,
        apiSecret
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Login failed');
    }
  }

  /**
   * Insert BVN Record
   */
  async insertBvn(bvn, firstName, lastName, dob, phone, token) {
    try {
      const response = await this.client.post('/api/insertBvn', {
        bvn,
        firstName,
        lastName,
        dob,
        phone
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'BVN insertion failed');
    }
  }

  /**
   * Insert NIN Record
   */
  async insertNin(nin, firstName, lastName, dob, token) {
    try {
      const response = await this.client.post('/api/insertNin', {
        nin,
        firstName,
        lastName,
        dob
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'NIN insertion failed');
    }
  }

  /**
   * Validate BVN
   */
  async validateBvn(bvn, token) {
    try {
      const response = await this.client.post('/api/validateBvn', {
        bvn
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'BVN validation failed');
    }
  }

  /**
   * Validate NIN
   */
  async validateNin(nin, token) {
    try {
      const response = await this.client.post('/api/validateNin', {
        nin
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'NIN validation failed');
    }
  }

  /**
   * Create Account
   */
  async createAccount(kycType, kycId, dob, token) {
    try {
      const response = await this.client.post('/api/account/create', {
        kycType,
        kycId,
        dob
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Account creation failed');
    }
  }

  /**
   * Get All Accounts
   */
  async getAllAccounts(token) {
    try {
      const response = await this.client.get('/api/accounts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch accounts');
    }
  }

  /**
   * Name Enquiry
   */
  async nameEnquiry(accountNumber, token) {
    try {
      const response = await this.client.get(`/api/account/name-enquiry/${accountNumber}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Name enquiry failed');
    }
  }

  /**
   * Get Account Balance
   */
  async getBalance(accountNumber, token) {
    try {
      const response = await this.client.get(`/api/account/balance/${accountNumber}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Balance retrieval failed');
    }
  }

  /**
   * Initiate Transfer
   */
  async transfer(fromAccountNumber, toAccountNumber, amount, token) {
    try {
      const response = await this.client.post('/api/transfer', {
        fromAccountNumber,
        toAccountNumber,
        amount
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Transfer failed');
    }
  }

  /**
   * Get Transaction Status
   */
  async getTransactionStatus(transactionId, token) {
    try {
      const response = await this.client.get(`/api/transaction/${transactionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Transaction status retrieval failed');
    }
  }

  /**
   * Error handler
   */
  handleError(error, defaultMessage) {
    if (error.response) {
      const { status, data } = error.response;
      const message = data?.message || data?.error || defaultMessage;
      const err = new Error(message);
      err.status = status;
      err.data = data;
      return err;
    } else if (error.request) {
      const err = new Error('No response from NIBSS API');
      err.status = 503;
      return err;
    } else {
      return error;
    }
  }
}

export default new NIBSSService();
