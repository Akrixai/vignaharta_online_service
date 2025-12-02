
KWIKAPI Integration Guide (Portal)
1. Authentication & Base
Base URL: https://www.kwikapi.com

Auth: api_key (your secret key) is mandatory in all calls.​

Common header:

text
Content-Type: application/json
Accept: application/json
2. Master Data APIs
2.1 Biller Details API
Get details of a single operator (supports deciding bill-fetch, limits, service type).​

Endpoint

text
POST /api/v2/operatorFetch.php
Request (form-data)

json
api_key: YOUR_SECRET_KEY
opid: 53          // Integer, operator id
Success Response (example structure)

json
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
2.2 Circle Codes API
Use for mobile/DTH circle list in your UI.​

Endpoint

text
GET /api/v2/circle_codes.php?api_key=YOUR_SECRET_KEY
Response

json
{
  "response": [
    {
      "circle_name": "DELHI",
      "circle_code": "1"
    },
    {
      "circle_name": "Maharashtra",
      "circle_code": "4"
    }
    // ...
  ]
}
3. Bill Fetch (Postpaid, DTH, Electricity, etc.)
3.1 Bill Fetch v2
Use only for billers where bill_fetch = "YES" in Biller Details.​

Endpoint

text
GET /api/v2/bills/validation.php
Query Parameters

text
api_key  = YOUR_SECRET_KEY
number   = 12438555985          // Consumer / account / subscriber id
amount   = 10                   // Any dummy amount (string)
opid     = 65                   // Operator id
order_id = 478245232            // Your unique Txn ID (1–14 digits)
opt1     = opt1                 // Optional
opt2     = opt2                 // Optional
opt3     = opt3                 // Optional
opt4     = opt4                 // Optional
opt5     = opt5                 // Optional
opt6     = opt6                 // Optional
opt7     = opt7                 // Optional
opt8     = Bills                // Required literal
opt9     = opt9                 // Optional
opt10    = opt10                // Optional
mobile   = 9999999999           // Customer mobile (10 digits)
Success Response (structure)

json
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
Use ref_id, due_amount, etc. as input to your bill payment API.​

4. Wallet & Reporting APIs
4.1 Wallet Balance Fetch API
Use to display current wallet balance in your portal.​

Endpoint

text
GET /api/v2/balance.php?api_key=YOUR_SECRET_KEY
Response

json
{
  "response": {
    "balance": "271.67",
    "plan_credit": "9467"
  }
}
4.2 Transaction Status Fetch API
Use this to check final status (SUCCESS/FAILED/PENDING) of any recharge or bill payment. It is listed in the Postman collection; follow the same style as other GET APIs and always pass api_key and order_id.​

4.3 Last 100 Transactions Fetch API
Use for admin/user transaction list. It is a POST API in the collection; body will at least include api_key, with optional filters if shown in your Postman view.​

5. Recharge & Payment APIs (From Collection)
These are present in your Postman collection menu (names exactly):​

Purpose	Collection name	Notes
Prepaid / DTH Recharge	“Prepaid/DTH Recharge”	Use for mobile prepaid, DTH top-up.
Utility payments	“Utility Payments”	For electricity / other billers.
Postpaid/Fastag	“Postpaid/Fastag Recharge”	Marked Deprecated – avoid for new.
​

Each of these uses the same patterns as above:

Always include api_key, opid, number, amount, order_id, mobile.

For bill-based utilities, also send ref_id from Bill Fetch v2.

Use opt1–opt10 fields when the operator’s description (from Biller Details) says extra inputs like “pass Consumer Number in 'account'” etc.​

Refer to the exact request/response bodies under those three items in your Postman page and plug them into this structure for your Swagger/postman-to-code generation.​

6. Headers Summary
For all above APIs:

text
Content-Type: application/x-www-form-urlencoded   // for form-data style requests
Accept: application/json
Plus either:

api_key in query string (GET) or

api_key in body/form-data (POST), as shown in each example above.
For your portal (prepaid/postpaid mobile, DTH, electricity, bill fetch, payments, wallet balance, and status), you will need a fixed set of KWIKAPI endpoints with common auth and headers. Below is a concise list of the required APIs with method, URL, basic request structure, and typical response fields so you can wire your frontend and backend.

Common headers and auth
All APIs use the same authentication via api_key (your secret key).​

Send these headers with every request:​

Content-Type: application/json for JSON body requests, or application/x-www-form-urlencoded for form-data.

Optional: Accept: application/json.

Most GET APIs pass api_key as a query parameter; most POST APIs pass it in body/form-data.​

Reference / master data APIs
You should call these periodically and cache in your DB.

Circle codes (for mobile/DTH)
Purpose: Get list of telecom circles for prepaid/postpaid/DTH.​

Method & URL:
GET https://www.kwikapi.com/api/v2/circle_codes.php?api_key=YOUR_SECRET_KEY​

Request:

Query: api_key=YOUR_SECRET_KEY

Response (main fields):

response[]: each has circle_name, circle_code.​

Biller / operator details (find opid, bill_fetch support)
Purpose: Get details for a particular operator (mobile/DTH/electricity, etc.), including whether bill fetch is allowed, amount limits, and service type (PRE, PST, DTH, ELC, etc.).​

Method & URL:
POST https://www.kwikapi.com/api/v2/operatorFetch.php​

Body (form-data or JSON):

api_key (string)

opid (integer operator id returned from your master list UI or their operator list API)

Response (main fields):

success (bool), STATUS (“SUCCESS”/“FAILED”)

operator_name, operator_id, service_type (e.g., PRE, PST, DTH, ELC)

