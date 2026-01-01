<?php
header('Content-Type: application/json');

// Test script to verify proxy setup
$tests = [
    'php_version' => phpversion(),
    'curl_enabled' => extension_loaded('curl'),
    'json_enabled' => extension_loaded('json'),
    'openssl_enabled' => extension_loaded('openssl'),
    'server_ip' => $_SERVER['SERVER_ADDR'] ?? 'Unknown',
    'timestamp' => date('Y-m-d H:i:s'),
    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown'
];

// Test cURL functionality
if ($tests['curl_enabled']) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://httpbin.org/get');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $response = curl_exec($ch);
    $tests['curl_test'] = $response !== false ? 'Working' : 'Failed: ' . curl_error($ch);
    curl_close($ch);
} else {
    $tests['curl_test'] = 'cURL not available';
}

echo json_encode([
    'status' => 'Success',
    'message' => 'Proxy server test results',
    'tests' => $tests
], JSON_PRETTY_PRINT);
?>