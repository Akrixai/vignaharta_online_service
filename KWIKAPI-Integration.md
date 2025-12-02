
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

