@echo off
title Belinha - Servidor Local MilkyPot
color 0D

set "MP_DIR=%~dp0"
set "AP_DIR=%MP_DIR%autopilot"

cls
echo.
echo  ==========================================================
echo        BELINHA - Servidor Local + Painel
echo        http://localhost:5757
echo  ==========================================================
echo.

cd /d "%AP_DIR%"
if not exist server.js (
    echo [ERRO] autopilot\server.js nao encontrado.
    pause
    exit /b 1
)

if not exist node_modules (
    echo [1/3] Instalando dependencias ^(primeira vez, ~1min^)...
    call npm install
    if errorlevel 1 (
        echo.
        echo [ERRO] npm install falhou. Verifique sua internet.
        pause
        exit /b 1
    )
) else (
    echo [1/3] Dependencias OK.
)

echo [2/3] Verificando Claude CLI...
call claude --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ERRO] Claude CLI nao instalado ou nao logado.
    echo.
    echo Resolver:
    echo   1. npm install -g @anthropic-ai/claude-code
    echo   2. claude login
    echo.
    pause
    exit /b 1
)

echo [3/3] Iniciando servidor Node...
echo.
echo  ==========================================================
echo    SERVIDOR RODANDO - NAO FECHE ESTA JANELA
echo.
echo    PAINEL BELINHA:
echo    http://localhost:5757/painel/copilot-belinha.html
echo.
echo    Abrira automaticamente no seu navegador em 4s.
echo  ==========================================================
echo.

REM Abre o painel no browser padrao apos 4s (tempo do servidor subir)
start "" /B cmd /c "timeout /t 4 /nobreak >nul & start http://localhost:5757/painel/copilot-belinha.html"

node server.js

echo.
echo  ==========================================================
echo    [AVISO] Servidor parou inesperadamente.
echo    Mensagem de erro acima ^(se houver^).
echo.
echo    Causa comum: porta 5757 ocupada por outro processo.
echo    Solucao: feche outras janelas do Belinha, ou reinicie o PC.
echo  ==========================================================
echo.
pause
