@echo off
setlocal enabledelayedexpansion
set BASE_URL=%~1
if "%BASE_URL%"=="" set BASE_URL=http://localhost:3000

echo ============================================
echo  TESTE COMPLETO - Aldeias Games
echo  %DATE% %TIME%
echo ============================================
echo URL Base: %BASE_URL%
echo.
echo A testar:
echo   [ 1] Vitest - Unit/Integration Tests
echo   [ 2] Playwright - E2E Tests
echo   [ 3] API Health Check
echo   [ 4] 2FA (TOTP) flow
echo   [ 5] Rate Limiting
echo   [ 6] Payment (Stripe)
echo   [ 7] Build Verification
echo   [ 8] Euromilhoes (criar→comprar→sortear→claim)
echo   [ 9] Poio da Vaca (criar→comprar→sortear→claim)
echo   [10] Rifa (criar→comprar→sortear→claim)
echo   [11] Raspadinha (criar→comprar→revelar→claim)
echo   [12] Validacoes de Erro (auth, stock, estado)
echo   [13] Dashboard Analytics
echo.
echo Prima Ctrl+C para cancelar, ou qualquer tecla para comecar...
pause >nul
echo.

set "PASS=0"
set "FAIL=0"
set "TOTAL=0"

:: ============================================
:: 1. Vitest Unit/Integration Tests
:: ============================================
echo ============================================
echo [1/13] Vitest - Unit/Integration Tests
echo ============================================
set NODE_ENV=test
npx vitest run 2>&1
if %ERRORLEVEL% equ 0 (
    set /a PASS+=1
    echo [PASSOU] Vitest
) else (
    set /a FAIL+=1
    echo [FALHOU] Vitest
)
set /a TOTAL+=1
echo.

:: ============================================
:: 2. Playwright E2E Tests
:: ============================================
echo ============================================
echo [2/13] Playwright - E2E Tests
echo ============================================
npx playwright test --reporter=list 2>&1
if %ERRORLEVEL% equ 0 (
    set /a PASS+=1
    echo [PASSOU] Playwright
) else (
    set /a FAIL+=1
    echo [FALHOU] Playwright
)
set /a TOTAL+=1
echo.

:: ============================================
:: 3. API Health Check
:: ============================================
echo ============================================
echo [3/13] API Health Check
echo ============================================
curl -s "%BASE_URL%/api/health" | findstr /C:"ok" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    set /a PASS+=1
    echo [PASSOU] API Health
) else (
    set /a FAIL+=1
    echo [FALHOU] API Health
)
set /a TOTAL+=1
echo.

:: ============================================
:: 4. 2FA (TOTP) flow
:: ============================================
echo ============================================
echo [4/13] 2FA (TOTP) flow
echo ============================================
if exist "scripts\test-2fa.mjs" (
    node scripts/test-2fa.mjs %BASE_URL% 2>&1
    if !ERRORLEVEL! equ 0 (
        set /a PASS+=1
        echo [PASSOU] 2FA
    ) else (
        set /a FAIL+=1
        echo [FALHOU] 2FA
    )
) else (
    echo [SKIP] scripts\test-2fa.mjs nao encontrado
)
set /a TOTAL+=1
echo.

:: ============================================
:: 5. Rate Limiting
:: ============================================
echo ============================================
echo [5/13] Rate Limiting
echo ============================================
if exist "scripts\test-rate-limit.mjs" (
    node scripts/test-rate-limit.mjs %BASE_URL% 2>&1
    if !ERRORLEVEL! equ 0 (
        set /a PASS+=1
        echo [PASSOU] Rate Limiting
    ) else (
        set /a FAIL+=1
        echo [FALHOU] Rate Limiting
    )
) else (
    echo [SKIP] scripts\test-rate-limit.mjs nao encontrado
)
set /a TOTAL+=1
echo.

