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

// Helper to sanitize base64 data strings
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

// Helper to strip markdown code blocks
function cleanJsonText(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
}

// 1. Comprehensive AI Analysis Endpoint
app.post('/api/ai/analyze', async (req, res) => {
  try {
    const { photoBase64 } = req.body;

    if (!photoBase64) {
      return res.status(400).json({ error: 'Missing photoBase64' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'Gemini API key is not configured in server environment',
      });
    }

    const { data, mimeType } = extractBase64(photoBase64);

    const imagePart = {
      inlineData: {
        mimeType: mimeType || 'image/jpeg',
        data,
      },
    };

    const textPart = {
      text: `Analyze this photo of an urban civic environment in Visakhapatnam (Vizag), India.
Inspect what is shown carefully.
- If it shows a civic infrastructure issue (pothole, drain overflow, sewage, garbage dump, dark/broken streetlight, broken water pipe, illegal trench, etc.):
  1. "situation": Write 2-3 plain sentences describing what is visible in the photo and why it is a problem.
  2. "suggestedType": Pick one from ["Pothole", "Drain / Sewage", "Garbage", "Streetlight", "Water leak", "Other"].
  3. "severity": Rate severity on an integer scale from 1 to 10.
  4. "severityReason": One short sentence on why this score was assigned.
  5. "hazard": One short sentence on the direct risk to pedestrians, cyclists, or motorists.
  6. "department": The most appropriate municipal division (e.g. "Roads & Bridges Department", "Public Health & Sanitation Division", "Electrical & Street Lighting Wing", "Water Supply & Sewerage Board", "Town Planning").
- If the photo does NOT show a civic issue (e.g., a selfie, indoor room, pet, random object):
  1. "situation": State clearly that the photo does not appear to show a public municipal or civic infrastructure issue.
  2. "suggestedType": "Other".
  3. "severity": 1.
  4. "severityReason": "No civic infrastructure defect or hazard detected in photo."
  5. "hazard": "None identified."
  6. "department": "Public Relations / General Administration".

Return JSON only conforming to the schema.`,
    };

    const callGemini = async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: { parts: [imagePart, textPart] },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              situation: {
                type: Type.STRING,
                description: '2-3 plain sentences describing what is visible in the photo and why it is a problem',
              },
              suggestedType: {
                type: Type.STRING,
                description: 'one of Pothole, Drain / Sewage, Garbage, Streetlight, Water leak, Other',
                enum: ['Pothole', 'Drain / Sewage', 'Garbage', 'Streetlight', 'Water leak', 'Other'],
              },
              severity: {
                type: Type.INTEGER,
                description: 'integer 1-10 (set to 1 if not a civic issue)',
              },
              severityReason: {
                type: Type.STRING,
                description: 'one short sentence on severity rating',
              },
              hazard: {
                type: Type.STRING,
                description: 'one short sentence on the risk to people',
              },
              department: {
                type: Type.STRING,
                description: 'most likely municipal department',
              },
            },
            required: [
              'situation',
              'suggestedType',
              'severity',
              'severityReason',
              'hazard',
              'department',
            ],
          },
        },
      });
      return response.text;
    };

    // Try first call, and retry once if it fails or returns malformed text
    let rawText = '';
    try {
      rawText = (await callGemini()) || '';
    } catch (firstErr) {
      console.warn('Gemini analyze attempt 1 failed, retrying once...', firstErr);
      rawText = (await callGemini()) || '';
    }

    if (!rawText) {
      throw new Error('Received empty response from Gemini');
    }

    const cleaned = cleanJsonText(rawText);
    const parsed = JSON.parse(cleaned);

    const validTypes = ['Pothole', 'Drain / Sewage', 'Garbage', 'Streetlight', 'Water leak', 'Other'];
    const suggestedType = validTypes.includes(parsed.suggestedType) ? parsed.suggestedType : 'Other';
    const severity = Math.max(1, Math.min(10, Math.round(Number(parsed.severity) || 5)));

    return res.json({
      situation: parsed.situation || 'Civic issue documented in Visakhapatnam.',
      suggestedType,
      severity,
      severityReason: parsed.severityReason || 'Evaluated via multimodal civic analysis.',
      hazard: parsed.hazard || 'Caution advised in vicinity of incident.',
      department: parsed.department || 'Greater Visakhapatnam Municipal Works',
    });
  } catch (error: any) {
    console.error('Error analyzing photo with Gemini:', error?.message || error);
    return res.status(500).json({
      error: error?.message || 'Failed to complete AI analysis',
    });
  }
});

// Backward compatible endpoint for simple severity
app.post('/api/ai/severity', async (req, res) => {
  try {
    const { photoBase64 } = req.body;
    if (!photoBase64) return res.status(400).json({ error: 'Missing photo' });
    const { data, mimeType } = extractBase64(photoBase64);

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          { inlineData: { mimeType, data } },
          { text: 'Assess civic severity 1-10 with one sentence reason in JSON {severity, reason}.' },
        ],
      },
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(cleanJsonText(response.text || '{}'));
    return res.json({
      severity: Number(parsed.severity) || 5,
      reason: parsed.reason || 'Assessed by Gemini.',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Error' });
  }
});

// 2. AI Fix Check Endpoint
app.post('/api/ai/fix-check', async (req, res) => {
  try {
    const { photoBeforeBase64, photoAfterBase64, issueType } = req.body;

    if (!photoBeforeBase64 || !photoAfterBase64) {
      return res.status(400).json({ error: 'Both photos required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'Gemini API key is not configured' });
    }

    const before = extractBase64(photoBeforeBase64);
    const after = extractBase64(photoAfterBase64);

    const callFixCheck = async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            { inlineData: { mimeType: before.mimeType, data: before.data } },
            { inlineData: { mimeType: after.mimeType, data: after.data } },
            {
              text: `You are an objective municipal civic inspector comparing a BEFORE photo (first image) and an AFTER photo (second image) of a reported civic issue (${issueType || 'civic issue'}) in Visakhapatnam (Vizag), India.
Evaluate whether the issue has been legitimately resolved:
- "fixed": The issue seen in BEFORE is clearly repaired, cleared, resurfaced, or replaced in AFTER.
- "not_fixed": The AFTER photo shows the same scene and the problem remains broken, unrepaired, or inadequate.
- "unsure": The angle, zoom, lighting, or location looks different or ambiguous, so you cannot confidently confirm it is the exact same spot or resolved.

Return JSON with:
- "verdict": one of "fixed", "not_fixed", or "unsure"
- "reason": one short sentence explaining your verdict.`,
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
                description: 'verdict: fixed, not_fixed, or unsure',
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

    let raw = '';
    try {
      raw = (await callFixCheck()) || '';
    } catch (err) {
      console.warn('AI fix check retry attempt...', err);
      raw = (await callFixCheck()) || '';
    }

    const parsed = JSON.parse(cleanJsonText(raw));
    let verdict = String(parsed.verdict).toLowerCase();
    if (verdict !== 'fixed' && verdict !== 'not_fixed' && verdict !== 'unsure') {
      verdict = 'unsure';
    }

    return res.json({
      verdict,
      reason: parsed.reason || 'AI verification check completed.',
    });
  } catch (error: any) {
    console.error('Error during fix check:', error?.message || error);
    return res.status(500).json({
      error: error?.message || 'Failed to verify fix',
    });
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
