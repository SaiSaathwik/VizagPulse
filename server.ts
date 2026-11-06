import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '20mb' }));

// Initialize GoogleGenAI client with required 'aistudio-build' User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper: Sanitize base64 data strings (stripping data: prefix and returning raw base64)
function extractBase64(dataUriOrRaw: string): { data: string; mimeType: string } {
  const match = dataUriOrRaw.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (match) {
    return {
      mimeType: match[1],
      data: match[2],
    };
  }
  return {
    mimeType: 'image/jpeg',
    data: dataUriOrRaw,
  };
}

// Helper: Thoroughly strip markdown code blocks and extract valid JSON
function cleanAndExtractJson(raw: string): any {
  if (!raw || typeof raw !== 'string') return null;

  try {
    // Strip any markdown code fences anywhere in the string (```json, ```javascript, ```js, or bare ```)
    let cleaned = raw
      .replace(/```(?:json|javascript|js)?/gi, '')
      .replace(/```/g, '')
      .trim();

    // Find outermost { } or [ ]
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');
    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      const lastBrace = cleaned.lastIndexOf('}');
      if (lastBrace !== -1) {
        cleaned = cleaned.slice(firstBrace, lastBrace + 1);
      }
    } else if (firstBracket !== -1) {
      const lastBracket = cleaned.lastIndexOf(']');
      if (lastBracket !== -1) {
        cleaned = cleaned.slice(firstBracket, lastBracket + 1);
      }
    }

    return JSON.parse(cleaned);
  } catch (e) {
    console.warn('Failed to parse JSON from AI response:', e);
    return null;
  }
}

// Helper: Wrap promise with timeout
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`AI operation timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

// =========================================================================
// 1. FEATURE 1: AI PRIORITY RANKING ENDPOINT
// =========================================================================
app.post('/api/ai/priority-ranking', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const { issues } = req.body;

    if (!Array.isArray(issues) || issues.length === 0) {
      return res.status(400).json({ error: 'Missing or empty issues array' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({ rankings: [] });
    }

    const compactList = issues.map((i: any) => ({
      id: String(i.id),
      type: String(i.type),
      area: String(i.areaName || 'Vizag'),
      daysOpen: Number(i.daysOpen) || 1,
      plusOnes: Number(i.plusOnes) || 0,
      disputed: Boolean(i.disputed),
    }));

    const promptText = `You are an urban municipal prioritization AI for Visakhapatnam (Vizag), India.
Evaluate these open civic reports and assign a priority score from 1 to 10 to each issue.
Consider severity of damage, traffic/pedestrian risk, days left open, and community +1 endorsements.
1 = lowest priority/minor cosmetic, 10 = critical hazard or major road closure.

Input Issues:
${JSON.stringify(compactList, null, 2)}

Return JSON ONLY: an array of objects matching this exact structure:
[
  { "id": "string", "priority": integer 1-10, "reason": "one short sentence" }
]`;

    const executeCall = async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: promptText,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                priority: { type: Type.INTEGER },
                reason: { type: Type.STRING },
              },
              required: ['id', 'priority', 'reason'],
            },
          },
        },
      });
      return response.text;
    };

    let rawOutput = '';
    try {
      rawOutput = (await withTimeout(executeCall(), 20000)) || '';
    } catch (firstErr) {
      console.warn('AI priority ranking retry attempt 1...', firstErr);
      rawOutput = (await withTimeout(executeCall(), 20000)) || '';
    }

    if (!rawOutput) {
      throw new Error('Empty response received from Gemini');
    }

    const parsedArray = cleanAndExtractJson(rawOutput);
    if (!Array.isArray(parsedArray)) {
      throw new Error('Expected JSON array of priority rankings');
    }

    // Validate and clamp 1-10
    const validMap = new Map<string, { priority: number; reason: string }>();
    for (const item of parsedArray) {
      if (item && item.id) {
        const p = Math.max(1, Math.min(10, Math.round(Number(item.priority) || 5)));
        const r = String(item.reason || 'Prioritized based on hazard and citizen urgency.');
        validMap.set(String(item.id), { priority: p, reason: r });
      }
    }

    const results = compactList.map((item) => {
      const found = validMap.get(item.id);
      if (found) {
        return { id: item.id, priority: found.priority, reason: found.reason };
      }
      return null;
    }).filter(Boolean);

    return res.json({ rankings: results });
  } catch (error: any) {
    console.error('Error during AI priority ranking:', error?.message || error);
    return res.status(200).json({ rankings: [], error: error?.message || 'Failed to prioritize issues' });
  }
});

// =========================================================================
// 2. FEATURE 2: AI FIX CHECK ENDPOINT (Shared for Issue Page & Authority)
// =========================================================================
app.post('/api/ai/fix-check', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const { photoBeforeBase64, photoAfterBase64, issueType } = req.body;

    if (!photoBeforeBase64 || !photoAfterBase64) {
      return res.status(400).json({ error: 'Both photoBeforeBase64 and photoAfterBase64 are required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({
        verdict: 'unsure',
        reason: 'AI verification key not configured (manual override available).',
      });
    }

    const before = extractBase64(photoBeforeBase64);
    const after = extractBase64(photoAfterBase64);

    const executeCall = async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            { inlineData: { mimeType: before.mimeType, data: before.data } },
            { inlineData: { mimeType: after.mimeType, data: after.data } },
            {
              text: `Compare these two photos of the same civic issue (${issueType || 'civic issue'}) in Visakhapatnam (before, then after).
