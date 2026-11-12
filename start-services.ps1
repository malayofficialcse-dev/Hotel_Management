<#
.SYNOPSIS
    Start each StayEase backend microservice in its own local PowerShell window.
.DESCRIPTION
    Runs the Node.js and Go services directly on Windows. The local PostgreSQL,
    MongoDB, Redis, and RabbitMQ services must already be running. This script
    does not use Docker.
#>

[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

$Services = @(
    @{ Name = "auth-service";         Runtime = "Node"; Port = 8001; Script = "dev" },
    @{ Name = "user-service";         Runtime = "Node"; Port = 8002; Script = "dev" },
    @{ Name = "hotel-service";        Runtime = "Node"; Port = 8003; Script = "dev" },
    @{ Name = "room-service";         Runtime = "Node"; Port = 8004; Script = "dev" },
    @{ Name = "booking-service";      Runtime = "Go";   Port = 8005; Script = $null },
    @{ Name = "payment-service";      Runtime = "Node"; Port = 8006; Script = "dev" },
    @{ Name = "employee-service";     Runtime = "Node"; Port = 8007; Script = "dev" },
    @{ Name = "department-service";   Runtime = "Node"; Port = 8012; Script = "dev" },
    @{ Name = "housekeeping-service"; Runtime = "Node"; Port = 8008; Script = "dev" },
    @{ Name = "review-service";       Runtime = "Node"; Port = 8009; Script = "dev" },
    @{ Name = "notification-service"; Runtime = "Go";   Port = 8010; Script = $null },
    @{ Name = "analytics-service";    Runtime = "Go";   Port = 8011; Script = $null },
    @{ Name = "api-gateway";          Runtime = "Node"; Port = 8000; Script = "dev" }
)

$RootDir = $PSScriptRoot
$ServicesDir = Join-Path $RootDir "services"
$RunnerPath = Join-Path $RootDir "start-local-service.ps1"
$RegistryPath = Join-Path $env:LOCALAPPDATA "StayEase\local-service-processes.json"

$GoCommand = Get-Command go.exe -ErrorAction SilentlyContinue
if (-not $GoCommand) {
    $GoCandidates = @(
        (Join-Path $env:ProgramFiles "Go\bin\go.exe"),
        (Join-Path $env:LOCALAPPDATA "Programs\Go\bin\go.exe"),
        (Join-Path $env:USERPROFILE "go\bin\go.exe"),
        "C:\Go\bin\go.exe"
    )
    $GoExecutable = $GoCandidates |
        Where-Object { Test-Path -LiteralPath $_ -PathType Leaf } |
        Select-Object -First 1
    if ($GoExecutable) {
        $GoBin = Split-Path -Parent $GoExecutable
        $env:PATH = "$GoBin;$env:PATH"
        $GoCommand = Get-Command go.exe -ErrorAction SilentlyContinue
        Write-Host "Found Go at $GoExecutable and added it to this session's PATH." -ForegroundColor Cyan
    }
}

function Test-LocalTcpPort {
    param([Parameter(Mandatory = $true)][int]$Port)

    $Client = New-Object System.Net.Sockets.TcpClient
    $Connect = $null
    try {
        $Connect = $Client.BeginConnect([System.Net.IPAddress]::Loopback, $Port, $null, $null)
        if (-not $Connect.AsyncWaitHandle.WaitOne(500)) {
            return $false
        }

        $Client.EndConnect($Connect)
        return $true
    } catch {
        return $false
    } finally {
        if ($Connect) {
            $Connect.AsyncWaitHandle.Close()
        }
        $Client.Close()
    }
}

$MissingRequirements = @()
$NodeAvailable = [bool](Get-Command node.exe -ErrorAction SilentlyContinue) -and
    [bool](Get-Command npm.cmd -ErrorAction SilentlyContinue)
$GoAvailable = $false
if ($GoCommand) {
    $PreviousErrorActionPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = "Stop"
        & $GoCommand.Source tool compile -V 2>&1 | Out-Null
        $GoAvailable = $LASTEXITCODE -eq 0
    } catch {
        $GoAvailable = $false
    } finally {
        $ErrorActionPreference = $PreviousErrorActionPreference
    }
}
if (-not (Test-Path -LiteralPath $RunnerPath -PathType Leaf)) {
    $MissingRequirements += "Service terminal runner was not found: $RunnerPath"
}
foreach ($Service in $Services) {
    $ServicePath = Join-Path $ServicesDir $Service.Name
    if (-not (Test-Path -LiteralPath $ServicePath -PathType Container)) {
        $MissingRequirements += "Service directory was not found: $ServicePath"
    } elseif ($Service.Runtime -eq "Node" -and
        -not (Test-Path -LiteralPath (Join-Path $ServicePath "package.json") -PathType Leaf)) {
        $MissingRequirements += "Node package manifest was not found for '$($Service.Name)'."
    } elseif ($Service.Runtime -eq "Go" -and
        -not (Test-Path -LiteralPath (Join-Path $ServicePath "go.mod") -PathType Leaf)) {
        $MissingRequirements += "Go module file was not found for '$($Service.Name)'."
    }
}

