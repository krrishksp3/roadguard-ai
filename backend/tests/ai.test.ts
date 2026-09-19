import { DemoAIProvider } from '../src/services/ai/DemoAIProvider';
import { AIAnalysisOutputSchema } from '../src/services/ai/schemas';

describe('DemoAIProvider — Strict Image-First Validation Matrix', () => {
  const provider = new DemoAIProvider();

  // CASE 1: Genuine pothole image -> accepted -> damageDetected true -> risk workflow continues
  it('CASE 1: Genuine pothole image is accepted with damageDetected true', async () => {
    const res = await provider.analyzeRoadDamage({
      imageUrl: '/demo-evidence/pothole-reference.jpg',
      imageFilename: 'pothole-reference.jpg',
      description: 'Cavity on lane',
    });
    expect(res.damageDetected).toBe(true);
    expect(res.validRoadDamage).toBe(true);
    expect(res.classification).toBe('VALID_ROAD_DAMAGE');
    expect(res.damageType).toBe('pothole');
    expect(res.roadSafetyRisk).toBeGreaterThan(0);
    expect(res.confidence).toBeGreaterThan(0.5);
    expect(AIAnalysisOutputSchema.safeParse(res).success).toBe(true);
  });

  // CASE 2: Genuine road crack image -> accepted -> damageDetected true
  it('CASE 2: Genuine road crack image is accepted with damageDetected true', async () => {
    const res = await provider.analyzeRoadDamage({
      imageUrl: '/demo-evidence/crack-evidence.svg',
      imageFilename: 'crack-evidence.svg',
      description: 'Alligator cracking along lane',
    });
    expect(res.damageDetected).toBe(true);
    expect(res.validRoadDamage).toBe(true);
    expect(res.classification).toBe('VALID_ROAD_DAMAGE');
    expect(res.damageType).toBe('crack');
    expect(res.roadSafetyRisk).toBeGreaterThan(0);
    expect(AIAnalysisOutputSchema.safeParse(res).success).toBe(true);
  });

  // CASE 3: Normal road image -> rejected -> risk 0 -> no assignment
  it('CASE 3: Normal road image without defects is rejected with risk 0 and damageDetected false', async () => {
    const res = await provider.analyzeRoadDamage({
      imageUrl: '/uploads/normal_road_surface.jpg',
      imageFilename: 'normal_road_surface.jpg',
      description: 'Road surface view',
    });
    expect(res.damageDetected).toBe(false);
    expect(res.validRoadDamage).toBe(false);
    expect(res.classification).toBe('NO_DAMAGE_FOUND');
    expect(res.damageType).toBe('NO_ROAD_DAMAGE');
    expect(res.severity).toBe('NONE');
    expect(res.safetyRisk).toBe('NONE');
    expect(res.roadSafetyRisk).toBe(0);
    expect(res.confidence).toBe(0);
    expect(AIAnalysisOutputSchema.safeParse(res).success).toBe(true);
  });

  // CASE 4: Bus/vehicle scene without road damage -> rejected -> risk 0 -> no assignment
  it('CASE 4: Bus/vehicle scene without road damage is rejected with risk 0', async () => {
    const res = await provider.analyzeRoadDamage({
      imageUrl: '/uploads/city_bus_traffic_scene.jpg',
      imageFilename: 'city_bus_traffic_scene.jpg',
      description: 'Traffic on highway',
    });
    expect(res.damageDetected).toBe(false);
    expect(res.validRoadDamage).toBe(false);
    expect(res.classification).toBe('NO_DAMAGE_FOUND');
    expect(res.roadSafetyRisk).toBe(0);
    expect(res.confidence).toBe(0);
    expect(AIAnalysisOutputSchema.safeParse(res).success).toBe(true);
  });

  // CASE 5: Person image -> rejected -> no authority workflow
  it('CASE 5: Person/selfie image is rejected as NON_ROAD_IMAGE with risk 0', async () => {
    const res = await provider.analyzeRoadDamage({
      imageUrl: '/uploads/person_portrait_selfie.jpg',
      imageFilename: 'person_portrait_selfie.jpg',
      description: 'Person selfie',
    });
    expect(res.damageDetected).toBe(false);
    expect(res.validRoadDamage).toBe(false);
    expect(res.classification).toBe('NON_ROAD_IMAGE');
    expect(res.roadSafetyRisk).toBe(0);
    expect(res.confidence).toBe(0);
    expect(AIAnalysisOutputSchema.safeParse(res).success).toBe(true);
  });

  // CASE 6: ID card/document image -> rejected -> no authority workflow
  it('CASE 6: ID card/document image is rejected as NON_ROAD_IMAGE with risk 0', async () => {
    const res = await provider.analyzeRoadDamage({
      imageUrl: '/uploads/student_id_card.png',
      imageFilename: 'student_id_card.png',
      description: 'College student badge',
    });
    expect(res.damageDetected).toBe(false);
    expect(res.validRoadDamage).toBe(false);
    expect(res.classification).toBe('NON_ROAD_IMAGE');
    expect(res.roadSafetyRisk).toBe(0);
    expect(res.confidence).toBe(0);
    expect(AIAnalysisOutputSchema.safeParse(res).success).toBe(true);
  });

  // CASE 7: Cartoon/random unrelated image -> rejected -> no authority workflow
  it('CASE 7: Cartoon/random unrelated image is rejected as NON_ROAD_IMAGE with risk 0', async () => {
    const res = await provider.analyzeRoadDamage({
      imageUrl: '/uploads/cartoon_anime_drawing.png',
      imageFilename: 'cartoon_anime_drawing.png',
      description: 'Drawing',
    });
    expect(res.damageDetected).toBe(false);
    expect(res.validRoadDamage).toBe(false);
    expect(res.classification).toBe('NON_ROAD_IMAGE');
    expect(res.roadSafetyRisk).toBe(0);
    expect(res.confidence).toBe(0);
    expect(AIAnalysisOutputSchema.safeParse(res).success).toBe(true);
  });

  // CASE 8: User selects POTHOLE but image is normal road -> rejected -> user input must NOT override image evidence
  it('CASE 8: User selects POTHOLE but image is normal road -> rejected with NO_DAMAGE_FOUND', async () => {
    const res = await provider.analyzeRoadDamage({
      imageUrl: '/uploads/normal_asphalt_carriageway.jpg',
      imageFilename: 'normal_asphalt_carriageway.jpg',
      description: 'Pothole here',
      damageTypeHint: 'pothole', // Citizen selected Pothole!
    });
    expect(res.damageDetected).toBe(false);
    expect(res.validRoadDamage).toBe(false);
    expect(res.classification).toBe('NO_DAMAGE_FOUND');
    expect(res.damageType).toBe('NO_ROAD_DAMAGE');
    expect(res.roadSafetyRisk).toBe(0);
    expect(AIAnalysisOutputSchema.safeParse(res).success).toBe(true);
  });

  // CASE 9: User description says "large pothole" but image has no pothole -> rejected
  it('CASE 9: User description says "large pothole" but image is intact road -> rejected', async () => {
    const res = await provider.analyzeRoadDamage({
      imageUrl: '/uploads/smooth_paved_road.jpg',
      imageFilename: 'smooth_paved_road.jpg',
      description: 'large dangerous pothole in middle of road', // Citizen text claim!
      damageTypeHint: 'pothole',
    });
    expect(res.damageDetected).toBe(false);
    expect(res.validRoadDamage).toBe(false);
    expect(res.classification).toBe('NO_DAMAGE_FOUND');
    expect(res.roadSafetyRisk).toBe(0);
    expect(AIAnalysisOutputSchema.safeParse(res).success).toBe(true);
  });

  // CASE 10: Low-confidence/insufficient image -> needs review or rejected -> never automatically assigned
  it('CASE 10: Low-confidence/insufficient/blurry image is rejected as INSUFFICIENT_EVIDENCE', async () => {
    const res = await provider.analyzeRoadDamage({
      imageUrl: '/uploads/blurry_night_obscured_capture.jpg',
      imageFilename: 'blurry_night_obscured_capture.jpg',
      description: 'Dark road photo',
    });
    expect(res.damageDetected).toBe(false);
    expect(res.validRoadDamage).toBe(false);
    expect(res.classification).toBe('INSUFFICIENT_EVIDENCE');
    expect(res.damageType).toBe('INSUFFICIENT_EVIDENCE');
    expect(res.roadSafetyRisk).toBe(0);
    expect(AIAnalysisOutputSchema.safeParse(res).success).toBe(true);
  });

  // CASE 11: Valid road damage with misleading citizen text ("normal pic") still correctly accepted
  it('CASE 11: Valid road damage image with misleading text "normal pic" remains VALID', async () => {
    const res = await provider.analyzeRoadDamage({
      imageUrl: '/demo-evidence/large-road-pothole.jpg',
      imageFilename: 'large-road-pothole.jpg',
      description: 'normal pic', // Citizen description says normal pic, but image is a pothole!
    });
    expect(res.damageDetected).toBe(true);
    expect(res.validRoadDamage).toBe(true);
    expect(res.classification).toBe('VALID_ROAD_DAMAGE');
    expect(res.damageType).toBe('pothole');
    expect(res.roadSafetyRisk).toBeGreaterThan(0);
  });

  // CASE 12: Determinism: Same image input produces identical validation and classification results
  it('CASE 12: Exact same image uploaded twice produces identical deterministic result', async () => {
    const res1 = await provider.analyzeRoadDamage({
      imageUrl: '/demo-evidence/potholes-on-road.jpg',
      imageFilename: 'potholes-on-road.jpg',
      description: 'Pothole 1',
    });
    const res2 = await provider.analyzeRoadDamage({
      imageUrl: '/demo-evidence/potholes-on-road.jpg',
      imageFilename: 'potholes-on-road.jpg',
      description: 'Different user text for same pothole',
    });
    expect(res1.damageDetected).toBe(res2.damageDetected);
    expect(res1.validRoadDamage).toBe(res2.validRoadDamage);
    expect(res1.damageType).toBe(res2.damageType);
    expect(res1.severity).toBe(res2.severity);
    expect(res1.roadSafetyRisk).toBe(res2.roadSafetyRisk);
    expect(res1.confidence).toBe(res2.confidence);
  });
});

