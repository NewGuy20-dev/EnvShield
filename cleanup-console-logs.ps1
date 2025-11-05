# cleanup-console-logs.ps1
$targetFile = "app/api/v1/tokens/[tokenId]/route.ts"
if (Test-Path $targetFile) {
    $content = Get-Content $targetFile -Raw -ErrorAction SilentlyContinue
    if ($content) {
        $lines = $content -split "`r?`n"
        $cleanedLines = $lines | Where-Object { $_ -notmatch '\s*console\.(log|error)\s*\(' }
        $cleaned = $cleanedLines -join "`n"
        [System.IO.File]::WriteAllText($targetFile, $cleaned, [System.Text.Encoding]::UTF8)
    }
}
