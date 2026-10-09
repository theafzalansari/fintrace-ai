# FinTrace AI — Backend API & Integration Contract

**Branch**: `main`  
**Target Audience**: Sahil & Sakshi (Frontend / Integration Team)  
**Status**: Milestone 2 Complete (Ingestion, Financial Web Graph & Explainable Risk Scoring)

---

## 1. Overview & Setup

The FinTrace AI backend provides REST API endpoints for:
1. Ingesting financial audit datasets (Beneficiaries & Disbursements) via JSON or CSV.
2. Validating incoming records with detailed Zod schema error reporting.
3. Constructing an interactive Financial Web Graph linking beneficiaries, payout bank accounts, disbursements, and shared attribute clusters.
4. Performing explainable rule-based risk scoring (0–100 bounded scale) with clear human-review disclaimers.

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
| `GET` | `/api/analysis/graph` | Build & return Financial Web Graph (nodes & edges) | N/A |
| `GET` | `/api/analysis/risks` | Calculate & return ranked explainable risk findings | N/A |

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
| `amount` | Number | **Yes** | — | Must be positive number > 0 (string numbers automatically coerced) |
| `currency` | String | No | `INR` | Currency code |
| `disbursementDate` | Date/ISO String | **Yes** | — | Valid Date / ISO timestamp |
| `programCode` | String | **Yes** | — | Scheme / Program reference (e.g., `SCHEME-AGRI-2024`) |
| `paymentChannel` | Enum | No | `Direct Transfer` | Options: `'Direct Transfer'`, `'UPI'`, `'NEFT'`, `'RTGS'`, `'Check'` |
| `status` | Enum | No | `Completed` | Options: `'Completed'`, `'Pending'`, `'Failed'`, `'Reversed'` |
| `referenceNumber` | String | No | `""` | Transaction reference / UTR number |
| `remarks` | String | No | `""` | Additional audit remarks |

---

## 4. Graph Construction API (`GET /api/analysis/graph`)

Generates graph representation from ingested data.

### 4.1 Node Types
- `beneficiary`: `id = beneficiaryId`, `label = name`
- `payout_account`: `id = ACC-{bankAccountNumber}`, `label = Account {bankAccountNumber}`
- `disbursement`: `id = disbursementId`, `label = Disbursement {disbursementId}`

### 4.2 Edge Relations & Reasons
- `BENEFICIARY_PAYOUT_ACCOUNT`: Beneficiary link to payout bank account node.
- `DISBURSED_TO`: Disbursement link to beneficiary.
- `SHARED_BANK_ACCOUNT`: Shared payout bank account between beneficiaries (`sourceAttribute: "bankAccountNumber"`).
- `SHARED_PHONE`: Shared normalized phone number (`sourceAttribute: "phone"`).
- `SHARED_ADDRESS`: Shared physical address (`sourceAttribute: "address"`).
- `SHARED_EMAIL`: Shared email address (`sourceAttribute: "email"`).
- `SHARED_IDENTITY_HASH`: Shared identity hash (`sourceAttribute: "identityHash"`).

### 4.3 Sample Graph Response
```json
{
  "success": true,
  "data": {
    "nodes": [
      {
        "id": "BEN-1001",
        "label": "Rajesh Kumar",
        "type": "beneficiary",
        "metadata": {
          "category": "Individual",
          "status": "Active",
          "bankAccountNumber": "918273645012",
          "ifscOrRoutingCode": "SBIN0001234"
        }
      },
      {
        "id": "ACC-918273645012",
        "label": "Account 918273645012",
        "type": "payout_account",
        "metadata": {
          "bankAccountNumber": "918273645012",
          "ifscOrRoutingCode": "SBIN0001234",
          "associatedBeneficiariesCount": 2
        }
      }
    ],
    "edges": [
      {
        "id": "edge-1",
        "source": "BEN-1001",
        "target": "ACC-918273645012",
        "relation": "BENEFICIARY_PAYOUT_ACCOUNT",
        "reason": "Beneficiary Rajesh Kumar uses payout account 918273645012",
        "sourceAttribute": "bankAccountNumber"
      },
      {
        "id": "edge-2",
        "source": "BEN-1001",
        "target": "BEN-1002",
        "relation": "SHARED_BANK_ACCOUNT",
        "reason": "Shared bank account \"918273645012\" shared between Rajesh Kumar and Asha Workers Co-Op",
        "sourceAttribute": "bankAccountNumber"
      }
    ],
    "summary": {
      "totalNodes": 2,
      "totalEdges": 2,
      "beneficiaryCount": 2,
      "payoutAccountCount": 1,
      "disbursementCount": 0
    }
  }
}
```

