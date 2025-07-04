from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from datetime import datetime

class GenerationRequest(BaseModel):
    project_id: Optional[str] = None
    domain: str
    data_type: str  # tabular, timeseries, text, image
    source_data: List[Dict[str, Any]] = []
    config: Dict[str, Any] = {}
    
    class Config:
        schema_extra = {
            "example": {
                "domain": "healthcare",
                "data_type": "tabular",
                "source_data": [
                    {"patient_id": "P001", "age": 45, "diagnosis": "diabetes"},
                    {"patient_id": "P002", "age": 32, "diagnosis": "hypertension"}
                ],
                "config": {
                    "row_count": 10000,
                    "privacy_level": "maximum",
                    "quality_level": "high"
                }
            }
        }

class GenerationResponse(BaseModel):
    job_id: str
    status: str
    message: str
    estimated_completion: Optional[datetime] = None
    
class GenerationStatus(BaseModel):
    job_id: str
    status: str  # pending, running, completed, failed, cancelled
    progress: int  # 0-100
    message: str
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    result: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None

class DataAnalysisRequest(BaseModel):
    sample_data: List[Dict[str, Any]]
    config: Dict[str, Any] = {}
    
class DataAnalysisResponse(BaseModel):
    analysis: Dict[str, Any]
    recommendations: Dict[str, Any]
    estimated_time: str
    quality_score: float