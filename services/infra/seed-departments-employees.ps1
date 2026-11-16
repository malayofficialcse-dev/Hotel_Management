<#
.SYNOPSIS
    Seed Departments and Employees across all Hotels in StayEase.
.DESCRIPTION
    Dynamically fetches all active hotels from MongoDB hotel_catalog,
    creates standard departments in MongoDB (hotel_departments) and PostgreSQL (hotel_operations_db),
    and inserts realistic department-linked employees with positions, salaries, codes, and permissions.
.EXAMPLE
    .\services\infra\seed-departments-employees.ps1
#>

[CmdletBinding()]
param(
    [string]$MongoUri = "mongodb://localhost:27017",
    [string]$PostgresUrl = "postgresql://postgres:postgrespassword@localhost:55432/hotel_operations_db?schema=public"
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$NodeScript = Join-Path $ScriptDir "seed-departments-employees.js"

if (-not (Test-Path -LiteralPath $NodeScript -PathType Leaf)) {
    throw "Node script not found: $NodeScript"
}

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "🏨 StayEase Departments & Employees Master Seeder" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "MongoDB URI:     $MongoUri" -ForegroundColor Gray
Write-Host "PostgreSQL URL:  $PostgresUrl" -ForegroundColor Gray
Write-Host ""

$env:MONGODB_URI = $MongoUri
$env:DATABASE_URL = $PostgresUrl

node "$NodeScript"

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Seeding failed with exit code $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "`n✅ Successfully seeded departments and employees for all hotels!" -ForegroundColor Green
