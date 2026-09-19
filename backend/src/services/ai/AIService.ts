import { AIProvider } from './AIProvider';
import { DemoAIProvider } from './DemoAIProvider';
import { OpenAIProvider } from './OpenAIProvider';
import { GeminiProvider } from './GeminiProvider';
import { AIAnalysisOutput, AIVerificationOutput } from './schemas';

export interface AIDiagnosticInfo {
  provider: 'gemini' | 'openai' | 'demo';
  providerName: string;
  model: string;
  isKeyConfigured: boolean;
  status: 'ready' | 'missing_key' | 'offline_demo';
}

export class AIService {
  private provider: AIProvider;
  private diagnostic: AIDiagnosticInfo;

  constructor() {
    const providerType = (process.env.AI_PROVIDER || 'demo').toLowerCase().trim();

    if (providerType === 'gemini') {
      const apiKey = (process.env.GEMINI_API_KEY || '').trim();
      const model = (process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim();
      const geminiProvider = new GeminiProvider(apiKey, model);
      this.provider = geminiProvider;
      this.diagnostic = {
        provider: 'gemini',
        providerName: geminiProvider.name,
        model,
        isKeyConfigured: Boolean(apiKey && apiKey.length > 0),
        status: apiKey && apiKey.length > 0 ? 'ready' : 'missing_key',
      };
    } else if (providerType === 'openai') {
      const apiKey = (process.env.OPENAI_API_KEY || '').trim();
      const model = (process.env.OPENAI_MODEL || 'gpt-4o-mini').trim();
      const openAiProvider = new OpenAIProvider(apiKey, model);
      this.provider = openAiProvider;
      this.diagnostic = {
        provider: 'openai',
        providerName: openAiProvider.name,
        model,
        isKeyConfigured: Boolean(apiKey && apiKey.length > 0),
        status: apiKey && apiKey.length > 0 ? 'ready' : 'missing_key',
      };
    } else {
      const demoProvider = new DemoAIProvider();
      this.provider = demoProvider;
      this.diagnostic = {
        provider: 'demo',
        providerName: demoProvider.name,
        model: 'deterministic-fixture-engine-v2',
        isKeyConfigured: true,
        status: 'offline_demo',
      };
    }
  }

  getProviderName(): string {
    return this.provider.name;
  }

  getModelName(): string {
    return this.diagnostic.model;
  }

  getDiagnosticInfo(): AIDiagnosticInfo {
    return { ...this.diagnostic };
  }

  isDemo(): boolean {
    return this.provider instanceof DemoAIProvider;
  }

  async analyzeRoadDamage(
    imageUrl: string,
    description: string,
    damageTypeHint?: string,
    imageFilename?: string
  ): Promise<AIAnalysisOutput> {
    return this.provider.analyzeRoadDamage({ imageUrl, imageFilename, description, damageTypeHint });
  }

  async verifyRepair(
    beforeImageUrl: string,
    afterImageUrl: string,
    damageType: string,
    originalSeverity: string
  ): Promise<AIVerificationOutput> {
    return this.provider.verifyRepair({ beforeImageUrl, afterImageUrl, damageType, originalSeverity });
  }
}

export const aiService = new AIService();
