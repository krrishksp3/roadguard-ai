import { AIProvider, DamageAnalysisInput, VerificationInput } from './AIProvider';
import { AIAnalysisOutput, AIAnalysisOutputSchema, AIVerificationOutput, AIVerificationOutputSchema } from './schemas';
import { ROAD_DAMAGE_ANALYSIS_SYSTEM_PROMPT, ROAD_REPAIR_VERIFICATION_PROMPT } from './prompts';
import { DemoAIProvider } from './DemoAIProvider';

export class GeminiProvider implements AIProvider {
  name = 'Google Gemini Provider';
  private apiKey: string;
  private fallbackProvider = new DemoAIProvider();

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';
  }

  async analyzeRoadDamage(input: DamageAnalysisInput): Promise<AIAnalysisOutput> {
    if (!this.apiKey) {
      console.warn('[GeminiProvider] No API key provided, falling back to DemoAIProvider.');
      return this.fallbackProvider.analyzeRoadDamage(input);
    }

    try {
      // Gemini REST API call with structured schema response
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: `${ROAD_DAMAGE_ANALYSIS_SYSTEM_PROMPT}\nCitizen Description: "${input.description}". Damage hint: "${input.damageTypeHint || ''}"` },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini HTTP ${response.status}: ${await response.text()}`);
      }

      const json = await response.json();
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = JSON.parse(text);
      return AIAnalysisOutputSchema.parse(parsed);
    } catch (error) {
      console.error('[GeminiProvider] Error analyzing damage, falling back to DemoAIProvider:', error);
      return this.fallbackProvider.analyzeRoadDamage(input);
    }
  }

  async verifyRepair(input: VerificationInput): Promise<AIVerificationOutput> {
    if (!this.apiKey) {
      return this.fallbackProvider.verifyRepair(input);
    }

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: `${ROAD_REPAIR_VERIFICATION_PROMPT}\nOriginal Damage: ${input.damageType} (${input.originalSeverity})` },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini HTTP ${response.status}`);
      }

      const json = await response.json();
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      return AIVerificationOutputSchema.parse(JSON.parse(text));
    } catch (error) {
      console.error('[GeminiProvider] Verification fallback:', error);
      return this.fallbackProvider.verifyRepair(input);
    }
  }
}
