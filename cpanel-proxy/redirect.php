<?php
// PAN Card Redirection Handler
// This handles the redirect from InsPay after PAN application completion

// Get parameters from URL
$txid = $_GET['txid'] ?? '';
$status = $_GET['status'] ?? '';
$opid = $_GET['opid'] ?? '';

// Log the redirect for debugging
$logData = [
    'timestamp' => date('Y-m-d H:i:s'),
    'method' => $_SERVER['REQUEST_METHOD'],
    'query_params' => $_GET,
    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown',
    'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'Unknown'
];
file_put_contents('redirect_logs.txt', json_encode($logData) . "\n", FILE_APPEND | LOCK_EX);

// Build the redirect URL to your Vercel application
$redirectUrl = 'https://www.vighnahartaonlineservice.in/dashboard/pan-services/history';

// If we have parameters, add them to the redirect URL
if (!empty($txid) || !empty($status) || !empty($opid)) {
    $params = array_filter([
        'txid' => $txid,
        'status' => $status,
        'opid' => $opid,
        'redirected' => 'true'
    ]);
    
    if (!empty($params)) {
        $redirectUrl .= '?' . http_build_query($params);
    }
}

// Redirect to your application
header('Location: ' . $redirectUrl, true, 302);
exit();
?>