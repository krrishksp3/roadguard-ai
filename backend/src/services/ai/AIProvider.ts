import { AIAnalysisOutput, AIVerificationOutput } from './schemas';

export interface DamageAnalysisInput {
  imageUrl: string;
  description: string;
  damageTypeHint?: string;
}

export interface VerificationInput {
  beforeImageUrl: string;
  afterImageUrl: string;
  damageType: string;
  originalSeverity: string;
}

export interface AIProvider {
  name: string;
  analyzeRoadDamage(input: DamageAnalysisInput): Promise<AIAnalysisOutput>;
  verifyRepair(input: VerificationInput): Promise<AIVerificationOutput>;
}
