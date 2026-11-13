import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

// Basic liveness/healthcheck for Cloud Run
app.get('/health', (_req, res) => {
  res.status(200).send('OK');
});

// High payload limit for camera photos (Nepali ID documents front and back)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper to extract mimeType and base64 payload
function parseBase64Image(dataUrl: string): { mimeType: string; data: string } {
  const matches = dataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (matches && matches.length === 3) {
    return { mimeType: matches[1], data: matches[2] };
  } else if (dataUrl.includes(',')) {
    return { mimeType: 'image/jpeg', data: dataUrl.split(',')[1] };
  }
  return { mimeType: 'image/jpeg', data: dataUrl };
}

// Comprehensive endpoint for detecting and parsing various Nepalese identification documents (Front and/or Back)
app.post('/api/ocr-id', async (req, res) => {
  const { image, frontImage, backImage } = req.body;
  
  const frontImg = frontImage || image;
  const backImg = backImage;

  if (!frontImg && !backImg) {
    return res.status(400).json({ error: 'At least one image (front or back) is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not defined in server environment');
    return res.status(500).json({ error: 'Server AI configuration missing (GEMINI_API_KEY)' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Prepare multimodal parts for Gemini
    const parts: any[] = [];

    if (frontImg) {
      const parsedFront = parseBase64Image(frontImg);
      parts.push({
        inlineData: {
          mimeType: parsedFront.mimeType,
          data: parsedFront.data,
        },
      });
    }

    if (backImg) {
      const parsedBack = parseBase64Image(backImg);
      parts.push({
        inlineData: {
          mimeType: parsedBack.mimeType,
          data: parsedBack.data,
        },
      });
    }

    const hasBothSides = !!(frontImg && backImg);

    const prompt = `You are an expert Nepalese document analyst and OCR reader specialized in Nepal official identity documents:
${hasBothSides ? 'You have been provided with BOTH the FRONT and BACK sides of the document. Synthesize and cross-correlate information from both sides to form a complete, accurate record.' : 'You have been provided with an image of the document (Front or Back side). Extract all identifiable fields.'}

Supported Nepalese Identity Documents:
1. "citizenship" (नेपाली नागरिकताको प्रमाणपत्र):
   - FRONT side typically contains: नागरिकता नं (Citizenship Certificate No.), पूरा नाम (Nepali & English), जन्म मिति (DOB), बाबुको नाम (Father's Name), पतिको नाम (Husband's Name), जारी मिति र जिल्ला.
   - BACK side or address section typically contains: जन्मस्थान (Birthplace), स्थायी ठेगाना (Permanent Address: प्रदेश, जिल्ला, गा.वि.स. वा नगरपालिका, वडा नं., टोल), जारी गर्ने अधिकारीको दस्तखत र जारी मिति.
2. "national_id" (राष्ट्रिय परिचयपत्र / National Identity Card - NID):
   - Smart card with biometric chip.
   - FRONT side contains: National Identity Number (NIN - 10 digits e.g. 123-456-7890), पूरा नाम थर (Nepali), Full Name (English), बाबु/आमा/पतिको नाम, फोटो, जारी मिति (B.S. & A.D.).
   - BACK side contains: स्थायी ठेगाना (प्रदेश, जिल्ला, स्थानीय तह/न.पा., वडा नं.), आपतकालीन सम्पर्क, बारकोड.
3. "passport" (राहदानी / Nepal Passport):
   - Machine Readable Passport (MRP) or e-Passport.
   - Bio-data page contains: Passport No (Letter + 7-8 digits e.g. PA1234567, 09876543), Surname, Given Names, Nationality, Date of Issue, Place of Issue, Address / Father/Mother/Spouse name on back page.
4. "voter_id" (मतदाता परिचयपत्र / Nepal Election Commission Voter ID):
   - Contains: मतदाता परिचयपत्र नं (Voter ID No.), मतदाताको नाम, बाबु/आमा/पतिको नाम, जिल्ला, स्थानीय तह, वडा नं., मतदान केन्द्र.
5. "driving_license" (सवारी चालक अनुमतिपत्र / Smart Driving License):
   - Contains: License No., Name, Citizenship No., Address, Father/Husband Name, Issue Date.

Task:
Carefully inspect the provided image(s), recognize WHICH type of Nepali ID document it is, and extract all personal identification data.

Extraction Instructions:
- detectedDocType: Exactly one of "citizenship", "national_id", "passport", "voter_id", "driving_license", or "other".
- fullNameNepali: Person's full name in Nepali Devanagari script (e.g. "सरिता थापा", "राम कुमार श्रेष्ठ"). If only English is on document, transliterate or leave empty.
- fullNameEnglish: Person's full name in English / Roman script (e.g. "SARITA THAPA", "RAM KUMAR SHRESTHA").
- grandfatherName: Grandfather's full name (बाजेको नाम e.g. "हर्क बहादुर थापा") - crucial for Nepalese three-generation (३ पुस्ते) legal deeds.
- fatherName: Father's full name (बाबुको नाम e.g. "कर्ण बहादुर थापा").
- spouseName: Spouse's name (पति वा पत्नीको नाम).
- fatherOrHusbandName: Father's or Husband's name as combined/documented on card.
- idType: Map to "citizenship", "national_id", "passport", or "voter_id".
- idNumber: Exact ID card number, Citizenship number, National Identity Number (NIN), or Passport number. Preserve any hyphens or slashes.
- issuedDistrict: District where issued (e.g. "काठमाडौं", "भक्तपुर", "ललितपुर", "मोरङ", "कास्की", "चितवन", etc.) or "परराष्ट्र मन्त्रालय" (MFA).
- issuedDateBS: Date of issue in Bikram Sambat (e.g. "२०७२/०४/१५" or "2072-04-15"). If only A.D. date exists on passport, include that date.
- province: Province name (e.g. "बागमती प्रदेश", "कोशी प्रदेश", "गण्डकी प्रदेश", "मधेश प्रदेश", "लुम्बिनी प्रदेश", "कर्णाली प्रदेश", "सुदूरपश्चिम प्रदेश").
- district: Permanent address district.
- municipality: Municipality / Rural Municipality (गाउँपालिका / नगरपालिका / म.न.पा. / उ.म.न.पा.).
- wardNo: Ward number (e.g. "4", "५", "12").
- tole: Street or village/tole name.
- currentAddress: Temporary address if explicitly stated.

Output only valid JSON according to the schema.`;

    parts.push({ text: prompt });

    const candidateModels = [
      'gemini-3.8-flash',
      'gemini-flash-latest',
      'gemini-3.1-flash-lite',
      'gemini-3.1-pro-preview'
    ];

    let response: any = null;
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts,
            },
          ],
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                detectedDocType: { type: Type.STRING },
                fullNameNepali: { type: Type.STRING },
                fullNameEnglish: { type: Type.STRING },
                grandfatherName: { type: Type.STRING },
                fatherName: { type: Type.STRING },
                spouseName: { type: Type.STRING },
                fatherOrHusbandName: { type: Type.STRING },
                idType: { type: Type.STRING },
                idNumber: { type: Type.STRING },
                issuedDistrict: { type: Type.STRING },
                issuedDateBS: { type: Type.STRING },
                province: { type: Type.STRING },
                district: { type: Type.STRING },
                municipality: { type: Type.STRING },
                wardNo: { type: Type.STRING },
                tole: { type: Type.STRING },
                currentAddress: { type: Type.STRING },
              },
            },
          },
        });

        if (response && response.text) {
          break; // Succeeded!
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${model} encountered an issue (${err?.status || err?.message || 'Error'}). Trying next candidate...`);
        continue;
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error('All OCR models are temporarily busy. Please retry in a few moments.');
    }

    const rawText = response.text?.trim() || '';
    if (!rawText) {
      return res.status(500).json({ error: 'No response from OCR engine' });
    }

    // Strip markdown code fences if present (e.g. ```json ... ```)
    let cleanedText = rawText;
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      cleanedText = jsonMatch[1].trim();
    }

    let data;
    try {
      data = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse JSON output from Gemini:', rawText);
      return res.status(500).json({ error: 'Failed to parse extracted document details' });
    }

    return res.json(data);
  } catch (error: any) {
    console.error('OCR API Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to analyze document' });
  }
});

async function startServer() {
  const distPath = path.resolve(process.cwd(), 'dist');

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // In dev or default mode, check if dist exists or mount vite middlewares
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.warn('Vite middleware could not start, serving static dist instead:', err);
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port} (NODE_ENV: ${process.env.NODE_ENV || 'development'})`);
  });
}

startServer();
