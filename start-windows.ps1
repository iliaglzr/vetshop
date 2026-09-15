Write-Host 'VetShop starting...' -ForegroundColor Green

Set-Location "$PSScriptRoot\backend"
if (!(Test-Path .env)) { Copy-Item .env.example .env }
php artisan key:generate
php artisan optimize:clear
php artisan migrate --seed
php artisan storage:link
Start-Process powershell -ArgumentList '-NoExit','-Command',"Set-Location '$PSScriptRoot\backend'; php artisan serve"

Set-Location "$PSScriptRoot\frontend"
if (!(Test-Path node_modules)) { npm install }
Start-Process powershell -ArgumentList '-NoExit','-Command',"Set-Location '$PSScriptRoot\frontend'; npm run dev"

Write-Host 'Backend: http://localhost:8000' -ForegroundColor Cyan
Write-Host 'Frontend: http://localhost:5173' -ForegroundColor Cyan
