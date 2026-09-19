import { AIProvider, DamageAnalysisInput, VerificationInput } from './AIProvider';
import { AIAnalysisOutput, AIAnalysisOutputSchema, AIVerificationOutput, AIVerificationOutputSchema } from './schemas';
import { ROAD_DAMAGE_ANALYSIS_SYSTEM_PROMPT, ROAD_REPAIR_VERIFICATION_PROMPT } from './prompts';
import { resolveImageBuffer } from './imageResolver';

export class OpenAIProvider implements AIProvider {
  name = 'OpenAI Vision Provider';
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    this.apiKey = (apiKey || process.env.OPENAI_API_KEY || '').trim();
    this.model = (model || process.env.OPENAI_MODEL || 'gpt-4o-mini').trim();
  }

  getModelName(): string {
    return this.model;
  }

  isKeyConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 0);
  }

  async analyzeRoadDamage(input: DamageAnalysisInput): Promise<AIAnalysisOutput> {
    if (!this.apiKey) {
      throw new Error(
        '[OpenAIProvider] OPENAI_API_KEY is not configured in environment variables. Please provide a valid OpenAI API key.'
      );
    }

    const imageEvidence = await resolveImageBuffer(input.imageUrl, input.imageFilename);
    if (!imageEvidence) {
      throw new Error(
        `[OpenAIProvider] Unable to load image binary data from "${input.imageUrl}". Vision analysis requires valid image bytes.`
      );
    }

    const dataUrl = `data:${imageEvidence.mimeType};base64,${imageEvidence.buffer.toString('base64')}`;

    const promptText = `${ROAD_DAMAGE_ANALYSIS_SYSTEM_PROMPT}

EVIDENCE CONTEXT:
- Contextual Citizen Description: "${input.description || 'None'}"
- Suggested Category Hint: "${input.damageTypeHint || 'None'}"

CRITICAL MANDATE:
The citizen description is contextual metadata ONLY.
The actual attached photograph pixels MUST be evaluated first.
If the image does not visibly show road, asphalt, or civil infrastructure distress, you MUST return:
"validRoadDamage": false, "classification": "INVALID_EVIDENCE", "roadSafetyRisk": 0.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: promptText },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analyze this photograph for road damage validity and severity.' },
              { type: 'image_url', image_url: { url: dataUrl } },
            ],
          },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`[OpenAIProvider] OpenAI API error HTTP ${response.status} (${this.model}): ${errorText}`);
    }

    const json = await response.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error(`[OpenAIProvider] Empty response from model ${this.model}.`);
    }

    const parsed = JSON.parse(content);

    const isDamage = Boolean(
      parsed.damageDetected !== false &&
      parsed.validRoadDamage !== false &&
      parsed.visibleDamage !== false &&
      parsed.classification !== 'NO_DAMAGE_FOUND' &&
      parsed.classification !== 'NON_ROAD_IMAGE' &&
      parsed.classification !== 'INSUFFICIENT_EVIDENCE' &&
      parsed.classification !== 'INVALID_EVIDENCE' &&
      parsed.roadSafetyRisk !== 0
    );

    if (!isDamage) {
      const cls = parsed.classification || (parsed.damageType === 'NON_ROAD_IMAGE' ? 'NON_ROAD_IMAGE' : parsed.damageType === 'INSUFFICIENT_EVIDENCE' ? 'INSUFFICIENT_EVIDENCE' : 'NO_DAMAGE_FOUND');
      parsed.damageDetected = false;
      parsed.validRoadDamage = false;
      parsed.classification = cls;
      parsed.damageType = cls === 'NON_ROAD_IMAGE' ? 'NON_ROAD_IMAGE' : cls === 'INSUFFICIENT_EVIDENCE' ? 'INSUFFICIENT_EVIDENCE' : 'NO_ROAD_DAMAGE';
      parsed.severity = 'NONE';
      parsed.safetyRisk = 'NONE';
      parsed.visibleDamage = false;
      parsed.roadSafetyRisk = 0;
      parsed.confidence = 0;
      parsed.evidenceReason = parsed.evidenceReason || parsed.description || 'No actionable road damage verified from photographic evidence.';
      parsed.description = parsed.description || 'Road damage could not be verified from this image.';
      parsed.recommendedAction = parsed.recommendedAction || 'No civil action required. Report cancelled at intake due to invalid evidence.';
      parsed.cancellationReason = parsed.cancellationReason || parsed.evidenceReason || 'The uploaded photograph does not provide sufficient road-damage evidence.';
      if (!parsed.imageQuality) {
        parsed.imageQuality = {
          isAcceptable: cls === 'NO_DAMAGE_FOUND',
          isBlurry: cls === 'INSUFFICIENT_EVIDENCE',
          isTooDark: false,
          hasRoadVisible: cls === 'NO_DAMAGE_FOUND',
          qualityScore: cls === 'NO_DAMAGE_FOUND' ? 85 : 0,
          warningMessage: cls === 'NON_ROAD_IMAGE' ? 'Non-road content detected in evidence.' : undefined,
        };
      }
    } else {
      parsed.damageDetected = true;
      parsed.validRoadDamage = true;
      parsed.classification = 'VALID_ROAD_DAMAGE';
      parsed.visibleDamage = true;
      parsed.description = parsed.description || 'Pavement defect detected and verified through visual analysis.';
      parsed.recommendedAction = parsed.recommendedAction || 'Inspect and execute patch repair in accordance with civil maintenance standards.';
      parsed.evidenceReason = parsed.evidenceReason || parsed.description || 'Pavement defect verified from image pixels.';
      if (typeof parsed.confidence !== 'number' || parsed.confidence <= 0) {
        parsed.confidence = 0.9;
      }
      if (typeof parsed.roadSafetyRisk !== 'number' || parsed.roadSafetyRisk <= 0) {
        parsed.roadSafetyRisk = parsed.severity === 'critical' ? 85 : parsed.severity === 'high' ? 75 : parsed.severity === 'medium' ? 50 : 35;
      }
      if (!parsed.safetyRisk || parsed.safetyRisk === 'NONE') {
        parsed.safetyRisk = parsed.roadSafetyRisk >= 76 ? 'CRITICAL' : parsed.roadSafetyRisk >= 50 ? 'HIGH' : parsed.roadSafetyRisk >= 40 ? 'MODERATE' : 'LOW';
      }
      if (!parsed.imageQuality) {
        parsed.imageQuality = {
          isAcceptable: true,
          isBlurry: false,
          isTooDark: false,
          hasRoadVisible: true,
          qualityScore: 85,
        };
      }
    }

    return AIAnalysisOutputSchema.parse(parsed);
  }

  async verifyRepair(input: VerificationInput): Promise<AIVerificationOutput> {
    if (!this.apiKey) {
      throw new Error('[OpenAIProvider] OPENAI_API_KEY is not configured for repair verification.');
    }

    const beforeEvidence = await resolveImageBuffer(input.beforeImageUrl);
    const afterEvidence = await resolveImageBuffer(input.afterImageUrl);

    const contentParts: any[] = [
      {
        type: 'text',
        text: `Original Damage: ${input.damageType} (${input.originalSeverity})`,
      },
    ];

    if (beforeEvidence) {
      contentParts.push({
        type: 'image_url',
        image_url: { url: `data:${beforeEvidence.mimeType};base64,${beforeEvidence.buffer.toString('base64')}` },
      });
    }

    if (afterEvidence) {
      contentParts.push({
        type: 'image_url',
        image_url: { url: `data:${afterEvidence.mimeType};base64,${afterEvidence.buffer.toString('base64')}` },
      });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: ROAD_REPAIR_VERIFICATION_PROMPT },
          { role: 'user', content: contentParts },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`[OpenAIProvider] OpenAI repair verification HTTP ${response.status}: ${await response.text()}`);
    }

    const json = await response.json();
    const content = json.choices?.[0]?.message?.content;
    return AIVerificationOutputSchema.parse(JSON.parse(content));
  }
}
