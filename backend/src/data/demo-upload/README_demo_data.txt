================================================================================
FinTrace AI — Synthetic YouTube Demonstration Dataset Guide
================================================================================

This folder contains a fully synthetic, production-validated demo dataset designed for live YouTube video demonstrations of FinTrace AI.

Files Included:
1. beneficiaries_demo.csv (10 Beneficiary Records)
2. disbursements_demo.csv (18 Disbursement Records)
3. README_demo_data.txt (This guide)

--------------------------------------------------------------------------------
RECOMMENDED DEMO UPLOADING ORDER:
--------------------------------------------------------------------------------
Step 1: Open the FinTrace AI UI at http://localhost:5173/dashboard (or /beneficiaries)
Step 2: Click "Ingest Beneficiaries" or "Ingest CSV".
Step 3: Select and upload `beneficiaries_demo.csv`.
        Expected Result: 10 total rows processed, 10 accepted, 0 rejected.
        Observe: Beneficiary Registry updates with 10 records.
Step 4: Click "Ingest Disbursements" or navigate to /disbursements.
Step 5: Select and upload `disbursements_demo.csv`.
        Expected Result: 18 total rows processed, 18 accepted, 0 rejected.
        Observe: Total Payout Volume updates to ₹1,898,000.00 across 18 transactions.

--------------------------------------------------------------------------------
EXPECTED RISK SCORING ANALYSIS RESULTS:
--------------------------------------------------------------------------------
After both files are uploaded, the hybrid risk-scoring engine evaluates all 10 entities:

[HIGH RISK FINDINGS - EXACTLY 2 ENTITIES]
1. BEN-3003 ("Apex Infrastructure Solutions") — Risk Level: HIGH (Score: ~72 - 75 / 100)
   Triggered Evidence Signals:
   - [SHARED_PAYOUT_ACCOUNT (+50 PTS)]: Shares payout account ACC-SHARED-99 with BEN-3004.
   - [DUPLICATE_IDENTITY_HASH (+40 PTS)]: Shares corporate identity hash HASH-CORP-9900 with BEN-3004.
   - [BENEFICIARY_STATUS_FLAG (+50 PTS)]: Account status is marked as Suspended.
   - [HIGH_DISBURSEMENT_VOLUME (+15 PTS)]: Cumulative payout volume ₹550,000 >= ₹500,000 threshold.

2. BEN-3004 ("Apex Horizon Ventures") — Risk Level: HIGH (Score: ~72 - 75 / 100)
   Triggered Evidence Signals:
   - [SHARED_PAYOUT_ACCOUNT (+50 PTS)]: Shares payout account ACC-SHARED-99 with BEN-3003.
   - [DUPLICATE_IDENTITY_HASH (+40 PTS)]: Shares corporate identity hash HASH-CORP-9900 with BEN-3003.
   - [HIGH_DISBURSEMENT_VOLUME (+15 PTS)]: Cumulative payout volume ₹600,000 >= ₹500,000 threshold.

[MEDIUM RISK FINDINGS - EXACTLY 1 ENTITY]
3. BEN-3007 ("Vikram Enterprises") — Risk Level: MEDIUM (Score: ~38 / 100)
   Triggered Evidence Signals:
   - [BENEFICIARY_STATUS_FLAG (+35 PTS)]: Account status is marked as Flagged.
   - [SUSPICIOUS_PAYMENT_STATUS (+15 PTS)]: History contains a Reversed disbursement (DISB-3017).

[LOW RISK FINDINGS - 7 ENTITIES]
4. BEN-3001, BEN-3002, BEN-3005, BEN-3006, BEN-3008, BEN-3009, BEN-3010 — Risk Level: LOW (Scores: 0 to 15 / 100).

--------------------------------------------------------------------------------
NETWORK GRAPH TOPOLOGY HIGHLIGHTS:
--------------------------------------------------------------------------------
- ACC-SHARED-99 Payout Account Node connects BEN-3003 and BEN-3004 with a SHARED_BANK_ACCOUNT edge.
- Shared Identity Hash HASH-CORP-9900 connects BEN-3003 and BEN-3004 with a SHARED_IDENTITY_HASH edge.
- Shared Physical Address connects BEN-3005 and BEN-3006 with a SHARED_ADDRESS edge.
- Shared Phone Number connects BEN-3008 and BEN-3009 with a SHARED_PHONE edge.

--------------------------------------------------------------------------------
STRICT SCHEMA & FIELD MAP:
--------------------------------------------------------------------------------
Beneficiaries Header:
beneficiaryId,name,bankAccountNumber,ifscOrRoutingCode,category,phone,email,address,identityHash,status

Disbursements Header:
disbursementId,beneficiaryId,amount,currency,disbursementDate,programCode,paymentChannel,status,referenceNumber,remarks

All data is 100% fictional and compliant with FinTrace AI Zod Validators.