:: ============================================
:: 6. Payment (Stripe)
:: ============================================
echo ============================================
echo [6/13] Payment (Stripe)
echo ============================================
if exist "scripts\test-payment.mjs" (
    node scripts/test-payment.mjs %BASE_URL% 2>&1
    if !ERRORLEVEL! equ 0 (
        set /a PASS+=1
        echo [PASSOU] Payment
    ) else (
        set /a FAIL+=1
        echo [FALHOU] Payment
    )
) else (
    echo [SKIP] scripts\test-payment.mjs nao encontrado
)
set /a TOTAL+=1
echo.

:: ============================================
:: 7. Build Verification
:: ============================================
echo ============================================
echo [7/13] Build Verification
echo ============================================
if exist "scripts\verify-build.bat" (
    call scripts\verify-build.bat 2>&1
    if !ERRORLEVEL! equ 0 (
        set /a PASS+=1
        echo [PASSOU] Build
    ) else (
        set /a FAIL+=1
        echo [FALHOU] Build
    )
) else (
    echo [SKIP] verify-build.bat nao encontrado
)
set /a TOTAL+=1
echo.

:: ============================================
:: 8. Euromilhoes
:: ============================================
echo ============================================
echo [8/13] Euromilhoes
echo ============================================
call teste-euromilhoes.bat %BASE_URL%
if %ERRORLEVEL% equ 0 (
    set /a PASS+=1
    echo [PASSOU] Euromilhoes
) else (
    set /a FAIL+=1
    echo [FALHOU] Euromilhoes
)
set /a TOTAL+=1
echo.

:: ============================================
:: 9. Poio da Vaca
:: ============================================
echo ============================================
echo [9/13] Poio da Vaca
echo ============================================
call teste-poio.bat %BASE_URL%
if %ERRORLEVEL% equ 0 (
    set /a PASS+=1
    echo [PASSOU] Poio da Vaca
) else (
    set /a FAIL+=1
    echo [FALHOU] Poio da Vaca
)
set /a TOTAL+=1
echo.

:: ============================================
:: 10. Rifa
:: ============================================
echo ============================================
echo [10/13] Rifa
echo ============================================
call teste-rifa.bat %BASE_URL%
if %ERRORLEVEL% equ 0 (
    set /a PASS+=1
    echo [PASSOU] Rifa
) else (
    set /a FAIL+=1
    echo [FALHOU] Rifa
)
set /a TOTAL+=1
echo.

:: ============================================
:: 11. Raspadinha
:: ============================================
echo ============================================
echo [11/13] Raspadinha
echo ============================================
call teste-raspadinha.bat %BASE_URL%
if %ERRORLEVEL% equ 0 (
    set /a PASS+=1
    echo [PASSOU] Raspadinha
) else (
    set /a FAIL+=1
    echo [FALHOU] Raspadinha
)
set /a TOTAL+=1
echo.

:: ============================================
:: 12. Validacoes de Erro
:: ============================================
echo ============================================
echo [12/13] Validacoes de Erro
echo ============================================
call teste-validacoes.bat %BASE_URL%
if %ERRORLEVEL% equ 0 (
    set /a PASS+=1
    echo [PASSOU] Validacoes
) else (
    set /a FAIL+=1
    echo [FALHOU] Validacoes
)
set /a TOTAL+=1
echo.

:: ============================================
:: 13. Dashboard Analytics
:: ============================================
echo ============================================
echo [13/13] Dashboard Analytics
echo ============================================
call teste-analytics.bat %BASE_URL%
if %ERRORLEVEL% equ 0 (
    set /a PASS+=1
    echo [PASSOU] Analytics
) else (
    set /a FAIL+=1
    echo [FALHOU] Analytics
)
set /a TOTAL+=1
echo.

:: ============================================
:: Resultado Final
:: ============================================
echo ============================================
echo  RESULTADO FINAL  %DATE% %TIME%
echo ============================================
echo  Passaram: %PASS%/%TOTAL%
echo  Falharam: %FAIL%/%TOTAL%
echo ============================================

if %FAIL% gtr 0 (
    echo  ALGUNS TESTES FALHARAM
) else (
    echo  TODOS OS TESTES PASSARAM
)
echo ============================================

pause
exit /b %FAIL%