bill_fetch (“YES”/“NO”), bbps_enabled (“YES”/“NO`)

amount_minimum, amount_maximum, message.​

(If your documentation section has “Biller List API” and “Operator & Circle Fetch API”, use those similarly to get all operators filtered by service type for your dropdowns.)​

Bill fetch (for postpaid, DTH, electricity, etc.)
Use this when bill_fetch=YES for that operator.

Bill Fetch v2 (non-deprecated)
Purpose: Fetch bill details (amount, due date, customer name, bill number, etc.).​

Method & URL:
GET https://www.kwikapi.com/api/v2/bills/validation.php​

Required query params:

api_key = YOUR_SECRET_KEY

number = Consumer/account number (or mobile/DTH subscriber id as per operator)

amount = any dummy amount (string, e.g., 10)

opid = operator id

order_id = your unique transaction id (1–14 digits)

opt8 = "Bills" (required)

mobile = customer mobile (10-digit)

Optional query params:

opt1 … opt7, opt9, opt10 for extra inputs (cycle, subdivision, date of birth, etc. if required by operator).​

Response (main fields):

status, message

due_amount, due_date

customer_name

bill_number, bill_date, bill_period

ref_id (you will often need this ref_id in the actual bill-payment API).​

Payment APIs you will wire into your portal
Your KWIKAPI Postman collection has separate entries under “Payment APIs” for:​

Use case	Likely endpoint path (v2)	Method	Notes
Prepaid mobile/DTH	/api/v2/recharge.php or similar “Prepaid/DTH Recharge” entry	GET/POST	For mobile prepaid and DTH top-up. ​
Postpaid mobile	Deprecated Fastag/Postpaid recharge entry; use standard utility/bbps-style payment if bill-fetch based. ​		
Utility payments	/api/v2/bills/pay.php or equivalent “Utility Payments” entry	GET/POST	Used for electricity, water, gas, postpaid, etc. with ref_id. ​
Because your Postman page only partially shows these, use the exact endpoint names from the “Prepaid/DTH Recharge” and “Utility Payments” sections; the request pattern is typically:​

Typical request fields (Prepaid/DTH)
api_key – your key

number – mobile number or DTH card/customer id

amount – recharge amount

opid – operator id

order_id – unique transaction id

circle – circle code (for prepaid mobile where required)

mobile – customer contact mobile (often same as number)

Optional: opt1…opt10 depending on operator requirements.​

Typical request fields (Utility / bill payment)
api_key

number – consumer/account id

amount – bill amount (usually from bill fetch API)

opid – operator id

order_id – your transaction id

ref_id – from Bill Fetch v2 response (critical for BBPS-style payments)

mobile – customer mobile

opt* – any operator-specific extra fields.​

Typical payment response fields
status (“SUCCESS” / “FAILED” / “PENDING”)

message – human readable

order_id – your id

txid / rrn / operator_ref – gateway or operator reference

amount – debited amount

number – account/mobile number

Sometimes balance or commission.​

You will also need to implement:

Transaction Status Fetch API – to poll the final status when you get PENDING.

Last 100 Transactions Fetch API – for your admin/user transaction history screen.​

Wallet balance and status-related APIs
Wallet balance fetch
Purpose: Show available wallet balance in your portal for deciding if a recharge/payment can proceed.​

Method & URL:
GET https://www.kwikapi.com/api/v2/balance.php?api_key=YOUR_SECRET_KEY (or with api_key as param/body as in docs).​

Request:

Query: api_key=YOUR_SECRET_KEY

Response (main fields):

response.balance – current wallet balance

response.plan_credit – plan credit if applicable.​

Transaction status fetch
Purpose: Check the latest status of a recharge/bill payment.​

Endpoint: “Transaction Status Fetch Api” in your collection, usually something like:
GET /api/v2/status.php?api_key=...&order_id=...

Key params:

api_key

order_id (your transaction id sent originally).

Response:

status, message, gateway references, and sometimes full transaction object.​

Last 100 transactions
Purpose: Show a transaction list in your admin dashboard or user “My Orders” screen.​

Endpoint: “Last 100 Transactions Fetch Api” (POST).

Body:

api_key

Optional filters like from_date, to_date, service_type depending on their spec.

Response:

Array of transactions with order_id, amount, number, service_type, status, date_time.​

Minimal integration set for your use cases
For your portal, integrate at least these APIs:

Configuration / master data

Circle Codes API

Biller List / Operator & Circle Fetch API

Biller Details (operatorFetch) API.​

Bill-related

Bill Fetch v2 (validation.php).​

Payments

Prepaid/DTH Recharge API

Utility Payments API (for electricity, postpaid, other BBPS billers).​

Wallet and status

Wallet Balance Fetch API

Transaction Status Fetch API

Last 100 Transactions API.​

curl --location 'https://www.kwikapi.com/api/v2/operator_codes.php?api_key=4d3105-f2aaf2-1f5bcf-f40193'
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
      "operator_name": "Idea",
      "operator_id": "3",
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
      "operator_name": "Bsnl Topup",
      "operator_id": "4",
      "service_type": "Prepaid",
      "status": "0",
      "bill_fetch": "NO",
      "bbps_enabled": "NO",
      "message": "",
      "description": "",
      "amount_minimum": "10",
      "amount_maximum": "10000"
    },
    {
      "operator_name": "Bsnl Special",
      "operator_id": "5",
      "service_type": "Prepaid",
      "status": "0",
      "bill_fetch": "NO",
      "bbps_enabled": "NO",
      "message": "",
      "description": "",
      "amount_minimum": "10",
      "amount_maximum": "10000"
    },
    {
      "operator_name": "Reliance Jio",
      "operator_id": "8",
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
      "operator_name": "Telenor",
      "operator_id": "9",
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
      "operator_name": "Telenor Special",
      "operator_id": "10",
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
      "operator_name": "Videocon",
      "operator_id": "12",
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
      "operator_name": "Videocon Special",
      "operator_id": "13",
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
      "operator_name": "MTNL",
      "operator_id": "14",
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
      "operator_name": "MTNL Special",
      "operator_id": "15",
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
      "operator_name": "Tata Docomo",
      "operator_id": "18",
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
      "operator_name": "Tata Docomo Special",
      "operator_id": "19",
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
      "operator_name": "Vodafone",
      "operator_id": "21",
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
    },
    {
      "operator_name": "BIG TV DTH",
      "operator_id": "24",
      "service_type": "DTH",
      "status": "1",
      "bill_fetch": "NO",
      "bbps_enabled": "NO",
      "message": "",
      "description": "",
      "amount_minimum": "10",
      "amount_maximum": "10000"
    },
    {
      "operator_name": "DISH DTH",
      "operator_id": "25",
      "service_type": "DTH",
      "status": "1",
      "bill_fetch": "NO",
      "bbps_enabled": "NO",
      "message": "",
      "description": "",
      "amount_minimum": "10",
      "amount_maximum": "64490"
    },
    {
      "operator_name": "SUN DTH",
      "operator_id": "26",
      "service_type": "DTH",
      "status": "1",
      "bill_fetch": "NO",
      "bbps_enabled": "NO",
      "message": "",
      "description": "",
      "amount_minimum": "50",
      "amount_maximum": "5700"
    },
    {
      "operator_name": "TATA SKY DTH",
      "operator_id": "27",
      "service_type": "DTH",
      "status": "1",
      "bill_fetch": "NO",
      "bbps_enabled": "NO",
      "message": "",
      "description": "",
      "amount_minimum": "20",
      "amount_maximum": "30000"
    },
    {
      "operator_name": "VIDEOCON DTH",
      "operator_id": "28",
      "service_type": "DTH",
      "status": "1",
      "bill_fetch": "NO",
      "bbps_enabled": "NO",
      "message": "",
      "description": "",
      "amount_minimum": "50",
      "amount_maximum": "65000"
    },
    {
      "operator_name": "Vodafone Postpaid",
      "operator_id": "29",
      "service_type": "Postpaid",
      "status": "1",
      "bill_fetch": "NO",
      "bbps_enabled": "YES",
      "message": "",
      "description": "",
      "amount_minimum": "10",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Tata Docomo Postpaid",
      "operator_id": "32",
      "service_type": "Postpaid",
      "status": "1",
      "bill_fetch": "NO",
      "bbps_enabled": "YES",
      "message": "",
      "description": "",
      "amount_minimum": "10",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "BSNL Postpaid",
      "operator_id": "36",
      "service_type": "Postpaid",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "NO",
      "message": "",
      "description": "",
      "amount_minimum": "10",
      "amount_maximum": "200000"
    },
    {
      "operator_name": "MTS MBLAZE",
      "operator_id": "42",
      "service_type": "DATACARD",
      "status": "1",
      "bill_fetch": "NO",
      "bbps_enabled": "",
      "message": "",
      "description": "",
      "amount_minimum": "",
      "amount_maximum": ""
    },
    {
      "operator_name": "MTS MBROWSE",
      "operator_id": "43",
      "service_type": "DATACARD",
      "status": "1",
      "bill_fetch": "NO",
      "bbps_enabled": "",
      "message": "",
      "description": "",
      "amount_minimum": "",
      "amount_maximum": ""
    },
    {
      "operator_name": "RELIANCE NETCONNECT",
      "operator_id": "44",
      "service_type": "DATACARD",
      "status": "1",
      "bill_fetch": "NO",
      "bbps_enabled": "",
      "message": "",
      "description": "",
      "amount_minimum": "",
      "amount_maximum": ""
    },
    {
      "operator_name": "TATA PHOTON WHIZ",
      "operator_id": "45",
      "service_type": "DATACARD",
      "status": "1",
      "bill_fetch": "NO",
      "bbps_enabled": "",
      "message": "",
      "description": "",
      "amount_minimum": "",
      "amount_maximum": ""
    },
    {
      "operator_name": "TATA PHOTON MAX",
      "operator_id": "46",
      "service_type": "DATACARD",
      "status": "1",
      "bill_fetch": "NO",
      "bbps_enabled": "",
      "message": "",
      "description": "",
      "amount_minimum": "",
      "amount_maximum": ""
    },
    {
      "operator_name": "TATA PHOTON PLUS",
      "operator_id": "47",
      "service_type": "DATACARD",
      "status": "1",
      "bill_fetch": "NO",
      "bbps_enabled": "",
      "message": "",
      "description": "",
      "amount_minimum": "",
      "amount_maximum": ""
    },
    {
      "operator_name": "Airtel Postpaid",
      "operator_id": "48",
      "service_type": "Postpaid",
      "status": "1",
      "bill_fetch": "NO",
      "bbps_enabled": "YES",
      "message": "",
      "description": "",
      "amount_minimum": "10",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Idea Postpaid",
      "operator_id": "49",
      "service_type": "Postpaid",
      "status": "1",
      "bill_fetch": "NO",
      "bbps_enabled": "YES",
      "message": "",
      "description": "",
      "amount_minimum": "10",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "BSES Yamuna Power Limited - Delhi",
      "operator_id": "50",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "Paas CA Number in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "BSES Rajdhani Power Limited - Delhi",
      "operator_id": "51",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "Paas CA Number in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Uttar Gujarat Vij Company Limited - UGVCL",
      "operator_id": "53",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "NO",
      "bbps_enabled": "YES",
      "message": "pass Consumer Number in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "UHBVN - HARYANA",
      "operator_id": "54",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Account Number in \\'account\\' , Mobile Number in Optional 1",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "West Bengal State Electricity Distribution Nigam - WBSEDCL",
      "operator_id": "55",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Consumer ID in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Tata Power Delhi Distribution Limited - Delhi",
      "operator_id": "56",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass CA Number in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Dakshin Gujarat Vij Company Limited - DGVCL",
      "operator_id": "57",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "NO",
      "bbps_enabled": "YES",
      "message": "pass Consumer Number in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Madhya Gujarat Vij Company Limited - MGVCL",
      "operator_id": "58",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "NO",
      "bbps_enabled": "YES",
      "message": "pass Consumer Number in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Paschim Gujarat Vij Company Limited - PGVCL",
      "operator_id": "59",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "NO",
      "bbps_enabled": "YES",
      "message": "pass Consumer Number in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "CESC - WEST BENGAL",
      "operator_id": "60",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Consumer ID in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Jaipur Vidyut Vitran Nigam Ltd - RAJASTHAN",
      "operator_id": "61",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass K Number in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "North Bihar power distribution company ltd - NBPDCL",
      "operator_id": "63",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass CA Number in 'account'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "South Bihar power distribution company ltd - SBPDCL",
      "operator_id": "64",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass CA Number in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Andhra Pradesh Southern POWER Distribution Company - APSPDCL",
      "operator_id": "65",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Service Number in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "ANDHRA PRADESH Eastern POWER Distribution Company- APEPDCL",
      "operator_id": "66",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Service Number in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Madhya Kshetra Vitaran (Rural) - MADHYA PRADESH",
      "operator_id": "67",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "NO",
      "message": "pass IVRS in 'account'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Uttarakhand Power Corporation Ltd - UPCL",
      "operator_id": "68",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Service Connection Number in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "TSECL TRIPURA",
      "operator_id": "69",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Consumer ID in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "APDCL (RAPDR) - ASSAM",
      "operator_id": "70",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Consumer ID in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Brihan Mumbai Electric Supply and Transport Undertaking - BEST",
      "operator_id": "72",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Consumer Number in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Noida Power - Noida",
      "operator_id": "73",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Consumer Number in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Jamshedpur Utilities AND Services - JUSCO",
      "operator_id": "74",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Business Partner Number in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "India Power - WEST BENGAL",
      "operator_id": "75",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Consumer Number in 'account'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "MSEDC MAHARASHTRA",
      "operator_id": "76",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Consumer Number in \\'account\\' and Billing Unit in \\'optional1\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Jodhpur Vidyut Vitran Nigam - RAJASTHAN",
      "operator_id": "77",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass K Number in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "BESCOM BENGALURU",
      "operator_id": "78",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Consumer Number/Account Id in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "TAMIL NADU ELECTICITY BOARD -TNEB",
      "operator_id": "79",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Consumer Number in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "CSPDCL CHHATTISGARH",
      "operator_id": "83",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Business Partner Number in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Ajmer Vidyut Vitran Nigam - RAJASTHAN",
      "operator_id": "84",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass K Number in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Money Transfer",
      "operator_id": "86",
      "service_type": "Money Transfer",
      "status": "1",
      "bill_fetch": "NO",
      "bbps_enabled": "NO",
      "message": "&lt;table&gt;&lt;tbody&gt;&lt;tr&gt;     &lt;th&gt;Min Value / Transaction&lt;/th&gt;     &lt;th&gt;Max Value / Transaction&lt;/th&gt;     &lt;th&gt;Max Value / Remitter / Month&lt;/th&gt;   &lt;/tr&gt;   &lt;tr&gt;     &lt;td&gt;RS 10&lt;/td&gt;     &lt;td&gt;RS 5,000&lt;/td&gt;     &lt;td&gt;RS 25,000&lt;/td&gt;   &lt;/tr&gt;   &lt;/tbody&gt;&lt;/table&gt;",
      "description": "",
      "amount_minimum": "10",
      "amount_maximum": "5000"
    },
    {
      "operator_name": "UPPCL (URBAN) - UTTAR PRADESH",
      "operator_id": "88",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Consumer Number in \\'account\\'\r\n\r\nMIN LENGTH 10\r\nMAX LENGTH 12",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "UTI PAN",
      "operator_id": "89",
      "service_type": "PAN",
      "status": "1",
      "bill_fetch": "",
      "bbps_enabled": "",
      "message": "pass KwikOutlet ID in 'kwikoutlet_id'",
      "description": "",
      "amount_minimum": "0",
      "amount_maximum": "0"
    },
    {
      "operator_name": "Mahanagar Gas",
      "operator_id": "90",
      "service_type": "GAS",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Customer Account Number in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "200000"
    },
    {
      "operator_name": "Tripura Natural Gas",
      "operator_id": "91",
      "service_type": "GAS",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Consumer Number in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Siti Energy ",
      "operator_id": "92",
      "service_type": "GAS",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass ARN Number in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Sabarmati Gas",
      "operator_id": "93",
      "service_type": "GAS",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Customer ID in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Indraprastha Gas",
      "operator_id": "94",
      "service_type": "GAS",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass BP Number in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Haryana City Gas",
      "operator_id": "95",
      "service_type": "GAS",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass CRN Number in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Gujarat Gas",
      "operator_id": "96",
      "service_type": "GAS",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Customer ID in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Adani Gas",
      "operator_id": "97",
      "service_type": "GAS",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Customer ID in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "TPADL - AJMER",
      "operator_id": "98",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass K Number in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Uttarakhand Jal Sansthan",
      "operator_id": "99",
      "service_type": "Water",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Consumer Number (Last 7 Digits) in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Urban Improvement Trust (UIT) - BHIWADI",
      "operator_id": "100",
      "service_type": "Water",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Customer ID in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Municipal Corporation of Gurugram",
      "operator_id": "101",
      "service_type": "Water",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass K Number  in \\\\\\'account\\\\\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Delhi Jal Board",
      "operator_id": "102",
      "service_type": "Water",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass K No in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Tata Docomo CDMA (LL)",
      "operator_id": "103",
      "service_type": "Landline",
      "status": "1",
      "bill_fetch": "NO",
      "bbps_enabled": "YES",
      "message": "pass Landline Number with STD Code (without 0) in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "MTNL - Mumbai(LL)",
      "operator_id": "104",
      "service_type": "Landline",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Telephone Number  in \\'account\\' and Account Number in \\'optional1\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "MTNL - Delhi(LL)",
      "operator_id": "105",
      "service_type": "Landline",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Telephone Number in \\'account\\' and Account Number in \\'optional1\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "BSNL Individual(LL)",
      "operator_id": "106",
      "service_type": "Landline",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Account Number in \\'account\\',  Number with STD Code (without 0) in optional1",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Airtel(LL)",
      "operator_id": "107",
      "service_type": "Landline",
      "status": "1",
      "bill_fetch": "NO",
      "bbps_enabled": "YES",
      "message": "pass Landline Number with STD code in \\\\\\'account\\\\\\' ",
      "description": "",
      "amount_minimum": "10",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Tikona Broadband",
      "operator_id": "108",
      "service_type": "Broadband",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Service ID in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Connect Broadband",
      "operator_id": "109",
      "service_type": "Broadband",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Directory Number in \\'account\\'",
      "description": "",
      "amount_minimum": "100",
      "amount_maximum": "9999"
    },
    {
      "operator_name": "Tata Power - MUMBAI",
      "operator_id": "110",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Consumer Number in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Tata AIG General Insurance",
      "operator_id": "111",
      "service_type": "Insurance",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "NO",
      "message": "pass alphanumeric Policy Number in \\'account\\' and Date of Birth (DD-MM-YYYY) in \\'optional1\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Tata AIA Life Insurance",
      "operator_id": "112",
      "service_type": "Insurance",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "NO",
      "message": "pass alphanumeric Policy Number in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "ICICI Prudential Life Insurance",
      "operator_id": "113",
      "service_type": "Insurance",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "NO",
      "message": "pass Policy Number in \\'account\\' and Date of Birth (DD-MM-YYYY) in \\'optional1\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "UPPCL (RURAL) - UTTAR PRADESH",
      "operator_id": "114",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Consumer Number in \\'account\\'\r\n\r\nMIN LENGTH 12\r\nMAX LENGTH 12",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Reliance Jio Postpaid",
      "operator_id": "115",
      "service_type": "Postpaid",
      "status": "1",
      "bill_fetch": "NO",
      "bbps_enabled": "YES",
      "message": "pass Mobile Number in 'account'",
      "description": "",
      "amount_minimum": "10",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "SOUTHCO - ODISHA",
      "operator_id": "116",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Consumer Number in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "SNDL Power - NAGPUR",
      "operator_id": "117",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Consumer Number in \\\\\\'account\\\\\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "PSPCL - PUNJAB",
      "operator_id": "118",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Account Number in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "NESCO - ODISHA",
      "operator_id": "119",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Consumer Number in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "MEPDCL - MEGHALAYA",
      "operator_id": "121",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Consumer Number in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Kota Electricity Distribution - RAJASTHAN",
      "operator_id": "122",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass K Number in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "JBVNL - JHARKHAND",
      "operator_id": "123",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Consumer Number in \\'account\\' and Subdivision Code in \\'optional1\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Himachal Pradesh State Electricity Board",
      "operator_id": "125",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass K Number in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "HESCOM - KARNATAKA",
      "operator_id": "126",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "Account ID (RAPDRP) OR Consumer Number / Connection ID (Non-RAPDRP)",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "GESCOM - KARNATAKA",
      "operator_id": "127",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Consumer Number in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "DNHPDCL - DADRA &amp; NAGAR HAVELI",
      "operator_id": "128",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Service Connection Number in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "DHBVN - HARYANA",
      "operator_id": "129",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Account Number in \\'account\\' , Mobile Number in opt1",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Daman and Diu Electricity",
      "operator_id": "130",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Account Number in account",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "CESCOM - KARNATAKA",
      "operator_id": "131",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "Account ID (RAPDRP) OR Consumer Number / Connection ID (Non-RAPDRP)",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "BKESL - BIKANER",
      "operator_id": "132",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass K Number in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "BESL - BHARATPUR",
      "operator_id": "133",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass K Number in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "APDCL (Non-RAPDR) - ASSAM",
      "operator_id": "134",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Consumer ID in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "WESCO - ODISHA",
      "operator_id": "135",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Consumer Number in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Hathway Broadband",
      "operator_id": "136",
      "service_type": "Broadband",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Customer ID in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "ACT Fibernet",
      "operator_id": "137",
      "service_type": "Broadband",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Account Number / User Name in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Vadodara Gas",
      "operator_id": "138",
      "service_type": "GAS",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Consumer Number in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Unique Central Piped Gases",
      "operator_id": "139",
      "service_type": "GAS",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Customer No in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Maharashtra Natural Gas",
      "operator_id": "140",
      "service_type": "GAS",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass BP Number in \\'account\\'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "KESCO - KANPUR",
      "operator_id": "142",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Account Number in 'account'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Madhya Kshetra Vitaran (Urban) - MADHYA PRADESH",
      "operator_id": "143",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass IVRS in 'account'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Adani Electricity - MUMBAI",
      "operator_id": "144",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Consumer number in 'account'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "NDMC - DELHI",
      "operator_id": "145",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Consumer number in 'account'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Ujjain Nagar Nigam - PHED",
      "operator_id": "146",
      "service_type": "Water",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Business Partner Number in 'account'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Surat Municipal Corporation",
      "operator_id": "147",
      "service_type": "Water",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Connection Number Number in 'account'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Pune Municipal Corporation",
      "operator_id": "148",
      "service_type": "Water",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Consumer Number in 'account'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "New Delhi Municipal Council (NDMC)",
      "operator_id": "149",
      "service_type": "Water",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Consumer Number in 'account'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Municipal Corporation Ludhiana",
      "operator_id": "150",
      "service_type": "Water",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Consumer Number in 'account', Mobile Number in optional 1, Email Id  in optional 2",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Municipal Corporation Jalandhar",
      "operator_id": "151",
      "service_type": "Water",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Account Number in 'account', Consumer Mobile Number in optional 1, Consumer Email Id  in optional 2 , UID in optional 3",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Jabalpur Municipal Corporation",
      "operator_id": "152",
      "service_type": "Water",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Service Number in 'account'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Indore Municipal Corporation",
      "operator_id": "154",
      "service_type": "Water",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Service Number in 'account'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Hyderabad Metropolitan Water Supply and Sewerage Board",
      "operator_id": "155",
      "service_type": "Water",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass CAN Number in 'account'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Gwalior Municipal Corporation",
      "operator_id": "156",
      "service_type": "Water",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Connection ID in 'account'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Greater Warangal Municipal Corporation",
      "operator_id": "157",
      "service_type": "Water",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Connection ID in 'account'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Bhopal Municipal Corporation",
      "operator_id": "158",
      "service_type": "Water",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Connection ID in 'account'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Bangalore Water Supply and Sewerage Board",
      "operator_id": "159",
      "service_type": "Water",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass RR Number in 'account'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "IndianOil - Adani Gas",
      "operator_id": "160",
      "service_type": "Gas",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Customer ID in 'account'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Charotar Gas Sahakari Mandali",
      "operator_id": "161",
      "service_type": "Gas",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Customer Number in 'account'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Central UP Gas Limited",
      "operator_id": "163",
      "service_type": "Gas",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Customer Code / CRN Number in 'account'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Aavantika Gas",
      "operator_id": "164",
      "service_type": "Gas",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Customer Number in 'account'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "BSNL - Corporate",
      "operator_id": "165",
      "service_type": "Landline",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Account Number in 'account'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "TTN BroadBand",
      "operator_id": "166",
      "service_type": "Broadband",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass User Name in 'account'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Spectranet Broadband",
      "operator_id": "167",
      "service_type": "Broadband",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass CAN/Account ID in 'account'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Airtel Broadband",
      "operator_id": "168",
      "service_type": "Broadband",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Landline Number with STD code in 'account'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Nextra Broadband",
      "operator_id": "169",
      "service_type": "Broadband",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Consumer ID in 'account'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Torrent Power - SURAT",
      "operator_id": "170",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Service Number in 'account' , City in optional 1",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Torrent Power - BHIWANDI",
      "operator_id": "171",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Service Number in 'account' , City in optional 1",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Torrent Power - AHMEDABAD",
      "operator_id": "172",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Service Number in 'account' , City in optional 1",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Torrent Power - AGRA",
      "operator_id": "173",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "pass Service Number in 'account' , City in optional 1",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Sikkim Power (Rural)",
      "operator_id": "174",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "Contract Acc Number in 'account'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Poorv Kshetra Vitaran (Urban) - MADHYA PRADESH",
      "operator_id": "175",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "Consumer Number/IVRS in 'account'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Poorv Kshetra Vitaran (Rural) - MADHYA PRADESH",
      "operator_id": "176",
      "service_type": "ELC",
      "status": "1",
      "bill_fetch": "YES",
      "bbps_enabled": "YES",
      "message": "Consumer Number/IVRS in 'account'",
      "description": "",
      "amount_minimum": "1",
      "amount_maximum": "49999"
    },
    {
      "operator_name": "Airtel Official",
      "operator_id": "177",
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
      "operator_name": "Idea Official",
      "operator_id": "178",
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
      "operator_name": "Bsnl Topup Official",
      "operator_id": "179",
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
      "operator_name": "Bsnl Special Official",
      "operator_id": "180",
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
      "operator_name": "Jio Official",
      "operator_id": "181",
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
      "operator_name": "MTNL Official",
      "operator_id": "182",
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
      "operator_name": "MTNL Spl Official",
      "operator_id": "183",
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
      "operator_name": "Voda Official",
      "operator_id": "184",
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
      "operator_name": "Tata Sky Official",
      "operator_id": "185",
      "service_type": "DTH",
      "status": "1",
      "bill_fetch": "NO",
      "bbps_enabled": "NO",
      "message": "",
      "description": "",
      "amount_minimum": "10",
      "amount_maximum": "10000"
    },
    {
      "operator_name": "Sun Direct Official",
      "operator_id": "186",
      "service_type": "DTH",
      "status": "1",
      "bill_fetch": "NO",
      "bbps_enabled": "NO",
      "message": "",
      "description": "",
      "amount_minimum": "10",
      "amount_maximum": "10000"
    },
    {
      "operator_name": "Dish TV Official",
      "operator_id": "187",
      "service_type": "DTH",
      "status": "1",
      "bill_fetch": "NO",
      "bbps_enabled": "NO",
      "message": "",
      "description": "",
      "amount_minimum": "10",
      "amount_maximum": "10000"
    },
    {
      "operator_name": "Videocon D2h Official",
      "operator_id": "188",
      "service_type": "DTH",
      "status": "1",
      "bill_fetch": "NO",
      "bbps_enabled": "NO",
      "message": "",
      "description": "",
      "amount_minimum": "10",
      "amount_maximum": "10000"
    },
    {
      "operator_name": "Airtel DTH Official",
      "operator_id": "189",
      "service_type": "DTH",
      "status": "1",
      "bill_fetch": "NO",
      "bbps_enabled": "NO",
      "message": "",
      "description": "",
      "amount_minimum": "10",
      "amount_maximum": "10000"
    },
    {
      "operator_name": "Dish Tv NKL",
      "operator_id": "190",
      "service_type": "DTH",
      "status": "1",
      "bill_fetch": "NO",
      "bbps_enabled": "NO",
      "message": "this is only for Nikhil Singh with dealer  - nik550",
      "description": "",
      "amount_minimum": "10",
      "amount_maximum": "10000"
    },
    {
      "operator_name": "Jio SS02",
      "operator_id": "191",
      "service_type": "Prepaid",
      "status": "0",
      "bill_fetch": "NO",
      "bbps_enabled": "NO",
      "message": "",
      "description": "",
      "amount_minimum": "10",
      "amount_maximum": "10000"
    },
    {
      "operator_name": "Jio SS03",
      "operator_id": "192",
      "service_type": "Prepaid",
      "status": "0",
      "bill_fetch": "NO",
      "bbps_enabled": "NO",
      "message": "",
      "description": "",
      "amount_minimum": "10",
      "amount_maximum": "10000"
    },
    {
      "operator_name": "Airtel Mix",
      "operator_id": "193",
      "service_type": "Prepaid",
      "status": "1",
      "bill_fetch": "NO",
      "bbps_enabled": "NO",
      "message": "",
      "description": "",
      "amount_minimum": "10",
      "amount_maximum": "10000"
    }
  ]
}
curl --location 'https://www.kwikapi.com/api/v2/operatorFetch.php' \
--form 'api_key="4d3105-f2aaf2-1f5bcf-f40193-0a76DFF"' \
--form 'opid="53"'
{
  "success": true,
  "STATUS": "SUCCESS",
  "operator_name": "Uttar Gujarat Vij Company Limited - UGVCL",
  "operator_id": "53",
  "service_type": "ELC",
  "status": "1",
  "bill_fetch": "NO",
  "bbps_enabled": "YES",
  "message": "pass Consumer Number in \\'account\\'",
  "description": "",
  "amount_minimum": "1",
  "amount_maximum": "49999"
}
curl --location 'https://www.kwikapi.com/api/v2/circle_codes.php?api_key=4d3105-f2aaf2-1f5bcf-f40193-0a76DFF'
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
    },
    {
      "circle_name": "Karnataka",
      "circle_code": "7"
    },
    {
      "circle_name": "Gujarat",
      "circle_code": "8"
    },
    {
      "circle_name": "UTTAR PRADESH(East)",
      "circle_code": "9"
    },
    {
      "circle_name": "Madhya Pradesh",
      "circle_code": "10"
    },
    {
      "circle_name": "West Bengal",
      "circle_code": "12"
    },
    {
      "circle_name": "Rajasthan",
      "circle_code": "13"
    },
    {
      "circle_name": "Kerala",
      "circle_code": "14"
    },
    {
      "circle_name": "Punjab",
      "circle_code": "15"
    },
    {
      "circle_name": "Haryana",
      "circle_code": "16"
    },
    {
      "circle_name": "Bihar",
      "circle_code": "17"
    },
    {
      "circle_name": "ODISHA",
      "circle_code": "18"
    },
    {
      "circle_name": "Assam",
      "circle_code": "19"
    },
    {
      "circle_name": "Himachal Pradesh",
      "circle_code": "21"
    },
    {
      "circle_name": "Jammu And Kashmir",
      "circle_code": "22"
    },
    {
      "circle_name": "Jharkhand",
      "circle_code": "24"
    },
    {
      "circle_name": "CHHATTISGARH",
      "circle_code": "25"
    },
    {
      "circle_name": "GOA",
      "circle_code": "26"
    },
    {
      "circle_name": "MANIPUR",
      "circle_code": "27"
    },
    {
      "circle_name": "MEGHALAYA",
      "circle_code": "28"
    },
    {
      "circle_name": "MIZORAM",
      "circle_code": "29"
    },
    {
      "circle_name": "NAGALAND",
      "circle_code": "30"
    },
    {
      "circle_name": "SIKKIM",
      "circle_code": "31"
    },
    {
      "circle_name": "TRIPURA",
      "circle_code": "32"
    },
    {
      "circle_name": "UTTARAKHAND",
      "circle_code": "33"
    },
    {
      "circle_name": "ANDAMAN AND NICOBAR",
      "circle_code": "34"
    },
    {
      "circle_name": "CHANDIGARH",
      "circle_code": "35"
    },
    {
      "circle_name": "DADRA AND NAGAR HAVELI",
      "circle_code": "36"
    },
    {
      "circle_name": "DAMAN AND DIU",
      "circle_code": "37"
    },
    {
      "circle_name": "LAKSHADWEEP",
      "circle_code": "38"
    },
    {
      "circle_name": "PUDUCHERRY",
      "circle_code": "39"
    },
    {
      "circle_name": "TELANGANA",
      "circle_code": "40"
    },
    {
      "circle_name": "ARUNACHAL PRADESH",
      "circle_code": "41"
    },
    {
      "circle_name": "UTTAR PRADESH(West)",
      "circle_code": "2"
    }
  ]
}
curl --location 'https://www.kwikapi.com/api/v2/bills/validation.php?api_key=4d3105-f2aaf2-1f5bcf-f40193-0a76DFF&number=12430005985&amount=10&opid=63&order_id=478245232&opt1=opt1&opt2=opt2&opt3=opt3&opt4=opt4&opt5=opt5&opt6=opt6&opt7=opt7&opt8=Billls&opt9=opt9&opt10=opt10'
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
curl --location 'https://www.kwikapi.com/api/v2/balance.php'
{
  "response": {
    "balance": "271.67",
    "plan_credit": "9467"
  }
}

curl --location 'https://www.kwikapi.com/api/v2/status.php?api_key=4d3105-f2aaf2-1f5bcf-f40193-0a76DFF&order_id=2439418'

{
  "response": {
    "order_id": "2439418",
    "operator_ref": "BR044989",
    "status": "SUCCESS",
    "number": "124385",
    "amount": "1885.00",
    "service": "North Bihar power distribution company ltd - NBPDCL",
    "charged_amount": "1850",
    "closing_balance": "271.67",
    "available_balance": "0",
    "pid": "7485412",
    "date": "2020-07-07 15:21:42"
  }
}

curl --location 'https://www.kwikapi.com/api/v2/transactions.php?api_key=6AASASASASS'
[
  {
    "trx_id": "2439956",
    "your_id": "15941191532587",
    "number": "70451550381",
    "number2": null,
    "ref_id": "14132909",
    "amount": "220",
    "charged_amount": "212.74",
    "date": "2020-07-07 16:22:33",
    "status": "SUCCESS",
    "service": "SUN DTH"
  },
  {
    "trx_id": "2431807",
    "your_id": "15940443156175",
    "number": "1330889849",
    "number2": null,
    "ref_id": "TV2007061635047665Sanju  Zalaki",
    "amount": "234",
    "charged_amount": "226.98",
    "date": "2020-07-06 19:35:16",
    "status": "SUCCESS",
    "service": "TATA SKY DTH"
  },
  {
    "trx_id": "2431540",
    "your_id": "15940425549246",
    "number": "10562628866",
    "number2": null,
    "ref_id": "14053087",
    "amount": "278",
    "charged_amount": "268.83",
    "date": "2020-07-06 19:05:55",
    "status": "SUCCESS",
    "service": "SUN DTH"
  },
  {
    "trx_id": "2431503",
    "your_id": "15940421852935",
    "number": "94665223",
    "number2": null,
    "ref_id": "WREC66035391 KRISHNAPPA SHANKREPPA TALAKERI",
    "amount": "290",
    "charged_amount": "278.69",
    "date": "2020-07-06 18:59:46",
    "status": "SUCCESS",
    "service": "VIDEOCON DTH"
  },
  {
    "trx_id": "2431439",
    "your_id": null,
    "number": "9448608706",
    "number2": null,
    "ref_id": "018818830262",
    "amount": "2000",
    "charged_amount": "2000",
    "date": "2020-07-06 18:52:53",
    "status": "CREDIT",
    "service": "WALLET"
  },
  {
    "trx_id": "2430914",
    "your_id": "15940383938911",
    "number": "1230031625",
    "number2": null,
    "ref_id": "TV2007061634947173Mr. Malakaresedd  Khota",
    "amount": "268",
    "charged_amount": "259.96",
    "date": "2020-07-06 17:56:33",
    "status": "SUCCESS",
    "service": "TATA SKY DTH"
  },
  {
    "trx_id": "2429736",
    "your_id": "15940274641322",
    "number": "02542016972",
    "number2": null,
    "ref_id": "ROER179947619-Grimalla Hosama",
    "amount": "200",
    "charged_amount": "192.20",
    "date": "2020-07-06 14:54:24",
    "status": "SUCCESS",
    "service": "DISH DTH"
  },
  {
    "trx_id": "2429413",
    "your_id": "15940246211198",
    "number": "1342812946",
    "number2": null,
    "ref_id": "TV2007061634814017LAXMAN  BADIGER",
    "amount": "404",
    "charged_amount": "391.88",
    "date": "2020-07-06 14:07:02",
    "status": "SUCCESS",
    "service": "TATA SKY DTH"
  },
  {
    "trx_id": "2429398",
    "your_id": "15940245131034",
    "number": "9483750054",
    "number2": null,
    "ref_id": "4802244012",
    "amount": "20",
    "charged_amount": "19.00",
    "date": "2020-07-06 14:05:14",
    "status": "SUCCESS",
    "service": "Bsnl Topup"
  },
  {
    "trx_id": "2429319",
    "your_id": null,
    "number": "9448608706",
    "number2": null,
    "ref_id": "018813987877",
    "amount": "900",
    "charged_amount": "900",
    "date": "2020-07-06 13:57:42",
    "status": "CREDIT",
    "service": "WALLET"
  },
  {
    "trx_id": "2413671",
    "your_id": "15938702879670",
    "number": "9480207963",
    "number2": null,
    "ref_id": "2417771340",
    "amount": "50",
    "charged_amount": "47.50",
    "date": "2020-07-04 19:14:47",
    "status": "SUCCESS",
    "service": "Bsnl Topup"
  },
  {
    "trx_id": "2396522",
    "your_id": "1593700523502",
    "number": "1136829981",
    "number2": null,
    "ref_id": "TV2007021632528435MR",
    "amount": "153",
    "charged_amount": "148.41",
    "date": "2020-07-02 20:05:23",
    "status": "SUCCESS",
    "service": "TATA SKY DTH"
  },
  {
    "trx_id": "2394785",
    "your_id": "15936873944252",
    "number": "9449325652",
    "number2": null,
    "ref_id": "2394784",
    "amount": "75",
    "charged_amount": "71.25",
    "date": "2020-07-02 16:26:36",
    "status": "REVERSAL",
    "service": "Bsnl Special"
  },
  {
    "trx_id": "2394784",
    "your_id": "15936873944252",
    "number": "9449325652",
    "number2": null,
    "ref_id": "2394785",
    "amount": "75",
    "charged_amount": "71.25",
    "date": "2020-07-02 16:26:34",
    "status": "FAILED",
    "service": "Bsnl Special"
  },
  {
    "trx_id": "2394250",
    "your_id": "15936829602287",
    "number": "9481839001",
    "number2": null,
    "ref_id": "4797212656",
    "amount": "20",
    "charged_amount": "19.00",
    "date": "2020-07-02 15:12:41",
    "status": "SUCCESS",
    "service": "Bsnl Topup"
  },
  {
    "trx_id": "2388527",
    "your_id": "15936160656007",
    "number": "8277442834",
    "number2": null,
    "ref_id": "2414719597",
    "amount": "10",
    "charged_amount": "9.50",
    "date": "2020-07-01 20:37:45",
    "status": "SUCCESS",
    "service": "Bsnl Topup"
  },
  {
    "trx_id": "2388518",
    "your_id": "15936160084682",
    "number": "8277442834",
    "number2": null,
    "ref_id": "2414718891",
    "amount": "75",
    "charged_amount": "71.25",
    "date": "2020-07-01 20:36:49",
    "status": "SUCCESS",
    "service": "Bsnl Special"
  },
  {
    "trx_id": "2386453",
    "your_id": "15936014785611",
    "number": "8277371654",
    "number2": null,
    "ref_id": "2414426366",
    "amount": "20",
    "charged_amount": "19.00",
    "date": "2020-07-01 16:34:39",
    "status": "SUCCESS",
    "service": "Bsnl Topup"
  },
  {
    "trx_id": "2386449",
    "your_id": "15936014522893",
    "number": "8277371654",
    "number2": null,
    "ref_id": "2414425803",
    "amount": "75",
    "charged_amount": "71.25",
    "date": "2020-07-01 16:34:13",
    "status": "SUCCESS",
    "service": "Bsnl Special"
  },
  {
    "trx_id": "2386248",
    "your_id": "15935993313211",
    "number": "9141086455",
    "number2": null,
    "ref_id": "2414388943",
    "amount": "30",
    "charged_amount": "28.50",
    "date": "2020-07-01 15:58:52",
    "status": "SUCCESS",
    "service": "Bsnl Topup"
  },
  {
    "trx_id": "2386237",
    "your_id": "15935992765974",
    "number": "8277217445",
    "number2": null,
    "ref_id": "2414387289",
    "amount": "20",
    "charged_amount": "19.00",
    "date": "2020-07-01 15:57:56",
    "status": "SUCCESS",
    "service": "Bsnl Topup"
  },
  {
    "trx_id": "2385357",
    "your_id": "15935918416942",
    "number": "9482057058",
    "number2": null,
    "ref_id": "2414263259",
    "amount": "20",
    "charged_amount": "19.00",
    "date": "2020-07-01 13:54:01",
    "status": "SUCCESS",
    "service": "Bsnl Topup"
  },
  {
    "trx_id": "2385353",
    "your_id": "15935918143863",
    "number": "9482057058",
    "number2": null,
    "ref_id": "2414262902",
    "amount": "75",
    "charged_amount": "71.25",
    "date": "2020-07-01 13:53:35",
    "status": "SUCCESS",
    "service": "Bsnl Special"
  },
  {
    "trx_id": "2384418",
    "your_id": "15935855825068",
    "number": "9482399835",
    "number2": null,
    "ref_id": "2414115532",
    "amount": "75",
    "charged_amount": "71.25",
    "date": "2020-07-01 12:09:43",
    "status": "SUCCESS",
    "service": "Bsnl Special"
  },
  {
    "trx_id": "2380290",
    "your_id": "15935331369432",
    "number": "1254594425",
    "number2": null,
    "ref_id": "TV2006301631310785",
    "amount": "172",
    "charged_amount": "166.84",
    "date": "2020-06-30 21:35:36",
    "status": "SUCCESS",
    "service": "TATA SKY DTH"
  },
  {
    "trx_id": "2380111",
    "your_id": "15935317747076",
    "number": "1254594425",
    "number2": null,
    "ref_id": "TV2006301631295683",
    "amount": "100",
    "charged_amount": "97.00",
    "date": "2020-06-30 21:12:54",
    "status": "SUCCESS",
    "service": "TATA SKY DTH"
  },
  {
    "trx_id": "2378176",
    "your_id": "15935196292190",
    "number": "70431116287",
    "number2": null,
    "ref_id": "123319817",
    "amount": "629",
    "charged_amount": "608.24",
    "date": "2020-06-30 17:50:30",
    "status": "SUCCESS",
    "service": "SUN DTH"
  },
  {
    "trx_id": "2378118",
    "your_id": null,
    "number": "9448608706",
    "number2": null,
    "ref_id": "018216659187",
    "amount": "1500",
    "charged_amount": "1500",
    "date": "2020-06-30 17:43:09",
    "status": "CREDIT",
    "service": "WALLET"
  },
  {
    "trx_id": "2375783",
    "your_id": "15934983527263",
    "number": "1337257933",
    "number2": null,
    "ref_id": "TV2006301630875290Mr",
    "amount": "130",
    "charged_amount": "126.10",
    "date": "2020-06-30 11:55:53",
    "status": "SUCCESS",
    "service": "TATA SKY DTH"
  },
  {
    "trx_id": "2374573",
    "your_id": "15934915947632",
    "number": "1245898901",
    "number2": null,
    "ref_id": "TV2006301630791139MR",
    "amount": "50",
    "charged_amount": "48.50",
    "date": "2020-06-30 10:03:14",
    "status": "SUCCESS",
    "service": "TATA SKY DTH"
  },
  {
    "trx_id": "2369972",
    "your_id": "15934314481714",
    "number": "10557135430",
    "number2": null,
    "ref_id": "122877643",
    "amount": "278",
    "charged_amount": "268.83",
    "date": "2020-06-29 17:20:49",
    "status": "SUCCESS",
    "service": "SUN DTH"
  },
  {
    "trx_id": "2369505",
    "your_id": "15934273791386",
    "number": "1197247602",
    "number2": null,
    "ref_id": "TV2006291630395355SAVITA",
    "amount": "234",
    "charged_amount": "226.98",
    "date": "2020-06-29 16:13:00",
    "status": "SUCCESS",
    "service": "TATA SKY DTH"
  },
  {
    "trx_id": "2369117",
    "your_id": "15934237506461",
    "number": "8152055830",
    "number2": null,
    "ref_id": "2412031322",
    "amount": "30",
    "charged_amount": "28.50",
    "date": "2020-06-29 15:12:30",
    "status": "SUCCESS",
    "service": "Bsnl Topup"
  },
  {
    "trx_id": "2367106",
    "your_id": "15934133045640",
    "number": "8762931417",
    "number2": null,
    "ref_id": "2411808906",
    "amount": "75",
    "charged_amount": "71.25",
    "date": "2020-06-29 12:18:24",
    "status": "SUCCESS",
    "service": "Bsnl Special"
  },
  {
    "trx_id": "2365514",
    "your_id": "15934044021910",
    "number": "9591958066",
    "number2": null,
    "ref_id": "ORR2006290950210053",
    "amount": "49",
    "charged_amount": "47.04",
    "date": "2020-06-29 09:50:03",
    "status": "SUCCESS",
    "service": "Idea"
  },
  {
    "trx_id": "2361268",
    "your_id": "1593348389478",
    "number": "150201989",
    "number2": null,
    "ref_id": "WREC64863512 SHARANA  BASAPPA",
    "amount": "322",
    "charged_amount": "309.44",
    "date": "2020-06-28 18:16:29",
    "status": "SUCCESS",
    "service": "VIDEOCON DTH"
  },
  {
    "trx_id": "2360328",
    "your_id": "15933392518590",
    "number": "9620098126",
    "number2": null,
    "ref_id": "2411052403",
    "amount": "10",
    "charged_amount": "9.50",
    "date": "2020-06-28 15:44:12",
    "status": "SUCCESS",
    "service": "Bsnl Topup"
  },
  {
    "trx_id": "2359955",
    "your_id": "1593335754972",
    "number": "41123305561",
    "number2": null,
    "ref_id": "122415473",
    "amount": "25",
    "charged_amount": "24.18",
    "date": "2020-06-28 14:45:55",
    "status": "SUCCESS",
    "service": "SUN DTH"
  },
  {
    "trx_id": "2359940",
    "your_id": "15933356341551",
    "number": "41123305561",
    "number2": null,
    "ref_id": "122414978",
    "amount": "220",
    "charged_amount": "212.74",
    "date": "2020-06-28 14:43:55",
    "status": "SUCCESS",
    "service": "SUN DTH"
  },
  {
    "trx_id": "2358761",
    "your_id": null,
    "number": "9448608706",
    "number2": null,
    "ref_id": "018011917217",
    "amount": "1250",
    "charged_amount": "1250",
    "date": "2020-06-28 11:52:41",
    "status": "CREDIT",
    "service": "WALLET"
  },
  {
    "trx_id": "2355624",
    "your_id": "15932728012472",
    "number": "3026196190",
    "number2": null,
    "ref_id": "766268372-RAHIMAN",
    "amount": "240",
    "charged_amount": "232.56",
    "date": "2020-06-27 21:16:41",
    "status": "SUCCESS",
    "service": "AIRTEL DTH"
  },
  {
    "trx_id": "2353311",
    "your_id": null,
    "number": "9448586751",
    "number2": null,
    "ref_id": "2353309",
    "amount": "50",
    "charged_amount": "47.50",
    "date": "2020-06-27 17:31:42",
    "status": "REFUNDED",
    "service": "Bsnl Topup"
  },
  {
    "trx_id": "2353309",
    "your_id": "15932592958083",
    "number": "9448586751",
    "number2": null,
    "ref_id": "2353311",
    "amount": "50",
    "charged_amount": "47.50",
    "date": "2020-06-27 17:31:35",
    "status": "FAILED",
    "service": "Bsnl Topup"
  },
  {
    "trx_id": "2353004",
    "your_id": "15932568259191",
    "number": "8265004385",
    "number2": null,
    "ref_id": "BR0004ULQ9HU",
    "amount": "20",
    "charged_amount": "19.12",
    "date": "2020-06-27 16:50:26",
    "status": "SUCCESS",
    "service": "Reliance Jio"
  },
  {
    "trx_id": "2351296",
    "your_id": "15932439723269",
    "number": "89097246",
    "number2": null,
    "ref_id": "WREC64695704 KIRANKUMAR S CHAUHAN",
    "amount": "290",
    "charged_amount": "278.69",
    "date": "2020-06-27 13:16:13",
    "status": "SUCCESS",
    "service": "VIDEOCON DTH"
  },
  {
    "trx_id": "2351166",
    "your_id": "15932430662017",
    "number": "02543319555",
    "number2": null,
    "ref_id": "ROER179055996-raju hosamani",
    "amount": "352",
    "charged_amount": "338.27",
    "date": "2020-06-27 13:01:07",
    "status": "SUCCESS",
    "service": "DISH DTH"
  },
  {
    "trx_id": "2351163",
    "your_id": null,
    "number": "9448608706",
    "number2": null,
    "ref_id": "017912653042",
    "amount": "800",
    "charged_amount": "800",
    "date": "2020-06-27 13:00:50",
    "status": "CREDIT",
    "service": "WALLET"
  },
  {
    "trx_id": "2350327",
    "your_id": "15932380009626",
    "number": "9449327511",
    "number2": null,
    "ref_id": "5602413512",
    "amount": "20",
    "charged_amount": "19.00",
    "date": "2020-06-27 11:36:41",
    "status": "SUCCESS",
    "service": "Bsnl Topup"
  },
  {
    "trx_id": "2350312",
    "your_id": "15932379604113",
    "number": "9449327511",
    "number2": null,
    "ref_id": "5602411350",
    "amount": "75",
    "charged_amount": "71.25",
    "date": "2020-06-27 11:36:01",
    "status": "SUCCESS",
    "service": "Bsnl Special"
  },
  {
    "trx_id": "2343388",
    "your_id": "15931729007640",
    "number": "02543187036",
    "number2": null,
    "ref_id": "ROER178981866-SANJIVU CHOUVAN",
    "amount": "220",
    "charged_amount": "211.42",
    "date": "2020-06-26 17:31:41",
    "status": "SUCCESS",
    "service": "DISH DTH"
  },
  {
    "trx_id": "2343125",
    "your_id": "15931708467449",
    "number": "02543150497",
    "number2": null,
    "ref_id": "ROER178977369-Mahadev Nijappa",
    "amount": "1074",
    "charged_amount": "1032.11",
    "date": "2020-06-26 16:57:26",
    "status": "SUCCESS",
    "service": "DISH DTH"
  },
  {
    "trx_id": "2343059",
    "your_id": null,
    "number": "9448608706",
    "number2": null,
    "ref_id": "017816893083",
    "amount": "1500",
    "charged_amount": "1500",
    "date": "2020-06-26 16:49:01",
    "status": "CREDIT",
    "service": "WALLET"
  },
  {
    "trx_id": "2334867",
    "your_id": "15930951348981",
    "number": "8970910492",
    "number2": null,
    "ref_id": "ORR2006251955250100",
    "amount": "49",
    "charged_amount": "47.04",
    "date": "2020-06-25 19:55:35",
    "status": "SUCCESS",
    "service": "Idea"
  },
  {
    "trx_id": "2328397",
    "your_id": "1593057498863",
    "number": "9916161413",
    "number2": null,
    "ref_id": "RBR2006250928230036",
    "amount": "49",
    "charged_amount": "47.04",
    "date": "2020-06-25 09:28:19",
    "status": "SUCCESS",
    "service": "Vodafone"
  },
  {
    "trx_id": "2325174",
    "your_id": "15930094064742",
    "number": "9011618845",
    "number2": null,
    "ref_id": "MP0624200725000010",
    "amount": "39",
    "charged_amount": "37.44",
    "date": "2020-06-24 20:06:46",
    "status": "SUCCESS",
    "service": "Idea"
  },
  {
    "trx_id": "2325159",
    "your_id": "15930093264027",
    "number": "9763494372",
    "number2": null,
    "ref_id": "MP0624200528000171",
    "amount": "219",
    "charged_amount": "210.24",
    "date": "2020-06-24 20:05:26",
    "status": "SUCCESS",
    "service": "Idea"
  },
  {
    "trx_id": "2324551",
    "your_id": "15930060294139",
    "number": "3016629179",
    "number2": null,
    "ref_id": "758898003-Sidaray",
    "amount": "200",
    "charged_amount": "193.80",
    "date": "2020-06-24 19:10:29",
    "status": "SUCCESS",
    "service": "AIRTEL DTH"
  },
  {
    "trx_id": "2324013",
    "your_id": "15930027344799",
    "number": "10189010407",
    "number2": null,
    "ref_id": "120979929",
    "amount": "220",
    "charged_amount": "212.74",
    "date": "2020-06-24 18:15:35",
    "status": "SUCCESS",
    "service": "SUN DTH"
  },
  {
    "trx_id": "2323800",
    "your_id": "15930010929544",
    "number": "1209406824",
    "number2": null,
    "ref_id": "TV2006241627527531MEHEBOOB",
    "amount": "240",
    "charged_amount": "232.80",
    "date": "2020-06-24 17:48:13",
    "status": "SUCCESS",
    "service": "TATA SKY DTH"
  },
  {
    "trx_id": "2323512",
    "your_id": null,
    "number": "9448608706",
    "number2": null,
    "ref_id": "017617927985",
    "amount": "1000",
    "charged_amount": "1000",
    "date": "2020-06-24 17:10:55",
    "status": "CREDIT",
    "service": "WALLET"
  },
  {
    "trx_id": "2323263",
    "your_id": "15929963192016",
    "number": "7353594006",
    "number2": null,
    "ref_id": "KKR2006241628300138",
    "amount": "10",
    "charged_amount": "9.60",
    "date": "2020-06-24 16:28:39",
    "status": "SUCCESS",
    "service": "Idea"
  },
  {
    "trx_id": "2322484",
    "your_id": "15929891569646",
    "number": "226739855",
    "number2": null,
    "ref_id": "WREC64285775 N A NADAF",
    "amount": "312",
    "charged_amount": "299.83",
    "date": "2020-06-24 14:29:16",
    "status": "SUCCESS",
    "service": "VIDEOCON DTH"
  },
  {
    "trx_id": "2321865",
    "your_id": "15929851096546",
    "number": "9448917440",
    "number2": null,
    "ref_id": "2406827304",
    "amount": "99",
    "charged_amount": "94.05",
    "date": "2020-06-24 13:21:50",
    "status": "SUCCESS",
    "service": "Bsnl Special"
  },
  {
    "trx_id": "2321722",
    "your_id": "15929839241324",
    "number": "7090800836",
    "number2": null,
    "ref_id": "OR0624130229000082",
    "amount": "36",
    "charged_amount": "34.56",
    "date": "2020-06-24 13:02:05",
    "status": "SUCCESS",
    "service": "Idea"
  },
  {
    "trx_id": "2321578",
    "your_id": "15929830007078",
    "number": "02538288052",
    "number2": null,
    "ref_id": "ROER178763780-Prasuram Vattar",
    "amount": "306",
    "charged_amount": "294.07",
    "date": "2020-06-24 12:46:41",
    "status": "SUCCESS",
    "service": "DISH DTH"
  },
  {
    "trx_id": "2321466",
    "your_id": "15929822074931",
    "number": "70496077416",
    "number2": null,
    "ref_id": "120859694",
    "amount": "278",
    "charged_amount": "268.83",
    "date": "2020-06-24 12:33:28",
    "status": "SUCCESS",
    "service": "SUN DTH"
  },
  {
    "trx_id": "2321419",
    "your_id": null,
    "number": "9448608706",
    "number2": null,
    "ref_id": "017612896470",
    "amount": "1000",
    "charged_amount": "1000",
    "date": "2020-06-24 12:29:40",
    "status": "CREDIT",
    "service": "WALLET"
  },
  {
    "trx_id": "2321246",
    "your_id": "1592980836636",
    "number": "9739751081",
    "number2": null,
    "ref_id": "KKH2006241210290088",
    "amount": "129",
    "charged_amount": "123.84",
    "date": "2020-06-24 12:10:37",
    "status": "SUCCESS",
    "service": "Vodafone"
  },
  {
    "trx_id": "2317686",
    "your_id": "15929270559527",
    "number": "7353145010",
    "number2": null,
    "ref_id": "OR0623211429000044",
    "amount": "49",
    "charged_amount": "47.04",
    "date": "2020-06-23 21:14:15",
    "status": "SUCCESS",
    "service": "Idea"
  },
  {
    "trx_id": "2317669",
    "your_id": "1592926825493",
    "number": "3020821795",
    "number2": null,
    "ref_id": "756902992-MAHEBOOBTAMBOLI",
    "amount": "330",
    "charged_amount": "319.77",
    "date": "2020-06-23 21:10:26",
    "status": "SUCCESS",
    "service": "AIRTEL DTH"
  },
  {
    "trx_id": "2317607",
    "your_id": "15929261559342",
    "number": "02537956436",
    "number2": null,
    "ref_id": "ROER178728449-Noorahmed Shekh",
    "amount": "300",
    "charged_amount": "288.30",
    "date": "2020-06-23 20:59:15",
    "status": "SUCCESS",
    "service": "DISH DTH"
  },
  {
    "trx_id": "2317602",
    "your_id": "15929261086343",
    "number": "41023822293",
    "number2": null,
    "ref_id": "120685168",
    "amount": "220",
    "charged_amount": "212.74",
    "date": "2020-06-23 20:58:28",
    "status": "SUCCESS",
    "service": "SUN DTH"
  },
  {
    "trx_id": "2317587",
    "your_id": null,
    "number": "9448608706",
    "number2": null,
    "ref_id": "017520858626",
    "amount": "1000",
    "charged_amount": "1000",
    "date": "2020-06-23 20:55:55",
    "status": "CREDIT",
    "service": "WALLET"
  },
  {
    "trx_id": "2317389",
    "your_id": "15929241402806",
    "number": "9481338065",
    "number2": null,
    "ref_id": "2406187887",
    "amount": "20",
    "charged_amount": "19.00",
    "date": "2020-06-23 20:25:40",
    "status": "SUCCESS",
    "service": "Bsnl Topup"
  },
  {
    "trx_id": "2317194",
    "your_id": "15929225487070",
    "number": "41327974956",
    "number2": null,
    "ref_id": "120655074",
    "amount": "220",
    "charged_amount": "212.74",
    "date": "2020-06-23 19:59:08",
    "status": "SUCCESS",
    "service": "SUN DTH"
  },
  {
    "trx_id": "2314613",
    "your_id": "15929016005143",
    "number": "9482711310",
    "number2": null,
    "ref_id": "2405750460",
    "amount": "75",
    "charged_amount": "71.25",
    "date": "2020-06-23 14:10:01",
    "status": "SUCCESS",
    "service": "Bsnl Special"
  },
  {
    "trx_id": "2314254",
    "your_id": "15928989974854",
    "number": "1245898901",
    "number2": null,
    "ref_id": "TV2006231626817618",
    "amount": "50",
    "charged_amount": "48.50",
    "date": "2020-06-23 13:26:37",
    "status": "SUCCESS",
    "service": "TATA SKY DTH"
  },
  {
    "trx_id": "2314110",
    "your_id": "15928981253478",
    "number": "8970273511",
    "number2": null,
    "ref_id": "OR0623131226000088",
    "amount": "149",
    "charged_amount": "143.04",
    "date": "2020-06-23 13:12:05",
    "status": "SUCCESS",
    "service": "Idea"
  },
  {
    "trx_id": "2313540",
    "your_id": "15928945473869",
    "number": "1174499846",
    "number2": null,
    "ref_id": "TV2006231626767134",
    "amount": "200",
    "charged_amount": "194.00",
    "date": "2020-06-23 12:12:28",
    "status": "SUCCESS",
    "service": "TATA SKY DTH"
  },
  {
    "trx_id": "2313057",
    "your_id": "1592891739525",
    "number": "1285833818",
    "number2": null,
    "ref_id": "TV2006231626733330",
    "amount": "317",
    "charged_amount": "307.49",
    "date": "2020-06-23 11:25:39",
    "status": "SUCCESS",
    "service": "TATA SKY DTH"
  },
  {
    "trx_id": "2309508",
    "your_id": "15928403451427",
    "number": "220326891",
    "number2": null,
    "ref_id": "WREC64071566 AKASH  WADAGIRI",
    "amount": "315",
    "charged_amount": "302.72",
    "date": "2020-06-22 21:09:06",
    "status": "SUCCESS",
    "service": "VIDEOCON DTH"
  },
  {
    "trx_id": "2308879",
    "your_id": "1592836413678",
    "number": "7829184991",
    "number2": null,
    "ref_id": "KKH2006222003300057",
    "amount": "49",
    "charged_amount": "47.04",
    "date": "2020-06-22 20:03:33",
    "status": "SUCCESS",
    "service": "Vodafone"
  },
  {
    "trx_id": "2308049",
    "your_id": "15928319129000",
    "number": "9448581076",
    "number2": null,
    "ref_id": "5593511916",
    "amount": "319",
    "charged_amount": "303.05",
    "date": "2020-06-22 18:48:33",
    "status": "SUCCESS",
    "service": "Bsnl Special"
  },
  {
    "trx_id": "2307689",
    "your_id": "15928294103380",
    "number": "8762482769",
    "number2": null,
    "ref_id": "2404866270",
    "amount": "75",
    "charged_amount": "71.25",
    "date": "2020-06-22 18:06:51",
    "status": "SUCCESS",
    "service": "Bsnl Special"
  },
  {
    "trx_id": "2306743",
    "your_id": "15928218069547",
    "number": "7350071720",
    "number2": null,
    "ref_id": "KKR2006221600250010",
    "amount": "49",
    "charged_amount": "47.04",
    "date": "2020-06-22 16:00:07",
    "status": "SUCCESS",
    "service": "Idea"
  },
  {
    "trx_id": "2306627",
    "your_id": "15928206232350",
    "number": "7026182466",
    "number2": null,
    "ref_id": "KKR2006221540290068",
    "amount": "49",
    "charged_amount": "47.04",
    "date": "2020-06-22 15:40:24",
    "status": "SUCCESS",
    "service": "Idea"
  },
  {
    "trx_id": "2304823",
    "your_id": "15928075424032",
    "number": "7353083826",
    "number2": null,
    "ref_id": "MP0622120230000268",
    "amount": "129",
    "charged_amount": "123.84",
    "date": "2020-06-22 12:02:22",
    "status": "SUCCESS",
    "service": "Idea"
  },
  {
    "trx_id": "2304713",
    "your_id": null,
    "number": "7353083826",
    "number2": null,
    "ref_id": "2304698",
    "amount": "129",
    "charged_amount": "126.42",
    "date": "2020-06-22 11:55:06",
    "status": "REFUNDED",
    "service": "Airtel"
  },
  {
    "trx_id": "2304698",
    "your_id": "1592807039473",
    "number": "7353083826",
    "number2": null,
    "ref_id": "2304713",
    "amount": "129",
    "charged_amount": "126.42",
    "date": "2020-06-22 11:54:00",
    "status": "FAILED",
    "service": "Airtel"
  },
  {
    "trx_id": "2304680",
    "your_id": "15928069277691",
    "number": "7353855649",
    "number2": null,
    "ref_id": "MPR2006221152260096",
    "amount": "49",
    "charged_amount": "47.04",
    "date": "2020-06-22 11:52:08",
    "status": "SUCCESS",
    "service": "Idea"
  },
  {
    "trx_id": "2304655",
    "your_id": null,
    "number": "9886209702",
    "number2": null,
    "ref_id": "2304633",
    "amount": "10",
    "charged_amount": "9.50",
    "date": "2020-06-22 11:51:03",
    "status": "REFUNDED",
    "service": "Bsnl Topup"
  },
  {
    "trx_id": "2304633",
    "your_id": "15928067743111",
    "number": "9886209702",
    "number2": null,
    "ref_id": "2304655",
    "amount": "10",
    "charged_amount": "9.50",
    "date": "2020-06-22 11:49:35",
    "status": "FAILED",
    "service": "Bsnl Topup"
  },
  {
    "trx_id": "2304102",
    "your_id": "15928044533698",
    "number": "1336955024",
    "number2": null,
    "ref_id": "TV2006221626128400",
    "amount": "290",
    "charged_amount": "281.30",
    "date": "2020-06-22 11:10:54",
    "status": "SUCCESS",
    "service": "TATA SKY DTH"
  },
  {
    "trx_id": "2304035",
    "your_id": null,
    "number": "9448608706",
    "number2": null,
    "ref_id": "017410014000",
    "amount": "2200",
    "charged_amount": "2200",
    "date": "2020-06-22 11:06:15",
    "status": "CREDIT",
    "service": "WALLET"
  },
  {
    "trx_id": "2303651",
    "your_id": "15928027097468",
    "number": "9164232550",
    "number2": null,
    "ref_id": "OR0622104222000003",
    "amount": "149",
    "charged_amount": "143.04",
    "date": "2020-06-22 10:41:50",
    "status": "SUCCESS",
    "service": "Idea"
  },
  {
    "trx_id": "2303511",
    "your_id": "15928022322106",
    "number": "9480510726",
    "number2": null,
    "ref_id": "2404242359",
    "amount": "99",
    "charged_amount": "94.05",
    "date": "2020-06-22 10:33:53",
    "status": "SUCCESS",
    "service": "Bsnl Special"
  },
  {
    "trx_id": "2303336",
    "your_id": "15928015865169",
    "number": "9481270239",
    "number2": null,
    "ref_id": "2404222029",
    "amount": "99",
    "charged_amount": "94.05",
    "date": "2020-06-22 10:23:07",
    "status": "SUCCESS",
    "service": "Bsnl Special"
  },
  {
    "trx_id": "2300283",
    "your_id": "15927524872163",
    "number": "7721070149",
    "number2": null,
    "ref_id": "OR0621204426000099",
    "amount": "49",
    "charged_amount": "47.04",
    "date": "2020-06-21 20:44:48",
    "status": "SUCCESS",
    "service": "Idea"
  },
  {
    "trx_id": "2300028",
    "your_id": "15927506056463",
    "number": "7406004746",
    "number2": null,
    "ref_id": "RBR2006212013240045",
    "amount": "249",
    "charged_amount": "239.04",
    "date": "2020-06-21 20:13:26",
    "status": "SUCCESS",
    "service": "Vodafone"
  },
  {
    "trx_id": "2298556",
    "your_id": "15927412722348",
    "number": "7353186009",
    "number2": null,
    "ref_id": "OR0621173821000003",
    "amount": "129",
    "charged_amount": "123.84",
    "date": "2020-06-21 17:37:52",
    "status": "SUCCESS",
    "service": "Idea"
  }
]

curl --location 'https://www.kwikapi.com/api/v2/operator_fetch_v2.php' \
--form 'api_key="39d865-c41a55-b83eac-0e86b9-84071e"' \
--form 'number="7070300613"'
{
  "success": true,
  "hit_credit": "9466",
  "api_started": "NA",
  "api_expiry": "NA",
  "message": "NA",
  "details": {
    "operator": "IDEA",
    "Circle": "Bihar and Jharkhand"
  }
}

curl --location 'https://www.kwikapi.com/api/v2/recharge_plans.php' \
--form 'api_key="Api Key"' \
--form 'state_code="circle code"' \
--form 'opid="Operator Code"'
{
  "success": true,
  "hit_credit": "9463",
  "api_started": "NA",
  "api_expiry": "NA",
  "operator": "RELIANCE JIO",
  "circle": "DELHI",
  "message": "Ignore FRC plans, This is not usable so dont show it unless.",
  "plans": {
    "FULLTT": [
      {
        "rs": 129,
        "validity": "28 Days",
        "desc": "2GB data + Unlimited calls to Jio numbers/landline + 1000 minutes to non-Jio numbers + 300 SMS",
        "Type": "NEW ALL-IN-ONE"
      },
      {
        "rs": 149,
        "validity": "24 Days",
        "desc": "1GB data/day + Unlimited calls to Jio numbers/landline + 300 minutes to non-Jio numbers + 100 SMS/day",
        "Type": "NEW ALL-IN-ONE"
      },
      {
        "rs": 199,
        "validity": "28 Days",
        "desc": " 1.5GB/day data + Unlimited calls to Jio numbers/landline + 1000 minutes to non-Jio numbers + 100 SMS/day",
        "Type": "NEW ALL-IN-ONE"
      },
      {
        "rs": 249,
        "validity": "28 Days",
        "desc": "2GB/day data + Unlimited calls to Jio numbers/landline + 1000 minutes to non-Jio numbers + 100 SMS/day",
        "Type": "NEW ALL-IN-ONE"
      },
      {
        "rs": 329,
        "validity": "84 Days",
        "desc": "6GB data + Unlimited calls to Jio numbers/landline + 3000 minutes to non-Jio numbers + 1000 SMS",
        "Type": "NEW ALL-IN-ONE"
      },
      {
        "rs": 349,
        "validity": "28 Days",
        "desc": "   3GB/day data + Unlimited calls to Jio numbers/landline + 1000 minutes to non-Jio numbers + 100 SMS/day",
        "Type": "NEW ALL-IN-ONE"
      },
      {
        "rs": 399,
        "validity": "56 Days",
        "desc": " 1.5GB/day data + Unlimited calls to Jio numbers/landline + 2000 minutes to non-Jio numbers + 100 SMS/day",
        "Type": "NEW ALL-IN-ONE"
      },
      {
        "rs": 444,
        "validity": "56 Days",
        "desc": " 2GB/day data + Unlimited calls to Jio numbers/landline + 2000 minutes to non-Jio numbers + 100 SMS/day",
        "Type": "NEW ALL-IN-ONE"
      },
      {
        "rs": 555,
        "validity": "84 Days",
        "desc": "1.5GB/day data + Unlimited calls to Jio numbers/landline + 3000 minutes to non-Jio numbers + 100 SMS/day",
        "Type": "NEW ALL-IN-ONE"
      },
      {
        "rs": 599,
        "validity": "84 Days",
        "desc": " 2GB/day data + Unlimited calls to Jio numbers/landline + 3000 minutes to non-Jio numbers + 100 SMS/day",
        "Type": "NEW ALL-IN-ONE"
      },
      {
        "rs": 999,
        "validity": "84 Days",
        "desc": "3GB/day data + Unlimited calls to Jio numbers/landline + 3000 minutes to non-Jio numbers + 100 SMS/day",
        "Type": "NEW ALL-IN-ONE"
      },
      {
        "rs": 1299,
        "validity": "336 Days",
        "desc": " 24GB data + Unlimited calls to Jio numbers/landline + 12000 minutes to non-Jio numbers + 3600 SMS",
        "Type": "NEW ALL-IN-ONE"
      },
      {
        "rs": 2121,
        "validity": "336 Days",
        "desc": "1.5GB data/day + Unlimited Jio to Jio calls + 12000 minutes to non-Jio numbers + 100SMS/day",
        "Type": "NEW ALL-IN-ONE"
      },
      {
        "rs": 2399,
        "validity": "365 Days",
        "desc": "2GB 4G data/day + Unlimited Jio to Jio calls, Jio to Non-Jio FUP of 12000 minutes + 100 SMS/day",
        "Type": "NEW ALL-IN-ONE"
      },
      {
        "rs": 4999,
        "validity": "360 Days",
        "desc": "350 GB Data + Unlimited Jio to Jio calls, Jio to Non-Jio FUP of 12000 minutes + 100 SMS/day",
        "Type": "NEW ALL-IN-ONE"
      }
    ],
    "TOPUP": [
      {
        "rs": 10,
        "validity": "Unlimited",
        "desc": "7.47 Talktime,7.47 Talktime",
        "Type": "Talktime"
      },
      {
        "rs": 20,
        "validity": "Unlimited",
        "desc": "14.95 Talktime,14.95 Talktime",
        "Type": "Talktime"
      },
      {
        "rs": 50,
        "validity": "Unlimited",
        "desc": "39.37 Talktime,39.37 Talktime",
        "Type": "Talktime"
      },
      {
        "rs": 100,
        "validity": "Unlimited",
        "desc": "81.75 Talktime,81.75 Talktime",
        "Type": "Talktime"
      },
      {
        "rs": 500,
        "validity": "Unlimited",
        "desc": "420.73 Talktime,420.73 Talktime",
        "Type": "Talktime"
      },
      {
        "rs": 1000,
        "validity": "Unlimited",
        "desc": "844.46 Talktime,844.46 Talktime",
        "Type": "Talktime"
      }
    ],
    "DATA": [
      {
        "rs": 11,
        "validity": "Valid Till Base Pack",
        "desc": "800 MB 4G Data + 75 minutes to non-Jio [This recharge will get failed, if there is no active pack on your number]",
        "Type": "Data Pack"
      },
      {
        "rs": 21,
        "validity": "Valid Till Base Pack",
        "desc": "2GB 4G Data + 200 minutes to non-Jio [This recharge will get failed, if there is no active pack on your number]",
        "Type": "Data Pack"
      },
      {
        "rs": 51,
        "validity": "Valid Till Base Pack",
        "desc": "6GB 4G Data + 500 minutes to non-Jio [This recharge will get failed, if there is no active pack on your number]",
        "Type": "Data Pack"
      },
      {
        "rs": 101,
        "validity": "Valid Till Base Pack",
        "desc": "12GB 4G Data + 1000 minutes to non-Jio [This recharge will get failed, if there is no active pack on your number]",
        "Type": "Data Pack"
      }
    ],
    "SMS": null,
    "RATE_CUTTER": null,
    "TwoG": null,
    "Romaing": [
      {
        "rs": 501,
        "validity": "28 Days",
        "desc": "551 Talktime for ISD calling only",
        "Type": "International"
      },
      {
        "rs": 1101,
        "validity": "28 Days",
        "desc": "1211 Talktime for usage during international roaming only",
        "Type": "International"
      }
    ],
    "COMBO": null,
    "FRC": [
      {
        "rs": 228,
        "validity": "28 Days",
        "desc": "2GB data + Unlimited calls to Jio numbers/landline + 1000 minutes to non-Jio numbers + 300 SMS",
        "Type": "FRC/non-Prime"
      },
      {
        "rs": 248,
        "validity": "24 Days",
        "desc": "1GB data/day + Unlimited calls to Jio numbers/landline + 300 minutes to non-Jio numbers + 100 SMS/day",
        "Type": "FRC/non-Prime"
      },
      {
        "rs": 298,
        "validity": "28 Days",
        "desc": " 1.5GB/day data + Unlimited calls to Jio numbers/landline + 1000 minutes to non-Jio numbers + 100 SMS/day",
        "Type": "FRC/non-Prime"
      },
      {
        "rs": 348,
        "validity": "28 Days",
        "desc": "2GB/day data + Unlimited calls to Jio numbers/landline + 1000 minutes to non-Jio numbers + 100 SMS/day",
        "Type": "FRC/non-Prime"
      },
      {
        "rs": 428,
        "validity": "84 Days",
        "desc": "6GB data + Unlimited calls to Jio numbers/landline + 3000 minutes to non-Jio numbers + 1000 SMS",
        "Type": "FRC/non-Prime"
      },
      {
        "rs": 448,
        "validity": "28 Days",
        "desc": "   3GB/day data + Unlimited calls to Jio numbers/landline + 1000 minutes to non-Jio numbers + 100 SMS/day",
        "Type": "FRC/non-Prime"
      },
      {
        "rs": 498,
        "validity": "56 Days",
        "desc": " 1.5GB/day data + Unlimited calls to Jio numbers/landline + 2000 minutes to non-Jio numbers + 100 SMS/day",
        "Type": "FRC/non-Prime"
      },
      {
        "rs": 543,
        "validity": "56 Days",
        "desc": " 2GB/day data + Unlimited calls to Jio numbers/landline + 2000 minutes to non-Jio numbers + 100 SMS/day",
        "Type": "FRC/non-Prime"
      },
      {
        "rs": 654,
        "validity": "84 Days",
        "desc": "1.5GB/day data + Unlimited calls to Jio numbers/landline + 3000 minutes to non-Jio numbers + 100 SMS/day",
        "Type": "FRC/non-Prime"
      },
      {
        "rs": 698,
        "validity": "84 Days",
        "desc": " 2GB/day data + Unlimited calls to Jio numbers/landline + 3000 minutes to non-Jio numbers + 100 SMS/day",
        "Type": "FRC/non-Prime"
      },
      {
        "rs": 1098,
        "validity": "84 Days",
        "desc": "3GB/day data + Unlimited calls to Jio numbers/landline + 3000 minutes to non-Jio numbers + 100 SMS/day",
        "Type": "FRC/non-Prime"
      },
      {
        "rs": 1398,
        "validity": "336 Days",
        "desc": " 24GB data + Unlimited calls to Jio numbers/landline + 12000 minutes to non-Jio numbers + 3600 SMS",
        "Type": "FRC/non-Prime"
      },
      {
        "rs": 2220,
        "validity": "336 Days",
        "desc": "1.5GB data/day + Unlimited Jio to Jio calls + 12000 minutes to non-Jio numbers + 100SMS/day",
        "Type": "FRC/non-Prime"
      },
      {
        "rs": 2498,
        "validity": "365 Days",
        "desc": "2GB 4G data/day + Unlimited Jio to Jio calls, Jio to Non-Jio FUP of 12000 minutes + 100 SMS/day",
        "Type": "FRC/non-Prime"
      },
      {
        "rs": 5098,
        "validity": "360 Days",
        "desc": "350 GB Data + Unlimited Jio to Jio calls, Jio to Non-Jio FUP of 12000 minutes + 100 SMS/day",
        "Type": "FRC/non-Prime"
      }
    ],
    "JioPhone": [
      {
        "rs": 49,
        "validity": "14 Days",
        "desc": "Unlimited Jio to Jio calls + 250 Minutes to non-Jio numbers + 2GB + 25 SMS",
        "Type": "JioPhone"
      },
      {
        "rs": 69,
        "validity": "14 Days",
        "desc": "Unlimited Jio to Jio calls + 250 Minutes to non-Jio numbers + 0.5GB/day + 25 SMS",
        "Type": "JioPhone"
      },
      {
        "rs": 75,
        "validity": "28 Days",
        "desc": "Unlimited Jio to Jio calls + 500 minutes to non-Jio numbers + 100 MB data/day + 50 SMS [Only for JioPhone users]",
        "Type": "JioPhone"
      },
      {
        "rs": 99,
        "validity": "28 Days",
        "desc": "Unlimited Calling (Local/STD/Roaming) to Jio numbers and landline + 0.5GB data per day (thereafter unlimited data with speed upto 64Kbps) + 300 SMS + non-Jio calls @ 6paise/minute [Only for JioPhone users][This recharge is only available for JioPrime members, non-Prime members can use 109 pack.]",
        "Type": "JioPhone"
      },
      {
        "rs": 109,
        "validity": "28 Days",
        "desc": "Unlimited Calling (Local/STD/Roaming) to Jio numbers and landline + 0.5GB data per day (thereafter unlimited data with speed upto 64Kbps) + 300 SMS + non-Jio calls @ 6paise/minute + 124 minutes to non-Jio numbers [Only for JioPhone users]",
        "Type": "JioPhone"
      },
      {
        "rs": 125,
        "validity": "28 Days",
        "desc": "Unlimited Jio to Jio calls + 500 minutes to non-Jio numbers + 500 MB data/day + 300 SMS [Only for JioPhone users]",
        "Type": "JioPhone"
      },
      {
        "rs": 153,
        "validity": "28 Days",
        "desc": "Unlimited Calling (Local/STD/Roaming) to Jio numbers and landline + 1.5GB data per day  (thereafter unlimited data with speed upto 64Kbps) + 100 SMS/day + non-Jio calls @ 6paise/minute  [Only for JioPhone users][This recharge is only available for JioPrime members, non-Prime members can use 163 pack.]",
        "Type": "JioPhone"
      },
      {
        "rs": 155,
        "validity": "28 Days",
        "desc": "Unlimited Jio to Jio calls + 500 minutes to non-Jio numbers + 1GB data/day + 100 SMS/day [Only for JioPhone users]",
        "Type": "JioPhone"
      },
      {
        "rs": 163,
        "validity": "28 Days",
        "desc": "Unlimited Calling (Local/STD/Roaming) to Jio numbers and landline + 1.5GB data per day  (thereafter unlimited data with speed upto 64Kbps) + 100 SMS/day + non-Jio calls @ 6paise/minute + 124 Minutes to non-Jio numbers  [Only for JioPhone users]",
        "Type": "JioPhone"
      },
      {
        "rs": 185,
        "validity": "28 Days",
        "desc": "Unlimited Jio to Jio calls + 500 minutes to non-Jio numbers + 2GB data/day + 100 SMS/day [Only for JioPhone users]",
        "Type": "JioPhone"
      },
      {
        "rs": 297,
        "validity": "84 Days",
        "desc": "Unlimited Calling (Local/STD/Roaming) to Jio numbers and landline + 0.5GB data per day (thereafter unlimited data with speed upto 64Kbps) + 300 SMS + non-Jio calls @ 6paise/minute bsciption [Only for JioPhone users][This recharge is only available for JioPrime members, non-Prime members can use 307 pack.]",
        "Type": "JioPhone"
      },
      {
        "rs": 307,
        "validity": "84 Days",
        "desc": "Unlimited Calling (Local/STD/Roaming) to Jio numbers and landline + 0.5GB data per day (thereafter unlimited data with speed upto 64Kbps) + 300 SMS + non-Jio calls @ 6paise/minute + 124 minutes to non-Jio numbers [Only for JioPhone users]",
        "Type": "JioPhone"
      },
      {
        "rs": 594,
        "validity": "168 Days",
        "desc": "Unlimited Calling (Local/STD/Roaming) to Jio numbers and landline + 0.5GB data per day (thereafter unlimited data with speed upto 64Kbps) + 300 SMS  + non-Jio calls @ 6paise/minute  [Only for JioPhone users][This recharge is only available for JioPrime members, non-Prime members can use 604 pack.]",
        "Type": "JioPhone"
      },
      {
        "rs": 604,
        "validity": "168 Days",
        "desc": "Unlimited Calling (Local/STD/Roaming) to Jio numbers and landline + 0.5GB data per day (thereafter unlimited data with speed upto 64Kbps) + 300 SMS  + non-Jio calls @ 6paise/minute + 124 minutes to non-Jio numbers [Only for JioPhone users]",
        "Type": "JioPhone"
      }
    ],
    "STV": null
  }
}

curl --location 'https://www.kwikapi.com/api/v2/recharge.php?api_key=4d3105-f2aaf2-1f5bcf-f40193&number=7070300613&amount=10&opid=1&state_code=0&order_id=452145275'
{
  "status": "PENDING",
  "order_id": "2426629",
  "opr_id": "",
  "balance": "164.38",
  "number": "7070300613",
  "provider": "Airtel",
  "amount": "10",
  "charged_amount": "9.80",
  "message": "RECHARGE SUBMITTED SUCCESSFULLY"
}

Utility Payments
curl --location 'https://www.kwikapi.com/api/v2/bills/payments.php?api_key=4d3105-f2aaf2-1f5bcf-f40193-0a76DFF&number=12438555985&amount=10&opid=65&order_id=478245233&opt1=opt1&opt2=opt2&opt3=opt3&opt4=opt4&opt5=opt5&opt6=opt6&opt7=opt7&opt8=Bills&opt9=opt9&opt10=opt10&refrence_id=refrence_id'
{
  "status": "FAILED",
  "order_id": "2439372",
  "opr_id": "0",
  "balance": "2154.78",
  "number": "12438555985",
  "optional1": "opt1",
  "optional2": "opt2",
  "optional3": "opt3",
  "optional4": "opt4",
  "optional5": "opt5",
  "optional6": "opt6",
  "optional7": "opt7",
  "optional8": "Billls",
  "optional9": "opt9",
  "optional10": "opt10",
  "provider": "Andhra Pradesh Southern POWER Distribution Company - APSPDCL",
  "amount": "10",
  "charged_amount": "0",
  "message": "Invalid bill fetch reference id",
  "operator_message": "Invalid or missing bill fetch reference id"
}

