# 💈 Sistema Barber

Sistema de gerenciamento profissional e responsivo para barbearias, focado em alta escalabilidade (multi-tenant). O backend Node.js lida com sessões (Cookies JWT) e persiste dados no SQLite, permitindo que você venda assinaturas para dezenas de barbearias e cada uma acesse pelo seu próprio painel.

---

## 🚀 Funcionalidades 
- ✅ **Cadastro de Barbearias (Multi-Tenant)**: Cada cliente seu pode criar sua própria conta e gerenciar seus próprios dados sem ver os dados dos outros clientes.
- ✅ **API Restful Backend**: Totalmente isolado. `fetch` nativo no Frontend conversa com rotas seguras `/api/...`.
- ✅ **Dashboard Premium**: Design Dark Mode + Prata Metálico com Glassmorphism.
- ✅ **Gestão Completa**: Clientes, Serviços e Agendamentos com cálculos automáticos.

---

## 💼 Processo de Venda e Onboarding (O seu negócio)

A maior vantagem deste sistema é que ele roda na **Nuvem**. Você não precisa instalar NADA no computador do cliente. Seu modelo de negócio funciona da seguinte forma:

1. **Hospede o Sistema**: Coloque o seu código em um provedor de Nuvem (Hostinger, Render, VPS da DigitalOcean, etc). Seu sistema passará a ter um link, como `app.suasistema.com.br`.
2. **Faça a Venda**: Venda a assinatura mensal para o dono da barbearia (ex: R$ 50/mês).
3. **Crie o Acesso**: Você mesmo, do seu celular, acessa o link e clica em "Cadastre-se", criando o banco de dados e usuário para aquela barbearia.
4. **Entregue o Acesso**: Envie o Link, o E-mail e a Senha para o cliente no WhatsApp.
   > *"João, seu sistema já está liberado! Acesse o link: **app.suasistema.com.br** "*
5. **Uso Imediato**: O barbeiro clica no link, faz login pelo celular, e na hora já tem o sistema na palma da mão! Não precisa configurar rede, IP local ou instalar programas.

---

## 🛠️ Como Hospedar na Nuvem (Tutorial Básico)

Se você escolher hospedar num VPS Ubuntu ou serviço como Render:

1. **Faça o Upload dos Arquivos**: Use Git (Github) ou FTP para subir toda a pasta do projeto.
2. **Instale as dependências**:
   ```bash
   cd backend
   npm install
   ```
3. **Configure as Variáveis de Ambiente**:
   No servidor, crie um arquivo `.env` na pasta `backend` com:
   ```env
   JWT_SECRET=uma_chave_super_segura_aqui
   FRONTEND_URL=https://app.suasistema.com.br
   PORT=4000
   NODE_ENV=production
   ```
4. **Inicie o Servidor Definitivamente**:
   Use o `PM2` para que o sistema nunca caia:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "sistema-barber"
   ```
5. Pronto! Agora basta ligar o Nginx ou Apache apontando o seu domínio para o IP do seu servidor e porta 4000. O banco `database.sqlite` guardará os dados de todos os seus clientes com total segurança.