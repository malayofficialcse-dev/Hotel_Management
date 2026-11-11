<#
.SYNOPSIS
    Start the local backend services from the services directory.
#>

[CmdletBinding()]
param()

$RootScript = Join-Path (Split-Path -Parent $PSScriptRoot) "start-services.ps1"
& $RootScript
