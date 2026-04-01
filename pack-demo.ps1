# publish.ps1 — Build, pack, and install all @your-org packages into the demo app
# Usage: .\publish.ps1

$ErrorActionPreference = "Stop"

$packages = @(
    "packages\core",
    "packages\component-libs\angular-button",
    "packages\component-libs\bootstrap-lib"
)

$root = $PSScriptRoot
$demoPath = Join-Path $root "apps\demo"
$demoPackagesPath = Join-Path $demoPath "packages"
$tarballs = @()

if (Test-Path $demoPackagesPath) {
    Remove-Item -Recurse -Force $demoPackagesPath
}
New-Item -ItemType Directory -Force -Path $demoPackagesPath | Out-Null

foreach ($pkg in $packages) {
    $pkgPath = Join-Path $root $pkg
    $pkgName = (Get-Content "$pkgPath\package.json" | ConvertFrom-Json).name

    Write-Host ""
    Write-Host ">> $pkgName" -ForegroundColor Cyan

    Push-Location $pkgPath
    try {
        Write-Host "   Building..." -ForegroundColor Gray
        npm run build
        if ($LASTEXITCODE -ne 0) { throw "Build failed for $pkgName" }

        Write-Host "   Packing..." -ForegroundColor Gray
        $packDir = if (Test-Path "$pkgPath\ng-package.json") { "$pkgPath\dist" } else { $pkgPath }
        Push-Location $packDir
        $output = npm pack --pack-destination $demoPackagesPath --json | ConvertFrom-Json
        Pop-Location
        $tarball = Join-Path $demoPackagesPath $output[0].filename
        $tarballs += $tarball
        Write-Host "   -> packages\$($output[0].filename)" -ForegroundColor Gray
    } finally {
        Pop-Location
    }
}

Write-Host ""
Write-Host ">> Installing into demo app" -ForegroundColor Cyan
Push-Location $demoPath
try {
    npm install --no-workspaces @($tarballs)
    if ($LASTEXITCODE -ne 0) { throw "npm install failed in demo app" }
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "Done." -ForegroundColor Green
