import app from './app';

const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`========================================================`);
  console.log(`🚀 ROADGUARD AI BACKEND API RUNNING ON http://${HOST}:${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📖 API Docs: http://localhost:${PORT}/api/docs`);
  console.log(`========================================================`);
});
