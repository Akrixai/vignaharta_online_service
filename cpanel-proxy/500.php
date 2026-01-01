<?php
header('Content-Type: application/json');
http_response_code(500);

echo json_encode([
    'status' => 'Failure',
    'message' => 'Internal server error'
]);
?>