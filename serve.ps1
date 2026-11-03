# ZenDesk Clock - Built-in Zero-Dependency Local Server for Windows
$port = 5500
$root = $PSScriptRoot
if (-not $root) {
    if ($MyInvocation.MyCommand.Path) {
        $root = Split-Path -Parent $MyInvocation.MyCommand.Path
    } else {
        $root = Get-Location
    }
}

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".svg"  = "image/svg+xml"
    ".png"  = "image/png"
    ".ico"  = "image/x-icon"
    ".txt"  = "text/plain; charset=utf-8"
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

try {
    $listener.Start()
} catch {
    Write-Host "Port $port might be busy, trying 5501..." -ForegroundColor Yellow
    $port = 5501
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://localhost:$port/")
    $listener.Start()
}

$url = "http://localhost:$port/"
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  ⏳ ZenDesk Clock is running at: $url" -ForegroundColor Green
Write-Host "  Opening default browser automatically..." -ForegroundColor Gray
Write-Host "  Press Ctrl+C in this window to stop the server." -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

# Open default browser
Start-Process $url

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $path = $request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrEmpty($path)) {
            $path = "index.html"
        }

        # Normalize path
        $filePath = Join-Path $root ($path.Replace('/', [System.IO.Path]::DirectorySeparatorChar))

        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime = $mimeTypes[$ext]
            if (-not $mime) { $mime = "application/octet-stream" }

            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentType = $mime
            $response.ContentLength64 = $bytes.Length
            $response.StatusCode = 200
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $err = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.ContentType = "text/plain"
            $response.OutputStream.Write($err, 0, $err.Length)
        }
        $response.OutputStream.Close()
    } catch {
        # Catch cancellation or client aborts gracefully
    }
}