import { GeminiProvider } from '../src/services/ai/GeminiProvider';
import { AIService } from '../src/services/ai/AIService';

describe('GeminiProvider — Multimodal Vision AI & Configurable Model', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('throws a clear error when GEMINI_API_KEY is missing (no silent fallback)', async () => {
    const provider = new GeminiProvider('', 'gemini-3.6-flash');
    await expect(
      provider.analyzeRoadDamage({
        imageUrl: '/demo-evidence/pothole-reference.jpg',
        description: 'Pothole test',
      })
    ).rejects.toThrow(/GEMINI_API_KEY is not configured/);
  });

  it('uses configurable model from constructor or GEMINI_MODEL env', () => {
    const provider1 = new GeminiProvider('dummy-key', 'gemini-2.0-flash');
    expect(provider1.getModelName()).toBe('gemini-2.0-flash');

    const provider2 = new GeminiProvider('dummy-key');
    expect(provider2.getModelName()).toBe('gemini-3.6-flash');
  });

  it('TEST A: Genuine pothole photo receives valid road damage classification and risk from vision', async () => {
    const mockGeminiOutput = {
      validRoadDamage: true,
      classification: 'VALID_ROAD_DAMAGE',
      damageType: 'pothole',
      severity: 'high',
      confidence: 0.94,
      visibleDamage: true,
      roadSafetyRisk: 82,
      description: 'Deep circular asphalt pothole in traffic lane with visible base aggregate.',
      recommendedAction: 'Full depth asphalt compaction patch.',
      imageQuality: {
        isAcceptable: true,
        isBlurry: false,
        isTooDark: false,
        hasRoadVisible: true,
        qualityScore: 95,
      },
    };

    let capturedUrl = '';
    let capturedBody: any = null;

    global.fetch = jest.fn().mockImplementation(async (url: string, opts: any) => {
      capturedUrl = url;
      capturedBody = JSON.parse(opts.body);
      return {
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify(mockGeminiOutput) }],
              },
            },
          ],
        }),
      };
    });

    const provider = new GeminiProvider('fake-test-gemini-key', 'gemini-3.6-flash');
    const res = await provider.analyzeRoadDamage({
      imageUrl: '/demo-evidence/pothole-reference.jpg',
      imageFilename: 'pothole-reference.jpg',
      description: 'Deep road depression',
    });

    expect(capturedUrl).toContain('gemini-3.6-flash:generateContent');
    expect(capturedUrl).toContain('key=fake-test-gemini-key');
    expect(capturedBody.contents[0].parts[1].inlineData).toBeDefined();
    expect(capturedBody.contents[0].parts[1].inlineData.mimeType).toBe('image/jpeg');
    expect(capturedBody.contents[0].parts[1].inlineData.data.length).toBeGreaterThan(100);

    expect(res.validRoadDamage).toBe(true);
    expect(res.damageType).toBe('pothole');
    expect(res.severity).toBe('high');
    expect(res.roadSafetyRisk).toBe(82);
    expect(AIAnalysisOutputSchema.safeParse(res).success).toBe(true);
  });

  it('TEST B: Severe road damage returns critical severity and valid classification', async () => {
    const mockOutput = {
      validRoadDamage: true,
      classification: 'VALID_ROAD_DAMAGE',
      damageType: 'pothole',
      severity: 'critical',
      confidence: 0.96,
      visibleDamage: true,
      roadSafetyRisk: 92,
      description: 'Severe structural subgrade collapse with jagged broken pavement edges.',
      recommendedAction: 'Emergency road closure and sub-base reconstruction.',
      imageQuality: { isAcceptable: true, isBlurry: false, isTooDark: false, hasRoadVisible: true, qualityScore: 90 },
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify(mockOutput) }] } }],
      }),
    });

    const provider = new GeminiProvider('fake-key', 'gemini-3.6-flash');
    const res = await provider.analyzeRoadDamage({
      imageUrl: '/demo-evidence/severe-damage-reference.jpg',
      description: 'Caved road',
    });

    expect(res.validRoadDamage).toBe(true);
    expect(res.severity).toBe('critical');
    expect(res.roadSafetyRisk).toBe(92);
  });

  it('TEST C: Unrelated ID / document is rejected as INVALID_EVIDENCE with risk 0', async () => {
    const mockOutput = {
      validRoadDamage: false,
      classification: 'INVALID_EVIDENCE',
      damageType: 'other',
      severity: 'low',
      confidence: 0,
      visibleDamage: false,
      roadSafetyRisk: 0,
      description: 'The uploaded image shows an identity card document, not road infrastructure.',
      recommendedAction: 'No civil action required.',
      cancellationReason: 'Identity document uploaded instead of road hazard.',
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify(mockOutput) }] } }],
      }),
    });

    const provider = new GeminiProvider('fake-key');
    const res = await provider.analyzeRoadDamage({
      imageUrl: '/demo-evidence/pothole-reference.jpg', // buffer to simulate upload
      description: 'My ID card',
    });

    expect(res.validRoadDamage).toBe(false);
    expect(res.classification).toBe('INVALID_EVIDENCE');
    expect(res.roadSafetyRisk).toBe(0);
    expect(res.visibleDamage).toBe(false);
  });

  it('TEST D: Unrelated interior / cartoon is rejected with risk 0', async () => {
    const mockOutput = {
      validRoadDamage: false,
      classification: 'INVALID_EVIDENCE',
      damageType: 'other',
      severity: 'low',
      confidence: 0,
      visibleDamage: false,
      roadSafetyRisk: 0,
      description: 'Indoor room or cartoon illustration.',
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify(mockOutput) }] } }],
      }),
    });

    const provider = new GeminiProvider('fake-key');
    const res = await provider.analyzeRoadDamage({
      imageUrl: '/demo-evidence/pothole-reference.jpg',
      description: 'Interior pic',
    });

    expect(res.validRoadDamage).toBe(false);
    expect(res.roadSafetyRisk).toBe(0);
  });

  it('TEST E: Genuine road image with description "normal pic" remains VALID if road damage is visible', async () => {
    const mockOutput = {
      validRoadDamage: true,
      classification: 'VALID_ROAD_DAMAGE',
      damageType: 'pothole',
      severity: 'high',
      confidence: 0.91,
      visibleDamage: true,
      roadSafetyRisk: 78,
      description: 'Image clearly depicts damaged asphalt roadway despite citizen writing normal pic.',
      recommendedAction: 'Asphalt patching.',
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify(mockOutput) }] } }],
      }),
    });

    const provider = new GeminiProvider('fake-key');
    const res = await provider.analyzeRoadDamage({
      imageUrl: '/demo-evidence/pothole-reference.jpg',
      description: 'normal pic', // Misleading text!
    });

    expect(res.validRoadDamage).toBe(true);
    expect(res.visibleDamage).toBe(true);
    expect(res.damageType).toBe('pothole');
  });

  it('TEST F: Invalid image with description "huge pothole" remains INVALID with risk 0', async () => {
    const mockOutput = {
      validRoadDamage: false,
      classification: 'INVALID_EVIDENCE',
      damageType: 'other',
      severity: 'low',
      confidence: 0,
      visibleDamage: false,
      roadSafetyRisk: 0,
      description: 'Photograph does not show pavement or road hazard despite description.',
      cancellationReason: 'Invalid road-damage evidence.',
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify(mockOutput) }] } }],
      }),
    });

    const provider = new GeminiProvider('fake-key');
    const res = await provider.analyzeRoadDamage({
      imageUrl: '/demo-evidence/pothole-reference.jpg',
      description: 'huge dangerous pothole on road', // Misleading text!
    });

    expect(res.validRoadDamage).toBe(false);
    expect(res.classification).toBe('INVALID_EVIDENCE');
    expect(res.roadSafetyRisk).toBe(0);
  });

  it('does NOT silently fall back to DemoAIProvider when Gemini API fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => 'Quota exceeded or invalid API key',
    });

    const provider = new GeminiProvider('invalid-key', 'gemini-3.6-flash');
    await expect(
      provider.analyzeRoadDamage({
        imageUrl: '/demo-evidence/pothole-reference.jpg',
        description: 'Test',
      })
    ).rejects.toThrow(/Google Gemini API request failed with HTTP 403/);
  });

  describe('Transient HTTP 503 UNAVAILABLE Retry Mechanism', () => {
    const originalRetryDelay = process.env.GEMINI_RETRY_DELAY_MS;

    beforeEach(() => {
      process.env.GEMINI_RETRY_DELAY_MS = '10'; // Fast 10ms backoff for tests
    });

    afterEach(() => {
      if (originalRetryDelay !== undefined) {
        process.env.GEMINI_RETRY_DELAY_MS = originalRetryDelay;
      } else {
        delete process.env.GEMINI_RETRY_DELAY_MS;
      }
    });

    it('retries on HTTP 503 UNAVAILABLE and succeeds on subsequent attempt', async () => {
      const validMockOutput = {
        validRoadDamage: true,
        classification: 'VALID_ROAD_DAMAGE',
        damageType: 'pothole',
        severity: 'high',
        confidence: 0.93,
        visibleDamage: true,
        roadSafetyRisk: 80,
        description: 'Pothole detected after recovery from transient 503.',
        recommendedAction: 'Patch repair.',
      };

      let callCount = 0;
      global.fetch = jest.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            ok: false,
            status: 503,
            text: async () => 'The model is overloaded. Please try again later. (UNAVAILABLE)',
          };
        }
        return {
          ok: true,
          json: async () => ({
            candidates: [{ content: { parts: [{ text: JSON.stringify(validMockOutput) }] } }],
          }),
        };
      });

      const provider = new GeminiProvider('test-key', 'gemini-3.6-flash');
      const res = await provider.analyzeRoadDamage({
        imageUrl: '/demo-evidence/pothole-reference.jpg',
        description: 'Pothole test',
      });

      expect(callCount).toBe(2); // 1 initial + 1 retry = 2 attempts
      expect(res.validRoadDamage).toBe(true);
      expect(res.damageType).toBe('pothole');
    });

    it('exhausts maximum 2 retries (3 total attempts) on persistent HTTP 503 UNAVAILABLE and throws clear temporary error', async () => {
      let callCount = 0;
      global.fetch = jest.fn().mockImplementation(async () => {
        callCount++;
        return {
          ok: false,
          status: 503,
          text: async () => 'Resource exhausted or temporarily unavailable (UNAVAILABLE)',
        };
      });

      const provider = new GeminiProvider('test-key', 'gemini-3.6-flash');
      await expect(
        provider.analyzeRoadDamage({
          imageUrl: '/demo-evidence/pothole-reference.jpg',
          description: 'Pothole test',
        })
      ).rejects.toThrow(
        /Google Gemini service is temporarily unavailable \(HTTP 503 UNAVAILABLE\) after 2 retries/
      );

      expect(callCount).toBe(3); // 1 initial + 2 retries = 3 attempts total
    });

    it('does NOT retry HTTP 400, 401, 403, or 404 client errors (fails immediately on first attempt)', async () => {
      const nonRetryableCodes = [400, 401, 403, 404];

      for (const status of nonRetryableCodes) {
        let callCount = 0;
        global.fetch = jest.fn().mockImplementation(async () => {
          callCount++;
          return {
            ok: false,
            status,
            text: async () => `Client error with status ${status}`,
          };
        });

        const provider = new GeminiProvider('test-key', 'gemini-3.6-flash');
        await expect(
          provider.analyzeRoadDamage({
            imageUrl: '/demo-evidence/pothole-reference.jpg',
            description: 'Non-retryable test',
          })
        ).rejects.toThrow(new RegExp(`HTTP ${status}`));

        expect(callCount).toBe(1); // Strictly 1 attempt, zero retries
      }
    });

    it('does NOT retry on model schema or JSON parsing errors (fails immediately)', async () => {
      let callCount = 0;
      global.fetch = jest.fn().mockImplementation(async () => {
        callCount++;
        return {
          ok: true,
          json: async () => ({
            candidates: [{ content: { parts: [{ text: 'NOT VALID JSON' }] } }],
          }),
        };
      });

      const provider = new GeminiProvider('test-key', 'gemini-3.6-flash');
      await expect(
        provider.analyzeRoadDamage({
          imageUrl: '/demo-evidence/pothole-reference.jpg',
          description: 'Corrupted output test',
        })
      ).rejects.toThrow(/Failed to parse model JSON output/);

      expect(callCount).toBe(1); // Strictly 1 attempt, zero retries
    });
  });
});

