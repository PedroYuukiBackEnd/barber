const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cookieParser = require('cookie-parser');

const JWT_SECRET = process.env.JWT_SECRET || 'uma_chave_super_segura';
if (!process.env.JWT_SECRET) {
  console.warn('AVISO: JWT_SECRET não definido em variáveis de ambiente. Usando segredo de desenvolvimento padrão. Configure backend/.env para produção.');
}
const cors = require('cors');
const { initDatabase } = require('./src/database/init');
const authRoutes = require('./src/routes/authRoutes');
const clientRoutes = require('./src/routes/clientRoutes');
const serviceRoutes = require('./src/routes/serviceRoutes');
const appointmentRoutes = require('./src/routes/appointmentRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const { errorHandler } = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || `http://localhost:${PORT}`;

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: FRONTEND_URL, credentials: true }));

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/admin', adminRoutes);

const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));
app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'admin.html'));
});
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.use(errorHandler);

initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend rodando em http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Erro ao preparar banco de dados:', error);
    process.exit(1);
  });
