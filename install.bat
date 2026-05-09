@echo off
echo Instalando Sistema Barber SaaS...
cd backend
echo Instalando dependencias...
npm install
echo Copiando .env.example para .env...
copy .env.example .env
echo Inicializando banco de dados...
npm run db:init
echo.
echo Instalacao concluida!
echo Execute 'npm run dev' para iniciar o servidor.
echo Abra http://localhost:4000 no navegador.
pause