describe('AIService Provider Selection & Diagnostics', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('selects GeminiProvider when AI_PROVIDER=gemini', () => {
    process.env.AI_PROVIDER = 'gemini';
    process.env.GEMINI_API_KEY = 'test-gemini-key-12345';
    process.env.GEMINI_MODEL = 'gemini-3.6-flash';

    const service = new AIService();
    expect(service.getProviderName()).toBe('Google Gemini Vision Provider');
    expect(service.getModelName()).toBe('gemini-3.6-flash');
    expect(service.isDemo()).toBe(false);

    const diag = service.getDiagnosticInfo();
    expect(diag.provider).toBe('gemini');
    expect(diag.isKeyConfigured).toBe(true);
    expect(diag.status).toBe('ready');
    // NEVER expose raw key
    expect(JSON.stringify(diag)).not.toContain('test-gemini-key-12345');
  });

  it('selects DemoAIProvider when AI_PROVIDER=demo', () => {
    process.env.AI_PROVIDER = 'demo';

    const service = new AIService();
    expect(service.getProviderName()).toContain('DemoAIProvider');
    expect(service.isDemo()).toBe(true);

    const diag = service.getDiagnosticInfo();
    expect(diag.provider).toBe('demo');
    expect(diag.status).toBe('offline_demo');
  });
});

