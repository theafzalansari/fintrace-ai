# FinTrace AI — Backend Ingestion & Core API Contract

**Branch**: `feature/core-ingestion`  
**Target Audience**: Sahil & Sakshi (Frontend / Integration Team)  
**Status**: Milestone 1 Complete

---

## 1. Overview & Setup

The FinTrace AI backend provides REST API endpoints for ingesting financial audit datasets (Beneficiaries and Disbursements), validating incoming records using Zod schemas, persisting valid records to MongoDB (with fallback in-memory cache when running disconnected), and querying ingested records.

### Environment Configuration (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/fintrace-ai
CORS_ORIGIN=http://localhost:5173
```

---

## 2. API Endpoints Summary

| Method | Endpoint | Description | Content-Type |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service health check | N/A |
| `POST` | `/api/ingest/beneficiaries` | JSON ingestion for beneficiaries | `application/json` |
| `POST` | `/api/ingest/disbursements` | JSON ingestion for disbursements | `application/json` |
| `POST` | `/api/ingest/beneficiaries/csv` | CSV upload / raw CSV text for beneficiaries | `multipart/form-data` or `text/csv` |
| `POST` | `/api/ingest/disbursements/csv` | CSV upload / raw CSV text for disbursements | `multipart/form-data` or `text/csv` |
| `POST` | `/api/ingest/csv` | Unified CSV upload (`?type=beneficiary` or `?type=disbursement`) | `multipart/form-data` or `text/csv` |
| `GET` | `/api/beneficiaries` | List ingested beneficiaries | N/A |
| `GET` | `/api/disbursements` | List ingested disbursements | N/A |

---

## 3. Data Schemas

### 3.1 Beneficiary Schema

| Field | Type | Required | Default | Validation & Rules |
| :--- | :--- | :--- | :--- | :--- |
| `beneficiaryId` | String | **Yes** | — | Unique identifier (e.g., `BEN-1001`), non-empty |
| `name` | String | **Yes** | — | Full name or organization name, non-empty |
| `bankAccountNumber` | String | **Yes** | — | Bank account number, min length 4 |
| `ifscOrRoutingCode` | String | **Yes** | — | IFSC / Routing Code (uppercase), min length 3 |
| `category` | Enum | No | `Individual` | Options: `'Individual'`, `'Vendor'`, `'NGO'`, `'Contractor'` |
| `phone` | String | No | `""` | Phone number |
| `email` | String | No | `""` | Must be valid email format if provided |
| `address` | String | No | `""` | Physical address |
| `identityHash` | String | No | `""` | Hashed biometric or govt ID hash |
| `status` | Enum | No | `Active` | Options: `'Active'`, `'Suspended'`, `'Flagged'` |

### 3.2 Disbursement Schema

| Field | Type | Required | Default | Validation & Rules |
| :--- | :--- | :--- | :--- | :--- |
| `disbursementId` | String | **Yes** | — | Unique payment ID (e.g., `DISB-2024-001`) |
| `beneficiaryId` | String | **Yes** | — | Linked Beneficiary ID |
| `amount` | Number | **Yes** | — | Must be positive number > 0 (string numbers like `"25000"` automatically coerced) |
| `currency` | String | No | `INR` | Currency code |
| `disbursementDate` | Date/ISO String | **Yes** | — | Valid Date / ISO timestamp |
| `programCode` | String | **Yes** | — | Scheme / Program reference (e.g., `SCHEME-AGRI-2024`) |
| `paymentChannel` | Enum | No | `Direct Transfer` | Options: `'Direct Transfer'`, `'UPI'`, `'NEFT'`, `'RTGS'`, `'Check'` |
| `status` | Enum | No | `Completed` | Options: `'Completed'`, `'Pending'`, `'Failed'`, `'Reversed'` |
| `referenceNumber` | String | No | `""` | Transaction reference / UTR number |
| `remarks` | String | No | `""` | Additional audit remarks |

---

## 4. Request & Response Formats

### 4.1 Ingestion Response Contract (`IngestionResult`)

All ingestion endpoints return a detailed summary along with accepted records and a row-by-row breakdown of any rejected records.

```json
{
  "success": true,
  "message": "Processed 2 beneficiary records. Accepted: 1, Rejected: 1",
  "summary": {
    "totalRows": 2,
    "acceptedCount": 1,
    "rejectedCount": 1,
    "recordType": "beneficiary"
  },
  "accepted": [
    {
      "beneficiaryId": "BEN-1001",
      "name": "Rajesh Kumar",
      "bankAccountNumber": "918273645012",
      "ifscOrRoutingCode": "SBIN0001234",
      "category": "Individual",
      "phone": "+919876543210",
      "email": "rajesh.k@example.com",
      "address": "12 Civil Lines, New Delhi",
      "identityHash": "HASH-BEN-1001",
      "status": "Active"
    }
  ],
  "rejected": [
    {
      "row": 2,
      "raw": {
        "beneficiaryId": "",
        "name": "",
        "bankAccountNumber": "123",
        "ifscOrRoutingCode": ""
      },
      "errors": [
        { "field": "beneficiaryId", "message": "beneficiaryId cannot be empty" },
        { "field": "name", "message": "name cannot be empty" },
        { "field": "bankAccountNumber", "message": "bankAccountNumber must be at least 4 characters" },
        { "field": "ifscOrRoutingCode", "message": "ifscOrRoutingCode cannot be empty" }
      ]
    }
  ]
}
```

---

## 5. Testing Commands & Quick Start for Integration

### Start Backend API Server
```bash
cd backend
npm run dev
```

### 1. Verify Health
```bash
curl http://localhost:5000/api/health
```

### 2. Ingest Beneficiaries via JSON
```bash
curl -X POST http://localhost:5000/api/ingest/beneficiaries \
  -H "Content-Type: application/json" \
  -d '[
    {
      "beneficiaryId": "BEN-2001",
      "name": "Meera Patel",
      "bankAccountNumber": "554433221100",
      "ifscOrRoutingCode": "HDFC0001234",
      "category": "Individual"
    }
  ]'
```

### 3. Ingest Beneficiaries via CSV Upload
```bash
curl -X POST http://localhost:5000/api/ingest/beneficiaries/csv \
  -F "file=@src/data/synthetic/beneficiaries_sample.csv"
```

### 4. Fetch All Beneficiaries
```bash
curl http://localhost:5000/api/beneficiaries
```

### 5. Fetch All Disbursements
```bash
curl http://localhost:5000/api/disbursements
```

---

## 6. Run Automated Tests
```bash
cd backend
npm run test
```
