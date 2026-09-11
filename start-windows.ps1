Write-Host 'VetShop setup' -ForegroundColor Green
Set-Location "$PSScriptRoot\backend"
if (!(Test-Path vendor)) { php composer.phar install }
if (!(Test-Path .env)) { Copy-Item .env.example .env; php artisan key:generate }
php artisan migrate --seed
php artisan storage:link
Start-Process powershell -ArgumentList '-NoExit','-Command',"Set-Location '$PSScriptRoot\backend'; php artisan serve"
Set-Location "$PSScriptRoot\frontend"
npm install
Start-Process powershell -ArgumentList '-NoExit','-Command',"Set-Location '$PSScriptRoot\frontend'; npm run dev"
Write-Host 'Backend: http://localhost:8000' -ForegroundColor Cyan
Write-Host 'Frontend: http://localhost:5173' -ForegroundColor Cyan
