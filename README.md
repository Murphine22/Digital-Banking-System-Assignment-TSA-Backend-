# Digital Banking System - NIBSS Phoenix API Integration

A comprehensive Node.js backend for a digital banking system with full integration to the NIBSS Phoenix API. This system provides complete banking operations including customer onboarding, identity verification, account management, and fund transfers.

## 📋 Features

### Core Banking Operations
- **Fintech Onboarding**: Register financial institutions with NIBSS Phoenix API
- **Identity Verification**: BVN (Bank Verification Number) and NIN (National Identification Number) validation
- **Customer Onboarding**: Complete KYC (Know Your Customer) workflow
- **Account Management**: Create and manage bank accounts with NGN 15,000 initial balance
- **Fund Transfers**: Support for both intra-bank and inter-bank transfers
- **Transaction Management**: Complete transaction history with privacy controls
- **Name Enquiry**: Resolve account numbers to account holder names
- **Balance Checks**: Real-time account balance retrieval
- **Transaction Status Query (TSQ)**: Track transaction status in real-time

### Data Privacy & Security
- Strict data isolation: Customers can only view their own transactions
- Secure credential storage for NIBSS API integration
- JWT token management for authentication
- MongoDB Atlas for secure data persistence

## 🏗️ Architecture

### Database Schema (MongoDB)

#### User Model
- User authentication and profile management
- Role-based access control (admin/user)

#### Fintech Model
- Financial institution details
- NIBSS API credentials (apiKey, apiSecret)
- JWT token management
- Institution verification status

#### BVN Model
- Bank Verification Number records
- Personal information (name, DOB, phone)
- Verification status tracking
- Fintech association

#### NIN Model
- National Identification Number records
- Personal information (name, DOB, gender, address)
- Verification status tracking
- Fintech association

#### Customer Model
- Customer profile and KYC information
- Identity verification details (BVN/NIN)
- Fintech association
- Account reference

#### BankAccount Model
- Account details (number, name, type)
- Balance tracking (NGN currency)
- Customer and Fintech references
- Account status management

#### Transaction Model
- Complete transaction records
- Sender and recipient account information
- Transaction type (INTRA_BANK/INTER_BANK)
- Status tracking (PENDING/SUCCESS/FAILED)
- Timestamps and reference information

## 🚀 Getting Started

### Prerequisites
- Node.js 14+ and npm/pnpm
- MongoDB Atlas account
- NIBSS Phoenix API credentials

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Murphine22/Digital-Banking-System-Assignment-TSA-Backend-.git
cd digital-banking-system
```

2. **Install dependencies**
```bash
npm install
# or
pnpm install
```

3. **Set up environment variables**
Create a `.env` file in the root directory:
```env
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/digital-banking

# NIBSS Phoenix API Configuration
NIBSS_BASE_URL=https://nibssbyphoenix.onrender.com
NIBSS_API_KEY=your_api_key_here
NIBSS_API_SECRET=your_api_secret_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

# Fintech Configuration
FINTECH_NAME=Phoenix Bank
FINTECH_EMAIL=admin@phoenixbank.com
```

4. **Start the server**
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

## 📚 API Endpoints

### Fintech Management
```
POST   /api/fintech/onboard          - Register fintech with NIBSS
POST   /api/fintech/login            - Authenticate and get JWT token
GET    /api/fintech/:fintechId       - Get fintech details
```

### Identity Verification
```
POST   /api/identity/insertBvn       - Insert BVN record
POST   /api/identity/insertNin       - Insert NIN record
POST   /api/identity/validateBvn     - Validate BVN
POST   /api/identity/validateNin     - Validate NIN
GET    /api/identity/bvn/:bvn        - Get BVN record
GET    /api/identity/nin/:nin        - Get NIN record
```

### Customer Management
```
POST   /api/customer/onboard         - Create customer with KYC
POST   /api/customer/account/create  - Create bank account
GET    /api/customer/:customerId     - Get customer details
GET    /api/customer/fintech/:fintechId - Get all customers for fintech
```

### Account Operations
```
GET    /api/account/:accountNumber/balance       - Get account balance
GET    /api/account/:accountNumber/name-enquiry  - Perform name enquiry
GET    /api/account                              - Get all accounts
GET    /api/account/details/:accountId           - Get account details
```

### Transactions
```
POST   /api/transaction/transfer                 - Initiate fund transfer
GET    /api/transaction/:transactionId           - Get transaction status (TSQ)
GET    /api/transaction/account/:accountId       - Get transaction history
GET    /api/transaction/fintech/:fintechId       - Get all transactions for fintech
```

### Health Check
```
GET    /health                       - Server health status
GET    /                             - API information
```

## 📝 API Usage Examples

### 1. Fintech Onboarding
```bash
curl -X POST http://localhost:3000/api/fintech/onboard \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Phoenix Bank",
    "email": "admin@phoenixbank.com"
  }'
