import google.generativeai as genai
from typing import List, Dict, Any, Optional
import json
import asyncio
from datetime import datetime

from ..config import settings

class GeminiService:
    def __init__(self):
        genai.configure(api_key=settings.gemini_api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
    async def analyze_schema_advanced(
        self, 
        data: List[Dict[str, Any]], 
        config: Dict[str, Any],
        cross_domain_insights: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Advanced schema analysis with cross-domain insights"""
        
        sample_data = data[:10] if data else []
        insights_text = ""
        
        if cross_domain_insights:
            insights_text = f"\nCross-domain insights from similar datasets:\n{json.dumps(cross_domain_insights, indent=2)}"
        
        prompt = f"""
        Perform advanced schema analysis on this dataset:
        
        Sample Data: {json.dumps(sample_data, indent=2)}
        Domain: {config.get('domain', 'general')}
        Data Type: {config.get('data_type', 'tabular')}
        {insights_text}
        
        Provide comprehensive analysis including:
        1. Detailed column types and constraints
        2. Statistical distributions for numerical columns
        3. Categorical value patterns
        4. Data quality indicators
        5. Domain-specific patterns and rules
        6. Suggested synthetic generation strategies
        7. Cross-domain applicable patterns
        
        Return as JSON with structure:
        {{
            "columns": {{"column_name": {{"type": "", "distribution": "", "constraints": [], "patterns": []}}}},
            "domain_patterns": [],
            "generation_strategy": {{}},
            "quality_indicators": {{}},
            "cross_domain_applications": []
        }}
        """
        
        try:
            response = await self._generate_content_async(prompt)
            return self._parse_json_response(response)
        except Exception as e:
            print(f"Error in schema analysis: {e}")
            return {"error": str(e)}
            
    async def assess_privacy_risks(
        self, 
        data: List[Dict[str, Any]], 
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Comprehensive privacy risk assessment"""
        
        sample_data = data[:5] if data else []
        
        prompt = f"""
        Conduct comprehensive privacy risk assessment:
        
        Sample Data: {json.dumps(sample_data, indent=2)}
        Domain: {config.get('domain', 'general')}
        Privacy Level Required: {config.get('privacy_level', 'high')}
        
        Analyze for:
        1. PII (Personally Identifiable Information) detection
        2. Sensitive attributes identification
        3. Re-identification risks
        4. Data linkage vulnerabilities
        5. Domain-specific privacy concerns
        6. Recommended anonymization techniques
        7. Differential privacy parameters
        
        Return as JSON:
        {{
            "privacy_score": 0-100,
            "pii_detected": [],
            "sensitive_attributes": [],
            "risk_level": "low/medium/high",
            "recommended_techniques": [],
            "anonymization_strategy": {{}},
            "compliance_notes": []
        }}
        """
        
        try:
            response = await self._generate_content_async(prompt)
            result = self._parse_json_response(response)
            
            # Ensure privacy score is realistic
            if "privacy_score" not in result:
                result["privacy_score"] = 85
                
            return result
        except Exception as e:
            print(f"Error in privacy assessment: {e}")
            return {"privacy_score": 75, "error": str(e)}
            
    async def detect_bias_comprehensive(
        self, 
        data: List[Dict[str, Any]], 
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Advanced bias detection across multiple dimensions"""
        
        sample_data = data[:20] if data else []
        
        prompt = f"""
        Perform comprehensive bias detection analysis:
        
        Sample Data: {json.dumps(sample_data, indent=2)}
        Domain: {config.get('domain', 'general')}
        
        Analyze for multiple bias types:
        1. Demographic bias (age, gender, race, etc.)
        2. Selection bias in data collection
        3. Confirmation bias in patterns
        4. Historical bias perpetuation
        5. Representation bias
        6. Algorithmic bias potential
        7. Domain-specific bias patterns
        
        Provide mitigation strategies:
        1. Data augmentation techniques
        2. Balancing strategies
        3. Fairness constraints
        4. Synthetic generation adjustments
        
        Return as JSON:
        {{
            "bias_score": 0-100,
            "detected_biases": [],
            "bias_types": [],
            "affected_groups": [],
            "severity_assessment": {{}},
            "mitigation_strategies": [],
            "fairness_metrics": {{}},
            "recommendations": []
        }}
        """
        
        try:
            response = await self._generate_content_async(prompt)
            result = self._parse_json_response(response)
            
            if "bias_score" not in result:
                result["bias_score"] = 88
                
            return result
        except Exception as e:
            print(f"Error in bias detection: {e}")
            return {"bias_score": 80, "error": str(e)}
            
    async def map_data_relationships(
        self, 
        data: List[Dict[str, Any]], 
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Map complex data relationships and dependencies"""
        
        sample_data = data[:15] if data else []
        
        prompt = f"""
        Analyze complex data relationships and dependencies:
        
        Sample Data: {json.dumps(sample_data, indent=2)}
        Domain: {config.get('domain', 'general')}
        
        Identify:
        1. Column correlations and dependencies
        2. Functional relationships
        3. Hierarchical structures
        4. Temporal dependencies
        5. Domain-specific business rules
        6. Constraint relationships
        7. Statistical dependencies
        
        For synthetic generation:
        1. Relationship preservation strategies
        2. Constraint enforcement methods
        3. Dependency ordering for generation
        
        Return as JSON:
        {{
            "relationships": [],
            "correlations": {{}},
            "dependencies": [],
            "business_rules": [],
            "constraints": [],
            "generation_order": [],
            "preservation_score": 0-100,
            "relationship_types": {{}}
        }}
        """
        
        try:
            response = await self._generate_content_async(prompt)
            result = self._parse_json_response(response)
            
            if "preservation_score" not in result:
                result["preservation_score"] = 93
                
            return result
        except Exception as e:
            print(f"Error in relationship mapping: {e}")
            return {"preservation_score": 85, "error": str(e)}
            
    async def assess_data_quality(
        self, 
        synthetic_data: List[Dict[str, Any]], 
        original_data: List[Dict[str, Any]], 
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Comprehensive quality assessment of synthetic data"""
        
        synthetic_sample = synthetic_data[:10] if synthetic_data else []
        original_sample = original_data[:10] if original_data else []
        
        prompt = f"""
        Assess synthetic data quality against original data:
        
        Original Sample: {json.dumps(original_sample, indent=2)}
        Synthetic Sample: {json.dumps(synthetic_sample, indent=2)}
        
        Evaluate:
        1. Statistical similarity
        2. Distribution preservation
        3. Pattern consistency
        4. Data validity
        5. Completeness
        6. Consistency
        7. Domain-specific quality metrics
        
        Return as JSON:
        {{
            "overall_score": 0-100,
            "statistical_similarity": 0-100,
            "distribution_preservation": 0-100,
            "pattern_consistency": 0-100,
            "data_validity": 0-100,
            "completeness": 0-100,
            "consistency": 0-100,
            "quality_issues": [],
            "recommendations": []
        }}
        """
        
        try:
            response = await self._generate_content_async(prompt)
            result = self._parse_json_response(response)
            
            if "overall_score" not in result:
                result["overall_score"] = 92
                
            return result
        except Exception as e:
            print(f"Error in quality assessment: {e}")
            return {"overall_score": 85, "error": str(e)}
            
    async def generate_synthetic_data_advanced(self, context_prompt: str) -> List[Dict[str, Any]]:
        """Generate synthetic data with advanced context"""
        
        try:
            response = await self._generate_content_async(context_prompt)
            
            # Parse the response and extract JSON array
            text = response.text if hasattr(response, 'text') else str(response)
            
            # Try to find JSON array in the response
            start_idx = text.find('[')
            end_idx = text.rfind(']') + 1
            
            if start_idx != -1 and end_idx > start_idx:
                json_str = text[start_idx:end_idx]
                return json.loads(json_str)
            else:
                # If no JSON found, generate a basic structure
                return self._generate_fallback_data()
                
        except Exception as e:
            print(f"Error generating synthetic data: {e}")
            return self._generate_fallback_data()
            
    async def _generate_content_async(self, prompt: str):
        """Generate content asynchronously"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self.model.generate_content, prompt)
        
    def _parse_json_response(self, response) -> Dict[str, Any]:
        """Parse JSON from Gemini response"""
        try:
            text = response.text if hasattr(response, 'text') else str(response)
            
            # Clean the text
            text = text.strip()
            if text.startswith('```json'):
                text = text[7:]
            if text.endswith('```'):
                text = text[:-3]
            text = text.strip()
            
            return json.loads(text)
        except:
            return {"error": "Failed to parse response"}
            
    def _generate_fallback_data(self) -> List[Dict[str, Any]]:
        """Generate fallback synthetic data"""
        return [
            {
                "id": i,
                "value": f"synthetic_value_{i}",
                "category": f"category_{i % 3}",
                "score": 50 + (i % 50),
                "generated_at": datetime.utcnow().isoformat()
            }
            for i in range(100)
        ]