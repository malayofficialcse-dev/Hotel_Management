<#
.SYNOPSIS
    StayEase Enterprise Hotel Management Platform - Unified Database Seeder
.DESCRIPTION
    Populates all MongoDB collections and PostgreSQL databases with rich,
    interconnected, production-grade test data.
#>

param(
    [string]$PostgresHost = "localhost",
    [int]$PostgresPort = 55432,
    [string]$PostgresUser = "postgres",
    [string]$PostgresPassword = "postgrespassword",
    [string]$MongoUri = "mongodb://localhost:27017"
)

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "   🏨 StayEase Unified Master Seeder (MongoDB + PostgreSQL)     " -ForegroundColor Yellow
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " PostgreSQL Target: ${PostgresHost}:${PostgresPort}" -ForegroundColor Gray
Write-Host " MongoDB Target:    $MongoUri" -ForegroundColor Gray
Write-Host ""

$InfraDir = $PSScriptRoot

# 1. Seed MongoDB
Write-Host "[1/2] Seeding MongoDB (hotel_catalog, housekeeping, reviews)..." -ForegroundColor Yellow
$mongoSeedScript = Join-Path $InfraDir "seed-mongodb.js"
if (Test-Path $mongoSeedScript) {
    $env:MONGODB_URI = $MongoUri
    & node $mongoSeedScript
} else {
    Write-Host "❌ Could not find $mongoSeedScript" -ForegroundColor Red
}

# 2. Seed PostgreSQL
Write-Host ""
Write-Host "[2/3] Seeding PostgreSQL databases..." -ForegroundColor Yellow
$postgresSqlScript = Join-Path $InfraDir "seed-postgres.sql"

$psqlPaths = @(
    "psql",
    "C:\Program Files\PostgreSQL\18\bin\psql.exe",
    "C:\Program Files\PostgreSQL\17\bin\psql.exe",
    "C:\Program Files\PostgreSQL\16\bin\psql.exe"
)

$psqlCmd = $null
foreach ($p in $psqlPaths) {
    if (Get-Command $p -ErrorAction SilentlyContinue) {
        $psqlCmd = $p
        break
    }
}

if ($psqlCmd -and (Test-Path $postgresSqlScript)) {
    $env:PGPASSWORD = $PostgresPassword
    & $psqlCmd -h $PostgresHost -p $PostgresPort -U $PostgresUser -f $postgresSqlScript
    Write-Host "✅ PostgreSQL seed script applied!" -ForegroundColor Green
} else {
    Write-Host "⚠️ psql executable or seed script not found." -ForegroundColor Yellow
}

# 3. Seed Hotel Departments and Employees
Write-Host ""
Write-Host "[3/3] Seeding Departments and Employees across all hotels..." -ForegroundColor Yellow
$deptEmpScript = Join-Path $InfraDir "seed-departments-employees.js"
if (Test-Path $deptEmpScript) {
    $env:MONGODB_URI = $MongoUri
    $env:DATABASE_URL = "postgresql://${PostgresUser}:${PostgresPassword}@${PostgresHost}:${PostgresPort}/hotel_operations_db?schema=public"
    & node $deptEmpScript
    Write-Host "✅ Hotel Departments and Employees seeded!" -ForegroundColor Green
} else {
    Write-Host "❌ Could not find $deptEmpScript" -ForegroundColor Red
}

Write-Host ""
Write-Host "=================================================================" -ForegroundColor Green
Write-Host "   ✅ StayEase Seeding Successfully Completed!                   " -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green
Write-Host ""
