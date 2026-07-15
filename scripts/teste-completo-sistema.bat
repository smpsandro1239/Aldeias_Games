@echo off
setlocal enabledelayedexpansion

echo ============================================
echo   TESTE COMPLETO DO SISTEMA
echo   Aldeias Games
echo ============================================
echo.

set TOTAL=0
set PASSED=0
set FAILED=0

cd /d "%~dp0.."

REM 1. Vitest Unit + Integration Tests
set /a TOTAL+=1
echo [1/7] Vitest (unit + integration + validation)...
set NODE_ENV=test
npx vitest run 2>&1
if !errorlevel! equ 0 (
    set /a PASSED+=1
    echo   [PASS] Vitest
) else (
    set /a FAILED+=1
    echo   [FAIL] Vitest
)
echo.

REM 2. Playwright E2E Tests
set /a TOTAL+=1
echo [2/7] Playwright E2E (browser tests)...
npx playwright test 2>&1
if !errorlevel! equ 0 (
    set /a PASSED+=1
    echo   [PASS] Playwright
) else (
    set /a FAILED+=1
    echo   [FAIL] Playwright
)
echo.

REM 3. API Health Check
set /a TOTAL+=1
echo [3/7] API Health Check...
set BASE_URL=%BASE_URL%
if "%BASE_URL%"=="" set BASE_URL=http://localhost:3000
curl -s "%BASE_URL%/api/health" | findstr /C:"ok" >nul 2>&1
if !errorlevel! equ 0 (
    set /a PASSED+=1
    echo   [PASS] API Health
) else (
    set /a FAILED+=1
    echo   [FAIL] API Health (%BASE_URL%/api/health)
)
echo.

REM 4. 2FA Flow Test
set /a TOTAL+=1
echo [4/7] 2FA (TOTP) flow test...
node scripts/test-2fa.mjs %BASE_URL% 2>&1
if !errorlevel! equ 0 (
    set /a PASSED+=1
    echo   [PASS] 2FA
) else (
    set /a FAILED+=1
    echo   [FAIL] 2FA
)
echo.

REM 5. Rate Limiting Test
set /a TOTAL+=1
echo [5/7] Rate Limiting test...
node scripts/test-rate-limit.mjs %BASE_URL% 2>&1
if !errorlevel! equ 0 (
    set /a PASSED+=1
    echo   [PASS] Rate Limiting
) else (
    set /a FAILED+=1
    echo   [FAIL] Rate Limiting
)
echo.

REM 6. Payment (Stripe) Test
set /a TOTAL+=1
echo [6/7] Payment (Stripe) test...
node scripts/test-payment.mjs %BASE_URL% 2>&1
if !errorlevel! equ 0 (
    set /a PASSED+=1
    echo   [PASS] Payment
) else (
    set /a FAILED+=1
    echo   [FAIL] Payment
)
echo.

REM 7. Build Verification
set /a TOTAL+=1
echo [7/7] Build verification...
if exist "scripts\verify-build.bat" (
    call scripts\verify-build.bat 2>&1
    if !errorlevel! equ 0 (
        set /a PASSED+=1
        echo   [PASS] Build
    ) else (
        set /a FAILED+=1
        echo   [FAIL] Build
    )
) else (
    echo   [SKIP] verify-build.bat not found
    set /a TOTAL-=1
)
echo.

REM RESULTS SUMMARY
echo ============================================
echo   RESULTADO FINAL
echo ============================================
echo   Total:    %TOTAL%
echo   Passaram: %PASSED%
echo   Falharam: %FAILED%
if %FAILED% equ 0 (
    echo.
    echo   TODOS OS TESTES PASSARAM!
) else (
    echo.
    echo   ALGUNS TESTES FALHARAM
)
echo ============================================
echo.

if %FAILED% gtr 0 (
    exit /b 1
) else (
    exit /b 0
)
