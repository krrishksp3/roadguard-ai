import app from './app';
import { aiService } from './services/ai/AIService';

const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  const diag = aiService.getDiagnosticInfo();
  console.log(`========================================================`);
  console.log(`🚀 ROADGUARD AI BACKEND API RUNNING ON http://${HOST}:${PORT}`);
  console.log(`🤖 AI INTELLIGENCE ENGINE:`);
  console.log(`   Active Provider:      ${diag.providerName}`);
  console.log(`   Configured Model:     ${diag.model}`);
  console.log(`   API Key Configured:   ${diag.isKeyConfigured ? 'YES' : 'NO'}`);
  console.log(`   Operational Status:   ${diag.status.toUpperCase()}`);
  console.log(`📡 Health Check:         http://localhost:${PORT}/api/health`);
  console.log(`📖 API Docs:             http://localhost:${PORT}/api/docs`);
  console.log(`========================================================`);
});
