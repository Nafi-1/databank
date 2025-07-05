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

  async generateSchemaFromNaturalLanguage(
    description: string,
    domain: string = 'general',
    dataType: string = 'tabular'
  ) {
    if (!this.model) {
      // Return mock schema when Gemini is not configured
      return {
        schema: {
          id: { type: 'uuid', description: 'Unique identifier' },
          name: { type: 'string', description: 'Name field', examples: ['John Doe', 'Jane Smith'] },
          value: { type: 'number', description: 'Numeric value', constraints: { min: 1, max: 100 } },
          created_at: { type: 'datetime', description: 'Creation timestamp' }
        },
        detectedDomain: domain,
        suggestions: ["Configure Gemini API for advanced schema generation"]
    const prompt = `
      Based on this natural language description, generate a detailed database schema:
      
      Description: "${description}"
      Domain: ${domain}
      Data Type: ${dataType}
      
      Please analyze the description and create a comprehensive schema that includes:
      
      1. Field names that match the described data
      2. Appropriate data types (string, number, boolean, date, email, phone, etc.)
      3. Constraints where applicable (min/max values, required fields)
      4. Sample values or examples for each field
      5. Relationships between fields if applicable
      6. Domain-specific field suggestions
      
      Return the response as JSON with this exact structure:
      {
        "schema": {
          "field_name": {
            "type": "string|number|boolean|date|datetime|email|phone|uuid|text",
            "description": "Clear description of the field",
            "constraints": {
              "min": number,
              "max": number,
              "required": boolean,
              "unique": boolean
            },
            "examples": ["example1", "example2", "example3"]
          }
        },
        "detectedDomain": "detected_domain_from_description",
        "estimatedRows": number,
        "relationships": ["description of data relationships"],
        "suggestions": ["suggestions for data generation"]
      }
      
      Make sure the schema is realistic and comprehensive for the described use case.
    `;
      };
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      let text = response.text();
      
      // Clean up the response
      if (text.includes('```json')) {
        text = text.split('```json')[1].split('```')[0];
      } else if (text.includes('```')) {
        text = text.split('```')[1];
      }
      
      text = text.trim();
      
      const parsed = JSON.parse(text);
      
      // Validate and enhance the schema
      if (!parsed.schema) {
        throw new Error('Invalid schema format');
      }
      
      return {
        schema: parsed.schema,
        detectedDomain: parsed.detectedDomain || domain,
        estimatedRows: parsed.estimatedRows || 10000,
        relationships: parsed.relationships || [],
        suggestions: parsed.suggestions || []
      };
      
    } catch (error) {
      console.error('Failed to generate schema from natural language:', error);
      
      // Return a basic schema based on common patterns
      return {
        schema: this.generateFallbackSchema(description, domain),
        detectedDomain: domain,
        estimatedRows: 10000,
        relationships: [],
        suggestions: ["Error generating schema - using fallback"]
      };
    }
  }

  private generateFallbackSchema(description: string, domain: string) {
    const commonFields = {
      id: { type: 'uuid', description: 'Unique identifier' },
      created_at: { type: 'datetime', description: 'Creation timestamp' },
      updated_at: { type: 'datetime', description: 'Last update timestamp' }
    };

    // Domain-specific fields
    const domainFields: any = {
      healthcare: {
        patient_id: { type: 'string', description: 'Patient identifier' },
        age: { type: 'number', description: 'Patient age', constraints: { min: 0, max: 120 } },
        gender: { type: 'string', description: 'Patient gender', examples: ['Male', 'Female', 'Other'] },
        diagnosis: { type: 'string', description: 'Medical diagnosis' }
      },
      finance: {
        account_id: { type: 'string', description: 'Account identifier' },
        amount: { type: 'number', description: 'Transaction amount' },
        currency: { type: 'string', description: 'Currency code', examples: ['USD', 'EUR', 'GBP'] },
        transaction_type: { type: 'string', description: 'Type of transaction', examples: ['credit', 'debit'] }
      },
      retail: {
        customer_id: { type: 'string', description: 'Customer identifier' },
        product_name: { type: 'string', description: 'Product name' },
        price: { type: 'number', description: 'Product price', constraints: { min: 0 } },
        category: { type: 'string', description: 'Product category' }
      }
    };
    }
    return {
      ...commonFields,
      ...(domainFields[domain] || {
        name: { type: 'string', description: 'Name field' },
        value: { type: 'number', description: 'Numeric value' },
        status: { type: 'string', description: 'Status field', examples: ['active', 'inactive'] }
      })
    };
  }
}