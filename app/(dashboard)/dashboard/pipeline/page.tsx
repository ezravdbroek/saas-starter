'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Filter,
  ChevronDown,
  Clock,
  MapPin,
  Plus,
  GripVertical,
  Loader2,
  X,
} from 'lucide-react';
import {
  getPipelineData,
  getPipelinePageData,
  moveCandidate,
  type PipelineData,
} from '@/lib/actions/pipeline';
import { useTeamChannel } from '@/lib/pusher/use-team-channel';
import { EVENTS } from '@/lib/pusher/events';
import { getTeamIdForClient } from '@/lib/actions/team';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Stage =
  | 'applied'
  | 'screening'
  | 'interview'
  | 'assessment'
  | 'offer'
  | 'hired';

type PipelineApplication = PipelineData[Stage][number];

type StageConfig = {
  id: Stage;
  label: string;
  color: string;
  bgTint: string;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STAGES: StageConfig[] = [
  { id: 'applied', label: 'Aangemeld', color: '#3b82f6', bgTint: 'bg-blue-50/60' },
  { id: 'screening', label: 'Screening', color: '#f59e0b', bgTint: 'bg-amber-50/60' },
  { id: 'interview', label: 'Interview', color: '#f97316', bgTint: 'bg-orange-50/60' },
  { id: 'assessment', label: 'Assessment', color: '#8b5cf6', bgTint: 'bg-violet-50/60' },
  { id: 'offer', label: 'Aanbieding', color: '#10b981', bgTint: 'bg-emerald-50/60' },
  { id: 'hired', label: 'Aangenomen', color: '#059669', bgTint: 'bg-green-50/60' },
];

const STAGE_BORDER_CLASSES: Record<Stage, string> = {
  applied: 'border-t-blue-500',
  screening: 'border-t-amber-500',
  interview: 'border-t-orange-500',
  assessment: 'border-t-violet-500',
  offer: 'border-t-emerald-500',
  hired: 'border-t-green-600',
};

const STAGE_DOT_CLASSES: Record<Stage, string> = {
  applied: 'bg-blue-500',
  screening: 'bg-amber-500',
  interview: 'bg-orange-500',
  assessment: 'bg-violet-500',
  offer: 'bg-emerald-500',
  hired: 'bg-green-600',
};

const STAGE_DRAG_CLASSES: Record<Stage, string> = {
  applied: 'ring-blue-400/50 bg-blue-50/80',
  screening: 'ring-amber-400/50 bg-amber-50/80',
  interview: 'ring-orange-400/50 bg-orange-50/80',
  assessment: 'ring-violet-400/50 bg-violet-50/80',
  offer: 'ring-emerald-400/50 bg-emerald-50/80',
  hired: 'ring-green-500/50 bg-green-50/80',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function getDaysInStage(stageMovedAt: Date | string): number {
  const moved = new Date(stageMovedAt);
  const now = new Date();
  const diff = now.getTime() - moved.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function formatDays(days: number): string {
  if (days === 0) return 'Vandaag';
  if (days === 1) return '1 dag';
  return `${days} dagen`;
}

function matchesSearch(app: PipelineApplication, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  const fullName =
    `${app.candidate.firstName} ${app.candidate.lastName}`.toLowerCase();
  return (
    fullName.includes(q) ||
    (app.candidate.currentTitle?.toLowerCase().includes(q) ?? false) ||
    app.candidate.email.toLowerCase().includes(q) ||
    app.job.title.toLowerCase().includes(q)
  );
}

function matchesSource(app: PipelineApplication, source: string): boolean {
  if (!source) return true;
  return app.candidate.source === source;
}

// ---------------------------------------------------------------------------
// CandidateCard
// ---------------------------------------------------------------------------

function CandidateCard({
  app,
  onDragStart,
  onDragEnd,
  isDragging,
}: {
  app: PipelineApplication;
  onDragStart: (e: React.DragEvent, appId: number) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}) {
  const router = useRouter();
  const days = getDaysInStage(app.stageMovedAt);
  const initials = getInitials(app.candidate.firstName, app.candidate.lastName);

  let tags: string[] = [];
  try {
    const parsed = JSON.parse((app as unknown as Record<string, string>).tags || '[]');
    if (Array.isArray(parsed)) tags = parsed;
  } catch {
    // no tags
  }

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, app.id)}
      onDragEnd={onDragEnd}
      onClick={() => router.push(`/dashboard/candidates/${app.candidate.id}`)}
      className={`group relative bg-white rounded-[10px] border border-gray-200/80 p-3.5 transition-all duration-200 select-none
        ${isDragging ? 'opacity-40 scale-[0.97] rotate-[1deg] shadow-lg' : 'opacity-100'}
        hover:border-orange-300 hover:shadow-[0_3px_12px_rgba(249,115,22,0.08)]
        cursor-grab active:cursor-grabbing`}
    >
      {/* Drag grip indicator */}
      <div className="absolute top-3 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <GripVertical className="h-3.5 w-3.5 text-gray-300" />
      </div>

      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-[0_1px_4px_rgba(249,115,22,0.25)]">
          <span className="text-[11px] font-bold text-white leading-none">
            {initials}
          </span>
        </div>

        <div className="flex-1 min-w-0 pr-3">
          <p className="text-[13px] font-semibold text-gray-900 truncate leading-tight">
            {app.candidate.firstName} {app.candidate.lastName}
          </p>
          <p className="text-[12px] text-gray-500 mt-0.5 truncate">
            {app.candidate.currentTitle || app.job.title}
          </p>
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 mt-2.5 text-[11px] text-gray-400">
        <span className="inline-flex items-center gap-1">
          <Clock className="w-[11px] h-[11px]" />
          {formatDays(days)}
        </span>
        {app.candidate.location && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-[11px] h-[11px]" />
            {app.candidate.location}
          </span>
        )}
        <span className="text-gray-300">{app.candidate.source}</span>
      </div>

      {/* Job badge */}
      <div className="mt-2.5">
        <span className="inline-block text-[10px] font-medium text-orange-600/80 bg-orange-50 border border-orange-100 rounded-full px-2 py-[2px] truncate max-w-full">
          {app.job.title}
        </span>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex gap-1.5 mt-2">
          {tags.map((tag: string) => (
            <span
              key={tag}
              className={`text-[10px] font-medium px-2 py-[1px] rounded-full
                ${
                  tag === 'Top'
                    ? 'bg-orange-50 text-orange-600 border border-orange-200'
                    : 'bg-gray-100 text-gray-500'
                }`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// EmptyColumn
// ---------------------------------------------------------------------------

function EmptyColumn({ stage }: { stage: StageConfig }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <div
        className="w-10 h-10 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center mb-2"
      >
        <Plus className="w-4 h-4 text-gray-300" />
      </div>
      <p className="text-[12px] font-medium text-gray-400">Geen kandidaten</p>
      <p className="text-[11px] text-gray-300 mt-0.5">Sleep hierheen</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dropdown component
// ---------------------------------------------------------------------------

function Dropdown({
  label,
  icon,
  options,
  value,
  onChange,
}: {
  label: string;
  icon?: React.ReactNode;
  options: { value: string; label: string }[];
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = options.find((o) => o.value === value)?.label || label;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`h-9 px-3.5 text-[13px] font-medium bg-white border rounded-lg flex items-center gap-1.5 transition-colors
          ${
            value
              ? 'text-gray-900 border-orange-300 ring-1 ring-orange-100'
              : 'text-gray-500 border-gray-200 hover:border-gray-300'
          }`}
      >
        {icon}
        <span className="truncate max-w-[140px]">{value ? selectedLabel : label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-56 bg-white border border-gray-200 rounded-lg shadow-lg shadow-gray-200/60 z-50 py-1 max-h-64 overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value === value ? '' : opt.value);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-[13px] transition-colors
                ${
                  opt.value === value
                    ? 'bg-orange-50 text-orange-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function PipelinePage() {
  const router = useRouter();

  // State
  const [pipeline, setPipeline] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [jobFilter, setJobFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [jobOptions, setJobOptions] = useState<{ id: number; title: string }[]>([]);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOverStage, setDragOverStage] = useState<Stage | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<number | null>(null);
  const jobFilterRef = useRef(jobFilter);
  jobFilterRef.current = jobFilter;

  // Fetch pipeline + jobs in a single server call
  const fetchData = useCallback(async (jobId?: number) => {
    try {
      setError(null);
      const { pipeline: data, jobs } = await getPipelinePageData(jobId || undefined);
      setPipeline(data);
      setJobOptions(jobs);
    } catch (err) {
      setError('Kan pipeline data niet laden');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    getTeamIdForClient().then(setTeamId);
  }, [fetchData]);

  // Real-time: refresh pipeline when another user makes changes
  useTeamChannel(teamId, {
    [EVENTS.STAGE_CHANGED]: () => {
      fetchData(jobFilterRef.current ? parseInt(jobFilterRef.current) : undefined);
    },
    [EVENTS.APPLICATION_CREATED]: () => {
      fetchData(jobFilterRef.current ? parseInt(jobFilterRef.current) : undefined);
    },
    [EVENTS.CANDIDATE_CREATED]: () => {
      fetchData(jobFilterRef.current ? parseInt(jobFilterRef.current) : undefined);
    },
  });

  // Re-fetch when job filter changes
  useEffect(() => {
    if (!loading) {
      setLoading(true);
      fetchData(jobFilter ? parseInt(jobFilter) : undefined);
    }
  }, [jobFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Collect all unique sources
  const allSources: string[] = [];
  if (pipeline) {
    const sourceSet = new Set<string>();
    for (const stage of STAGES) {
      for (const app of pipeline[stage.id]) {
        if (app.candidate.source) sourceSet.add(app.candidate.source);
      }
    }
    allSources.push(...Array.from(sourceSet).sort());
  }

  // Drag handlers
  const handleDragStart = useCallback(
    (e: React.DragEvent, applicationId: number) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(applicationId));
      setDraggingId(applicationId);
      setMoveError(null);
    },
    []
  );

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    setDragOverStage(null);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, stageId: Stage) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (dragOverStage !== stageId) {
        setDragOverStage(stageId);
      }
    },
    [dragOverStage]
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent, stageId: Stage) => {
      // Only clear if actually leaving this column (not entering a child)
      const relatedTarget = e.relatedTarget as HTMLElement | null;
      const currentTarget = e.currentTarget as HTMLElement;
      if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
        if (dragOverStage === stageId) {
          setDragOverStage(null);
        }
      }
    },
    [dragOverStage]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent, newStage: Stage) => {
      e.preventDefault();
      setDragOverStage(null);

      const applicationIdStr = e.dataTransfer.getData('text/plain');
      const applicationId = parseInt(applicationIdStr);
      if (isNaN(applicationId) || !pipeline) return;

      // Find which stage the app is currently in
      let currentStage: Stage | null = null;
      let appData: PipelineApplication | null = null;
      for (const stage of STAGES) {
        const found = pipeline[stage.id].find((a) => a.id === applicationId);
        if (found) {
          currentStage = stage.id;
          appData = found;
          break;
        }
      }

      if (!currentStage || !appData || currentStage === newStage) {
        setDraggingId(null);
        return;
      }

      // Optimistic update
      const previousPipeline = { ...pipeline };
      const updatedPipeline = { ...pipeline };
      updatedPipeline[currentStage] = pipeline[currentStage].filter(
        (a) => a.id !== applicationId
      );
      updatedPipeline[newStage] = [
        { ...appData, stage: newStage, stageMovedAt: new Date() },
        ...pipeline[newStage],
      ];
      setPipeline(updatedPipeline);
      setDraggingId(null);

      // Server call
      const result = await moveCandidate(applicationId, newStage);
      if (!result.success) {
        setPipeline(previousPipeline);
        setMoveError(result.error || 'Verplaatsen mislukt');
        setTimeout(() => setMoveError(null), 3000);
      }
    },
    [pipeline]
  );

  // Calculate totals
  const totalCandidates = pipeline
    ? STAGES.reduce((sum, s) => sum + pipeline[s.id].length, 0)
    : 0;
  const activeStages = pipeline
    ? STAGES.filter((s) => pipeline[s.id].length > 0).length
    : 0;

  // Filter applications per column
  function getFilteredApps(stageId: Stage): PipelineApplication[] {
    if (!pipeline) return [];
    return pipeline[stageId].filter(
      (app) =>
        matchesSearch(app, searchQuery) && matchesSource(app, sourceFilter)
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col h-full">
      {/* Error toast */}
      {moveError && (
        <div className="fixed top-4 right-4 z-50 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg shadow-lg shadow-red-100/50 flex items-center gap-2 animate-[slideIn_0.2s_ease-out]">
          <X className="w-3.5 h-3.5" />
          {moveError}
        </div>
      )}

      {/* Header — always visible */}
      <div className="px-6 lg:px-8 pt-6 pb-5 flex-shrink-0">
        <div className="flex justify-between items-start mb-5">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
              Pipeline
            </h1>
            <p className="text-[14px] text-gray-500 mt-1">
              {loading ? (
                <span className="inline-block h-4 w-48 bg-gray-200 animate-pulse rounded" />
              ) : (
                <>
                  {totalCandidates} kandidaten in {activeStages} actieve{' '}
                  {activeStages === 1 ? 'fase' : 'fases'}
                </>
              )}
            </p>
          </div>
        </div>

        {/* Filters — always visible */}
        <div className="flex gap-2 items-center flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-gray-400" />
            <input
              type="text"
              placeholder="Zoek kandidaat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-[34px] pr-3 text-[13px] border border-gray-200 rounded-lg w-[240px] outline-none bg-white placeholder:text-gray-400 focus:border-orange-300 focus:ring-1 focus:ring-orange-100 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2"
              >
                <X className="w-3.5 h-3.5 text-gray-300 hover:text-gray-500" />
              </button>
            )}
          </div>

          <Dropdown
            label="Alle vacatures"
            icon={<Filter className="w-3.5 h-3.5" />}
            value={jobFilter}
            onChange={(val) => setJobFilter(val)}
            options={[
              { value: '', label: 'Alle vacatures' },
              ...jobOptions.map((j) => ({
                value: String(j.id),
                label: j.title,
              })),
            ]}
          />

          <Dropdown
            label="Bron"
            value={sourceFilter}
            onChange={(val) => setSourceFilter(val)}
            options={[
              { value: '', label: 'Alle bronnen' },
              ...allSources.map((s) => ({ value: s, label: s })),
            ]}
          />

          {(searchQuery || jobFilter || sourceFilter) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setJobFilter('');
                setSourceFilter('');
              }}
              className="text-[12px] text-orange-500 hover:text-orange-600 font-medium ml-1"
            >
              Filters wissen
            </button>
          )}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 lg:px-8 pb-6">
        {error && !pipeline ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <X className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-sm text-gray-600">{error}</p>
            <button
              onClick={() => {
                setLoading(true);
                fetchData();
              }}
              className="text-sm text-orange-500 hover:text-orange-600 font-medium"
            >
              Opnieuw proberen
            </button>
          </div>
        ) : (
          <div className="flex gap-4 h-full min-w-max">
            {STAGES.map((stage) => {
              const apps = loading ? [] : getFilteredApps(stage.id);
              const isOver = dragOverStage === stage.id;

              return (
                <div
                  key={stage.id}
                  onDragOver={(e) => handleDragOver(e, stage.id)}
                  onDragLeave={(e) => handleDragLeave(e, stage.id)}
                  onDrop={(e) => handleDrop(e, stage.id)}
                  className={`w-[280px] flex-shrink-0 flex flex-col rounded-xl border-t-[3px] transition-colors duration-200
                    ${STAGE_BORDER_CLASSES[stage.id]}
                    ${
                      isOver
                        ? `ring-2 ${STAGE_DRAG_CLASSES[stage.id]}`
                        : 'bg-gray-50/80 ring-0'
                    }`}
                >
                  {/* Column header */}
                  <div className="px-3.5 pt-3.5 pb-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${STAGE_DOT_CLASSES[stage.id]}`}
                      />
                      <span className="text-[13px] font-semibold text-gray-700">
                        {stage.label}
                      </span>
                    </div>
                    {loading ? (
                      <span className="h-5 w-6 bg-gray-200 animate-pulse rounded-md" />
                    ) : (
                      <span className="text-[11px] font-semibold text-gray-500 bg-white border border-gray-200/80 rounded-md px-2 py-0.5 min-w-[24px] text-center tabular-nums shadow-sm">
                        {apps.length}
                      </span>
                    )}
                  </div>

                  {/* Cards container */}
                  <div className="flex-1 overflow-y-auto px-2 pb-2 flex flex-col gap-2 min-h-0">
                    {loading ? (
                      <>
                        {[1, 2].map((i) => (
                          <div
                            key={i}
                            className="bg-white rounded-[10px] border border-gray-200/80 p-3.5 space-y-2.5"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
                              <div className="flex-1 space-y-1.5">
                                <div className="h-3.5 w-24 bg-gray-200 animate-pulse rounded" />
                                <div className="h-3 w-32 bg-gray-100 animate-pulse rounded" />
                              </div>
                            </div>
                            <div className="flex gap-3">
                              <div className="h-3 w-14 bg-gray-100 animate-pulse rounded" />
                              <div className="h-3 w-16 bg-gray-100 animate-pulse rounded" />
                            </div>
                            <div className="h-5 w-20 bg-orange-50 animate-pulse rounded-full" />
                          </div>
                        ))}
                      </>
                    ) : (
                      <>
                        {apps.map((app) => (
                          <CandidateCard
                            key={app.id}
                            app={app}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            isDragging={draggingId === app.id}
                          />
                        ))}
                        {apps.length === 0 && <EmptyColumn stage={stage} />}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
