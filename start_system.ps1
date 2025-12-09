#!/usr/bin/env powershell

<#
.SYNOPSIS
MAITRI Complete System Startup Script

.DESCRIPTION
Starts the backend API, frontend dev server, and opens browser to the application.

.PARAMETER BackendOnly
Only start the backend API (skip frontend)

.PARAMETER FrontendOnly  
Only start the frontend (assumes backend already running)

.EXAMPLE
.\start_system.ps1
Starts both backend and frontend

.EXAMPLE
.\start_system.ps1 -BackendOnly
Starts only the backend API on port 8000
#>

param(
    [switch]$BackendOnly,
    [switch]$FrontendOnly
)

$ErrorActionPreference = "Stop"
$BACKEND_PORT = 8000
$FRONTEND_PORT = 5173
$VENV_PATH = "D:\Maitri\py311-venv"
$PYTHON_EXE = "$VENV_PATH\Scripts\python.exe"

function Write-Status {
    param([string]$Message, [ValidateSet("Info", "Success", "Error", "Warning")]$Type = "Info")
    
    $colors = @{
        Info    = "Cyan"
        Success = "Green"
        Error   = "Red"
        Warning = "Yellow"
    }
    
    Write-Host $Message -ForegroundColor $colors[$Type]
}

function Test-Port {
    param([int]$Port)
    try {
        $tcpConnection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue
        return $tcpConnection.TcpTestSucceeded
    } catch {
        return $false
    }
}

function Start-Backend {
    Write-Status "Starting Backend API..." "Info"
    
    if (Test-Port $BACKEND_PORT) {
        Write-Status "Port $BACKEND_PORT already in use. Killing existing processes..." "Warning"
        try {
            Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force
            Start-Sleep -Seconds 2
        } catch {}
    }
    
    $cmd = "cd d:\Maitri; & '$PYTHON_EXE' -m uvicorn backend.main:app --port $BACKEND_PORT"
    
    # Start in new process to keep it running
    $process = Start-Process -FilePath powershell.exe `
        -ArgumentList "-NoExit -Command `"$cmd`"" `
        -PassThru
    
    Write-Status "Backend started (PID: $($process.Id))" "Success"
    
    # Wait for backend to be ready
    Write-Status "Waiting for backend to start..." "Info"
    $maxWait = 10
    $waited = 0
    while (-not (Test-Port $BACKEND_PORT) -and $waited -lt $maxWait) {
        Start-Sleep -Seconds 1
        $waited++
    }
    
    if (Test-Port $BACKEND_PORT) {
        Write-Status "Backend is ready on http://localhost:$BACKEND_PORT" "Success"
        
        # Test health endpoint
        try {
            $health = Invoke-RestMethod -Uri "http://localhost:$BACKEND_PORT/health" -ErrorAction SilentlyContinue
            if ($health.status -eq "ok") {
                Write-Status "Backend health check: OK" "Success"
            }
        } catch {
            Write-Status "Could not verify health check" "Warning"
        }
    } else {
        Write-Status "Backend failed to start or took too long" "Error"
        return $false
    }
    
    return $true
}

function Start-Frontend {
    Write-Status "Starting Frontend..." "Info"
    
    $frontendPath = "d:\Maitri\frontend"
    
    # Check if bun is available, otherwise use npm
    $packageManager = "npm"
    if (Get-Command bun -ErrorAction SilentlyContinue) {
        $packageManager = "bun"
    }
    
    Write-Status "Using package manager: $packageManager" "Info"
    
    # Set environment variable for API base
    $env:VITE_API_BASE = "http://localhost:$BACKEND_PORT"
    
    # Start frontend dev server
    $cmd = "cd '$frontendPath'; & $packageManager run dev"
    $process = Start-Process -FilePath powershell.exe `
        -ArgumentList "-NoExit -Command `"$cmd`"" `
        -PassThru
    
    Write-Status "Frontend started (PID: $($process.Id))" "Success"
    
    # Wait for frontend to be ready
    Write-Status "Waiting for frontend to start..." "Info"
    $maxWait = 30
    $waited = 0
    while (-not (Test-Port $FRONTEND_PORT) -and $waited -lt $maxWait) {
        Start-Sleep -Seconds 1
        $waited++
    }
    
    if (Test-Port $FRONTEND_PORT) {
        Write-Status "Frontend is ready on http://localhost:$FRONTEND_PORT" "Success"
        
        # Open browser
        Start-Sleep -Seconds 2
        Write-Status "Opening browser..." "Info"
        Start-Process "http://localhost:$FRONTEND_PORT"
    } else {
        Write-Status "Frontend failed to start or took too long" "Error"
        return $false
    }
    
    return $true
}

# Main execution
Write-Status "========================================" "Info"
Write-Status "MAITRI Emotion Classification System" "Info"
Write-Status "========================================" "Info"
Write-Host ""

try {
    if (-not $FrontendOnly) {
        if (-not (Start-Backend)) {
            exit 1
        }
        Write-Host ""
    }
    
    if (-not $BackendOnly) {
        if (-not (Start-Frontend)) {
            exit 1
        }
        Write-Host ""
    }
    
    Write-Status "========================================" "Success"
    Write-Status "System is ready!" "Success"
    Write-Status "========================================" "Success"
    Write-Host ""
    
    if (-not $FrontendOnly) {
        Write-Status "Backend API: http://localhost:$BACKEND_PORT" "Info"
        Write-Status "Documentation: http://localhost:$BACKEND_PORT/docs" "Info"
    }
    
    if (-not $BackendOnly) {
        Write-Status "Frontend: http://localhost:$FRONTEND_PORT" "Info"
    }
    
    Write-Host ""
    Write-Status "Press Ctrl+C in any window to stop services" "Info"
    
    # Keep script running
    while ($true) {
        Start-Sleep -Seconds 60
    }
    
} catch {
    Write-Status "Error: $_" "Error"
    exit 1
}
