<?php

use Valet\Drivers\ValetDriver;

class LocalValetDriver extends ValetDriver
{
    /**
     * Determine if the driver serves the request.
     */
    public function serves(string $sitePath, string $siteName, string $uri): bool
    {
        return true;
    }

    /**
     * Determine if the incoming request is for a static file.
     */
    public function isStaticFile(string $sitePath, string $siteName, string $uri)
    {
        // Never treat API calls as static files
        if (str_starts_with($uri, '/api/')) {
            return false;
        }

        // 1. Assets from Vite production build in /dist/assets
        if (str_starts_with($uri, '/assets/')) {
            $path = $sitePath . '/dist' . $uri;
            if (is_file($path)) {
                return $path;
            }
        }

        // 2. Images and media in /src/assets
        if (str_starts_with($uri, '/src/assets/')) {
            $path = $sitePath . $uri;
            if (is_file($path)) {
                return $path;
            }
        }

        // 3. Any direct file in /dist (e.g. favicon, robots.txt, etc.)
        if ($uri !== '/' && $uri !== '' && is_file($sitePath . '/dist' . $uri)) {
            return $sitePath . '/dist' . $uri;
        }

        return false;
    }

    /**
     * Get the fully resolved path to the application's front controller.
     */
    public function frontControllerPath(string $sitePath, string $siteName, string $uri): ?string
    {
        return $sitePath . '/index.php';
    }
}