describe('ROADGUARD AI — False-Negative Fix & 8 Mandatory Test Scenarios', () => {
  const provider = new DemoAIProvider();

  // TEST 1 — Ceiling fan image -> NON_ROAD_IMAGE, damageDetected false, risk 0
  it('TEST 1: Ceiling fan image is classified as NON_ROAD_IMAGE with damageDetected=false and risk=0', async () => {
    const res = await provider.analyzeRoadDamage({
      imageUrl: '/uploads/evidence-1789165596187-bb9e3e1b.png',
      imageFilename: 'ceiling_fan_indoor.png',
      description: 'Fan on the ceiling',
    });
    expect(res.damageDetected).toBe(false);
    expect(res.validRoadDamage).toBe(false);
    expect(res.classification).toBe('NON_ROAD_IMAGE');
    expect(res.damageType).toBe('NON_ROAD_IMAGE');
    expect(res.roadSafetyRisk).toBe(0);
    expect(res.confidence).toBe(0);
    expect(AIAnalysisOutputSchema.safeParse(res).success).toBe(true);
  });

  // TEST 2 — Normal intact road / vehicle scene -> NO_DAMAGE_FOUND, damageDetected false, risk 0
  it('TEST 2: Normal intact road / vehicle scene is classified as NO_DAMAGE_FOUND with risk=0', async () => {
    const res = await provider.analyzeRoadDamage({
      imageUrl: '/uploads/normal_road_surface.jpg',
      imageFilename: 'normal_road_surface.jpg',
      description: 'Clean smooth asphalt road',
    });
    expect(res.damageDetected).toBe(false);
    expect(res.validRoadDamage).toBe(false);
    expect(res.classification).toBe('NO_DAMAGE_FOUND');
    expect(res.damageType).toBe('NO_ROAD_DAMAGE');
    expect(res.roadSafetyRisk).toBe(0);
    expect(res.confidence).toBe(0);
    expect(AIAnalysisOutputSchema.safeParse(res).success).toBe(true);
  });

  // TEST 3 — Genuine pothole image (including uploaded multipart padded file!) -> VALID_ROAD_DAMAGE, damageDetected true
  it('TEST 3: Genuine pothole image (including multipart-padded upload) is classified as VALID_ROAD_DAMAGE', async () => {
    // Test with the actual uploaded evidence file that previously became NO_DAMAGE_FOUND
    const res = await provider.analyzeRoadDamage({
      imageUrl: '/uploads/evidence-1789166146961-27aaf5ad.jpg',
      imageFilename: 'evidence-1789166146961-27aaf5ad.jpg', // No defect tokens in filename!
      description: 'Large road damage cavity',
    });
    expect(res.damageDetected).toBe(true);
    expect(res.validRoadDamage).toBe(true);
    expect(res.classification).toBe('VALID_ROAD_DAMAGE');
    expect(res.damageType).toBe('pothole');
    expect(res.roadSafetyRisk).toBeGreaterThan(0);
    expect(res.severity).toMatch(/^(critical|high|medium|low)$/);
    expect(AIAnalysisOutputSchema.safeParse(res).success).toBe(true);
  });

  // TEST 4 — Waterlogged damaged road -> VALID_ROAD_DAMAGE, damageDetected true
  it('TEST 4: Waterlogged damaged road is classified as valid road damage', async () => {
    const res = await provider.analyzeRoadDamage({
      imageUrl: '/demo-evidence/waterlogging-reference.jpg',
      imageFilename: 'waterlogging-reference.jpg',
      description: 'Ponding water over broken road pavement',
    });
    expect(res.damageDetected).toBe(true);
    expect(res.validRoadDamage).toBe(true);
    expect(res.classification).toBe('VALID_ROAD_DAMAGE');
    expect(res.damageType).toBe('waterlogging');
    expect(res.roadSafetyRisk).toBeGreaterThan(0);
    expect(AIAnalysisOutputSchema.safeParse(res).success).toBe(true);
  });

  // TEST 5 — Road crack -> VALID_ROAD_DAMAGE, damageDetected true
  it('TEST 5: Road crack image is classified as valid road damage', async () => {
    const res = await provider.analyzeRoadDamage({
      imageUrl: '/demo-evidence/crack-evidence.svg',
      imageFilename: 'crack-evidence.svg',
      description: 'Severe longitudinal pavement crack',
    });
    expect(res.damageDetected).toBe(true);
    expect(res.validRoadDamage).toBe(true);
    expect(res.classification).toBe('VALID_ROAD_DAMAGE');
    expect(res.damageType).toBe('crack');
    expect(res.roadSafetyRisk).toBeGreaterThan(0);
    expect(AIAnalysisOutputSchema.safeParse(res).success).toBe(true);
  });

  // TEST 6 — Random unrelated object -> NON_ROAD_IMAGE, damageDetected false, risk 0
  it('TEST 6: Random unrelated object is rejected as NON_ROAD_IMAGE with risk=0', async () => {
    const res = await provider.analyzeRoadDamage({
      imageUrl: '/uploads/random_unrelated_object.jpg',
      imageFilename: 'random_unrelated_object.jpg',
      description: 'Coffee cup and pen on table',
    });
    expect(res.damageDetected).toBe(false);
    expect(res.validRoadDamage).toBe(false);
    expect(res.classification).toBe('NON_ROAD_IMAGE');
    expect(res.damageType).toBe('NON_ROAD_IMAGE');
    expect(res.roadSafetyRisk).toBe(0);
    expect(AIAnalysisOutputSchema.safeParse(res).success).toBe(true);
  });

  // TEST 7 — Pothole selected in UI but fan image uploaded -> REJECT (image evidence wins)
  it('TEST 7: Pothole selected in UI but fan image uploaded is REJECTED as NON_ROAD_IMAGE', async () => {
    const res = await provider.analyzeRoadDamage({
      imageUrl: '/uploads/evidence-1789165596187-bb9e3e1b.png',
      imageFilename: 'ceiling_fan.png',
      description: 'Large dangerous pothole in road lane', // Citizen claims pothole
      damageTypeHint: 'pothole',                          // Citizen selected Pothole!
    });
    expect(res.damageDetected).toBe(false);
    expect(res.validRoadDamage).toBe(false);
    expect(res.classification).toBe('NON_ROAD_IMAGE');
    expect(res.damageType).toBe('NON_ROAD_IMAGE');
    expect(res.roadSafetyRisk).toBe(0);
    expect(AIAnalysisOutputSchema.safeParse(res).success).toBe(true);
  });

  // TEST 8 — Random category but genuine pothole image -> ACCEPT (image evidence recognized)
  it('TEST 8: Random category or description with genuine pothole image is ACCEPTED', async () => {
    const res = await provider.analyzeRoadDamage({
      imageUrl: '/demo-evidence/pothole-reference.jpg',
      imageFilename: 'pothole-reference.jpg',
      description: 'random scenery photo',   // Misleading citizen description
      damageTypeHint: 'other',               // Random/unrelated category
    });
    expect(res.damageDetected).toBe(true);
    expect(res.validRoadDamage).toBe(true);
    expect(res.classification).toBe('VALID_ROAD_DAMAGE');
    expect(res.damageType).toBe('pothole');
    expect(res.roadSafetyRisk).toBeGreaterThan(0);
    expect(AIAnalysisOutputSchema.safeParse(res).success).toBe(true);
  });
});

