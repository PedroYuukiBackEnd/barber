# Sistema Barber

Sistema local para gerenciar barbearias com login, clientes, servicos, agendamentos, historico, cobranca e painel de administracao.

## Como funciona agora

- Backend Node.js + Express.
- Banco local SQLite em `backend/database.sqlite`.
- Frontend servido pelo proprio backend em `http://localhost:4000`.
- Funciona em PC/notebook pelo navegador.
- Funciona em Android/iOS pelo navegador acessando o IP do computador na mesma rede.
- Pode ser instalado como PWA quando aberto pelo navegador do celular.
- Autenticacao por cookie JWT.
- Separacao de papeis:
  - `superadmin`: dono da plataforma, acessa `/admin.html`.
  - `user`: usuario comum da barbearia.
- Dados de clientes, servicos e agendamentos isolados por `tenant_id`.
- Cadastro publico desativado por padrao.

## Instalar

```bash
cd backend
npm install
npm run db:init
npm start
```

Depois abra no computador:

```text
http://localhost:4000
http://localhost:4000/admin.html
```

## Gerar executavel Windows

```bash
cd backend
npm run build
```

O pacote fica em:

```text
backend/dist
```

Para entregar em um PC Windows, copie a pasta `backend/dist` inteira. Ela contem:

- `server.exe`: aplicativo local.
- `frontend/`: telas do sistema.
- `.env`: configuracao local.
- `database.sqlite`: banco criado no primeiro uso.

Execute `server.exe` e abra:

```text
http://localhost:4000
```

Em uma etapa futura, esse executavel pode ser colocado dentro de um instalador com atalho no menu iniciar.

## APK, iOS e celulares

O APK standalone Android fica em:

```text
android-standalone/dist/SistemaBarber-standalone-debug.apk
```

Esse APK roda sem servidor e salva os dados no proprio armazenamento do aplicativo no Android. O acesso inicial dentro do APK e:

```text
Acesso: localadmin
Senha: localadmin123
```

Para instalar, copie o APK para o celular e abra o arquivo. O Android pode pedir permissao para instalar apps de fontes desconhecidas.

Observacao: esse APK atual e uma build debug para teste/entrega direta. Para Play Store ou venda em escala, gere uma build release assinada com uma chave definitiva.

No iPhone, a distribuicao nativa e `.ipa`/TestFlight/App Store, nao `.dmg`. `.dmg` e formato de instalador para macOS.

## Atualizacoes e localhost

Mesmo entregando por executavel ou APK, voce pode continuar testando atualizacoes em `localhost`.

Fluxo recomendado:

1. Crie uma branch para a atualizacao.
2. Rode e teste em `localhost`.
3. Gere o pacote com `npm run build`.
4. Teste o pacote gerado em `backend/dist`.
5. Entregue a nova versao ao cliente.

## Acesso inicial

O primeiro superadmin local e criado pelo `npm run db:init` usando as variaveis do `backend/.env`:

```env
DEFAULT_SUPERADMIN_EMAIL=localadmin
DEFAULT_SUPERADMIN_PASSWORD=localadmin123
```

Troque essas credenciais antes de entregar o sistema para um cliente.

## Usar no celular

1. Deixe o computador e o celular na mesma rede Wi-Fi.
2. Descubra o IP do computador.
3. No celular, abra:

```text
http://IP-DO-COMPUTADOR:4000
```

Exemplo:

```text
http://192.168.0.10:4000
```

Se o Windows bloquear, libere a porta `4000` no firewall para rede privada.

## Variaveis locais

Arquivo: `backend/.env`

```env
SQLITE_DATABASE_PATH=./database.sqlite
JWT_SECRET=troque_por_uma_chave_local_grande_e_segura
FRONTEND_URL=http://localhost:4000
PORT=4000
NODE_ENV=development
ENABLE_PUBLIC_REGISTRATION=false
DEFAULT_SUPERADMIN_NAME=Admin Local
DEFAULT_SUPERADMIN_EMAIL=localadmin
DEFAULT_SUPERADMIN_PASSWORD=localadmin123
```

## Backup

Para backup local, copie este arquivo com o sistema parado:

```text
backend/database.sqlite
```

Esse arquivo contem clientes, servicos, agendamentos, historico, usuarios e anexos.
