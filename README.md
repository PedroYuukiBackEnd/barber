# Sistema Barber

Sistema web para gerenciar barbearias com login, clientes, servicos, agendamentos, cobranca e painel de administracao da plataforma.

## Pronto para operar

- Backend Node.js + Express.
- Banco PostgreSQL via `DATABASE_URL`.
- Autenticacao por cookie JWT.
- Separacao de papeis:
  - `superadmin`: dono da plataforma, acessa `/admin.html`.
  - `admin`: dono/admin de uma barbearia, acessa apenas a propria barbearia.
  - `user`: usuario comum da barbearia.
- Dados de clientes, servicos e agendamentos isolados por `tenant_id`.
- Cadastro publico desativado por padrao em producao.

## Variaveis de ambiente

Configure no Render ou no seu provedor:

```env
DATABASE_URL=postgresql://usuario:senha@host:5432/banco
JWT_SECRET=troque_por_uma_chave_grande_e_segura
FRONTEND_URL=https://seu-app.onrender.com
PORT=4000
NODE_ENV=production
DATABASE_SSL=false
ENABLE_PUBLIC_REGISTRATION=false
DEFAULT_SUPERADMIN_NAME=Dono da Plataforma
DEFAULT_SUPERADMIN_EMAIL=seu-acesso-admin
DEFAULT_SUPERADMIN_PASSWORD=troque_por_uma_senha_forte
```

Use `DATABASE_SSL=true` se seu banco exigir SSL externo, como Neon ou Supabase.

## Render

Configuracao recomendada:

```text
Root Directory: backend
Build Command: npm install
Start Command: npm start
```

Depois do primeiro deploy, entre em `/admin.html` com o `DEFAULT_SUPERADMIN_EMAIL` e `DEFAULT_SUPERADMIN_PASSWORD`, crie as barbearias dos clientes pelo painel e entregue o acesso de cada uma.

Ao cadastrar uma barbearia, informe:

- Nome da barbearia: nome que aparecera no sistema do cliente.
- Nome completo do cliente/cabeleireiro: nome do usuario dono da barbearia.
- Acesso e senha: credenciais que o cliente usara para entrar.

## Desenvolvimento local

```bash
cd backend
npm install
npm start
```

Para rodar localmente, crie `backend/.env` com as variaveis acima apontando para um PostgreSQL de teste.
