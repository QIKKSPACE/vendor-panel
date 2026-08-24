<?php

header('Content-Type: application/json');
$payload = json_decode($rawPayload, true);
// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);

    echo json_encode([
        'success' => false,
        'message' => 'Method Not Allowed'
    ]);

    exit;
}

// API Key
const API_KEY = '99acers_9472306142_nimma';

// Storage directory
$storageDir = __DIR__ . '/../storage/webhooks';

if (!is_dir($storageDir)) {
    mkdir($storageDir, 0755, true);
}

// Get request headers
$headers = getallheaders();

// Validate API key
$receivedApiKey =
    $headers['X-API-Key']
    ?? $headers['x-api-key']
    ?? '';

if ($receivedApiKey !== API_KEY) {
    http_response_code(401);

    echo json_encode([
        'success' => false,
        'message' => 'Invalid API Key'
    ]);

    exit;
}

// Read raw payload
$rawPayload = file_get_contents('php://input');

// Build log object
$logData = [
    'received_at'  => date('Y-m-d H:i:s'),
    'method'       => $_SERVER['REQUEST_METHOD'],
    'ip'           => $_SERVER['REMOTE_ADDR'] ?? '',
    'headers'      => $headers,
    'query'        => $_GET,
    'payload_raw'  => $rawPayload,
    'payload_json' => json_decode($rawPayload, true)
];

// Single file
$fileName = $storageDir . '/99acers.json';
$payload = json_decode($rawPayload, true);
// Load existing records
$records = [];

if (file_exists($fileName)) {
    $records = json_decode(file_get_contents($fileName), true);

    if (!is_array($records)) {
        $records = [];
    }
}

// Append webhook
$records[] = $logData;

// Save
file_put_contents(
    $fileName,
    json_encode(
        $records,
        JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES
    ),
    LOCK_EX
);

// Success response
http_response_code(200);
$payload = json_decode($rawPayload, true);
$name = trim($payload['Name'] ?? '');
$email = trim($payload['Email'] ?? '');
$phone = trim($payload['Mobile'] ?? '');
$remarks = trim($payload['remarks'] ?? '');
$project = trim($payload['Project'] ?? '');
$stmt = $conn->prepare("
    INSERT INTO leads (
        name,
        phone,
        email,
        project_name,
        source,
        remark,
        overall_status,
        created_at,
        updated_at
    )
    VALUES (
        ?, ?, ?, ?, '99acres', ?, 'new', NOW(), NOW()
    )
");

$stmt->bind_param(
    "sssss",
    $name,
    $phone,
    $email,
    $project,
    $remarks
);

$stmt->execute();
$stmt->close();
echo json_encode([
    'success' => true,
    'message' => 'Webhook received successfully'
]);