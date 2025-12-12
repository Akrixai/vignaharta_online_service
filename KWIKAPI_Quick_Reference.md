# KWIKAPI v3.0.0 - Quick Reference Guide

## 🚀 Quick Start

### Base URL
```
https://www.kwikapi.com/api/v2/
```

### Authentication
All requests require `api_key` parameter:
```
api_key=YOUR_SECRET_KEY
```

---

## 📋 Common Endpoints

### 1. Get All Operators
```http
GET /operator_codes.php?api_key=YOUR_KEY
```
**Rate Limit:** 15/day

### 2. Get Operator Details
```http
POST /operatorFetch.php
Body: api_key=YOUR_KEY&opid=53
```
**Rate Limit:** 50/day

### 3. Get Circle Codes
```http
GET /circle_codes.php?api_key=YOUR_KEY
```
**Rate Limit:** 2/day

### 4. Check Balance
```http
GET /balance.php?api_key=YOUR_KEY
```
**Rate Limit:** 2/hour

### 5. Fetch Bill
```http
GET /bills/validation.php?api_key=YOUR_KEY&number=ACCOUNT_NO&amount=10&opid=OP_ID&order_id=UNIQUE_ID&opt8=Bills&mobile=MOBILE
```

### 6. Process Recharge/Payment
```http
POST /recharge.php
Body: api_key=YOUR_KEY&number=MOBILE&amount=AMOUNT&opid=OP_ID&order_id=UNIQUE_ID
```

---

## 🎯 Popular Operator IDs

### Mobile Prepaid
| ID | Operator |
|----|----------|
| 1 | Airtel |
| 3 | Idea |
| 8 | Reliance Jio |
| 21 | Vodafone |

### Mobile Postpaid
| ID | Operator |
|----|----------|
| 48 | Airtel Postpaid |
| 49 | Idea Postpaid |
| 115 | Jio Postpaid |
| 29 | Vodafone Postpaid |

### DTH
| ID | Operator |
|----|----------|
| 23 | Airtel DTH |
| 25 | Dish TV |
| 27 | Tata Sky |
| 28 | Videocon D2H |
| 26 | Sun Direct |

### Electricity (Major)
| ID | Operator |
|----|----------|
| 50 | BSES Yamuna - Delhi |
| 51 | BSES Rajdhani - Delhi |
| 78 | BESCOM - Bangalore |
| 79 | TNEB - Tamil Nadu |
| 88 | UPPCL Urban - UP |
| 118 | PSPCL - Punjab |

---

## 🔄 Transaction Flow

### For Prepaid/DTH (No Bill Fetch)
```
1. Get operator details → 2. Process recharge → 3. Check status
```

### For Bill Payments (With Bill Fetch)
```
1. Get operator details → 2. Fetch bill → 3. Show bill to user → 4. Process payment → 5. Check status
```

---

## 📊 Response Status

| Status | Meaning |
|--------|---------|
| SUCCESS | Transaction completed |
| PENDING | Processing |
| FAILED | Transaction failed |
| REFUND | Amount refunded |

---

## ⚠️ Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| API MISMATCH | Invalid API key | Check API key |
| Insufficient Balance | Low wallet balance | Add funds |
| Duplicate order_id | Same ID used twice | Use unique ID |
| Invalid Parameters | Missing/wrong params | Verify all params |

---

## 💡 Quick Tips

### Order ID
- Must be unique for each transaction
- Max 14 digits
- Store before API call

### Bill Fetch
- Only for operators with `bill_fetch: YES`
- Use `ref_id` in payment
- Pass `opt8=Bills` (required)

### Amount Limits
- Check `amount_minimum` and `amount_maximum`
- Varies by operator
- Validate before transaction

### Rate Limits
- Operator List: 15/day
- Circle Codes: 2/day
- Balance: 2/hour
- Operator Details: 50/day

---

## 🔧 Code Examples

