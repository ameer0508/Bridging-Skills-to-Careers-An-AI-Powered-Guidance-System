import uuid
import time
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class Span(BaseModel):
    span_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    trace_id: str
    component: str
    operation: str
    duration_ms: float
    timestamp: float = Field(default_factory=time.time)

class TracingEngine:
    """
    OpenTelemetry-compatible Distributed Tracing Engine tracking requests across Gateway, FeatureStore, & KnowledgeGraph.
    """

    def __init__(self):
        self._spans: List[Span] = []

    def start_trace(self, correlation_id: Optional[str] = None) -> str:
        return correlation_id or f"trace-{str(uuid.uuid4())[:8]}"

    def record_span(self, trace_id: str, component: str, operation: str, duration_ms: float) -> Span:
        span = Span(trace_id=trace_id, component=component, operation=operation, duration_ms=duration_ms)
        self._spans.append(span)
        return span

    def get_trace_spans(self, trace_id: str) -> List[Dict[str, Any]]:
        return [s.model_dump() for s in self._spans if s.trace_id == trace_id]
