export interface CareerMatchItem {
  careerId?: {
    _id: string;
    title: string;
    description?: string;
    category?: string;
  };
  matchScore: number;
  matchingSkills?: string[];
  missingSkills?: string[];
  confidence?: number;
}

export interface ReadinessItem {
  overallScore: number;
  readinessTier: string;
}

export interface RecommendationItem {
  _id?: string;
  title: string;
  category: string;
  priority: 'high' | 'medium' | 'critical' | 'low';
  reason?: string;
  impact?: number;
  estimatedTime?: string;
  status?: string;
}

export interface RoadmapPhaseItem {
  title: string;
  status: string;
}

export interface RoadmapPhase {
  title: string;
  description?: string;
  items?: RoadmapPhaseItem[];
}

export interface RoadmapData {
  progressPercentage: number;
  phases?: RoadmapPhase[];
}

export interface SessionTelemetry {
  lastReadinessScore: number;
  completedTaskCount: number;
  targetRoleTitle?: string;
  lastSessionTimestamp: number;
}
