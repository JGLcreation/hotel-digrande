<?php
/**
 * The Grand Luxe Hotel & Resort - Laravel Herd Gateway & Proxy
 * 
 * Bridges Laravel Herd / Nginx to:
 * 1. Vite pre-compiled SPA frontend (dist/index.html & assets)
 * 2. Express + TypeScript + MySQL backend running on port 3000
 */

$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$path = parse_url($requestUri, PHP_URL_PATH);

// ── 1. API PROXY ─────────────────────────────────────────────────────────────
if (str_starts_with($path, '/api/')) {
    $backendUrl = 'http://127.0.0.1:3000' . $requestUri;

    $executeProxy = function() use ($backendUrl, $requestUri) {
        $ch = curl_init($backendUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD'] ?? 'GET');
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        // Forward request headers
        $forwardHeaders = [];
        $rawHeaders = getallheaders();
        foreach ($rawHeaders as $key => $value) {
            $lower = strtolower($key);
            if ($lower !== 'host') {
                $forwardHeaders[] = "{$key}: {$value}";
            }
        }
        curl_setopt($ch, CURLOPT_HTTPHEADER, $forwardHeaders);

        // Forward body for POST/PUT/PATCH/DELETE
        $body = file_get_contents('php://input');
        if (!empty($body)) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
        }

        // Capture response headers
        $responseHeaders = [];
        curl_setopt($ch, CURLOPT_HEADERFUNCTION, function ($curl, $header) use (&$responseHeaders) {
            $len = strlen($header);
            $headerParts = explode(':', $header, 2);
            if (count($headerParts) === 2) {
                $name = trim($headerParts[0]);
                $val = trim($headerParts[1]);
                $responseHeaders[$name] = $val;
            }
            return $len;
        });

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        return [$response, $httpCode, $responseHeaders, $curlError];
    };

    list($response, $httpCode, $responseHeaders, $curlError) = $executeProxy();

    // If backend is not running, try to auto-start it in the background
    if ($response === false || $httpCode === 0) {
        $projectDir = __DIR__;
        $cmd = "start /B node \"{$projectDir}/node_modules/tsx/dist/cli.mjs\" \"{$projectDir}/server.ts\"";
        @pclose(@popen($cmd, "r"));
        sleep(2);
        list($response, $httpCode, $responseHeaders, $curlError) = $executeProxy();
    }

    if ($response === false || $httpCode === 0) {
        http_response_code(503);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'error' => 'Backend service is starting up or temporarily offline.',
            'detail' => $curlError ?: 'Could not reach Express server on port 3000.',
            'hint' => 'Run `npm run dev` in the project root to start the backend.'
        ]);
        exit;
    }

    http_response_code($httpCode);
    if (isset($responseHeaders['Content-Type'])) {
        header('Content-Type: ' . $responseHeaders['Content-Type']);
    } else {
        header('Content-Type: application/json; charset=utf-8');
    }
    echo $response;
    exit;
}

// ── 2. STATIC ASSETS SERVED VIA FRONT CONTROLLER (FALLBACK) ──────────────────
// Assets in dist/assets
if (str_starts_with($path, '/assets/')) {
    $filePath = __DIR__ . '/dist' . $path;
    if (is_file($filePath)) {
        $ext = pathinfo($filePath, PATHINFO_EXTENSION);
        $mimes = [
            'js' => 'application/javascript',
            'css' => 'text/css',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'svg' => 'image/svg+xml',
            'woff2' => 'font/woff2',
            'woff' => 'font/woff',
        ];
        header('Content-Type: ' . ($mimes[$ext] ?? 'application/octet-stream'));
        readfile($filePath);
        exit;
    }
}

// Images in src/assets
if (str_starts_with($path, '/src/assets/')) {
    $filePath = __DIR__ . $path;
    if (is_file($filePath)) {
        $ext = pathinfo($filePath, PATHINFO_EXTENSION);
        $mimes = [
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'webp' => 'image/webp',
            'svg' => 'image/svg+xml',
        ];
        header('Content-Type: ' . ($mimes[$ext] ?? 'image/jpeg'));
        readfile($filePath);
        exit;
    }
}

// ── 3. SERVE PRODUCTION SPA (DIST/INDEX.HTML) ────────────────────────────────
$distIndex = __DIR__ . '/dist/index.html';
if (is_file($distIndex)) {
    header('Content-Type: text/html; charset=utf-8');
    readfile($distIndex);
    exit;
}

// Fallback if dist hasn't been built yet
http_response_code(500);
header('Content-Type: text/html; charset=utf-8');
echo '<h1>Frontend build missing</h1><p>Please run <code>npm run build</code> in the project directory.</p>';