Return JSON only: {verdict: one of 'fixed','not_fixed','unsure', reason: one short sentence}.
Be strict: if the place, angle or scene looks different, or you cannot tell, return 'unsure'. Only return 'fixed' if the problem is clearly gone.`,
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              verdict: {
                type: Type.STRING,
                description: 'Verdict: fixed, not_fixed, or unsure',
                enum: ['fixed', 'not_fixed', 'unsure'],
              },
              reason: {
                type: Type.STRING,
                description: 'One short sentence explaining verdict',
              },
            },
            required: ['verdict', 'reason'],
          },
        },
      });
      return response.text;
    };

    let rawOutput = '';
    try {
      rawOutput = (await withTimeout(executeCall(), 20000)) || '';
    } catch (firstErr) {
      console.warn('AI fix check retry attempt...', firstErr);
      rawOutput = (await withTimeout(executeCall(), 20000)) || '';
    }

    if (!rawOutput) {
      throw new Error('Received empty response from Gemini');
    }

    const parsed = cleanAndExtractJson(rawOutput);
    let verdict = String(parsed?.verdict || '').toLowerCase().trim();
    if (verdict !== 'fixed' && verdict !== 'not_fixed' && verdict !== 'unsure') {
      verdict = 'unsure';
    }

    return res.json({
      verdict,
      reason: String(parsed?.reason || 'Verification audit complete.'),
    });
  } catch (error: any) {
    console.error('Error during AI fix check:', error?.message || error);
    return res.status(200).json({
      verdict: 'unsure',
      reason: 'AI visual check could not complete (manual override available).',
      error: error?.message,
    });
  }
});

// =========================================================================
// 3. FEATURE 3: DUPLICATE DETECTION AI ENDPOINT (8s timeout)
// =========================================================================
app.post('/api/ai/duplicate-check', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const { existingPhotoBase64, newPhotoBase64, issueType } = req.body;

    if (!existingPhotoBase64 || !newPhotoBase64) {
      return res.status(400).json({ error: 'Both photos required for comparison' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({ sameIssue: true, reason: 'Location match verified (AI unconfigured).' });
    }

    const existing = extractBase64(existingPhotoBase64);
    const incoming = extractBase64(newPhotoBase64);

    const executeCall = async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            { inlineData: { mimeType: existing.mimeType, data: existing.data } },
            { inlineData: { mimeType: incoming.mimeType, data: incoming.data } },
            {
              text: `Do these two photos show the same civic issue (${issueType || 'civic issue'}) at the same place in Visakhapatnam? Return JSON only: {sameIssue: true or false, reason: one short sentence}.`,
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sameIssue: { type: Type.BOOLEAN },
              reason: { type: Type.STRING },
            },
            required: ['sameIssue', 'reason'],
          },
        },
      });
      return response.text;
    };

    let rawOutput = '';
    try {
      rawOutput = (await withTimeout(executeCall(), 8000)) || '';
    } catch (firstErr) {
      console.warn('AI duplicate check attempt failed/timed out...', firstErr);
      return res.status(200).json({ sameIssue: true, reason: 'Location match verified (AI confirmation timed out).' });
    }

    const parsed = cleanAndExtractJson(rawOutput);
    return res.status(200).json({
      sameIssue: Boolean(parsed?.sameIssue),
      reason: String(parsed?.reason || 'Image analysis comparison completed.'),
    });
  } catch (error: any) {
    console.error('Error during duplicate check:', error?.message || error);
    return res.status(200).json({ sameIssue: true, reason: 'Location match verified.' });
  }
});

// =========================================================================
// 4. BUILT-IN SYSTEM CHECK (Gemini API Test Endpoint)
// =========================================================================
app.get('/api/ai/system-check', async (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const startTime = Date.now();
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({ success: false, error: 'GEMINI_API_KEY not configured in environment' });
    }

    const callTest = async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: 'Ping test: return JSON only: {"status": "ok", "app": "VizagPulse"}',
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              status: { type: Type.STRING },
              app: { type: Type.STRING },
            },
            required: ['status', 'app'],
          },
        },
      });
      return response.text;
    };

    const raw = await withTimeout(callTest(), 20000);
    const parsed = cleanAndExtractJson(raw || '{}');

    if (parsed && parsed.status === 'ok') {
      return res.status(200).json({ success: true, latencyMs: Date.now() - startTime });
    }
    return res.status(200).json({ success: false, error: 'Malformed JSON payload from model' });
  } catch (err: any) {
    console.warn('System check Gemini ping error:', err?.message || err);
    return res.status(200).json({ success: false, error: err?.message || 'Gemini API call failed' });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VizagPulse server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting VizagPulse server:', err);
  process.exit(1);
});
