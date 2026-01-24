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
    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown',
    'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? 'Unknown'
];

// Log to file for debugging
file_put_contents('callback_logs.txt', json_encode($logData) . "\n", FILE_APPEND | LOCK_EX);

// Get callback parameters (InsPay sends via GET)
$txid = $_GET['txid'] ?? '';
$status = $_GET['status'] ?? '';
$opid = $_GET['opid'] ?? '';

// Validate required parameters
if (empty($txid) || empty($status)) {
    http_response_code(400);
    $errorResponse = [
        'success' => false,
        'message' => 'Missing required callback parameters',
        'received' => ['txid' => $txid, 'status' => $status, 'opid' => $opid]
    ];
    
    // Log validation error
    file_put_contents('callback_errors.txt', json_encode([
        'timestamp' => date('Y-m-d H:i:s'),
        'error' => 'Missing parameters',
        'data' => $errorResponse
    ]) . "\n", FILE_APPEND | LOCK_EX);
    
    echo json_encode($errorResponse);
    exit();
}

// Forward to your Vercel application with retry mechanism
$vercelCallbackUrl = 'https://www.vighnahartaonlineservice.in/api/pan-services/callback?' . http_build_query([
    'txid' => $txid,
    'status' => $status,
    'opid' => $opid
]);

// Retry configuration
$maxRetries = 3;
$retryDelay = 2; // seconds
$success = false;
$lastError = '';
$lastResponse = '';
$lastHttpCode = 0;

for ($attempt = 1; $attempt <= $maxRetries; $attempt++) {
    // Initialize cURL to forward the callback
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $vercelCallbackUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 60); // Increased timeout to 60 seconds
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 30); // Connection timeout
    curl_setopt($ch, CURLOPT_USERAGENT, 'Akrix Solutions Callback Proxy/2.0');
    curl_setopt($ch, CURLOPT_HTTPGET, true);
    
    // Add custom headers for tracking
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'X-Callback-Attempt: ' . $attempt,
        'X-Callback-Source: InsPay',
        'X-Callback-Timestamp: ' . time()
    ]);
    
    // Execute request
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    $curlInfo = curl_getinfo($ch);
    curl_close($ch);
    
    // Store last attempt data
    $lastResponse = $response;
    $lastHttpCode = $httpCode;
    $lastError = $error;
    
    // Log each attempt
    $attemptLog = [
        'timestamp' => date('Y-m-d H:i:s'),
        'attempt' => $attempt,
        'txid' => $txid,
        'status' => $status,
        'vercel_url' => $vercelCallbackUrl,
        'http_code' => $httpCode,
        'curl_error' => $error,
        'response_time' => $curlInfo['total_time'] ?? 0,
        'response' => $response
    ];
    file_put_contents('callback_forward_logs.txt', json_encode($attemptLog) . "\n", FILE_APPEND | LOCK_EX);
    
    // Check if request was successful
    if (!$error && $httpCode >= 200 && $httpCode < 300) {
        $success = true;
        
        // Log success
        file_put_contents('callback_success.txt', json_encode([
            'timestamp' => date('Y-m-d H:i:s'),
            'txid' => $txid,
            'status' => $status,
            'opid' => $opid,
            'attempt' => $attempt,
            'http_code' => $httpCode
        ]) . "\n", FILE_APPEND | LOCK_EX);
        
        break; // Exit retry loop on success
    }
    
    // If not the last attempt, wait before retrying
    if ($attempt < $maxRetries) {
        sleep($retryDelay);
        $retryDelay *= 2; // Exponential backoff
    }
}

// Handle final result
if (!$success) {
    // Log failure after all retries
    file_put_contents('callback_failures.txt', json_encode([
        'timestamp' => date('Y-m-d H:i:s'),
        'txid' => $txid,
        'status' => $status,
        'opid' => $opid,
        'attempts' => $maxRetries,
        'last_error' => $lastError,
        'last_http_code' => $lastHttpCode,
        'last_response' => $lastResponse
    ]) . "\n", FILE_APPEND | LOCK_EX);
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to forward callback after ' . $maxRetries . ' attempts',
        'last_error' => $lastError,
        'last_http_code' => $lastHttpCode,
        'proxy_error' => true,
        'txid' => $txid
    ]);
    exit();
}

// Return the response from Vercel with appropriate HTTP code
http_response_code($lastHttpCode);
echo $lastResponse;
?>