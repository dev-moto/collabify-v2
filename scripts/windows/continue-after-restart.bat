@echo off
setlocal enabledelayedexpansion

echo ============================================================
echo Collabify - Continue After Restart
echo ============================================================
echo.

cd /d "%~dp0\..\.."

echo Current folder:
cd
echo.

echo [1/7] Checking GitHub CLI...
where gh >nul 2>nul
if errorlevel 1 (
  echo GitHub CLI was not found on PATH.
  echo Install it with: winget install GitHub.cli
  echo Then reopen this batch file.
  pause
  exit /b 1
) else (
  gh --version
)
echo.

echo [2/7] Checking Node/npm...
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found on PATH.
  echo Install Node.js LTS, then reopen this batch file.
  pause
  exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
  echo npm was not found on PATH.
  echo Reinstall Node.js LTS, then reopen this batch file.
  pause
  exit /b 1
)
node --version
npm --version
echo.

echo [3/7] Updating WSL...
wsl --update
if errorlevel 1 (
  echo WSL update failed. If this is a permissions issue, run this batch file as Administrator.
  echo You can continue manually after fixing WSL.
  pause
  exit /b 1
)

echo Setting WSL default version to 2...
wsl --set-default-version 2
if errorlevel 1 (
  echo Failed to set WSL default version to 2.
  echo Run PowerShell as Administrator and execute: wsl --set-default-version 2
  pause
  exit /b 1
)
echo.

echo [4/7] Checking Docker...
where docker >nul 2>nul
if errorlevel 1 (
  echo Docker CLI was not found on PATH.
  echo Install/start Docker Desktop first, then rerun this batch file.
  pause
  exit /b 1
)

docker version >nul 2>nul
if errorlevel 1 (
  echo Docker is installed but the engine is not running.
  echo Starting Docker Desktop if installed...
  if exist "%ProgramFiles%\Docker\Docker\Docker Desktop.exe" (
    start "" "%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
  ) else (
    echo Docker Desktop executable not found in Program Files.
  )
  echo.
  echo Wait until Docker Desktop says "Engine running", then press any key.
  pause >nul
)

docker version >nul 2>nul
if errorlevel 1 (
  echo Docker engine is still not available.
  echo Open Docker Desktop manually, wait for it to finish starting, then rerun this file.
  pause
  exit /b 1
)
docker version
echo.

echo [5/7] Checking Supabase CLI via npx...
npx supabase --version
if errorlevel 1 (
  echo Supabase CLI via npx failed.
  echo Check your internet connection and npm setup.
  pause
  exit /b 1
)
echo.

echo [6/7] Validating local Supabase migration...
npx supabase db reset --debug
if errorlevel 1 (
  echo.
  echo Supabase migration validation failed.
  echo Copy the error output and send it back for troubleshooting.
  pause
  exit /b 1
)
echo.

echo [7/7] Checking git diff whitespace...
git diff --check
if errorlevel 1 (
  echo git diff --check found an issue. Review the output above.
  pause
  exit /b 1
)
echo.

echo ============================================================
echo Done. Supabase local migration validation completed.
echo Next: send the result back, then continue with RLS tests or frontend auth.
echo ============================================================
pause
