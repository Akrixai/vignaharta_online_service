<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Log the incoming callback for debugging
$logData = [
    'timestamp' => date('Y-m-d H:i:s'),
    'method' => $_SERVER['REQUEST_METHOD'],
    'query_params' => $_GET,
    'post_data' => $_POST,
    'raw_input' => file_get_contents('php://input'),
    'headers' => getallheaders(),
    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown'
];

// Log to file for debugging (optional)
file_put_contents('callback_logs.txt', json_encode($logData) . "\n", FILE_APPEND | LOCK_EX);

// Get callback parameters (InsPay sends via GET)
$txid = $_GET['txid'] ?? '';
$status = $_GET['status'] ?? '';
$opid = $_GET['opid'] ?? '';

// Validate required parameters
if (empty($txid) || empty($status)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Missing required callback parameters'
    ]);
    exit();
}

// Forward to your Vercel application
$vercelCallbackUrl = 'https://www.vighnahartaonlineservice.in/api/pan-services/callback?' . http_build_query([
    'txid' => $txid,
    'status' => $status,
    'opid' => $opid
]);

// Initialize cURL to forward the callback
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $vercelCallbackUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_USERAGENT, 'Akrix Solutions Callback Proxy/1.0');

// Forward as GET request (same as InsPay sends)
curl_setopt($ch, CURLOPT_HTTPGET, true);

// Execute request
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

// Log the forwarding result
$forwardLog = [
    'timestamp' => date('Y-m-d H:i:s'),
    'vercel_url' => $vercelCallbackUrl,
    'http_code' => $httpCode,
    'curl_error' => $error,
    'response' => $response
];
file_put_contents('callback_forward_logs.txt', json_encode($forwardLog) . "\n", FILE_APPEND | LOCK_EX);

// Handle cURL errors
if ($error) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to forward callback: ' . $error,
        'proxy_error' => true
    ]);
    exit();
}

// Return the response from Vercel with appropriate HTTP code
http_response_code($httpCode);
echo $response;
?>