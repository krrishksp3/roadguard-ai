import { AIProvider, DamageAnalysisInput, VerificationInput } from './AIProvider';
import { AIAnalysisOutput, AIAnalysisOutputSchema, AIVerificationOutput, AIVerificationOutputSchema } from './schemas';
import { ROAD_DAMAGE_ANALYSIS_SYSTEM_PROMPT, ROAD_REPAIR_VERIFICATION_PROMPT } from './prompts';
import { resolveImageBuffer } from './imageResolver';

export class GeminiProvider implements AIProvider {
  name = 'Google Gemini Vision Provider';
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    this.apiKey = (apiKey || process.env.GEMINI_API_KEY || '').trim();
    this.model = (model || process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim();
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
        '[GeminiProvider] GEMINI_API_KEY is not configured in environment variables. Please provide a valid Gemini API key.'
      );
    }

    // 1. Resolve raw image bytes for multimodal input
    const imageEvidence = await resolveImageBuffer(input.imageUrl, input.imageFilename);
    if (!imageEvidence) {
      throw new Error(
        `[GeminiProvider] Unable to load image binary data from "${input.imageUrl}". Multimodal vision analysis requires valid image bytes.`
      );
    }

    // 2. Construct prompt emphasizing image-first validation
    const promptText = `${ROAD_DAMAGE_ANALYSIS_SYSTEM_PROMPT}

EVIDENCE CONTEXT:
- Contextual Citizen Description: "${input.description || 'None'}"
- Suggested Category Hint: "${input.damageTypeHint || 'None'}"

CRITICAL MANDATE:
The citizen description is contextual metadata ONLY.
The actual attached photograph pixels MUST be evaluated first.
If the image does not visibly show road, asphalt, or civil infrastructure distress, you MUST return:
"validRoadDamage": false, "classification": "INVALID_EVIDENCE", "roadSafetyRisk": 0.
Even if the description says "huge pothole", an unrelated image (person, ID card, document, screenshot, indoor, food) MUST BE REJECTED.
Conversely, if the image shows genuine road damage (e.g. pothole, cracking, waterlogging, collapse), it MUST BE ACCEPTED as validRoadDamage: true even if description says "normal pic".`;

    const parts: any[] = [
      { text: promptText },
      {
        inlineData: {
          mimeType: imageEvidence.mimeType,
          data: imageEvidence.buffer.toString('base64'),
        },
      },
    ];

    // 3. Dispatch multimodal request to Google Gemini API
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      this.model
    )}:generateContent?key=${encodeURIComponent(this.apiKey)}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(
        `[GeminiProvider] Google Gemini API request failed with HTTP ${response.status} (${this.model}): ${errText}`
      );
    }

    const json = await response.json();
    const candidate = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidate) {
      throw new Error(`[GeminiProvider] Gemini model ${this.model} returned empty response.`);
    }

    const cleanedJson = candidate.replace(/```json\n?|\n?```/gi, '').trim();
    let parsed: any;
    try {
      parsed = JSON.parse(cleanedJson);
    } catch (parseErr) {
      throw new Error(`[GeminiProvider] Failed to parse model JSON output: ${candidate}`);
    }

    // 4. Strict normalization and schema enforcement
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
      throw new Error(
        '[GeminiProvider] GEMINI_API_KEY is not configured for repair verification.'
      );
    }

    const beforeEvidence = await resolveImageBuffer(input.beforeImageUrl);
    const afterEvidence = await resolveImageBuffer(input.afterImageUrl);

    const parts: any[] = [
      {
        text: `${ROAD_REPAIR_VERIFICATION_PROMPT}

ORIGINAL DAMAGE REPORT:
- Defect Type: ${input.damageType}
- Severity: ${input.originalSeverity}`,
      },
    ];

    if (beforeEvidence) {
      parts.push({
        inlineData: {
          mimeType: beforeEvidence.mimeType,
          data: beforeEvidence.buffer.toString('base64'),
        },
      });
    }

    if (afterEvidence) {
      parts.push({
        inlineData: {
          mimeType: afterEvidence.mimeType,
          data: afterEvidence.buffer.toString('base64'),
        },
      });
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      this.model
    )}:generateContent?key=${encodeURIComponent(this.apiKey)}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`[GeminiProvider] Gemini repair verification failed with HTTP ${response.status}: ${await response.text()}`);
    }

    const json = await response.json();
    const candidate = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidate) throw new Error('[GeminiProvider] Empty candidate response for repair verification.');

    const cleaned = candidate.replace(/```json\n?|\n?```/gi, '').trim();
    return AIVerificationOutputSchema.parse(JSON.parse(cleaned));
  }
}
