<#
.SYNOPSIS
    Load a service's local .env file and run its development command.
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$ServiceName,

    [Parameter(Mandatory = $true)]
    [ValidateSet("Node", "Go")]
    [string]$Runtime,

    [Parameter(Mandatory = $true)]
    [string]$ServiceDirectory,

    [string]$NpmScript
)

$ErrorActionPreference = "Continue"
Set-Location -LiteralPath $ServiceDirectory

$EnvironmentFile = Join-Path $ServiceDirectory ".env"
if (Test-Path -LiteralPath $EnvironmentFile -PathType Leaf) {
    foreach ($Line in Get-Content -LiteralPath $EnvironmentFile) {
        if ($Line -match '^\s*(?:export\s+)?(?<Name>[A-Za-z_][A-Za-z0-9_]*)\s*=\s*(?<Value>.*)\s*$') {
            $Name = $Matches.Name
            $Value = $Matches.Value.Trim()

            if ($Value.Length -ge 2) {
                $FirstCharacter = $Value[0]
                $LastCharacter = $Value[$Value.Length - 1]
                if (($FirstCharacter -eq '"' -and $LastCharacter -eq '"') -or
                    ($FirstCharacter -eq "'" -and $LastCharacter -eq "'")) {
                    $Value = $Value.Substring(1, $Value.Length - 2)
                }
            }

            [Environment]::SetEnvironmentVariable($Name, $Value, "Process")
        }
    }
}

Write-Host "Starting $ServiceName locally..." -ForegroundColor Cyan
if ($Runtime -eq "Node") {
    if (-not $NpmScript) {
        throw "An npm script is required for Node service '$ServiceName'."
    }

    $NpmCommand = Get-Command npm.cmd -ErrorAction Stop
    & $NpmCommand.Source run $NpmScript
    $ServiceExitCode = $LASTEXITCODE
} else {
    $GoCommand = Get-Command go.exe -ErrorAction Stop
    & $GoCommand.Source run .
    $ServiceExitCode = $LASTEXITCODE
}

if ($ServiceExitCode -ne 0) {
    Write-Host "$ServiceName exited with code $ServiceExitCode. Check the output above." -ForegroundColor Red
    if ($Runtime -eq "Go") {
        Write-Host "If Windows reports an Application Control block, ask your administrator to approve the Go service for local development or provide an approved development environment; this script cannot override that policy." -ForegroundColor Yellow
    }
}
