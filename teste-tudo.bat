@echo off
setlocal enabledelayedexpansion
set BASE_URL=%~1
if "%BASE_URL%"=="" set BASE_URL=http://localhost:3000

echo ============================================
echo  TESTE COMPLETO - Todos os Jogos
echo ============================================
echo URL Base: %BASE_URL%
echo.
echo A testar: Euromilhoes, Poio da Vaca, Rifa, Raspadinha
echo.
echo Prima Ctrl+C para cancelar, ou qualquer tecla para comecar...
pause >nul
echo.

set "PASS=0"
set "FAIL=0"

:: ============================================
:: 1. Euromilhoes
:: ============================================
echo ============================================
echo [1/4] Euromilhoes
echo ============================================
call teste-euromilhoes.bat %BASE_URL%
if %ERRORLEVEL% equ 0 (
    set /a PASS+=1
    echo [PASSOU] Euromilhoes
) else (
    set /a FAIL+=1
    echo [FALHOU] Euromilhoes
)
echo.

:: ============================================
:: 2. Poio da Vaca
:: ============================================
echo ============================================
echo [2/4] Poio da Vaca
echo ============================================
call teste-poio.bat %BASE_URL%
if %ERRORLEVEL% equ 0 (
    set /a PASS+=1
    echo [PASSOU] Poio da Vaca
) else (
    set /a FAIL+=1
    echo [FALHOU] Poio da Vaca
)
echo.

:: ============================================
:: 3. Rifa
:: ============================================
echo ============================================
echo [3/4] Rifa
echo ============================================
call teste-rifa.bat %BASE_URL%
if %ERRORLEVEL% equ 0 (
    set /a PASS+=1
    echo [PASSOU] Rifa
) else (
    set /a FAIL+=1
    echo [FALHOU] Rifa
)
echo.

:: ============================================
:: 4. Raspadinha
:: ============================================
echo ============================================
echo [4/4] Raspadinha
echo ============================================
call teste-raspadinha.bat %BASE_URL%
if %ERRORLEVEL% equ 0 (
    set /a PASS+=1
    echo [PASSOU] Raspadinha
) else (
    set /a FAIL+=1
    echo [FALHOU] Raspadinha
)
echo.

:: ============================================
:: Resultado Final
:: ============================================
echo ============================================
echo  RESULTADO FINAL
echo ============================================
echo  Passaram: %PASS%/4
echo  Falharam: %FAIL%/4
echo ============================================

if %FAIL% gtr 0 (
    echo  ALGUNS TESTES FALHARAM
) else (
    echo  TODOS OS TESTES PASSARAM
)
echo ============================================

pause
exit /b %FAIL%
