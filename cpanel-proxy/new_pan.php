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

// Get query parameters
$username = $_GET['username'] ?? '';
$token = $_GET['token'] ?? '';
$number = $_GET['number'] ?? '';
$mode = $_GET['mode'] ?? '';
$orderid = $_GET['orderid'] ?? '';

// Validate required parameters
if (empty($username) || empty($token) || empty($number) || empty($mode) || empty($orderid)) {
    http_response_code(400);
    echo json_encode([
        'status' => 'Failure',
        'message' => 'Missing required parameters'
    ]);
    exit();
}

// Build Inspay API URL
$inspayUrl = 'https://connect.inspay.in/v4/nsdl/new_pan?' . http_build_query([
    'username' => $username,
    'token' => $token,
    'number' => $number,
    'mode' => $mode,
    'orderid' => $orderid
]);

// Initialize cURL
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $inspayUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_USERAGENT, 'Akrix Solutions Proxy/1.0');

// Execute request
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

// Handle cURL errors
if ($error) {
    http_response_code(500);
    echo json_encode([
        'status' => 'Failure',
        'message' => 'Proxy error: ' . $error
    ]);
    exit();
}

// Return response with appropriate HTTP code
http_response_code($httpCode);
echo $response;
?>