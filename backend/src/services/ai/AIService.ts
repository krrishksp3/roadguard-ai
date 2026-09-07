import { AIProvider } from './AIProvider';
import { DemoAIProvider } from './DemoAIProvider';
import { OpenAIProvider } from './OpenAIProvider';
import { GeminiProvider } from './GeminiProvider';
import { AIAnalysisOutput, AIVerificationOutput } from './schemas';

export class AIService {
  private provider: AIProvider;

  constructor() {
    const providerType = (process.env.AI_PROVIDER || 'demo').toLowerCase();
    
    if (providerType === 'openai' && process.env.OPENAI_API_KEY) {
      this.provider = new OpenAIProvider();
    } else if (providerType === 'gemini' && process.env.GEMINI_API_KEY) {
      this.provider = new GeminiProvider();
    } else {
      this.provider = new DemoAIProvider();
    }
  }

  getProviderName(): string {
    return this.provider.name;
  }

  isDemo(): boolean {
    return this.provider instanceof DemoAIProvider;
  }

  async analyzeRoadDamage(imageUrl: string, description: string, damageTypeHint?: string): Promise<AIAnalysisOutput> {
    return this.provider.analyzeRoadDamage({ imageUrl, description, damageTypeHint });
  }

  async verifyRepair(beforeImageUrl: string, afterImageUrl: string, damageType: string, originalSeverity: string): Promise<AIVerificationOutput> {
    return this.provider.verifyRepair({ beforeImageUrl, afterImageUrl, damageType, originalSeverity });
  }
}

export const aiService = new AIService();
