import React, { useState, useMemo } from 'react';
import {
  Radio,
  Pause,
  Play,
  Search,
  AlertTriangle,
  CheckCircle2,
  Server,
  RotateCcw,
  Terminal,
  Activity,
} from 'lucide-react';
import { GlassPanel } from '../../components/experience/workspace';
import { WorkspaceHero, AIStatusBar } from '../../components/experience/workspace';
import { useToast } from '../../components/composite/Toast';

export interface EventStreamRecord {
  id: string;
  eventType: string;
  producer: string;
  correlationId: string;
  timestamp: string;
  status: 'DELIVERED' | 'RETRYING' | 'DLQ_ENQUEUED';
  payload: Record<string, unknown>;
}

export const EventMonitoringConsoleWorkspace: React.FC = () => {
  const { addToast } = useToast();

  // State Management
  const [isLiveStreamActive, setIsLiveStreamActive] = useState<boolean>(true);
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [searchCorrelationId, setSearchCorrelationId] = useState<string>('');
  const [selectedEventId, setSelectedEventId] = useState<string>('ev-101');

  // Simulated Domain Event Stream
  const eventsStream: EventStreamRecord[] = useMemo(
    () => [
      {
        id: 'ev-101',
        eventType: 'ResumeParsed',
        producer: 'ResumeParserService',
        correlationId: 'corr-9841-a1',
        timestamp: '20:10:04',
        status: 'DELIVERED',
        payload: { resumeId: 'res-8821', skillsExtracted: ['Python', 'FastAPI', 'Kubernetes'] },
      },
      {
        id: 'ev-102',
        eventType: 'SkillsExtracted',
        producer: 'SkillIntelligenceService',
        correlationId: 'corr-9841-a1',
        timestamp: '20:10:05',
        status: 'DELIVERED',
        payload: { userId: 'usr-104', totalSkills: 18, vectorEmbeddingDim: 1536 },
      },
      {
        id: 'ev-103',
        eventType: 'CareerMatched',
        producer: 'CareerMatchingEngine',
        correlationId: 'corr-9841-a1',
        timestamp: '20:10:06',
        status: 'DELIVERED',
        payload: { targetRole: 'AI Infrastructure Engineer', matchScore: 95.8 },
      },
      {
        id: 'ev-104',
        eventType: 'JobDataUpdated',
        producer: 'ExternalGateway',
        correlationId: 'corr-5512-b2',
        timestamp: '20:09:50',
        status: 'DELIVERED',
        payload: { domain: 'jobs', itemsCount: 142, provider: 'Adzuna' },
      },
      {
        id: 'ev-105',
        eventType: 'MarketTrendUpdated',
        producer: 'MarketIntelligenceEngine',
        correlationId: 'corr-3310-c3',
        timestamp: '20:08:12',
        status: 'DLQ_ENQUEUED',
        payload: { error: 'Timeout waiting for upstream market index sync', attempts: 3 },
      },
    ],
    []
  );

  const consumerServices = [
    { name: 'SkillIntelligenceService', subscribedTo: 'ResumeParsed', status: 'Healthy', latencyMs: 12, processed: 1420 },
    { name: 'CareerMatchingEngine', subscribedTo: 'SkillsExtracted', status: 'Healthy', latencyMs: 18, processed: 1390 },
    { name: 'RecommendationsEngine', subscribedTo: 'CareerMatched', status: 'Healthy', latencyMs: 15, processed: 1380 },
    { name: 'AdaptiveRoadmapBuilder', subscribedTo: 'RecommendationsGenerated', status: 'Healthy', latencyMs: 24, processed: 1250 },
    { name: 'PredictiveAnalyticsEngine', subscribedTo: 'RoadmapUpdated', status: 'Healthy', latencyMs: 30, processed: 1100 },
  ];


  // Filtered Events
  const filteredEvents = useMemo(() => {
    let list = [...eventsStream];
    if (selectedEventType !== 'all') {
      list = list.filter((e) => e.eventType === selectedEventType);
    }
    if (searchCorrelationId.trim()) {
      const q = searchCorrelationId.toLowerCase();
      list = list.filter((e) => e.correlationId.toLowerCase().includes(q) || e.producer.toLowerCase().includes(q));
    }
    return list;
  }, [eventsStream, selectedEventType, searchCorrelationId]);

  // Selected Event Details
  const selectedEvent = useMemo(
    () => eventsStream.find((e) => e.id === selectedEventId) || eventsStream[0],
    [eventsStream, selectedEventId]
  );

  // Replay Failed Event
  const handleReplayEvent = (correlationId: string) => {
    addToast({
      type: 'info',
      message: `Triggering event replay for correlation ID ${correlationId}...`,
    });
    setTimeout(() => {
      addToast({
        type: 'success',
        message: `Replayed event ${correlationId} successfully across 5 subscribers!`,
      });
    }, 1000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 px-4">
      {/* WORKSPACE HERO & PLATFORM STATUS BAR */}
      <WorkspaceHero
        title="SkillBridge Event Bus & Streaming Console"
        subtitle="Real-time domain event stream monitoring, consumer health grids, dead-letter queue inspection, & historical event replay"
        badge="Event Bus Operations"
        badgeColor="indigo"
        metrics={[
          { label: 'Event Throughput', value: '180 req/s', change: '16 Event Types', trend: 'up' },
          { label: 'Avg Dispatch Latency', value: '0.33 ms', change: 'Fanout Delivery', trend: 'up' },
          { label: 'Consumer Services', value: '5 Services', change: '100% Healthy', trend: 'up' },
          { label: 'Dead-Letter Queue', value: '1 DLQ Event', change: 'Replay Ready', trend: 'up' },
        ]}
      />

      {/* STREAM CONTROL TOOLBAR */}
      <GlassPanel className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-aurora-violet/25">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-xl bg-aurora-violet/[0.06] border border-aurora-violet/25 text-aurora-indigo">
            <Radio className="w-5 h-5 animate-pulse" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-aurora-ink">Live Event Streaming Transport</h3>
            <span className="text-[11px] text-aurora-muted">
              Transport: In-Memory / Pluggable Redis Streams • PubSub Fanout Model
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsLiveStreamActive(!isLiveStreamActive)}
            className={`py-2 px-4 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              isLiveStreamActive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50'
            }`}
          >
            {isLiveStreamActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isLiveStreamActive ? 'Live Stream Active' : 'Stream Paused'}</span>
          </button>
        </div>
      </GlassPanel>

      {/* TOP EVENT METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassPanel className="p-4 space-y-2 border-aurora-violet/25">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-aurora-muted uppercase">Total Events Stored</span>
            <Activity className="w-4 h-4 text-aurora-indigo" />
          </div>
          <span className="text-xl font-bold text-aurora-ink block">1,420 Events</span>
          <span className="text-xs text-aurora-indigo">Audited in EventStore</span>
        </GlassPanel>

        <GlassPanel className="p-4 space-y-2 border-emerald-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-aurora-muted uppercase">Subscriber Success</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          </div>
          <span className="text-xl font-bold text-emerald-700 block">99.93% Delivery</span>
          <span className="text-xs text-emerald-700">0 Network Retries</span>
        </GlassPanel>

        <GlassPanel className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-aurora-muted uppercase">Retry Handler</span>
            <RotateCcw className="w-4 h-4 text-aurora-violet" />
          </div>
          <span className="text-xl font-bold text-aurora-ink block">Exponential 1.5x</span>
          <span className="text-xs text-aurora-violet">Max 3 Attempts</span>
        </GlassPanel>

        <GlassPanel className="p-4 space-y-2 border-rose-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-aurora-muted uppercase">Dead-Letter Queue</span>
            <AlertTriangle className="w-4 h-4 text-rose-700" />
          </div>
          <span className="text-xl font-bold text-rose-700 block">1 DLQ Record</span>
          <span className="text-xs text-aurora-muted">Ready for Replay</span>
        </GlassPanel>
      </div>

      {/* FILTER BAR & SEARCH */}
      <GlassPanel className="p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Correlation ID Search */}
          <div className="lg:col-span-6 relative">
            <input
              type="text"
              value={searchCorrelationId}
              onChange={(e) => setSearchCorrelationId(e.target.value)}
              placeholder="Search by correlation ID or producer service..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-aurora-canvas/60 border border-aurora-line text-xs text-aurora-ink placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <Search className="w-4 h-4 text-aurora-muted absolute left-3 top-2.5" />
          </div>

          {/* Event Type Filter */}
          <div className="lg:col-span-6">
            <select
              aria-label="Event type"
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-aurora-canvas/60 border border-aurora-line text-xs text-aurora-ink focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all" className="bg-aurora-canvas text-aurora-ink">All 16 Domain Event Types</option>
              <option value="ResumeParsed" className="bg-aurora-canvas text-aurora-ink">ResumeParsed</option>
              <option value="SkillsExtracted" className="bg-aurora-canvas text-aurora-ink">SkillsExtracted</option>
              <option value="CareerMatched" className="bg-aurora-canvas text-aurora-ink">CareerMatched</option>
              <option value="JobDataUpdated" className="bg-aurora-canvas text-aurora-ink">JobDataUpdated</option>
              <option value="MarketTrendUpdated" className="bg-aurora-canvas text-aurora-ink">MarketTrendUpdated</option>
            </select>
          </div>
        </div>
      </GlassPanel>

      {/* MAIN STREAM & DETAILS (2 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LIVE EVENT STREAM FEED (7 COLS) */}
        <GlassPanel className="lg:col-span-7 p-6 space-y-4 border-aurora-violet/25">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-aurora-ink flex items-center gap-2">
              <Radio className="w-4 h-4 text-aurora-indigo" />
              Live Domain Event Stream Feed ({filteredEvents.length})
            </span>
            <span className="text-[10px] text-aurora-violet font-bold bg-aurora-violet/[0.06] px-2 py-0.5 rounded">
              {isLiveStreamActive ? 'Streaming Live' : 'Paused'}
            </span>
          </div>

          <div className="space-y-3">
            {filteredEvents.map((evt) => {
              const isSelected = selectedEventId === evt.id;
              return (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEventId(evt.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-violet-50 border-indigo-500 shadow-lg shadow-indigo-600/30'
                      : 'bg-aurora-canvas/60 border-aurora-line hover:border-aurora-line'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-aurora-violet/[0.06] border border-aurora-violet/25 text-aurora-indigo text-[10px] font-bold">
                        {evt.eventType}
                      </span>
                      <span className="text-[10px] text-aurora-muted">{evt.producer}</span>
                    </div>

                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                        evt.status === 'DELIVERED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {evt.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-aurora-muted">Correlation ID: <strong className="text-aurora-ink">{evt.correlationId}</strong></span>
                    <span className="text-aurora-muted">{evt.timestamp}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassPanel>

        {/* EVENT DETAILS & PAYLOAD INSPECTOR (5 COLS) */}
        <div className="lg:col-span-5 space-y-6">
          <GlassPanel className="p-6 space-y-4 border-aurora-violet/25">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-aurora-ink flex items-center gap-2">
                <Terminal className="w-4 h-4 text-aurora-violet" />
                Payload & Correlation Inspector
              </span>
              <span className="px-2 py-0.5 rounded bg-aurora-violet/[0.06] text-aurora-violet text-[10px] font-bold">
                {selectedEvent.eventType}
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-aurora-canvas border border-aurora-line space-y-1">
                <span className="text-[9px] text-aurora-muted block uppercase">Event ID</span>
                <span className="text-aurora-ink font-bold">{selectedEvent.id}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-aurora-canvas border border-aurora-line space-y-1">
                <span className="text-[9px] text-aurora-muted block uppercase">Correlation ID</span>
                <span className="text-aurora-violet font-bold">{selectedEvent.correlationId}</span>
              </div>
            </div>

            {/* JSON Payload Display */}
            <div className="space-y-1">
              <span className="text-[10px] text-aurora-muted uppercase">Event Payload Metadata</span>
              <pre className="p-3 rounded-xl bg-aurora-canvas border border-aurora-line text-[11px] text-emerald-700 overflow-x-auto">
                {JSON.stringify(selectedEvent.payload, null, 2)}
              </pre>
            </div>

            {/* Replay Action */}
            <div className="pt-2">
              <button
                onClick={() => handleReplayEvent(selectedEvent.correlationId)}
                className="w-full py-2.5 px-4 rounded-xl [background:var(--aurora-gradient-action)] hover:brightness-110 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Replay Correlation Event Flow</span>
              </button>
            </div>
          </GlassPanel>

          {/* CONSUMER SERVICES HEALTH */}
          <GlassPanel className="p-6 space-y-4">
            <span className="text-xs font-bold text-aurora-ink flex items-center gap-2">
              <Server className="w-4 h-4 text-aurora-violet" />
              Active Subscriber Services ({consumerServices.length})
            </span>

            <div className="space-y-2 text-xs">
              {consumerServices.map((sub, i) => (
                <div key={i} className="p-3 rounded-xl bg-aurora-canvas/60 border border-aurora-line flex items-center justify-between">
                  <div>
                    <span className="font-bold text-aurora-ink block">{sub.name}</span>
                    <span className="text-[10px] text-aurora-muted">Subscribed: {sub.subscribedTo}</span>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-emerald-700 font-bold block">{sub.latencyMs} ms</span>
                    <span className="text-[10px] text-aurora-muted">{sub.processed} Processed</span>
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      </div>

      {/* BOTTOM STATUS BAR */}
      <AIStatusBar
        status="active"
        confidence={99.9}
        lastUpdated="Event Bus Telemetry Live"
      />
    </div>
  );
};

export default EventMonitoringConsoleWorkspace;
