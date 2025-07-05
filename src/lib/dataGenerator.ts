import { GeminiService } from './gemini';
import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

export class DataGeneratorService {
  private gemini = new GeminiService();

  async processUploadedData(file: File) {
    try {
      const data = await this.parseFile(file);
      const analysis = await this.gemini.analyzeDataSchema(data);
      
      return {
        data,
        analysis,
        schema: this.extractSchema(data),
        statistics: this.calculateStatistics(data)
      };
    } catch (error) {
      console.error('Error processing uploaded data:', error);
      throw error;
    }
  }

  async generateSchemaFromDescription(
    description: string, 
    domain: string, 
    dataType: string
  ) {
    try {
      console.log('Generating schema from description:', { description, domain, dataType });
      
      // Try to use backend API first
      try {
        const schema = await ApiService.generateSchemaFromDescription(description, domain, dataType);
        return schema;
      } catch (backendError) {
        console.log('Backend unavailable, using local Gemini service');
        // Fallback to local Gemini service
        const schema = await this.gemini.generateSchemaFromNaturalLanguage(
          description,
          domain,
          dataType
        );
        
        // Generate sample data based on the schema
        const sampleData = this.generateSampleDataFromSchema(schema.schema || {}, 5);
        
        return {
          ...schema,
          sampleData,
          detectedDomain: schema.detectedDomain || domain
        };
      }
      
    } catch (error) {
      console.error('Error generating schema from description:', error);
      throw error;
    }
  }

  private generateSampleDataFromSchema(schema: any, rowCount: number = 5): any[] {
    const sampleData = [];
    
    for (let i = 0; i < rowCount; i++) {
      const row: any = {};
      
      Object.entries(schema).forEach(([fieldName, fieldInfo]: [string, any]) => {
        row[fieldName] = this.generateSampleValue(fieldInfo, i);
      });
      
      sampleData.push(row);
    }
    
    return sampleData;
  }

