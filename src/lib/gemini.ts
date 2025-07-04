import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('Missing Gemini API key');
}

const genAI = new GoogleGenerativeAI(apiKey);

export class GeminiService {
  private model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  async analyzeDataSchema(data: any[]) {
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

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    
    try {
      return JSON.parse(response.text());
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      return null;
    }
  }

  async generateSyntheticData(schema: any, config: any) {
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

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    
    try {
      return JSON.parse(response.text());
    } catch (error) {
      console.error('Failed to parse synthetic data:', error);
      return [];
    }
  }

  async detectBias(data: any[], config: any) {
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

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    
    try {
      return JSON.parse(response.text());
    } catch (error) {
      console.error('Failed to parse bias analysis:', error);
      return { biasScore: 0, biasTypes: [], recommendations: [] };
    }
  }

  async assessPrivacy(data: any[]) {
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

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    
    try {
      return JSON.parse(response.text());
    } catch (error) {
      console.error('Failed to parse privacy analysis:', error);
      return { privacyScore: 100, risks: [], recommendations: [] };
    }
  }
}