# Start both backend (uvicorn) and frontend (Vite) in separate PowerShell windows.
# Usage: Right-click -> Run with PowerShell, or from PowerShell: .\start_all.ps1

$root = Split-Path -Parent $MyInvocation.MyCommand.Definition

# Backend: Start in a new PowerShell window
$backendCmd = "Set-Location -Path 'D:\Maitri'; D:\Maitri\py311-venv\Scripts\python.exe run_backend.py"
Start-Process -FilePath powershell -ArgumentList "-NoExit","-Command",$backendCmd -WindowStyle Normal

# Frontend: run via cmd to avoid PowerShell npm.ps1 policy problems
$frontendCmd = "cd /d D:\Maitri\frontend && npm run dev"
Start-Process -FilePath cmd.exe -ArgumentList "/k",$frontendCmd -WindowStyle Normal

Write-Host "Started backend and frontend in new windows. Check the windows for logs and Vite URL." -ForegroundColor Green