  private generateSampleValue(fieldInfo: any, index: number): any {
    const { type, constraints, examples } = fieldInfo;
    
    switch (type) {
      case 'string':
        if (examples && examples.length > 0) {
          return examples[index % examples.length];
        }
        return `sample_${fieldInfo.name || 'value'}_${index + 1}`;
        
      case 'number':
      case 'integer':
        const min = constraints?.min || 1;
        const max = constraints?.max || 100;
        return Math.floor(Math.random() * (max - min + 1)) + min;
        
      case 'boolean':
        return Math.random() > 0.5;
        
      case 'date':
      case 'datetime':
        const now = new Date();
        const randomDays = Math.floor(Math.random() * 365);
        const date = new Date(now.getTime() - randomDays * 24 * 60 * 60 * 1000);
        return type === 'date' ? date.toISOString().split('T')[0] : date.toISOString();
        
      case 'email':
        return `user${index + 1}@example.com`;
        
      case 'phone':
        return `+1-555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
        
      case 'id':
      case 'uuid':
        return uuidv4();
        
      default:
        return `sample_value_${index + 1}`;
    }
  }

  private async parseFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          
          console.log('File content preview:', content.substring(0, 200));
          
          if (file.name.endsWith('.json')) {
            try {
              const jsonData = JSON.parse(content);
              // Ensure we have an array
              if (Array.isArray(jsonData)) {
                resolve(jsonData);
              } else if (jsonData && typeof jsonData === 'object') {
                // If it's an object, wrap it in an array
                resolve([jsonData]);
              } else {
                reject(new Error('JSON file must contain an array of objects or a single object'));
              }
            } catch (jsonError) {
              reject(new Error(`Invalid JSON format: ${jsonError.message}`));
            }
          } else if (file.name.endsWith('.csv')) {
            try {
              const lines = content.split('\n').filter(line => line.trim());
              
              if (lines.length < 2) {
                reject(new Error('CSV file must have at least a header row and one data row'));
                return;
              }
              
              // Handle CSV with potential quotes and commas inside values
              const parseCSVLine = (line: string): string[] => {
                const result = [];
                let current = '';
                let inQuotes = false;
                
                for (let i = 0; i < line.length; i++) {
                  const char = line[i];
                  
                  if (char === '"') {
                    inQuotes = !inQuotes;
                  } else if (char === ',' && !inQuotes) {
                    result.push(current.trim());
                    current = '';
                  } else {
                    current += char;
                  }
                }
                
                result.push(current.trim());
                return result;
              };
              
              const headers = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim());
              
              if (headers.length === 0) {
                reject(new Error('CSV file must have valid headers'));
                return;
              }
              
              const data = [];
              for (let i = 1; i < lines.length; i++) {
                const values = parseCSVLine(lines[i]);
                if (values.length > 0 && values.some(v => v.trim() !== '')) {
                  const row: any = {};
                  headers.forEach((header, index) => {
                    let value = values[index]?.replace(/^"|"$/g, '')?.trim() || '';
                    
                    // Try to convert to appropriate types
                    if (value !== '') {
                      // Check if it's a number
                      if (!isNaN(Number(value)) && value !== '') {
                        row[header] = Number(value);
                      } else if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
                        row[header] = value.toLowerCase() === 'true';
                      } else {
                        row[header] = value;
                      }
                    } else {
                      row[header] = null;
                    }
                  });
                  data.push(row);
                }
              }
              
              if (data.length === 0) {
                reject(new Error('CSV file contains no valid data rows'));
                return;
              }
              
              console.log('Parsed CSV data:', data.slice(0, 3));
              resolve(data);
            } catch (csvError) {
              reject(new Error(`CSV parsing error: ${csvError.message}`));
            }
          } else if (file.name.endsWith('.xlsx')) {
            reject(new Error('Excel files (.xlsx) are not supported yet. Please convert to CSV or JSON format.'));
          } else {
            reject(new Error(`Unsupported file format: ${file.name}. Please use CSV or JSON files.`));
          }
        } catch (error) {
          console.error('File parsing error:', error);
          reject(new Error(`Failed to parse file: ${error.message}`));
        }
      };
      
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        reject(new Error('Failed to read file. Please try again.'));
      };
      
      reader.readAsText(file);
    });
  }

  private extractSchema(data: any[]) {
    if (!data.length) return {};
    
    const sample = data[0];
    const schema: any = {};
    
    Object.keys(sample).forEach(key => {
      const values = data.map(row => row[key]).filter(v => v !== null && v !== undefined);
      const sampleValue = values[0];
      
      if (typeof sampleValue === 'number') {
        schema[key] = { type: 'number', range: this.getNumberRange(values) };
      } else if (this.isDate(sampleValue)) {
        schema[key] = { type: 'date', range: this.getDateRange(values) };
      } else if (typeof sampleValue === 'boolean') {
        schema[key] = { type: 'boolean' };
      } else {
        schema[key] = { 
          type: 'string', 
          categories: this.getUniqueValues(values).slice(0, 10) 
        };
      }
    });
    
    return schema;
  }

  private calculateStatistics(data: any[]) {
    if (!data.length) return {};
    
    const stats: any = {
      rowCount: data.length,
      columnCount: Object.keys(data[0]).length,
      nullValues: 0,
      duplicateRows: 0
    };
    
    // Calculate null values
    data.forEach(row => {
      Object.values(row).forEach(value => {
        if (value === null || value === undefined || value === '') {
          stats.nullValues++;
        }
      });
    });
    
    // Calculate duplicate rows
    const stringifiedRows = data.map(row => JSON.stringify(row));
    const uniqueRows = new Set(stringifiedRows);
    stats.duplicateRows = data.length - uniqueRows.size;
    
    return stats;
  }

  async generateSchemaFromDescription(
    description: string, 
    domain: string, 
    dataType: string
  ) {
    try {
      console.log('Generating schema from description:', { description, domain, dataType });
      
      // Validate inputs
      if (!description || description.trim().length < 10) {
        throw new Error('Description must be at least 10 characters long');
      }
      
      if (!domain || !dataType) {
        throw new Error('Domain and data type must be specified');
      }
      
      // Try to use backend API first
      try {
        console.log('Attempting backend API call...');
        const schema = await ApiService.generateSchemaFromDescription(description, domain, dataType);
        console.log('Backend schema response:', schema);
        
        // Validate the response
        if (!schema || !schema.schema || Object.keys(schema.schema).length === 0) {
          throw new Error('Backend returned empty schema');
        }
        
        return schema;
      } catch (backendError) {
        console.log('Backend unavailable, using local Gemini service:', backendError.message);
        
        // Fallback to local Gemini service
        const schema = await this.gemini.generateSchemaFromNaturalLanguage(
          description,
          domain,
          dataType
        );
        
        console.log('Local Gemini schema response:', schema);
        
        // Validate the response
        if (!schema || !schema.schema || Object.keys(schema.schema).length === 0) {
          throw new Error('Failed to generate valid schema');
        }
        
        // Generate sample data based on the schema
        const sampleData = this.generateSampleDataFromSchema(schema.schema || {}, 5);
        
        return {
          ...schema,
          sampleData,
          detectedDomain: schema.detectedDomain || domain
        };
      }
      
    } catch (error) {
      console.error('Error generating schema from description:', error);
      
      // Provide a more helpful error message
      if (error.message.includes('API key')) {
        throw new Error('AI service not configured. Schema generation requires API setup.');
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection and try again.');
      } else {
        throw new Error(`Schema generation failed: ${error.message}`);
      }
    }
  }

  private getNumberRange(values: number[]) {
    const numbers = values.filter(v => !isNaN(Number(v))).map(Number);
    return {
      min: Math.min(...numbers),
      max: Math.max(...numbers),
      avg: numbers.reduce((a, b) => a + b, 0) / numbers.length
    };
  }

  private getDateRange(values: string[]) {
    const dates = values.map(v => new Date(v)).filter(d => !isNaN(d.getTime()));
    return {
      min: new Date(Math.min(...dates.map(d => d.getTime()))),
      max: new Date(Math.max(...dates.map(d => d.getTime())))
    };
  }

  private getUniqueValues(values: any[]) {
    return [...new Set(values)];
  }

  private isDate(value: any): boolean {
    return !isNaN(Date.parse(value));
  }

  async generateSyntheticDataset(config: any) {
    try {
      // For guests, try local generation first
      if (config.isGuest) {
        try {
          const result = await ApiService.generateLocalData(config);
          return result;
        } catch (backendError) {
          console.log('Backend unavailable, using local generation');
          // Continue with local generation below
        }
      }
      
      // Step 1: Schema Analysis
      const schemaAnalysis = await this.gemini.analyzeDataSchema(config.sourceData || []);
      
      // Step 2: Privacy Assessment
      const privacyAssessment = await this.gemini.assessPrivacy(config.sourceData || []);
      
      // Step 3: Bias Detection
      const biasAnalysis = await this.gemini.detectBias(config.sourceData || [], config);
      
      // Step 4: Generate Synthetic Data
      let syntheticData;
      
      if (config.schema && Object.keys(config.schema).length > 0) {
        // Use provided schema for generation
        syntheticData = await this.gemini.generateSyntheticDataFromSchema(config.schema, config, config.description || '');
      } else {
        // Use analyzed schema
        syntheticData = await this.gemini.generateSyntheticData(schemaAnalysis?.schema || {}, config);
      }
      
      // Step 5: Quality Assessment
      const qualityScore = this.assessDataQuality(syntheticData, config.sourceData || []);
      
      return {
        data: syntheticData,
        qualityScore,
        privacyScore: privacyAssessment.privacyScore,
        biasScore: biasAnalysis.biasScore,
        metadata: {
          rowsGenerated: syntheticData.length,
          columnsGenerated: Object.keys(syntheticData[0] || {}).length,
          generationTime: new Date().toISOString(),
          config
        }
      };
    } catch (error) {
      console.error('Error generating synthetic dataset:', error);
      throw error;
    }
  }

  private assessDataQuality(syntheticData: any[], originalData: any[]) {
    // Implement quality scoring algorithm
    let score = 100;
    
    // Check for null values
    const nullCount = syntheticData.reduce((count, row) => {
      return count + Object.values(row).filter(v => v === null || v === undefined).length;
    }, 0);
    
    if (nullCount > 0) {
      score -= Math.min(20, (nullCount / (syntheticData.length * Object.keys(syntheticData[0] || {}).length)) * 100);
    }
    
    // Check for data consistency
    if (syntheticData.length === 0) {
      score = 0;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  async exportData(data: any[], format: 'csv' | 'json' | 'excel') {
    switch (format) {
      case 'csv':
        return this.exportToCSV(data);
      case 'json':
        return this.exportToJSON(data);
      case 'excel':
        return this.exportToExcel(data);
      default:
        throw new Error('Unsupported export format');
    }
  }

  private exportToCSV(data: any[]) {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => 
          typeof row[header] === 'string' && row[header].includes(',') 
            ? `"${row[header]}"` 
            : row[header]
        ).join(',')
      )
    ].join('\n');
    
    return csvContent;
  }

  private exportToJSON(data: any[]) {
    return JSON.stringify(data, null, 2);
  }

  private exportToExcel(data: any[]) {
    // This would require additional Excel library implementation
    // For now, return CSV format
    return this.exportToCSV(data);
  }
}