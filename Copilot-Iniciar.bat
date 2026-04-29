@echo off
title MilkyPot Copilot - Configuracao com Tool Calls
color 0B
setlocal enabledelayedexpansion

set "MP_DIR=%~dp0"
set "AP_DIR=%MP_DIR%autopilot"
set "SA_FILE=%AP_DIR%\firebase-admin.json"

cls
echo.
echo  ==========================================================
echo        MilkyPot COPILOT - Servidor Local com Tool Calls
echo        Porta 5858 - Backend: Claude CLI ^(plano Pro/Max - R^$ 0^)
echo  ==========================================================
echo.

cd /d "%AP_DIR%"
if not exist copilot-server.js (
    echo [ERRO] autopilot\copilot-server.js nao encontrado.
    pause
    exit /b 1
)

REM ========================================
REM [1/4] Verifica Node
REM ========================================
echo [1/4] Verificando Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ERRO] Node.js nao instalado.
    echo Baixe em: https://nodejs.org
    pause
    exit /b 1
)
echo       Node OK

REM ========================================
REM [2/4] Verifica Claude CLI
REM ========================================
echo [2/4] Verificando Claude CLI...
where claude >nul 2>&1
if errorlevel 1 (
    cls
    echo.
    echo  ==========================================================
    echo    SETUP - Claude CLI necessario
    echo  ==========================================================
    echo.
    echo  O Copilot usa SEU plano Claude Pro/Max ^(R^$ 0 de API^).
    echo.
    echo  COMO INSTALAR:
    echo  --------------
    echo  1. Abrir cmd como ADMINISTRADOR
    echo  2. Rodar:
    echo.
    echo     npm install -g @anthropic-ai/claude-code
    echo.
    echo  3. Depois rodar:
    echo.
    echo     claude login
    echo.
    echo  4. Login com sua conta Claude.ai ^(mesma do Pro/Max^)
    echo  5. Executar este .bat de novo
    echo.
    pause
    exit /b 1
)
echo       Claude CLI OK

REM ========================================
REM [3/4] Verifica/instala dependencias
REM ========================================
echo [3/4] Verificando dependencias...
if not exist node_modules\firebase-admin (
    echo       Instalando firebase-admin ^(primeira vez, ~1min^)...
    call npm install
    if errorlevel 1 (
        echo.
        echo [ERRO] npm install falhou.
        pause
        exit /b 1
    )
)
echo       Dependencias OK

REM ========================================
REM [4/4] Verifica firebase-admin.json
REM ========================================
echo [4/4] Verificando firebase-admin.json...
if not exist "%SA_FILE%" (
    cls
    echo.
    echo  ==========================================================
    echo    SETUP - PRIMEIRO USO ^(faca uma vez^)
    echo  ==========================================================
    echo.
    echo  Falta o arquivo: firebase-admin.json
    echo  ^(da poder ao Copilot pra escrever no Firestore^)
    echo.
    echo  COMO PEGAR:
    echo  -----------
    echo  1. Vai abrir o Firebase Console em 3 segundos
    echo  2. Clique em "Gerar nova chave privada" ^(botao no fim da pagina^)
    echo  3. Salve o arquivo .json baixado em:
    echo.
    echo     %SA_FILE%
    echo.
    echo  4. Renomeie o arquivo pra exatamente: firebase-admin.json
    echo  5. Volte aqui ^(esta janela^) que ela detecta sozinha
    echo.
    echo  ==========================================================
    echo.
    timeout /t 3 /nobreak >nul
    start "" "https://console.firebase.google.com/project/milkypot-ad945/settings/serviceaccounts/adminsdk"
    echo.
    echo  Aguardando voce salvar o arquivo...
    echo.
    :wait_sa
    if exist "%SA_FILE%" goto sa_ok
    timeout /t 2 /nobreak >nul
    goto wait_sa
    :sa_ok
    echo  [OK] firebase-admin.json detectado!
    timeout /t 1 /nobreak >nul
)
echo       firebase-admin.json OK

REM ========================================
REM Verifica se ja esta rodando
REM ========================================
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing 'http://localhost:5858/health' -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }"
if not errorlevel 1 (
    echo.
    echo  ==========================================================
    echo    JA EXISTE COPILOT RODANDO NA PORTA 5858
    echo    Reaproveitando instancia atual.
    echo  ==========================================================
    start "" "http://localhost:5858/painel/copilot.html"
    exit /b 0
)

REM ========================================
REM Inicia servidor
REM ========================================
cls
echo.
echo  ==========================================================
echo    MilkyPot COPILOT - Iniciando...
echo.
echo    UI:     http://localhost:5858/painel/copilot.html
echo    Health: http://localhost:5858/health
echo.
echo    Backend: Claude CLI ^(seu plano Pro/Max - R^$ 0^)
echo    NAO FECHE ESTA JANELA enquanto estiver usando.
echo  ==========================================================
echo.

REM Abre browser apos 3s
start "" /B cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:5858/painel/copilot.html"

node copilot-server.js

echo.
echo  ==========================================================
echo    Servidor parou.
echo    Erro acima ^(se houver^).
echo  ==========================================================
echo.
pause
