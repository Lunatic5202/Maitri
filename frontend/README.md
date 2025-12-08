Frontend (Vite + React)

Run the dev server
1. From PowerShell you may need to use `cmd.exe` to avoid npm script policy errors.

```powershell
# in PowerShell
cmd.exe /c "cd /d D:\\Maitri\\frontend && npm install && npm run dev"
```

2. Or run inside a cmd prompt:

```cmd
cd /d D:\\Maitri\\frontend
npm install
npm run dev
```

Environment
- Development API URL is provided by `frontend/.env.local` as `VITE_API_BASE` (default: `http://localhost:8000`).
- The EmotionDetection component uses this env var to POST FormData to `${VITE_API_BASE}/classify` when Server mode is enabled.

Troubleshooting
- If the UI shows "Server Down", check backend with `Invoke-RestMethod -Uri 'http://127.0.0.1:8000/health'`.
- If PowerShell refuses to run `npm run dev`, use the `scripts/start_all.ps1` which launches the frontend in a `cmd` window automatically.