### JavaScript/Node.js - Get Operators
```javascript
const axios = require('axios');

async function getOperators() {
  try {
    const response = await axios.get(
      'https://www.kwikapi.com/api/v2/operator_codes.php',
      { params: { api_key: 'YOUR_API_KEY' } }
    );
    return response.data;
  } catch (error) {
    console.error('Error:', error.message);
  }
}
```

### JavaScript/Node.js - Mobile Recharge
```javascript
async function mobileRecharge(mobile, amount, opid) {
  const FormData = require('form-data');
  const form = new FormData();
  
  form.append('api_key', 'YOUR_API_KEY');
  form.append('number', mobile);
  form.append('amount', amount);
  form.append('opid', opid);
  form.append('order_id', Date.now().toString());
  
  try {
    const response = await axios.post(
      'https://www.kwikapi.com/api/v2/recharge.php',
      form,
      { headers: form.getHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error:', error.message);
  }
}
```

### Python - Fetch Bill
```python
import requests

def fetch_bill(account_no, opid, mobile):
    url = "https://www.kwikapi.com/api/v2/bills/validation.php"
    params = {
        'api_key': 'YOUR_API_KEY',
        'number': account_no,
        'amount': '10',
        'opid': opid,
        'order_id': str(int(time.time())),
        'opt8': 'Bills',
        'mobile': mobile
    }
    
    response = requests.get(url, params=params)
    return response.json()
```

### PHP - Process Payment
```php
<?php
$url = "https://www.kwikapi.com/api/v2/recharge.php";

$data = array(
    'api_key' => 'YOUR_API_KEY',
    'number' => '9876543210',
    'amount' => '99',
    'opid' => '1',
    'order_id' => time()
);

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
print_r($result);
?>
```

### cURL - Get Balance
```bash
curl -X GET "https://www.kwikapi.com/api/v2/balance.php?api_key=YOUR_API_KEY"
```

---

## 📱 Service Types

| Code | Service |
|------|---------|
| Prepaid | Mobile Prepaid |
| Postpaid | Mobile Postpaid |
| DTH | DTH Recharge |
| ELC | Electricity |
| GAS | Piped Gas |
| Water | Water Bill |
| Landline | Landline |
| Broadband | Internet |
| Insurance | Insurance Premium |
| Money Transfer | Bank Transfer |
| PAN | PAN Card |

---

## 🗺️ Circle Codes (Top 10)

| Code | Circle |
|------|--------|
| 1 | Delhi |
| 4 | Maharashtra |
| 5 | Andhra Pradesh |
| 7 | Karnataka |
| 8 | Gujarat |
| 13 | Rajasthan |
| 15 | Punjab |
| 16 | Haryana |
| 23 | Tamil Nadu |
| 40 | Telangana |

---

## 🎯 Testing Checklist

- [ ] Test with valid API key
- [ ] Test with invalid API key (error handling)
- [ ] Test operator list fetch
- [ ] Test bill fetch (for supported operators)
- [ ] Test small amount recharge
- [ ] Test duplicate order_id (should fail)
- [ ] Test invalid mobile number
- [ ] Test amount validation (min/max)
- [ ] Test PENDING status handling
- [ ] Test balance check

---

## 📞 Support

For issues or queries:
- Check operator status first
- Verify all parameters
- Check rate limits
- Review error messages
- Contact KWIKAPI support

---

## 🔐 Security Best Practices

1. **Never expose API key in client-side code**
2. **Use environment variables for API key**
3. **Implement server-side validation**
4. **Log all transactions**
5. **Use HTTPS only**
6. **Validate user inputs**
7. **Implement rate limiting on your end**
8. **Store transaction details before API call**

---

## 📈 Performance Tips

1. **Cache operator and circle lists** (update daily)
2. **Use connection pooling** for HTTP requests
3. **Implement retry logic** with exponential backoff
4. **Handle PENDING status** asynchronously
5. **Use webhooks** for status updates (if available)
6. **Batch fetch** operator details when needed

---

**Quick Reference Version:** 1.0  
**Last Updated:** December 12, 2024  
**API Version:** v3.0.0
