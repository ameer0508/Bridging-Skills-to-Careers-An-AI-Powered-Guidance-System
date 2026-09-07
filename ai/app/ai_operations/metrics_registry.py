from enum import Enum
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional

class MetricType(str, Enum):
    COUNTER = "counter"
    GAUGE = "gauge"
    HISTOGRAM = "histogram"

class MetricDefinition(BaseModel):
    name: str
    metric_type: MetricType
    unit: str
    description: str
