@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

echo ╔══════════════════════════════════════════════════════════╗
echo ║  TESTE COMPLETO DO SISTEMA — Aldeias Games             ║
echo ║  Executa todos os suites de teste sequencialmente      ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

set TOTAL=0
set PASSED=0
set FAILED=0

cd /d "%~dp0.."

REM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REM 1. Vitest Unit + Integration Tests
REM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
set /a TOTAL+=1
echo [1/7] Vitest (unit + integration + validation)...
set NODE_ENV=test
npx vitest run 2>&1
if %errorlevel% equ 0 (
    set /a PASSED+=1
    echo   ✅ Vitest PASS
) else (
    set /a FAILED+=1
    echo   ❌ Vitest FALHOU
)
echo.

REM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REM 2. Playwright E2E Tests
REM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
set /a TOTAL+=1
echo [2/7] Playwright E2E (browser tests)...
npx playwright test 2>&1
if %errorlevel% equ 0 (
    set /a PASSED+=1
    echo   ✅ Playwright PASS
) else (
    set /a FAILED+=1
    echo   ❌ Playwright FALHOU
)
echo.

REM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REM 3. API Health Check
REM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
set /a TOTAL+=1
echo [3/7] API Health Check...
set BASE_URL=%BASE_URL%
if "%BASE_URL%"=="" set BASE_URL=http://localhost:3000
curl -s "%BASE_URL%/api/health" | findstr /C:"ok" >nul 2>&1
if %errorlevel% equ 0 (
    set /a PASSED+=1
    echo   ✅ API Health OK
) else (
    set /a FAILED+=1
    echo   ❌ API Health FALHOU (%BASE_URL%/api/health)
)
echo.

REM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REM 4. 2FA Flow Test
REM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
set /a TOTAL+=1
echo [4/7] 2FA (TOTP) flow test...
node scripts/test-2fa.mjs %BASE_URL% 2>&1
if %errorlevel% equ 0 (
    set /a PASSED+=1
    echo   ✅ 2FA PASS
) else (
    set /a FAILED+=1
    echo   ❌ 2FA FALHOU
)
echo.

REM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REM 5. Rate Limiting Test
REM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
set /a TOTAL+=1
echo [5/7] Rate Limiting test...
node scripts/test-rate-limit.mjs %BASE_URL% 2>&1
if %errorlevel% equ 0 (
    set /a PASSED+=1
    echo   ✅ Rate Limiting PASS
) else (
    set /a FAILED+=1
    echo   ❌ Rate Limiting FALHOU
)
echo.

REM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REM 6. Payment (Stripe) Test
REM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
set /a TOTAL+=1
echo [6/7] Payment (Stripe) test...
node scripts/test-payment.mjs %BASE_URL% 2>&1
if %errorlevel% equ 0 (
    set /a PASSED+=1
    echo   ✅ Payment PASS
) else (
    set /a FAILED+=1
    echo   ❌ Payment FALHOU
)
echo.

REM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REM 7. Build Verification
REM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
set /a TOTAL+=1
echo [7/7] Build verification...
if exist "scripts\verify-build.bat" (
    call scripts\verify-build.bat 2>&1
    if !errorlevel! equ 0 (
        set /a PASSED+=1
        echo   ✅ Build PASS
    ) else (
        set /a FAILED+=1
        echo   ❌ Build FALHOU
    )
) else (
    echo   ⚠️  scripts\verify-build.bat não encontrado — ignorado
    set /a TOTAL-=1
)
echo.

REM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REM RESULTS SUMMARY
REM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ╔══════════════════════════════════════════════════════════╗
echo ║  RESULTADO FINAL                                        ║
echo ╠══════════════════════════════════════════════════════════╣
echo ║  Total:   %TOTAL% testes                                    ║
echo ║  Passaram: %PASSED%                                           ║
echo ║  Falharam: %FAILED%                                           ║
if %FAILED% equ 0 (
    echo ║                                                          ║
    echo ║  ✅ TODOS OS TESTES PASSARAM!                           ║
) else (
    echo ║                                                          ║
    echo ║  ❌ ALGUNS TESTES FALHARAM                              ║
)
echo ╚══════════════════════════════════════════════════════════╝
echo.

if %FAILED% gtr 0 (
    exit /b 1
) else (
    exit /b 0
)