describe('ROADGUARD AI — Real Multimodal Vision Generalization Matrix (10 Scenarios)', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const setupMockVision = (mockOutput: any) => {
    let capturedRequest: { url: string; body: any } | null = null;
    global.fetch = jest.fn().mockImplementation(async (url: string, opts: any) => {
      capturedRequest = { url, body: JSON.parse(opts.body) };
      return {
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify(mockOutput) }],
              },
            },
          ],
        }),
      };
    });
    return () => capturedRequest;
  };

  const provider = new GeminiProvider('test-gemini-key', 'gemini-3.6-flash');

  // SCENARIO 1: NEW genuine pothole — random neutral filename -> ACCEPT
  it('SCENARIO 1: NEW genuine pothole with random filename is ACCEPTED as VALID_ROAD_DAMAGE', async () => {
    const getReq = setupMockVision({
      damageDetected: true,
      validRoadDamage: true,
      classification: 'VALID_ROAD_DAMAGE',
      damageType: 'pothole',
      severity: 'high',
      confidence: 0.95,
      visibleDamage: true,
      roadSafetyRisk: 82,
      description: 'Asphalt cavity with jagged fractured aggregate edges and exposed granular sub-base.',
      recommendedAction: 'Full-depth asphalt patching and compaction.',
      imageQuality: { isAcceptable: true, isBlurry: false, isTooDark: false, hasRoadVisible: true, qualityScore: 92 },
    });

    const res = await provider.analyzeRoadDamage({
      imageUrl: '/uploads/evidence-1789166146961-27aaf5ad.jpg',
      imageFilename: 'IMG_94827.jpg', // Random neutral filename!
      description: '',
    });

    const req = getReq();
    expect(req).not.toBeNull();
    // Verify real image bytes were read and passed as inlineData base64
    expect(req!.body.contents[0].parts[1].inlineData.data.length).toBeGreaterThan(100);
    expect(res.damageDetected).toBe(true);
    expect(res.validRoadDamage).toBe(true);
    expect(res.classification).toBe('VALID_ROAD_DAMAGE');
    expect(res.damageType).toBe('pothole');
    expect(res.severity).toBe('high');
    expect(res.roadSafetyRisk).toBe(82);
    expect(AIAnalysisOutputSchema.safeParse(res).success).toBe(true);
  });

  // SCENARIO 2: NEW road crack — random filename -> ACCEPT
  it('SCENARIO 2: NEW road crack with random filename is ACCEPTED as VALID_ROAD_DAMAGE', async () => {
    const getReq = setupMockVision({
      damageDetected: true,
      validRoadDamage: true,
      classification: 'VALID_ROAD_DAMAGE',
      damageType: 'crack',
      severity: 'medium',
      confidence: 0.91,
      visibleDamage: true,
      roadSafetyRisk: 58,
      description: 'Longitudinal and alligator fatigue cracking along vehicular wheel path.',
      recommendedAction: 'Bituminous crack sealing emulsion.',
      imageQuality: { isAcceptable: true, isBlurry: false, isTooDark: false, hasRoadVisible: true, qualityScore: 90 },
    });

    const res = await provider.analyzeRoadDamage({
      imageUrl: '/demo-evidence/crack-evidence.svg',
      imageFilename: 'IMG_38291.svg',
      description: '',
    });

    const req = getReq();
    expect(req!.body.contents[0].parts[1].inlineData.data.length).toBeGreaterThan(100);
    expect(res.damageDetected).toBe(true);
    expect(res.validRoadDamage).toBe(true);
    expect(res.classification).toBe('VALID_ROAD_DAMAGE');
    expect(res.damageType).toBe('crack');
    expect(res.roadSafetyRisk).toBe(58);
    expect(AIAnalysisOutputSchema.safeParse(res).success).toBe(true);
  });

  // SCENARIO 3: NEW waterlogged damaged road — random filename -> ACCEPT
  it('SCENARIO 3: NEW waterlogged damaged road with random filename is ACCEPTED', async () => {
    const getReq = setupMockVision({
      damageDetected: true,
      validRoadDamage: true,
      classification: 'VALID_ROAD_DAMAGE',
      damageType: 'waterlogging',
      severity: 'high',
      confidence: 0.93,
      visibleDamage: true,
      roadSafetyRisk: 80,
      description: 'Standing stormwater inundation across vehicular carriageway creating hydroplaning safety risk.',
      recommendedAction: 'Clear stormwater outfalls and restore cross-drainage.',
      imageQuality: { isAcceptable: true, isBlurry: false, isTooDark: false, hasRoadVisible: true, qualityScore: 89 },
    });

    const res = await provider.analyzeRoadDamage({
      imageUrl: '/demo-evidence/waterlogging-reference.jpg',
      imageFilename: 'IMG_71042.jpg',
      description: '',
    });

    const req = getReq();
    expect(req!.body.contents[0].parts[1].inlineData.data.length).toBeGreaterThan(100);
    expect(res.damageDetected).toBe(true);
    expect(res.validRoadDamage).toBe(true);
    expect(res.classification).toBe('VALID_ROAD_DAMAGE');
    expect(res.damageType).toBe('waterlogging');
    expect(res.roadSafetyRisk).toBe(80);
    expect(AIAnalysisOutputSchema.safeParse(res).success).toBe(true);
  });

  // SCENARIO 4: NEW intact road — random filename -> REJECT (NO_DAMAGE_FOUND)
  it('SCENARIO 4: NEW intact road with random filename is REJECTED as NO_DAMAGE_FOUND with risk=0', async () => {
    const getReq = setupMockVision({
      damageDetected: false,
      validRoadDamage: false,
      classification: 'NO_DAMAGE_FOUND',
      damageType: 'NO_ROAD_DAMAGE',
      severity: 'NONE',
      confidence: 0,
      visibleDamage: false,
      roadSafetyRisk: 0,
      description: 'Smooth clean asphalt highway with intact white lane markings and no pavement distress.',
      recommendedAction: 'No civil action required. Carriageway intact.',
      imageQuality: { isAcceptable: true, isBlurry: false, isTooDark: false, hasRoadVisible: true, qualityScore: 95 },
    });

    const res = await provider.analyzeRoadDamage({
      imageUrl: '/demo-evidence/repaired-road-patch.jpg',
      imageFilename: 'IMG_55021.jpg',
      description: '',
    });

    const req = getReq();
    expect(req).not.toBeNull();
    expect(req!.body.contents[0].parts[1].inlineData.data.length).toBeGreaterThan(100);
    expect(res.damageDetected).toBe(false);
    expect(res.validRoadDamage).toBe(false);
    expect(res.classification).toBe('NO_DAMAGE_FOUND');
    expect(res.damageType).toBe('NO_ROAD_DAMAGE');
    expect(res.roadSafetyRisk).toBe(0);
    expect(AIAnalysisOutputSchema.safeParse(res).success).toBe(true);
  });

  // SCENARIO 5: NEW ceiling fan — random filename -> REJECT (NON_ROAD_IMAGE)
  it('SCENARIO 5: NEW ceiling fan with random filename is REJECTED as NON_ROAD_IMAGE with risk=0', async () => {
    const getReq = setupMockVision({
      damageDetected: false,
      validRoadDamage: false,
      classification: 'NON_ROAD_IMAGE',
      damageType: 'NON_ROAD_IMAGE',
      severity: 'NONE',
      confidence: 0,
      visibleDamage: false,
      roadSafetyRisk: 0,
      description: 'Indoor ceiling fan and lighting fixture. No roadway or civil pavement present.',
      recommendedAction: 'No civil action required.',
      imageQuality: { isAcceptable: false, isBlurry: false, isTooDark: false, hasRoadVisible: false, qualityScore: 0 },
    });

    const res = await provider.analyzeRoadDamage({
      imageUrl: '/uploads/evidence-1789165596187-bb9e3e1b.png',
      imageFilename: 'IMG_19482.png',
      description: '',
    });

    const req = getReq();
    expect(req).not.toBeNull();
    expect(req!.body.contents[0].parts[1].inlineData.data.length).toBeGreaterThan(100);
    expect(res.damageDetected).toBe(false);
    expect(res.validRoadDamage).toBe(false);
    expect(res.classification).toBe('NON_ROAD_IMAGE');
    expect(res.damageType).toBe('NON_ROAD_IMAGE');
    expect(res.roadSafetyRisk).toBe(0);
    expect(AIAnalysisOutputSchema.safeParse(res).success).toBe(true);
  });

  // SCENARIO 6: NEW indoor object — random filename -> REJECT (NON_ROAD_IMAGE)
  it('SCENARIO 6: NEW indoor object with random filename is REJECTED as NON_ROAD_IMAGE with risk=0', async () => {
    const getReq = setupMockVision({
      damageDetected: false,
      validRoadDamage: false,
      classification: 'NON_ROAD_IMAGE',
      damageType: 'NON_ROAD_IMAGE',
      severity: 'NONE',
      confidence: 0,
      visibleDamage: false,
      roadSafetyRisk: 0,
      description: 'Indoor office desk with lamp and books. Civil pavement surface completely absent.',
      recommendedAction: 'No civil action required.',
      imageQuality: { isAcceptable: false, isBlurry: false, isTooDark: false, hasRoadVisible: false, qualityScore: 0 },
    });

    const res = await provider.analyzeRoadDamage({
      imageUrl: '/uploads/evidence-1789166147115-8b17555e.png',
      imageFilename: 'IMG_88321.png',
      description: '',
    });

    const req = getReq();
    expect(req).not.toBeNull();
    expect(req!.body.contents[0].parts[1].inlineData.data.length).toBeGreaterThan(100);
    expect(res.damageDetected).toBe(false);
    expect(res.validRoadDamage).toBe(false);
    expect(res.classification).toBe('NON_ROAD_IMAGE');
    expect(res.roadSafetyRisk).toBe(0);
    expect(AIAnalysisOutputSchema.safeParse(res).success).toBe(true);
  });

  // SCENARIO 7: Genuine pothole + misleading description "normal image" -> ACCEPT
  it('SCENARIO 7: Genuine pothole with misleading text "normal image" is ACCEPTED from visual evidence', async () => {
    const getReq = setupMockVision({
      damageDetected: true,
      validRoadDamage: true,
      classification: 'VALID_ROAD_DAMAGE',
      damageType: 'pothole',
      severity: 'high',
      confidence: 0.94,
      visibleDamage: true,
      roadSafetyRisk: 78,
      description: 'Photograph clearly depicts deep asphalt pothole despite misleading citizen text claim.',
      recommendedAction: 'Hot-mix asphalt patch compaction.',
      imageQuality: { isAcceptable: true, isBlurry: false, isTooDark: false, hasRoadVisible: true, qualityScore: 92 },
    });

    const res = await provider.analyzeRoadDamage({
      imageUrl: '/demo-evidence/pothole-reference.jpg',
      imageFilename: 'IMG_77194.jpg',
      description: 'normal image just scenery', // Misleading text!
      damageTypeHint: 'other',
    });

    const req = getReq();
    expect(req).not.toBeNull();
    expect(req!.body.contents[0].parts[0].text).toContain('normal image just scenery');
    expect(res.damageDetected).toBe(true);
    expect(res.validRoadDamage).toBe(true);
    expect(res.classification).toBe('VALID_ROAD_DAMAGE');
    expect(res.damageType).toBe('pothole');
    expect(res.roadSafetyRisk).toBe(78);
    expect(AIAnalysisOutputSchema.safeParse(res).success).toBe(true);
  });

  // SCENARIO 8: Fan + category "Pothole" -> REJECT (image evidence wins)
  it('SCENARIO 8: Ceiling fan with category hint "Pothole" is REJECTED as NON_ROAD_IMAGE', async () => {
    const getReq = setupMockVision({
      damageDetected: false,
      validRoadDamage: false,
      classification: 'NON_ROAD_IMAGE',
      damageType: 'NON_ROAD_IMAGE',
      severity: 'NONE',
      confidence: 0,
      visibleDamage: false,
      roadSafetyRisk: 0,
      description: 'Photograph shows an electrical ceiling fan. Pothole claim rejected by visual evidence.',
      recommendedAction: 'No civil action required.',
      imageQuality: { isAcceptable: false, isBlurry: false, isTooDark: false, hasRoadVisible: false, qualityScore: 0 },
    });

    const res = await provider.analyzeRoadDamage({
      imageUrl: '/uploads/evidence-1789165596187-bb9e3e1b.png',
      imageFilename: 'IMG_44102.png',
      description: 'Emergency huge pothole in center of lane', // Citizen text
      damageTypeHint: 'pothole',                             // Citizen selected pothole!
    });

    const req = getReq();
    expect(req).not.toBeNull();
    expect(req!.body.contents[0].parts[0].text).toContain('Emergency huge pothole');
    expect(res.damageDetected).toBe(false);
    expect(res.validRoadDamage).toBe(false);
    expect(res.classification).toBe('NON_ROAD_IMAGE');
    expect(res.roadSafetyRisk).toBe(0);
    expect(AIAnalysisOutputSchema.safeParse(res).success).toBe(true);
  });

  // SCENARIO 9: Random image + category "Pothole" -> REJECT (image evidence wins)
  it('SCENARIO 9: Random non-road image with category "Pothole" is REJECTED as NON_ROAD_IMAGE', async () => {
    const getReq = setupMockVision({
      damageDetected: false,
      validRoadDamage: false,
      classification: 'NON_ROAD_IMAGE',
      damageType: 'NON_ROAD_IMAGE',
      severity: 'NONE',
      confidence: 0,
      visibleDamage: false,
      roadSafetyRisk: 0,
      description: 'Photograph shows an indoor desk setup, not road infrastructure. Pothole claim rejected.',
      recommendedAction: 'No civil action required.',
      imageQuality: { isAcceptable: false, isBlurry: false, isTooDark: false, hasRoadVisible: false, qualityScore: 0 },
    });

    const res = await provider.analyzeRoadDamage({
      imageUrl: '/uploads/evidence-1789166147162-4d017a2f.jpg',
      imageFilename: 'IMG_66914.jpg',
      description: 'Critical deep pothole hazard',
      damageTypeHint: 'pothole',
    });

    const req = getReq();
    expect(req).not.toBeNull();
    expect(req!.body.contents[0].parts[1].inlineData.data.length).toBeGreaterThan(100);
    expect(res.damageDetected).toBe(false);
    expect(res.validRoadDamage).toBe(false);
    expect(res.classification).toBe('NON_ROAD_IMAGE');
    expect(res.roadSafetyRisk).toBe(0);
    expect(AIAnalysisOutputSchema.safeParse(res).success).toBe(true);
  });

  // SCENARIO 10: Blurry/unclear road image -> INSUFFICIENT_EVIDENCE
  it('SCENARIO 10: Blurry/unclear road image is classified as INSUFFICIENT_EVIDENCE with risk=0', async () => {
    const getReq = setupMockVision({
      damageDetected: false,
      validRoadDamage: false,
      classification: 'INSUFFICIENT_EVIDENCE',
      damageType: 'INSUFFICIENT_EVIDENCE',
      severity: 'NONE',
      confidence: 0,
      visibleDamage: false,
      roadSafetyRisk: 0,
      description: 'Extreme motion blur and glare prevent verification of pavement surface distress.',
      recommendedAction: 'Re-photograph in daylight with stable focus facing the roadway.',
      cancellationReason: 'Image quality is insufficient to substantiate road distress.',
      imageQuality: { isAcceptable: false, isBlurry: true, isTooDark: false, hasRoadVisible: false, qualityScore: 15 },
    });

    const res = await provider.analyzeRoadDamage({
      imageUrl: '/uploads/blurry_night_obscured_capture.jpg',
      imageFilename: 'IMG_33019.jpg',
      description: 'Pothole at night',
    });

    expect(res.damageDetected).toBe(false);
    expect(res.validRoadDamage).toBe(false);
    expect(res.classification).toBe('INSUFFICIENT_EVIDENCE');
    expect(res.damageType).toBe('INSUFFICIENT_EVIDENCE');
    expect(res.roadSafetyRisk).toBe(0);
    expect(AIAnalysisOutputSchema.safeParse(res).success).toBe(true);
  });
});


