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
    this.model = (model || process.env.GEMINI_MODEL || 'gemini-3.6-flash').trim();
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
    if (!imageEvidence || imageEvidence.buffer.length === 0) {
      return {
        damageDetected: false,
        validRoadDamage: false,
        classification: 'INSUFFICIENT_EVIDENCE',
        damageType: 'INSUFFICIENT_EVIDENCE',
        severity: 'NONE',
        safetyRisk: 'NONE',
        confidence: 0,
        visibleDamage: false,
        roadSafetyRisk: 0,
        evidenceReason: `Unable to access or load image binary data from "${input.imageUrl || input.imageFilename || 'unspecified'}". Multimodal vision analysis could not be completed.`,
        description: 'Insufficient photographic evidence: Image file could not be accessed or parsed for visual analysis.',
        recommendedAction: 'Please submit a clear, accessible photograph of the road damage.',
        cancellationReason: 'Road damage could not be verified. Image binary data is unreadable or unavailable.',
        imageQuality: {
          isAcceptable: false,
          isBlurry: true,
          isTooDark: false,
          hasRoadVisible: false,
          qualityScore: 0,
          warningMessage: 'Image file unreadable or unavailable for multimodal vision analysis.',
        },
      };
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

    // 3. Dispatch multimodal request to Google Gemini API with retry on HTTP 503 UNAVAILABLE
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      this.model
    )}:generateContent?key=${encodeURIComponent(this.apiKey)}`;

    const candidate = await this.dispatchGeminiRequestWithRetry(endpoint, {
      contents: [{ role: 'user', parts }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

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
      parsed.classification !== 'INVALID_EVIDENCE'
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
      if (!parsed.roadSafetyRisk || parsed.roadSafetyRisk <= 0) {
        parsed.roadSafetyRisk = parsed.severity === 'critical' ? 88 : parsed.severity === 'high' ? 75 : parsed.severity === 'medium' ? 55 : 45;
      }
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

    const candidate = await this.dispatchGeminiRequestWithRetry(endpoint, {
      contents: [{ role: 'user', parts }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const cleaned = candidate.replace(/```json\n?|\n?```/gi, '').trim();
    return AIVerificationOutputSchema.parse(JSON.parse(cleaned));
  }

  /**
   * Dispatches request to Gemini API with production-safe retry logic:
   * - Retries ONLY on transient HTTP 503 / UNAVAILABLE errors.
   * - Maximum 2 retries (3 total attempts).
   * - Exponential backoff: 1s, then 2s (or configured via GEMINI_RETRY_DELAY_MS for tests).
   * - Never retries 400, 401, 403, 404, schema validation errors, or invalid API key errors.
   * - If all retries fail, throws a clear temporary AI-unavailable error.
   */
  private async dispatchGeminiRequestWithRetry(
    endpoint: string,
    requestBody: any
  ): Promise<string> {
    const maxRetries = 2;
    const baseDelayMs = process.env.GEMINI_RETRY_DELAY_MS
      ? parseInt(process.env.GEMINI_RETRY_DELAY_MS, 10)
      : 1000;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errText = await response.text();
        const is503Unavailable =
          response.status === 503 ||
          (response.status >= 500 && errText.toUpperCase().includes('UNAVAILABLE'));

        // Retry ONLY on HTTP 503 / UNAVAILABLE
        if (is503Unavailable && attempt < maxRetries) {
          const delayMs = baseDelayMs * Math.pow(2, attempt); // 1s, 2s
          console.warn(
            `[GeminiProvider] Transient HTTP 503 UNAVAILABLE from Gemini API (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${delayMs}ms...`
          );
          await this.delay(delayMs);
          continue;
        }

        if (is503Unavailable) {
          throw new Error(
            `[GeminiProvider] Google Gemini service is temporarily unavailable (HTTP 503 UNAVAILABLE) after ${maxRetries} retries. Please retry in a few moments.`
          );
        }

        // Do NOT retry 400, 401, 403, 404, or any client errors
        throw new Error(
          `[GeminiProvider] Google Gemini API request failed with HTTP ${response.status} (${this.model}): ${errText}`
        );
      }

      const json = await response.json();
      const candidate = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!candidate) {
        throw new Error(`[GeminiProvider] Gemini model ${this.model} returned empty response.`);
      }

      return candidate;
    }

    throw new Error(
      `[GeminiProvider] Google Gemini service is temporarily unavailable (HTTP 503 UNAVAILABLE) after ${maxRetries} retries. Please retry in a few moments.`
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