$MissingLocalDependencies = @()
foreach ($Dependency in @(
    @{ Name = "PostgreSQL"; Port = 5432 },
    @{ Name = "MongoDB";    Port = 27017 },
    @{ Name = "Redis";      Port = 6379 },
    @{ Name = "RabbitMQ";   Port = 5672 }
)) {
    if (-not (Test-LocalTcpPort -Port $Dependency.Port)) {
        $MissingLocalDependencies += "$($Dependency.Name) is not accepting local connections on port $($Dependency.Port)."
    }
}

$OccupiedServicePorts = @()
foreach ($Service in $Services) {
    if (Test-LocalTcpPort -Port $Service.Port) {
        $OccupiedServicePorts += "$($Service.Port) ($($Service.Name))"
    }
}

if ($MissingRequirements.Count -gt 0) {
    Write-Host "Cannot start services because required project files are missing:" -ForegroundColor Red
    foreach ($Issue in $MissingRequirements) {
        Write-Host "  - $Issue" -ForegroundColor Red
    }
    exit 1
}

if (-not (Get-Command node.exe -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js was not found; Node services will be skipped." -ForegroundColor Yellow
}
if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
    Write-Host "npm was not found; Node services will be skipped." -ForegroundColor Yellow
}
if (-not $GoAvailable) {
    if ($GoCommand) {
        Write-Host "Go was found, but Windows would not run its compiler; booking, notification, and analytics services will be skipped." -ForegroundColor Yellow
        Write-Host "Check your Windows Application Control policy for: $($GoCommand.Source)" -ForegroundColor Yellow
    } else {
        Write-Host "Go was not found; booking, notification, and analytics services will be skipped." -ForegroundColor Yellow
        Write-Host "Install Go from https://go.dev/dl/, reopen PowerShell, and run this script again to start them." -ForegroundColor Yellow
    }
}
if ($MissingLocalDependencies.Count -gt 0) {
    Write-Host "Some local dependencies are unavailable; affected features may be degraded:" -ForegroundColor Yellow
    foreach ($Issue in $MissingLocalDependencies) {
        Write-Host "  - $Issue" -ForegroundColor Yellow
    }
    Write-Host "Start these databases/brokers locally if the services need them. This script will not start containers." -ForegroundColor Yellow
}

$ServicesToStart = @($Services | Where-Object {
    ($_.Runtime -eq "Node" -and $NodeAvailable) -or
    ($_.Runtime -eq "Go" -and $GoAvailable)
})
$ServicesToSkip = @($Services | Where-Object {
    ($_.Runtime -eq "Node" -and -not $NodeAvailable) -or
    ($_.Runtime -eq "Go" -and -not $GoAvailable)
})
$OccupiedPortsByService = @{}
foreach ($Service in $Services) {
    if (Test-LocalTcpPort -Port $Service.Port) {
        $OccupiedPortsByService[$Service.Name] = $Service.Port
    }
}
$ServicesToStart = @($ServicesToStart | Where-Object { -not $OccupiedPortsByService.ContainsKey($_.Name) })

if ($OccupiedPortsByService.Count -gt 0) {
    Write-Host "Skipping services whose ports are already in use:" -ForegroundColor Yellow
    foreach ($ServiceName in $OccupiedPortsByService.Keys) {
        Write-Host "  - $ServiceName (port $($OccupiedPortsByService[$ServiceName]))" -ForegroundColor Yellow
    }
}

if ($ServicesToStart.Count -eq 0) {
    Write-Host "No services can be started. Install Node.js/npm and/or Go, and free the service ports, then try again." -ForegroundColor Red
    exit 1
}