```

### 2. Login (Get JWT Token)
```bash
curl -X POST http://localhost:3000/api/fintech/login \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "your_api_key",
    "apiSecret": "your_api_secret"
  }'
```

### 3. Insert BVN
```bash
curl -X POST http://localhost:3000/api/identity/insertBvn \
  -H "Content-Type: application/json" \
  -d '{
    "bvn": "12345678901",
    "firstName": "John",
    "lastName": "Doe",
    "dob": "1990-01-15",
    "phone": "08012345678",
    "fintechId": "fintech_id_here",
    "token": "jwt_token_here"
  }'
```

### 4. Create Customer
```bash
curl -X POST http://localhost:3000/api/customer/onboard \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "08012345678",
    "dob": "1990-01-15",
    "kycType": "BVN",
    "kycId": "12345678901",
    "fintechId": "fintech_id_here",
    "token": "jwt_token_here"
  }'
```

### 5. Create Bank Account
```bash
curl -X POST http://localhost:3000/api/customer/account/create \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "customer_id_here",
    "fintechId": "fintech_id_here",
    "kycType": "bvn",
    "kycId": "12345678901",
    "dob": "1990-01-15",
    "token": "jwt_token_here"
  }'
```

### 6. Initiate Transfer
```bash
curl -X POST http://localhost:3000/api/transaction/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "fromAccountNumber": "1234567890",
    "toAccountNumber": "0987654321",
    "amount": 5000,
    "fintechId": "fintech_id_here",
    "token": "jwt_token_here",
    "description": "Payment for services"
  }'
```

### 7. Get Transaction Status
```bash
curl -X GET http://localhost:3000/api/transaction/transaction_id_here \
  -H "Content-Type: application/json" \
  -d '{
    "token": "jwt_token_here"
  }'
```

### 8. Get Transaction History
```bash
curl -X GET "http://localhost:3000/api/transaction/account/account_id_here?limit=50&skip=0"
```

## 🔐 Security Features

- **Data Privacy**: Customers can only access their own transaction records
- **Secure Credential Storage**: NIBSS API credentials encrypted and securely stored
- **JWT Authentication**: Token-based authentication for API access
- **Input Validation**: All inputs validated using express-validator
- **CORS Protection**: Cross-Origin Resource Sharing configured
- **Error Handling**: Comprehensive error handling and logging

## 📊 Database Indexes

Transaction model includes optimized indexes for:
- `fromAccountId` + `createdAt` (descending)
- `toAccountId` + `createdAt` (descending)
- `transactionId`
- `status`

These indexes ensure fast query performance for transaction history and status lookups.

## 🧪 Testing

The API has been tested with:
- Fintech onboarding and authentication
- BVN/NIN insertion and validation
- Customer creation and verification
- Account creation with initial balance
- Fund transfers (intra-bank and inter-bank)
- Transaction status queries
- Transaction history retrieval with privacy controls

## 📦 Dependencies

- **express**: Web framework
- **mongoose**: MongoDB object modeling
- **axios**: HTTP client for NIBSS API calls
- **express-validator**: Request validation
- **jsonwebtoken**: JWT token generation and verification
- **cors**: Cross-Origin Resource Sharing
- **dotenv**: Environment variable management
- **uuid**: Unique ID generation
- **bcryptjs**: Password hashing (for future use)

## 🚀 Deployment

### Using Manus Platform
The project is configured for deployment on the Manus platform:

1. Save checkpoint: `webdev_save_checkpoint`
2. Use Management UI to export to GitHub
3. Deploy using Manus publish button

### Using External Hosting
For deployment on platforms like Railway, Render, or Vercel:

1. Set environment variables on the hosting platform
2. Ensure MongoDB Atlas is accessible
3. Deploy using platform-specific deployment process

## 📞 Support

For issues or questions:
1. Check the API documentation
2. Review error messages in server logs
3. Verify NIBSS API credentials
4. Ensure MongoDB connection is active

## 📄 License

MIT License - See LICENSE file for details

## 👥 Contributors

Phoenix Bank Development Team

---

**Version**: 1.0.0  
**Last Updated**: April 2026  
**NIBSS API**: https://nibssbyphoenix.onrender.com
