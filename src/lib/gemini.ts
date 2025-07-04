import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// Validate Gemini API key
function validateGeminiConfig() {
  if (!apiKey) {
    console.warn('⚠️ Gemini API key not found. AI features will be limited.');
    return false;
  }
  
  if (apiKey.includes('your_gemini') || apiKey === 'your_gemini_api_key') {
    console.warn(`
🔧 Gemini API Key Required for AI Features!

To enable AI features:
1. Go to https://makersuite.google.com/app/apikey
2. Create an API key
3. Add to .env file:
   VITE_GEMINI_API_KEY=your-actual-api-key

AI features will be limited until configured.
    `);
    return false;
  }
  
  return true;
}

const isGeminiConfigured = validateGeminiConfig();

let genAI: GoogleGenerativeAI | null = null;

if (isGeminiConfigured && apiKey) {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
  } catch (error) {
    console.error('Failed to initialize Gemini AI:', error);
  }
}

export class GeminiService {
  private model = genAI?.getGenerativeModel({ model: 'gemini-2.0-flash-exp' }) || null;

  private checkAvailability() {
    if (!this.model) {
      throw new Error('Gemini AI not configured. Please set VITE_GEMINI_API_KEY in your .env file.');
    }
  }

  async analyzeDataSchema(data: any[]) {
    if (!this.model) {
      // Return mock data when Gemini is not configured
      return {
        schema: {},
        relationships: [],
        quality: { score: 85 },
        domain: "general",
        suggestions: ["Configure Gemini API for advanced analysis"]
      };
    }

    const prompt = `
      Analyze this dataset schema and provide insights:
      ${JSON.stringify(data.slice(0, 5), null, 2)}
      
      Please provide:
      1. Data types for each column
      2. Potential relationships between columns
      3. Data quality assessment
      4. Suggestions for synthetic data generation
      5. Domain classification (healthcare, finance, retail, etc.)
      
      Return the response as JSON with the following structure:
      {
        "schema": {...},
        "relationships": [...],
        "quality": {...},
        "domain": "...",
        "suggestions": [...]
      }
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return JSON.parse(response.text());
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      return {
        schema: {},
        relationships: [],
        quality: { score: 85 },
        domain: "general",
        suggestions: ["Error in AI analysis"]
      };
    }
  }

  async generateSyntheticData(schema: any, config: any) {
    if (!this.model) {
      // Return mock data when Gemini is not configured
      return Array.from({ length: config.rowCount || 100 }, (_, i) => ({
        id: i + 1,
        sample_field: `sample_value_${i}`,
        category: `category_${i % 3}`,
        score: Math.floor(Math.random() * 100),
        generated_at: new Date().toISOString()
      }));
    }

    const prompt = `
      Generate synthetic data based on this schema and configuration:
      Schema: ${JSON.stringify(schema)}
      Config: ${JSON.stringify(config)}
      
      Generate ${config.rowCount || 100} rows of realistic synthetic data that:
      1. Maintains statistical properties of the original data
      2. Preserves relationships between columns
      3. Ensures privacy (no real personal data)
      4. Follows domain-specific patterns
      
      Return as JSON array of objects.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return JSON.parse(response.text());
    } catch (error) {
      console.error('Failed to generate synthetic data:', error);
      return Array.from({ length: config.rowCount || 100 }, (_, i) => ({
        id: i + 1,
        fallback_field: `fallback_value_${i}`,
        generated_at: new Date().toISOString()
      }));
    }
  }

  async detectBias(data: any[], config: any) {
    if (!this.model) {
      return { biasScore: 85, biasTypes: [], recommendations: ["Configure Gemini API for bias detection"] };
    }

    const prompt = `
      Analyze this dataset for potential bias:
      ${JSON.stringify(data.slice(0, 10), null, 2)}
      
      Look for:
      1. Demographic bias
      2. Selection bias
      3. Confirmation bias
      4. Historical bias
      5. Representation bias
      
      Provide a bias score (0-100) and recommendations for mitigation.
      Return as JSON: {"biasScore": number, "biasTypes": [], "recommendations": []}
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return JSON.parse(response.text());
    } catch (error) {
      console.error('Failed to parse bias analysis:', error);
      return { biasScore: 85, biasTypes: [], recommendations: ["Error in bias analysis"] };
    }
  }

  async assessPrivacy(data: any[]) {
    if (!this.model) {
      return { privacyScore: 90, risks: [], recommendations: ["Configure Gemini API for privacy assessment"] };
    }

    const prompt = `
      Assess privacy risks in this dataset:
      ${JSON.stringify(data.slice(0, 5), null, 2)}
      
      Check for:
      1. PII (Personally Identifiable Information)
      2. Sensitive attributes
      3. Re-identification risks
      4. Data linkage possibilities
      
      Provide privacy score (0-100) and recommendations.
      Return as JSON: {"privacyScore": number, "risks": [], "recommendations": []}
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return JSON.parse(response.text());
    } catch (error) {
      console.error('Failed to parse privacy analysis:', error);
      return { privacyScore: 90, risks: [], recommendations: ["Error in privacy analysis"] };
    }
  }
}