if ($NodeAvailable) {
    $NpmCommand = (Get-Command npm.cmd -ErrorAction Stop).Source
} else {
    $NpmCommand = $null
}
foreach ($Service in $ServicesToStart | Where-Object { $_.Runtime -eq "Node" }) {
    $ServicePath = Join-Path $ServicesDir $Service.Name
    $RequiredExecutable = if ($Service.Script -eq "start:dev") { "nest.cmd" } else { "tsx.cmd" }
    $ExecutablePath = Join-Path $ServicePath "node_modules\.bin\$RequiredExecutable"
    $DependenciesReady = Test-Path -LiteralPath $ExecutablePath -PathType Leaf

    if ($DependenciesReady) {
        Push-Location -LiteralPath $ServicePath
        try {
            $PreviousErrorActionPreference = $ErrorActionPreference
            $ErrorActionPreference = "Continue"
            & $NpmCommand ls --depth=0 2>&1 | Out-Null
            $DependenciesReady = $LASTEXITCODE -eq 0
        } finally {
            $ErrorActionPreference = $PreviousErrorActionPreference
            Pop-Location
        }
    }

    if (-not $DependenciesReady) {
        Write-Host "Repairing npm dependencies for $($Service.Name)..." -ForegroundColor Cyan
        Push-Location -LiteralPath $ServicePath
        try {
            $PreviousErrorActionPreference = $ErrorActionPreference
            $ErrorActionPreference = "Continue"
            if (Test-Path -LiteralPath (Join-Path $ServicePath "package-lock.json") -PathType Leaf) {
                & $NpmCommand ci --no-audit --no-fund
            } else {
                & $NpmCommand install --no-audit --no-fund
            }
            $NpmExitCode = $LASTEXITCODE
            $ErrorActionPreference = $PreviousErrorActionPreference
            if ($NpmExitCode -ne 0) {
                Write-Host "Skipping $($Service.Name): npm dependency installation failed with exit code $NpmExitCode." -ForegroundColor Red
                $ServicesToSkip += $Service
                $ServicesToStart = @($ServicesToStart | Where-Object { $_.Name -ne $Service.Name })
            }
        } finally {
            $ErrorActionPreference = $PreviousErrorActionPreference
            Pop-Location
        }
    }
}

$PowerShellPath = Join-Path $PSHOME "powershell.exe"
if (-not (Test-Path -LiteralPath $PowerShellPath -PathType Leaf)) {
    throw "Windows PowerShell executable was not found: $PowerShellPath"
}

$RegistryDirectory = Split-Path -Parent $RegistryPath
New-Item -ItemType Directory -Path $RegistryDirectory -Force | Out-Null
$StartedProcesses = @()

Write-Host "`nOpening one PowerShell window per backend service..." -ForegroundColor Cyan
foreach ($Service in $ServicesToStart) {
    $ServicePath = Join-Path $ServicesDir $Service.Name
    if (-not (Test-Path -LiteralPath $ServicePath -PathType Container)) {
        throw "Service directory was not found: $ServicePath"
    }

    $Arguments = @(
        "-NoExit",
        "-ExecutionPolicy", "Bypass",
        "-File", "`"$RunnerPath`"",
        "-ServiceName", $Service.Name,
        "-Runtime", $Service.Runtime,
        "-ServiceDirectory", "`"$ServicePath`""
    )
    if ($Service.Script) {
        $Arguments += @("-NpmScript", $Service.Script)
    }

    $Terminal = Start-Process -FilePath $PowerShellPath `
        -ArgumentList $Arguments `
        -WorkingDirectory $ServicePath `
        -WindowStyle Normal `
        -PassThru

    $StartedProcesses += [PSCustomObject]@{
        ServiceName = $Service.Name
        ProcessId = $Terminal.Id
        StartedAt = (Get-Date).ToUniversalTime().ToString("o")
    }
    ConvertTo-Json -InputObject @($StartedProcesses) -Depth 3 |
        Set-Content -LiteralPath $RegistryPath -Encoding UTF8

    Write-Host "  Started $($Service.Name) terminal (port $($Service.Port), PID $($Terminal.Id))." -ForegroundColor Green
}

Write-Host "`nOpened $($StartedProcesses.Count) of $($Services.Count) backend service terminal(s)." -ForegroundColor Green
if ($ServicesToSkip.Count -gt 0) {
    Write-Host "Services not started:" -ForegroundColor Yellow
    foreach ($Service in $ServicesToSkip) {
        Write-Host "  - $($Service.Name)" -ForegroundColor Yellow
    }
}
if ($StartedProcesses.ServiceName -contains "api-gateway") {
    Write-Host "API Gateway: http://localhost:8000" -ForegroundColor White
} elseif (Test-LocalTcpPort -Port 8000) {
    Write-Host "API Gateway port 8000 is already in use; check the existing listener." -ForegroundColor Yellow
} else {
    Write-Host "API Gateway was not started; install Node.js/npm and rerun the script." -ForegroundColor Yellow
}
Write-Host "Stop the managed service terminals with .\stop-services.ps1" -ForegroundColor Gray
