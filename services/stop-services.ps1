<#
.SYNOPSIS
    Stop the local backend service terminals from the services directory.
#>

[CmdletBinding()]
param()

$RootScript = Join-Path (Split-Path -Parent $PSScriptRoot) "stop-services.ps1"
& $RootScript