---

## 5. Explainable Risk Scoring API (`GET /api/analysis/risks`)

Transparent rule-based scoring (0–100 bounded scale).

### 5.1 Risk Rules & Scoring Weights

| Rule ID | Severity | Points | Description |
| :--- | :--- | :--- | :--- |
| `SHARED_PAYOUT_ACCOUNT` | **HIGH** | +50 (+70 if 3+) | Multiple distinct beneficiaries sharing 1 payout bank account |
| `DUPLICATE_IDENTITY_HASH` | **HIGH** | +40 | Duplicate identity hash linked across different beneficiary IDs |
| `BENEFICIARY_STATUS_FLAG` | **HIGH/MED** | +35 (Flagged) / +50 (Suspended) | Beneficiary account status marked as Flagged or Suspended |
| `SHARED_PHONE_NUMBER` | **LOW** | +15 | Shared contact phone number |
| `SHARED_ADDRESS` | **LOW** | +10 | Shared physical street address |
| `SHARED_EMAIL` | **LOW** | +10 | Shared email address |
| `HIGH_DISBURSEMENT_VOLUME` | **MEDIUM** | +15 | Cumulative payouts ≥ ₹500,000 |
| `HIGH_DISBURSEMENT_VELOCITY` | **LOW** | +15 | Received ≥ 3 separate payment disbursements |
| `SUSPICIOUS_PAYMENT_STATUS` | **MEDIUM** | +15 | Includes failed or reversed payment attempts |

### 5.2 Risk Levels & Human Review Disclaimer
- **High Risk**: `score >= 70`
- **Medium Risk**: `score >= 30 && score < 70`
- **Low Risk**: `score < 30`
- **Disclaimer**: *"Risk indicators are automated rule-based flags for forensic audit and require human review. They do not constitute conclusive proof of fraud."*

### 5.3 Sample Risk Analysis Response
```json
{
  "success": true,
  "data": {
    "findings": [
      {
        "entityId": "BEN-1001",
        "entityType": "beneficiary",
        "name": "Rajesh Kumar",
        "riskScore": 75,
        "riskLevel": "HIGH",
        "disclaimer": "Risk indicators are automated rule-based flags for forensic audit and require human review. They do not constitute conclusive proof of fraud.",
        "signals": [
          {
            "ruleId": "SHARED_PAYOUT_ACCOUNT",
            "severity": "HIGH",
            "points": 50,
            "description": "Bank account 918273645012 is shared by 2 distinct beneficiaries: Asha Workers Co-Op (BEN-1002)."
          },
          {
            "ruleId": "HIGH_DISBURSEMENT_VOLUME",
            "severity": "MEDIUM",
            "points": 15,
            "description": "High cumulative disbursement total of ₹600,000 across 2 payments."
          }
        ],
        "explanations": [
          "Bank account 918273645012 is shared by 2 distinct beneficiaries: Asha Workers Co-Op (BEN-1002).",
          "High cumulative disbursement total of ₹600,000 across 2 payments."
        ]
      }
    ],
    "summary": {
      "totalEntitiesAssessed": 1,
      "highRiskCount": 1,
      "mediumRiskCount": 0,
      "lowRiskCount": 0
    }
  }
}
```

---

## 6. Testing Commands & Quick Start for Integration

### Start Backend API Server
```bash
cd backend
npm run dev
```

### 1. Ingest Sample Synthetic Cluster
```bash
curl -X POST http://localhost:5000/api/ingest/beneficiaries/csv \
  -F "file=@src/data/synthetic/beneficiaries_sample.csv"
```

### 2. Fetch Graph
```bash
curl http://localhost:5000/api/analysis/graph
```

### 3. Fetch Risk Findings
```bash
curl http://localhost:5000/api/analysis/risks
```

### 4. Run Automated Test Suite (14 Tests)
```bash
cd backend
npm run test
```
