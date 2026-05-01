@echo off
title MilkyPot PDV — Impressao Silenciosa
color 0A

:: =============================================================
:: MilkyPot PDV — Launcher com impressao silenciosa
:: --kiosk-printing: elimina o dialogo de impressao do Windows.
::   O Chrome envia direto para a impressora padrao sem perguntar.
:: --app: abre em modo "app" (sem barra de endereco).
:: =============================================================

set PDV_URL=https://milkypot.com/painel/pdv.html

:: Detecta Chrome em locais comuns
set CHROME=""
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    set CHROME="%ProgramFiles%\Google\Chrome\Application\chrome.exe"
) else if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    set CHROME="%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
) else if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    set CHROME="%LocalAppData%\Google\Chrome\Application\chrome.exe"
)

if %CHROME%=="" (
    echo.
    echo [ERRO] Google Chrome nao encontrado.
    echo Instale o Chrome e tente novamente.
    pause
    exit /b 1
)

echo.
echo  ============================================================
echo    MilkyPot PDV — Modo Impressao Silenciosa
echo    URL : %PDV_URL%
echo.
echo    IMPRESSAO DIRETA ativada (sem dialogo do Windows)
echo    Impressora usada: a padrao do Windows
echo    Para trocar: Painel de Controle ^ Dispositivos e Impressoras
echo  ============================================================
echo.
echo Abrindo PDV em 2 segundos...
timeout /t 2 /nobreak >nul

start "" %CHROME% ^
    --kiosk-printing ^
    --disable-print-preview ^
    --app=%PDV_URL% ^
    --window-size=1366,768 ^
    --start-maximized ^
    --no-first-run ^
    --disable-translate ^
    --disable-features=TranslateUI

:: Se quiser modo kiosk completo (tela cheia, sem barra de tarefas):
:: adicione --kiosk apos --app=%PDV_URL%
:: Remova --kiosk para poder fechar normalmente com Alt+F4

exit /b 0
