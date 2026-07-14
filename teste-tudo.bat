@echo off
setlocal enabledelayedexpansion
set BASE_URL=%~1
if "%BASE_URL%"=="" set BASE_URL=http://localhost:3000

echo ============================================
echo  TESTE COMPLETO - Aldeias Games
echo ============================================
echo URL Base: %BASE_URL%
echo.
echo A testar:
echo   [1] Vitest - Unit/Integration Tests (232 testes)
echo   [2] Playwright - E2E Tests (32 testes)
echo   [3] Euromilhoes (API)
echo   [4] Poio da Vaca (API)
echo   [5] Rifa (API)
echo   [6] Raspadinha (API)
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
echo [1/6] Vitest - Unit/Integration Tests
echo ============================================
call npx vitest run
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
echo [2/6] Playwright - E2E Tests
echo ============================================
call npx playwright test --reporter=list
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
:: 3. Euromilhoes
:: ============================================
echo ============================================
echo [3/6] Euromilhoes
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
:: 4. Poio da Vaca
:: ============================================
echo ============================================
echo [4/6] Poio da Vaca
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
:: 5. Rifa
:: ============================================
echo ============================================
echo [5/6] Rifa
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
:: 6. Raspadinha
:: ============================================
echo ============================================
echo [6/6] Raspadinha
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
:: Resultado Final
:: ============================================
echo ============================================
echo  RESULTADO FINAL
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
