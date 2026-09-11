import fs from 'fs';
import path from 'path';
import { AIProvider, DamageAnalysisInput, VerificationInput } from './AIProvider';
import { AIAnalysisOutput, AIAnalysisOutputSchema, AIVerificationOutput, AIVerificationOutputSchema } from './schemas';
import { ROAD_DAMAGE_ANALYSIS_SYSTEM_PROMPT, ROAD_REPAIR_VERIFICATION_PROMPT } from './prompts';
import { DemoAIProvider } from './DemoAIProvider';

export class OpenAIProvider implements AIProvider {
  name = 'OpenAI Vision Provider';
  private apiKey: string;
  private fallbackProvider = new DemoAIProvider();

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
  }

  async analyzeRoadDamage(input: DamageAnalysisInput): Promise<AIAnalysisOutput> {
    if (!this.apiKey) {
      console.warn('[OpenAIProvider] No API key provided, falling back to DemoAIProvider.');
      return this.fallbackProvider.analyzeRoadDamage(input);
    }

    try {
      let resolvedImageUrl = input.imageUrl;
      const candidates = [
        input.imageUrl ? path.basename(input.imageUrl.split('?')[0]) : '',
        input.imageFilename || '',
      ].filter(Boolean);

      for (const name of candidates) {
        const searchPaths = [
          path.resolve(__dirname, '../../../uploads', name),
          path.resolve(__dirname, '../../uploads', name),
          path.resolve(process.cwd(), 'uploads', name),
        ];
        for (const p of searchPaths) {
          if (fs.existsSync(p)) {
            const buf = fs.readFileSync(p);
            const ext = path.extname(p).toLowerCase();
            const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
            resolvedImageUrl = `data:${mimeType};base64,${buf.toString('base64')}`;
            break;
          }
        }
        if (resolvedImageUrl.startsWith('data:')) break;
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: ROAD_DAMAGE_ANALYSIS_SYSTEM_PROMPT },
            {
              role: 'user',
              content: [
                { type: 'text', text: `Citizen Description: "${input.description}". Damage hint: "${input.damageTypeHint || ''}"` },
                { type: 'image_url', image_url: { url: resolvedImageUrl } },
              ],
            },
          ],
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI HTTP ${response.status}: ${await response.text()}`);
      }

      const json = await response.json();
      const content = json.choices?.[0]?.message?.content;
      const parsed = JSON.parse(content);
      return AIAnalysisOutputSchema.parse(parsed);
    } catch (error) {
      console.error('[OpenAIProvider] Error analyzing damage, falling back to DemoAIProvider:', error);
      return this.fallbackProvider.analyzeRoadDamage(input);
    }
  }

  async verifyRepair(input: VerificationInput): Promise<AIVerificationOutput> {
    if (!this.apiKey) {
      return this.fallbackProvider.verifyRepair(input);
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: ROAD_REPAIR_VERIFICATION_PROMPT },
            {
              role: 'user',
              content: [
                { type: 'text', text: `Original Damage Type: ${input.damageType}, Severity: ${input.originalSeverity}` },
                { type: 'image_url', image_url: { url: input.beforeImageUrl } },
                { type: 'image_url', image_url: { url: input.afterImageUrl } },
              ],
            },
          ],
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI HTTP ${response.status}`);
      }

      const json = await response.json();
      const content = json.choices?.[0]?.message?.content;
      return AIVerificationOutputSchema.parse(JSON.parse(content));
    } catch (error) {
      console.error('[OpenAIProvider] Verification error, falling back:', error);
      return this.fallbackProvider.verifyRepair(input);
    }
  }
}
