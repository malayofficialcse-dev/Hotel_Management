<#
.SYNOPSIS
    Stop only the local service terminals started by start-services.ps1.
#>

[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

$RegistryPath = Join-Path $env:LOCALAPPDATA "StayEase\local-service-processes.json"
$RunnerPath = Join-Path $PSScriptRoot "start-local-service.ps1"

if (-not (Test-Path -LiteralPath $RegistryPath -PathType Leaf)) {
    Write-Host "No managed service terminals were found. Close any service windows manually if needed." -ForegroundColor Yellow
    return
}

$Registry = @(Get-Content -LiteralPath $RegistryPath -Raw | ConvertFrom-Json)
$Processes = @(Get-CimInstance -ClassName Win32_Process -ErrorAction Stop)
$ProcessesById = @{}
$ChildrenByParentId = @{}
foreach ($Process in $Processes) {
    $ProcessesById[[int]$Process.ProcessId] = $Process
    $ParentId = [int]$Process.ParentProcessId
    if (-not $ChildrenByParentId.ContainsKey($ParentId)) {
        $ChildrenByParentId[$ParentId] = New-Object 'System.Collections.Generic.List[int]'
    }
    $ChildrenByParentId[$ParentId].Add([int]$Process.ProcessId)
}

$ValidRoots = @()
foreach ($Entry in $Registry) {
    $ProcessId = [int]$Entry.ProcessId
    if (-not $ProcessesById.ContainsKey($ProcessId)) {
        Write-Host "Terminal for $($Entry.ServiceName) is no longer running." -ForegroundColor Gray
        continue
    }

    $Process = $ProcessesById[$ProcessId]
    $CommandLine = [string]$Process.CommandLine
    if ($Process.Name -ieq "powershell.exe" -and
        $CommandLine.IndexOf($RunnerPath, [StringComparison]::OrdinalIgnoreCase) -ge 0) {
        $ValidRoots += $ProcessId
    } else {
        Write-Warning "PID $ProcessId no longer matches the tracked StayEase terminal; it was not stopped."
    }
}

$ManagedProcesses = @{}
$Queue = New-Object 'System.Collections.Generic.Queue[object]'
foreach ($RootId in $ValidRoots) {
    $Queue.Enqueue([PSCustomObject]@{ ProcessId = $RootId; Depth = 0 })
}

while ($Queue.Count -gt 0) {
    $Current = $Queue.Dequeue()
    if ($ManagedProcesses.ContainsKey($Current.ProcessId)) {
        continue
    }

    $ManagedProcesses[$Current.ProcessId] = $Current.Depth
    if ($ChildrenByParentId.ContainsKey($Current.ProcessId)) {
        foreach ($ChildId in $ChildrenByParentId[$Current.ProcessId]) {
            $Queue.Enqueue([PSCustomObject]@{ ProcessId = $ChildId; Depth = $Current.Depth + 1 })
        }
    }
}

$StopErrors = @()
foreach ($Managed in $ManagedProcesses.GetEnumerator() | Sort-Object { $_.Value } -Descending) {
    try {
        Stop-Process -Id ([int]$Managed.Key) -Force -ErrorAction Stop
    } catch {
        if (Get-Process -Id ([int]$Managed.Key) -ErrorAction SilentlyContinue) {
            $StopErrors += "Could not stop PID $($Managed.Key): $($_.Exception.Message)"
        }
    }
}

if ($StopErrors.Count -gt 0) {
    foreach ($ErrorMessage in $StopErrors) {
        Write-Error $ErrorMessage
    }
    throw "Some tracked service processes could not be stopped. Their process IDs are listed above."
}

Remove-Item -LiteralPath $RegistryPath -Force
Write-Host "Stopped $($ValidRoots.Count) managed service terminal(s) and their child processes." -ForegroundColor Green
Write-Host "Local database services were not stopped." -ForegroundColor Gray
