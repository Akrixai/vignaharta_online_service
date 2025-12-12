# KWIKAPI v3.0.0 - Complete API Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Categories](#api-categories)
4. [Fetching APIs](#fetching-apis)
5. [Transaction APIs](#transaction-apis)
6. [Error Handling](#error-handling)
7. [Response Codes](#response-codes)
8. [Best Practices](#best-practices)

---

## 🎯 Overview

**Collection Name:** KWIKAPI v3.0.0  
**Description:** This is an API document collection of KWIKAPI Transactions API  
**Base URL:** `https://www.kwikapi.com/api/v2/`  
**Postman Collection ID:** `8ef094a5-9cf6-45c8-967a-b6b3c0ddf039`

KWIKAPI provides comprehensive APIs for various recharge and bill payment services including:
- Mobile Recharge (Prepaid & Postpaid)
- DTH Recharge
- Electricity Bill Payment
- Gas Bill Payment
- Water Bill Payment
- Broadband Bill Payment
- Landline Bill Payment
- Insurance Premium Payment
- Money Transfer
- PAN Card Services

---

## 🔐 Authentication

All API requests require authentication using an API key.

### API Key Parameter
- **Parameter Name:** `api_key`
- **Type:** String
- **Location:** Query parameter or Form data
- **Format:** `XXXXXX-XXXXXX-XXXXXX-XXXXXX`
- **Example:** `4d3105-f2aaf2-1f5bcf-f40193`

### Authentication Errors
- **Status Code:** 200
- **Error Response:**
```json
{
  "status": "102",
  "message": "API MISMATCH"
}
```

---

## 📂 API Categories

The KWIKAPI collection is organized into the following categories:

### 1. 🟢 Fetching APIs
APIs for retrieving operator information, circle codes, bill details, and account balance.

### 2. 🔵 Transaction APIs
APIs for processing recharges and bill payments.

---

## 🟢 Fetching APIs

### 1.1 Biller List API

**Purpose:** Retrieve a list of all operator codes, status, amount ranges, and other details.

#### Request Details
- **Method:** `GET`
- **Endpoint:** `/operator_codes.php`
- **Rate Limit:** 15 hits/day (for syncing purposes only)

#### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| api_key | String | Yes | Your secret API key |

#### Request Example
```http
GET https://www.kwikapi.com/api/v2/operator_codes.php?api_key=YOUR_SECRET_KEY
```

#### Success Response (200 OK)
```json
{
  "response": [
    {
      "operator_name": "Airtel",
      "operator_id": "1",
      "service_type": "Prepaid",
      "status": "1",
      "bill_fetch": "NO",
      "bbps_enabled": "NO",
      "message": "",
      "description": "",
      "amount_minimum": "10",
      "amount_maximum": "10000"
    },
    {
      "operator_name": "AIRTEL DTH",
      "operator_id": "23",
      "service_type": "DTH",
      "status": "1",
      "bill_fetch": "NO",
      "bbps_enabled": "NO",
      "message": "",
      "description": "",
      "amount_minimum": "100",
      "amount_maximum": "15000"
    }
  ]
}
```

#### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| operator_name | String | Name of the operator |
| operator_id | String | Unique operator identifier |
| service_type | String | Type of service (Prepaid, Postpaid, DTH, ELC, GAS, Water, etc.) |
| status | String | 1 = Active, 0 = Inactive |
| bill_fetch | String | YES/NO - Whether bill fetching is supported |
| bbps_enabled | String | YES/NO - Whether BBPS is enabled |
| message | String | Special instructions for the operator |
| description | String | Additional description |
| amount_minimum | String | Minimum transaction amount |
| amount_maximum | String | Maximum transaction amount |

#### Service Types Available
- **Prepaid** - Mobile prepaid recharge
- **Postpaid** - Mobile postpaid bill payment
- **DTH** - DTH recharge
- **ELC** - Electricity bill payment
- **GAS** - Gas bill payment
- **Water** - Water bill payment
- **Landline** - Landline bill payment
- **Broadband** - Broadband bill payment
- **Insurance** - Insurance premium payment
- **Money Transfer** - Money transfer service
- **PAN** - PAN card service
- **DATACARD** - Data card recharge

---

### 1.2 Biller Details API

**Purpose:** Fetch detailed information about a specific operator using operator ID.

#### Request Details
- **Method:** `POST`
- **Endpoint:** `/operatorFetch.php`
- **Rate Limit:** 50 hits/day (for sync purposes only)

#### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| api_key | String | Yes | Your secret API key |
| opid | Integer | Yes | Operator ID |

#### Request Example
```http
POST https://www.kwikapi.com/api/v2/operatorFetch.php
Content-Type: multipart/form-data

api_key=YOUR_SECRET_KEY
opid=53
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "STATUS": "SUCCESS",
  "operator_name": "Uttar Gujarat Vij Company Limited - UGVCL",
  "operator_id": "53",
  "service_type": "ELC",
  "status": "1",
  "bill_fetch": "NO",
  "bbps_enabled": "YES",
  "message": "pass Consumer Number in 'account'",
  "description": "",
  "amount_minimum": "1",
  "amount_maximum": "49999"
}
```

#### BBPS Payment Channels

The API provides information about NPCI-supported payment channels:

| Payment Mode | INT | INB | MOB | MBB | ATM | BNK | KSK | AGT | BSC |
|--------------|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Cash | N | N | N | N | N | Y | Y | Y | Y |
| Internet Banking | Y | Y | Y | Y | Y | N | N | N | N |
| Credit Card | Y | Y | Y | Y | Y | Y | Y | N | Y |
| Debit Card | Y | Y | Y | Y | Y | Y | Y | N | Y |
| Prepaid Card | Y | Y | Y | Y | Y | Y | Y | N | Y |
| IMPS | N | Y | N | Y | N | Y | N | N | Y |
| NEFT | N | Y | N | Y | Y | Y | N | N | Y |
| UPI | Y | Y | Y | Y | N | Y | N | N | Y |
| Wallet | Y | Y | Y | Y | N | Y | Y | N | Y |
| AEPS | N | N | N | N | N | Y | N | N | Y |
| Account Transfer | N | N | N | N | N | Y | N | N | N |
| Bharat QR | N | N | Y | Y | N | Y | N | N | Y |
| USSD | N | N | Y | Y | N | N | N | N | N |

**Channel Codes:**
- INT - Internet
- INB - Internet Banking
- MOB - Mobile
- MBB - Mobile Banking
- ATM - ATM
- BNK - Bank Branch
- KSK - Kiosk
- AGT - Agent
- BSC - Business Correspondent

---

### 1.3 Circle Codes API

**Purpose:** Retrieve all available circle codes for mobile operators.

#### Request Details
- **Method:** `GET`
- **Endpoint:** `/circle_codes.php`
- **Rate Limit:** 2 hits/day

#### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| api_key | String | Yes | Your secret API key |

#### Request Example
```http
GET https://www.kwikapi.com/api/v2/circle_codes.php?api_key=YOUR_SECRET_KEY
```

#### Success Response (200 OK)
```json
{
  "response": [
    {
      "circle_name": "DELHI",
      "circle_code": "1"
    },
    {
      "circle_name": "Maharashtra",
      "circle_code": "4"
    },
    {
      "circle_name": "Andhra Pradesh",
      "circle_code": "5"
    },
    {
      "circle_name": "TAMIL NADU",
      "circle_code": "23"
    }
  ]
}
```

#### Complete Circle List
| Circle Code | Circle Name |
|-------------|-------------|
| 1 | DELHI |
| 2 | UTTAR PRADESH(West) |
| 4 | Maharashtra |
| 5 | Andhra Pradesh |
| 7 | Karnataka |
| 8 | Gujarat |
| 9 | UTTAR PRADESH(East) |
| 10 | Madhya Pradesh |
| 12 | West Bengal |
| 13 | Rajasthan |
| 14 | Kerala |
| 15 | Punjab |
| 16 | Haryana |
| 17 | Bihar |
| 18 | ODISHA |
| 19 | Assam |
| 21 | Himachal Pradesh |
| 22 | Jammu And Kashmir |
| 23 | TAMIL NADU |
| 24 | Jharkhand |
| 25 | CHHATTISGARH |
| 26 | GOA |
| 27 | MANIPUR |
| 28 | MEGHALAYA |
| 29 | MIZORAM |
| 30 | NAGALAND |
| 31 | SIKKIM |
| 32 | TRIPURA |
| 33 | UTTARAKHAND |
| 34 | ANDAMAN AND NICOBAR |
| 35 | CHANDIGARH |
| 36 | DADRA AND NAGAR HAVELI |
| 37 | DAMAN AND DIU |
| 38 | LAKSHADWEEP |
| 39 | PUDUCHERRY |
| 40 | TELANGANA |
| 41 | ARUNACHAL PRADESH |

---

### 1.4 Bill Fetch API v2

**Purpose:** Fetch bill details for operators that support bill fetching (electricity, gas, water, etc.).

#### Request Details
- **Method:** `GET`
- **Endpoint:** `/bills/validation.php`

#### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| api_key | String | Yes | Your secret API key |
| number | String | Yes | Account/Consumer number |
| amount | String | Yes | Any fake amount (for validation) |
| opid | Integer | Yes | Operator ID |
| order_id | Integer | Yes | Your unique transaction ID (max 14 digits) |
| opt1 | String | No | Optional parameter 1 |
| opt2 | String | No | Optional parameter 2 |
| opt3 | String | No | Optional parameter 3 |
| opt4 | String | No | Optional parameter 4 |
| opt5 | String | No | Optional parameter 5 |
| opt6 | String | No | Optional parameter 6 |
| opt7 | String | No | Optional parameter 7 |
| opt8 | String | Yes | Must be "Bills" |
| opt9 | String | No | Optional parameter 9 |
| opt10 | String | No | Optional parameter 10 |
| mobile | String | Yes | Customer mobile number (10 digits) |

#### Request Example
```http
GET https://www.kwikapi.com/api/v2/bills/validation.php?api_key=YOUR_SECRET_KEY&number=12438555985&amount=10&opid=65&order_id=478245232&opt8=Bills&mobile=9876543210
```

#### Success Response (200 OK)
```json
{
  "status": "SUCCESS",
  "message": "SUCCESS",
  "due_amount": "1885.00",
  "due_date": "13-07-2020",
  "customer_name": "KUSUM DEVI",
  "bill_number": "202006005985",
  "bill_date": "28-06-2020",
  "bill_period": "MONTHLY",
  "ref_id": "61936"
}
```

#### Failed Response (200 OK)
```json
{
  "status": "FAILED",
  "message": "Invalid Account Number",
  "due_amount": "NA",
  "due_date": "NA",
  "customer_name": "NA",
  "bill_number": "NA",
  "bill_date": "NA",
  "bill_period": "NA",
  "ref_id": "NA"
}
```

#### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| status | String | SUCCESS or FAILED |
| message | String | Status message |
| due_amount | String | Bill amount due |
| due_date | String | Due date for payment |
| customer_name | String | Name of the customer |
| bill_number | String | Bill number |
| bill_date | String | Bill generation date |
| bill_period | String | Billing period (MONTHLY, etc.) |
| ref_id | String | Reference ID for the bill fetch |

#### Important Notes
- Only use this API for operators where `bill_fetch` = "YES"
- The `ref_id` from the response should be used in the payment transaction
- Store the bill details before proceeding to payment

---

### 1.5 Bill Fetch API v2.2 (Deprecated)

**Purpose:** Enhanced bill fetch with additional fields (DEPRECATED - Use v2 instead).

#### Request Details
- **Method:** `GET`
- **Endpoint:** `/bills/validation_v2_2.php`
- **Status:** ❌ DEPRECATED

#### Success Response
```json
{
  "status": "SUCCESS",
  "provider": "BSES Rajdhani Power Limited - Delhi",
  "message": "SUCCESS",
  "due_amount": "1140.00",
  "due_date": "01/01/1990",
  "customer_name": "SAVITA",
  "bill_number": "153610347",
  "bill_date": "01/01/1990",
  "bill_period": "MONTHLY",
  "ref_id": "842228",
  "service": "ELC",
  "Additional": null
}
```

---

### 1.6 Wallet Balance Fetch API

**Purpose:** Check your KWIKAPI wallet balance.

#### Request Details
- **Method:** `GET`
- **Endpoint:** `/balance.php`
- **Rate Limit:** 2 hits/hour

#### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| api_key | String | Yes | Your secret API key |

#### Request Example
```http
GET https://www.kwikapi.com/api/v2/balance.php?api_key=YOUR_SECRET_KEY
```

#### Success Response (200 OK)
```json
{
  "status": "SUCCESS",
  "balance": "10000.50",
  "currency": "INR"
}
```

#### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| status | String | SUCCESS or FAILED |
| balance | String | Current wallet balance |
| currency | String | Currency code (INR) |

---

## 🔵 Transaction APIs

### 2.1 Mobile Recharge API (Prepaid)

**Purpose:** Process mobile prepaid recharge transactions.

#### Request Details
- **Method:** `POST`
- **Endpoint:** `/recharge.php`

#### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| api_key | String | Yes | Your secret API key |
| number | String | Yes | Mobile number (10 digits) |
| amount | String | Yes | Recharge amount |
| opid | Integer | Yes | Operator ID |
| order_id | String | Yes | Your unique transaction ID (max 14 digits) |
| circle | Integer | No | Circle code (required for some operators) |

#### Request Example
```http
POST https://www.kwikapi.com/api/v2/recharge.php
Content-Type: multipart/form-data

api_key=YOUR_SECRET_KEY
number=9876543210
amount=99
opid=1
order_id=1234567890
circle=1
```

#### Success Response
```json
{
  "status": "SUCCESS",
  "message": "Transaction Successful",
  "order_id": "1234567890",
  "txn_id": "KWK123456789",
  "operator_ref": "OP987654321",
  "amount": "99.00",
  "number": "9876543210",
  "operator": "Airtel"
}
```

#### Pending Response
```json
{
  "status": "PENDING",
  "message": "Transaction is in pending state",
  "order_id": "1234567890",
  "txn_id": "KWK123456789"
}
```

#### Failed Response
```json
{
  "status": "FAILED",
  "message": "Transaction Failed",
  "order_id": "1234567890",
  "error_code": "101",
  "error_message": "Insufficient Balance"
}
```

---

### 2.2 DTH Recharge API

**Purpose:** Process DTH recharge transactions.

#### Request Details
- **Method:** `POST`
- **Endpoint:** `/recharge.php`

#### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| api_key | String | Yes | Your secret API key |
| number | String | Yes | DTH subscriber ID |
| amount | String | Yes | Recharge amount |
| opid | Integer | Yes | DTH Operator ID |
| order_id | String | Yes | Your unique transaction ID (max 14 digits) |

#### DTH Operators
| Operator ID | Operator Name | Min Amount | Max Amount |
|-------------|---------------|------------|------------|
| 23 | AIRTEL DTH | 100 | 15000 |
| 24 | BIG TV DTH | 10 | 10000 |
| 25 | DISH DTH | 10 | 64490 |
| 26 | SUN DTH | 50 | 5700 |
| 27 | TATA SKY DTH | 20 | 30000 |
| 28 | VIDEOCON DTH | 50 | 65000 |

---

### 2.3 Postpaid Bill Payment API

**Purpose:** Pay mobile postpaid bills.

#### Request Details
- **Method:** `POST`
- **Endpoint:** `/bills/payment.php`

#### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| api_key | String | Yes | Your secret API key |
| number | String | Yes | Mobile number |
| amount | String | Yes | Bill amount |
| opid | Integer | Yes | Operator ID |
| order_id | String | Yes | Your unique transaction ID |
| ref_id | String | No | Reference ID from bill fetch (if applicable) |

#### Postpaid Operators
| Operator ID | Operator Name | BBPS Enabled | Bill Fetch |
|-------------|---------------|--------------|------------|
| 29 | Vodafone Postpaid | YES | NO |
| 32 | Tata Docomo Postpaid | YES | NO |
| 36 | BSNL Postpaid | NO | YES |
| 48 | Airtel Postpaid | YES | NO |
| 49 | Idea Postpaid | YES | NO |
| 115 | Reliance Jio Postpaid | YES | NO |

---

### 2.4 Electricity Bill Payment API

**Purpose:** Pay electricity bills for various state electricity boards.

#### Request Details
- **Method:** `POST`
- **Endpoint:** `/bills/payment.php`

#### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| api_key | String | Yes | Your secret API key |
| number | String | Yes | Consumer/Account number |
| amount | String | Yes | Bill amount |
| opid | Integer | Yes | Electricity board operator ID |
| order_id | String | Yes | Your unique transaction ID |
| ref_id | String | Yes | Reference ID from bill fetch |
| opt1 | String | No | Additional parameter (varies by operator) |
| mobile | String | Yes | Customer mobile number |

#### Major Electricity Operators
| Operator ID | Operator Name | Bill Fetch | BBPS | Special Instructions |
|-------------|---------------|------------|------|---------------------|
| 50 | BSES Yamuna Power Limited - Delhi | YES | YES | Pass CA Number in 'account' |
| 51 | BSES Rajdhani Power Limited - Delhi | YES | YES | Pass CA Number in 'account' |
| 53 | Uttar Gujarat Vij Company Limited - UGVCL | NO | YES | Pass Consumer Number in 'account' |
| 54 | UHBVN - HARYANA | YES | YES | Pass Account Number in 'account', Mobile in opt1 |
| 56 | Tata Power Delhi Distribution Limited | YES | YES | Pass CA Number in 'account' |
| 78 | BESCOM BENGALURU | YES | YES | Pass Consumer Number/Account Id in 'account' |
| 79 | TAMIL NADU ELECTRICITY BOARD - TNEB | YES | YES | Pass Consumer Number in 'account' |
| 88 | UPPCL (URBAN) - UTTAR PRADESH | YES | YES | Pass Consumer Number (10-12 digits) |
| 110 | Tata Power - MUMBAI | YES | YES | Pass Consumer Number in 'account' |
| 114 | UPPCL (RURAL) - UTTAR PRADESH | YES | YES | Pass Consumer Number (12 digits) |
| 118 | PSPCL - PUNJAB | YES | YES | Pass Account Number in 'account' |
| 144 | Adani Electricity - MUMBAI | YES | YES | Pass Consumer number in 'account' |
| 145 | NDMC - DELHI | YES | YES | Pass Consumer number in 'account' |

---

### 2.5 Gas Bill Payment API

**Purpose:** Pay piped gas bills.

#### Request Details
- **Method:** `POST`
- **Endpoint:** `/bills/payment.php`

#### Gas Operators
| Operator ID | Operator Name | Bill Fetch | BBPS | Account Field |
|-------------|---------------|------------|------|---------------|
| 90 | Mahanagar Gas | YES | YES | Customer Account Number |
| 91 | Tripura Natural Gas | YES | YES | Consumer Number |
| 92 | Siti Energy | YES | YES | ARN Number |
| 93 | Sabarmati Gas | YES | YES | Customer ID |
| 94 | Indraprastha Gas | YES | YES | BP Number |
| 95 | Haryana City Gas | YES | YES | CRN Number |
| 96 | Gujarat Gas | YES | YES | Customer ID |
| 97 | Adani Gas | YES | YES | Customer ID |
| 138 | Vadodara Gas | YES | YES | Consumer Number |
| 140 | Maharashtra Natural Gas | YES | YES | BP Number |
| 160 | IndianOil - Adani Gas | YES | YES | Customer ID |
| 163 | Central UP Gas Limited | YES | YES | Customer Code/CRN Number |

---

### 2.6 Water Bill Payment API

**Purpose:** Pay water bills for municipal corporations.

#### Water Operators
| Operator ID | Operator Name | Bill Fetch | BBPS | Account Field |
|-------------|---------------|------------|------|---------------|
| 99 | Uttarakhand Jal Sansthan | YES | YES | Consumer Number (Last 7 Digits) |
| 102 | Delhi Jal Board | YES | YES | K Number |
| 146 | Ujjain Nagar Nigam - PHED | YES | YES | Business Partner Number |
| 147 | Surat Municipal Corporation | YES | YES | Connection Number |
| 148 | Pune Municipal Corporation | YES | YES | Consumer Number |
| 149 | New Delhi Municipal Council (NDMC) | YES | YES | Consumer Number |
| 152 | Jabalpur Municipal Corporation | YES | YES | Service Number |
| 154 | Indore Municipal Corporation | YES | YES | Service Number |
| 155 | Hyderabad Metropolitan Water Supply | YES | YES | CAN Number |
| 159 | Bangalore Water Supply and Sewerage Board | YES | YES | RR Number |

---

### 2.7 Broadband Bill Payment API

**Purpose:** Pay broadband internet bills.

#### Broadband Operators
| Operator ID | Operator Name | Bill Fetch | BBPS | Account Field |
|-------------|---------------|------------|------|---------------|
| 108 | Tikona Broadband | YES | YES | Service ID |
| 109 | Connect Broadband | YES | YES | Directory Number |
| 136 | Hathway Broadband | YES | YES | Customer ID |
| 137 | ACT Fibernet | YES | YES | Account Number/User Name |
| 166 | TTN BroadBand | YES | YES | User Name |
| 167 | Spectranet Broadband | YES | YES | CAN/Account ID |
| 168 | Airtel Broadband | YES | YES | Landline Number with STD code |
| 169 | Nextra Broadband | YES | YES | Consumer ID |

---

### 2.8 Landline Bill Payment API

**Purpose:** Pay landline telephone bills.

#### Landline Operators
| Operator ID | Operator Name | Bill Fetch | BBPS | Special Instructions |
|-------------|---------------|------------|------|---------------------|
| 103 | Tata Docomo CDMA (LL) | NO | YES | Landline Number with STD Code (without 0) |
| 104 | MTNL - Mumbai(LL) | YES | YES | Telephone Number in 'account', Account Number in 'opt1' |
| 105 | MTNL - Delhi(LL) | YES | YES | Telephone Number in 'account', Account Number in 'opt1' |
| 106 | BSNL Individual(LL) | YES | YES | Account Number in 'account', Number with STD Code in opt1 |
| 107 | Airtel(LL) | NO | YES | Landline Number with STD code |
| 165 | BSNL - Corporate | YES | YES | Account Number |

---

### 2.9 Insurance Premium Payment API

**Purpose:** Pay insurance premiums.

#### Insurance Operators
| Operator ID | Operator Name | Bill Fetch | BBPS | Special Instructions |
|-------------|---------------|------------|------|---------------------|
| 111 | Tata AIG General Insurance | YES | NO | Policy Number in 'account', DOB (DD-MM-YYYY) in 'opt1' |
| 112 | Tata AIA Life Insurance | YES | NO | Alphanumeric Policy Number in 'account' |
| 113 | ICICI Prudential Life Insurance | YES | NO | Policy Number in 'account', DOB (DD-MM-YYYY) in 'opt1' |

---

### 2.10 Money Transfer API

**Purpose:** Transfer money to bank accounts.

#### Request Details
- **Method:** `POST`
- **Endpoint:** `/money_transfer.php`
- **Operator ID:** 86

#### Transaction Limits
| Limit Type | Amount |
|------------|--------|
| Min Value / Transaction | ₹10 |
| Max Value / Transaction | ₹5,000 |
| Max Value / Remitter / Month | ₹25,000 |

---

### 2.11 PAN Card Service API

**Purpose:** Apply for PAN card through UTI.

#### Request Details
- **Operator ID:** 89
- **Service Type:** PAN
- **Special Parameter:** Pass KwikOutlet ID in 'kwikoutlet_id'

---

## ⚠️ Error Handling

### Common Error Responses

#### 1. API Mismatch Error
```json
{
  "status": "102",
  "message": "API MISMATCH"
}
```
**Cause:** Invalid or incorrect API key  
**Solution:** Verify your API key

#### 2. Insufficient Balance
```json
{
  "error_code": "101",
  "message": "Insufficient Balance",
  "status": "FAILED"
}
```
**Cause:** Wallet balance is insufficient  
**Solution:** Add funds to your wallet

#### 3. Invalid Parameters
```json
{
  "error_code": "147",
  "message": "Invalid Parameters",
  "status": "FAILED"
}
```
**Cause:** Missing or incorrect request parameters  
**Solution:** Check all required parameters

#### 4. Operator Down
```json
{
  "status": "FAILED",
  "message": "Operator is temporarily unavailable"
}
```
**Cause:** Service provider is down  
**Solution:** Retry after some time

#### 5. Duplicate Transaction
```json
{
  "status": "FAILED",
  "message": "Duplicate order_id"
}
```
**Cause:** Same order_id used twice  
**Solution:** Use unique order_id for each transaction

---

## 📊 Response Codes

### Transaction Status Codes

| Status | Description | Action Required |
|--------|-------------|-----------------|
| SUCCESS | Transaction completed successfully | None - Transaction successful |
| PENDING | Transaction is being processed | Check status after some time |
| FAILED | Transaction failed | Check error message and retry if needed |
| REFUND | Transaction refunded | Amount will be credited back |

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Invalid API key |
| 403 | Forbidden | Access denied |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily unavailable |

---

## 💡 Best Practices

### 1. API Key Security
- ✅ Store API keys securely (environment variables, secure vault)
- ✅ Never expose API keys in client-side code
- ✅ Rotate API keys periodically
- ❌ Don't commit API keys to version control

### 2. Transaction Management
- ✅ Always use unique `order_id` for each transaction
- ✅ Store transaction details before making API call
- ✅ Implement proper error handling
- ✅ Use webhooks/callbacks for transaction status updates
- ✅ Implement retry logic for PENDING transactions

### 3. Bill Fetch Best Practices
- ✅ Always fetch bill details before payment
- ✅ Store `ref_id` from bill fetch response
- ✅ Pass `ref_id` in payment request
- ✅ Show bill details to customer before payment
- ✅ Validate bill amount with customer

### 4. Rate Limiting
- ✅ Respect API rate limits
- ✅ Implement caching for operator and circle lists
- ✅ Use balance API sparingly (max 2 hits/hour)
- ✅ Sync operator list once daily (max 15 hits/day)

### 5. Error Handling
- ✅ Implement comprehensive error handling
- ✅ Log all API requests and responses
- ✅ Show user-friendly error messages
- ✅ Implement automatic retry for network errors
- ✅ Handle PENDING status appropriately

### 6. Testing
- ✅ Test with small amounts first
- ✅ Test all error scenarios
- ✅ Verify bill fetch before implementing payments
- ✅ Test with different operators
- ✅ Implement proper logging for debugging

### 7. User Experience
- ✅ Show clear transaction status to users
- ✅ Provide transaction receipts
- ✅ Implement transaction history
- ✅ Show operator-specific instructions
- ✅ Validate input fields before API call

### 8. Data Validation
- ✅ Validate mobile numbers (10 digits)
- ✅ Validate amounts (min/max limits)
- ✅ Validate account numbers as per operator requirements
- ✅ Sanitize user inputs
- ✅ Check operator status before transaction

---

## 📝 Integration Checklist

### Phase 1: Setup
- [ ] Obtain API key from KWIKAPI
- [ ] Set up secure storage for API key
- [ ] Configure base URL and endpoints
- [ ] Set up logging mechanism

### Phase 2: Fetching APIs
- [ ] Implement Biller List API
- [ ] Implement Circle Codes API
- [ ] Implement Biller Details API
- [ ] Implement Balance Fetch API
- [ ] Implement Bill Fetch API
- [ ] Cache operator and circle data

### Phase 3: Transaction APIs
- [ ] Implement Mobile Prepaid Recharge
- [ ] Implement DTH Recharge
- [ ] Implement Postpaid Bill Payment
- [ ] Implement Electricity Bill Payment
- [ ] Implement other bill payments as needed

### Phase 4: Error Handling & Testing
- [ ] Implement comprehensive error handling
- [ ] Add retry logic for failed transactions
- [ ] Test all APIs with test data
- [ ] Test error scenarios
- [ ] Implement transaction status checking

### Phase 5: Production Readiness
- [ ] Implement transaction logging
- [ ] Set up monitoring and alerts
- [ ] Implement rate limiting
- [ ] Add transaction receipts
- [ ] Create user documentation
- [ ] Perform security audit

---

## 🔗 Additional Resources

### Official Links
- **BBPS Channel Support:** [https://www.kwikapi.com/Attachments/bbps_channel_support_30-10-2025.html](https://www.kwikapi.com/Attachments/bbps_channel_support_30-10-2025.html)
- **Postman Collection:** Available in workspace

### Support
For technical support and queries, contact KWIKAPI support team.

---

## 📌 Important Notes

1. **BBPS Compliance:** All BBPS-enabled transactions follow NPCI guidelines and compliance policies
2. **Transaction Limits:** Respect operator-specific min/max transaction limits
3. **Bill Fetch:** Only available for operators with `bill_fetch` = "YES"
4. **Order ID:** Must be unique for each transaction (max 14 digits)
5. **Rate Limits:** Strictly adhere to API rate limits to avoid account suspension
6. **Deprecated APIs:** Bill Fetch v2.2 is deprecated, use v2 instead
7. **Optional Parameters:** opt1-opt10 usage varies by operator, check operator details
8. **Mobile Parameter:** Required for bill payments for customer communication

---

## 📄 Document Version

- **Version:** 1.0
- **Last Updated:** December 12, 2024
- **API Version:** v3.0.0
- **Status:** Active

---

**Disclaimer:** This documentation is based on the KWIKAPI v3.0.0 Postman collection. Always refer to the official KWIKAPI documentation for the most up-to-date information and any changes to the API.
