from typing import Optional
from pydantic import BaseModel, ConfigDict

class AnalysisRequestPayload(BaseModel):
    """
    Input schema defining exactly what the API expects from the frontend.
    Enforces valid inputs before hitting the AI Orchestrator.
    """
    project_id: str
    github_url: str
    project_name: str = "Unknown"
    analysis_mode: str = "Fast Mode"  # 'Fast Mode' or 'Deep Mode'
    student_name: Optional[str] = None
    roll_number: Optional[str] = None

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "project_id": "STU_2056",
                "github_url": "https://github.com/student/ecommerce",
                "project_name": "ECommerce API",
                "analysis_mode": "Deep Mode"
            }
        }
    )
