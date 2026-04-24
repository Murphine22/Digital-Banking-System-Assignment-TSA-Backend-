import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Digital Banking System API',
      version: '1.0.0',
      description: 'Complete Digital Banking System with NIBSS Phoenix API Integration. Provides fintech onboarding, customer KYC, account management, and fund transfer capabilities.',
      contact: {
        name: 'Phoenix Bank Development',
        email: 'admin@phoenixbank.com'
      },
      license: {
        name: 'MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development Server'
      },
      {
        url: 'https://api.phoenixbank.com',
        description: 'Production Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from fintech login endpoint'
        }
      },
      schemas: {
        // Fintech Schemas
        FintechOnboardRequest: {
          type: 'object',
          required: ['name', 'email'],
          properties: {
            name: {
              type: 'string',
              example: 'Phoenix Bank',
              description: 'Name of the fintech institution'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'admin@phoenixbank.com',
              description: 'Email address of the fintech institution'
            }
          }
        },
        FintechOnboardResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                fintechId: { type: 'string', description: 'MongoDB ObjectId' },
                name: { type: 'string' },
                email: { type: 'string' },
                apiKey: { type: 'string' },
                apiSecret: { type: 'string' },
                bankCode: { type: 'string' },
                bankName: { type: 'string' }
              }
            }
          }
        },
        FintechLoginRequest: {
          type: 'object',
          required: ['apiKey', 'apiSecret'],
          properties: {
            apiKey: {
              type: 'string',
              example: 'your_api_key',
              description: 'API key from fintech onboarding'
            },
            apiSecret: {
              type: 'string',
              example: 'your_api_secret',
              description: 'API secret from fintech onboarding'
            }
          }
        },
        FintechLoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                fintechId: { type: 'string' },
                token: { type: 'string', description: 'JWT token for API requests' },
                expiresIn: { type: 'number', example: 3600 },
                fintech: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    email: { type: 'string' },
                    bankCode: { type: 'string' },
                    bankName: { type: 'string' }
                  }
                }
              }
            }
          }
        },

        // BVN Schemas
        InsertBvnRequest: {
          type: 'object',
          required: ['bvn', 'firstName', 'lastName', 'dob', 'phone', 'fintechId', 'token'],
          properties: {
            bvn: {
              type: 'string',
              minLength: 11,
              maxLength: 11,
              example: '12345678901',
              description: 'Bank Verification Number (11 digits)'
            },
            firstName: {
              type: 'string',
              example: 'John',
              description: 'First name of the individual'
            },
            lastName: {
              type: 'string',
              example: 'Doe',
              description: 'Last name of the individual'
            },
            dob: {
              type: 'string',
              format: 'date',
              example: '1990-01-15',
              description: 'Date of birth in ISO 8601 format'
            },
            phone: {
              type: 'string',
              example: '08012345678',
              description: 'Phone number'
            },
            fintechId: {
              type: 'string',
              description: 'MongoDB ObjectId of the fintech institution'
            },
            token: {
              type: 'string',
              description: 'NIBSS JWT token from login'
            }
          }
        },
        InsertBvnResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                bvnId: { type: 'string' },
                bvn: { type: 'string' },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                verificationStatus: { type: 'string', enum: ['PENDING', 'VERIFIED', 'FAILED'] }
              }
            }
          }
        },

        // NIN Schemas
        InsertNinRequest: {
          type: 'object',
          required: ['nin', 'firstName', 'lastName', 'dob', 'fintechId', 'token'],
          properties: {
            nin: {
              type: 'string',
              minLength: 11,
              maxLength: 11,
              example: '12345678901',
              description: 'National Identification Number (11 digits)'
            },
            firstName: {
              type: 'string',
              example: 'John',
              description: 'First name of the individual'
            },
            lastName: {
              type: 'string',
              example: 'Doe',
              description: 'Last name of the individual'
            },
            dob: {
              type: 'string',
              format: 'date',
              example: '1990-01-15',
              description: 'Date of birth in ISO 8601 format'
            },
            fintechId: {
              type: 'string',
              description: 'MongoDB ObjectId of the fintech institution'
            },
            token: {
              type: 'string',
              description: 'NIBSS JWT token from login'
            }
          }
        },

        // Customer Schemas
        CustomerOnboardRequest: {
          type: 'object',
          required: ['firstName', 'lastName', 'email', 'phone', 'dob', 'kycType', 'kycId', 'fintechId', 'token'],
          properties: {
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            phone: { type: 'string', example: '08012345678' },
            dob: { type: 'string', format: 'date', example: '1990-01-15' },
            kycType: { type: 'string', enum: ['BVN', 'NIN'], example: 'BVN' },
            kycId: { type: 'string', example: '12345678901' },
            fintechId: { type: 'string', description: 'MongoDB ObjectId of fintech' },
            token: { type: 'string', description: 'NIBSS JWT token' }
          }
        },
        CustomerOnboardResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                customerId: { type: 'string' },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                email: { type: 'string' },
                kycStatus: { type: 'string' }
              }
            }
          }
        },

        // Account Schemas
        CreateAccountRequest: {
          type: 'object',
          required: ['customerId', 'fintechId', 'kycType', 'kycId', 'dob', 'token'],
          properties: {
            customerId: { type: 'string', description: 'MongoDB ObjectId of customer' },
            fintechId: { type: 'string', description: 'MongoDB ObjectId of fintech' },
            kycType: { type: 'string', enum: ['bvn', 'nin'] },
            kycId: { type: 'string', example: '12345678901' },
            dob: { type: 'string', format: 'date', example: '1990-01-15' },
            token: { type: 'string', description: 'NIBSS JWT token' }
          }
        },
        CreateAccountResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                accountId: { type: 'string' },
                accountNumber: { type: 'string' },
                accountName: { type: 'string' },
                balance: { type: 'number', example: 15000 },
                currency: { type: 'string', example: 'NGN' },
                bankCode: { type: 'string' },
                bankName: { type: 'string' },
                status: { type: 'string', example: 'ACTIVE' }
              }
            }
          }
        },

        // Transaction Schemas
        TransferRequest: {
          type: 'object',
          required: ['fromAccountNumber', 'toAccountNumber', 'amount', 'fintechId', 'token'],
          properties: {
            fromAccountNumber: { type: 'string', example: '1234567890' },
            toAccountNumber: { type: 'string', example: '0987654321' },
            amount: { type: 'number', example: 5000, description: 'Amount in NGN' },
            fintechId: { type: 'string' },
            token: { type: 'string' },
            description: { type: 'string', example: 'Payment for services' }
          }
        },
        TransferResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                transactionId: { type: 'string' },
                fromAccountNumber: { type: 'string' },
                toAccountNumber: { type: 'string' },
                recipientName: { type: 'string' },
                amount: { type: 'number' },
                transactionType: { type: 'string', enum: ['INTRA_BANK', 'INTER_BANK'] },
                status: { type: 'string' },
                initiatedAt: { type: 'string', format: 'date-time' }
              }
            }
          }
        },

        // Error Response
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' }
                }
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js']
};

const specs = swaggerJsdoc(options);
export default specs;
