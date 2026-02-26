'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Globe,
  Calendar,
  MessageSquare,
  ArrowRight,
  Star,
  FileText,
  Briefcase,
  LinkIcon,
  Tag,
  Plus,
  Loader2,
  Clock,
  ExternalLink,
  Send,
  UserCircle,
  File,
  SmilePlus,
  Reply,
  ThumbsUp,
  CornerDownRight,
  X,
} from 'lucide-react';
import {
  getCandidateById,
  addCandidateNote,
  addCandidateToJob,
  getPublishedJobs,
  toggleNoteReaction,
} from '@/lib/actions/candidates';
import { useTeamChannel } from '@/lib/pusher/use-team-channel';
import { EVENTS } from '@/lib/pusher/events';
import { getTeamIdForClient, getCurrentUserId } from '@/lib/actions/team';

const sourceLabels: Record<string, string> = {
  linkedin: 'LinkedIn',
  indeed: 'Indeed',
  website: 'Website',
  referral: 'Referral',
  manual: 'Handmatig',
  other: 'Anders',
};

const sourceColors: Record<string, string> = {
  linkedin: 'bg-blue-50 text-blue-700 border-blue-200',
  indeed: 'bg-purple-50 text-purple-700 border-purple-200',
  website: 'bg-green-50 text-green-700 border-green-200',
  referral: 'bg-amber-50 text-amber-700 border-amber-200',
  manual: 'bg-gray-50 text-gray-600 border-gray-200',
  other: 'bg-slate-50 text-slate-600 border-slate-200',
};

const stageLabels: Record<string, string> = {
  applied: 'Gesolliciteerd',
  screening: 'Screening',
  interview: 'Interview',
  assessment: 'Assessment',
  offer: 'Aanbieding',
  hired: 'Aangenomen',
  rejected: 'Afgewezen',
};

const stageColors: Record<string, string> = {
  applied: 'bg-sky-50 text-sky-700 border-sky-200',
  screening: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  interview: 'bg-violet-50 text-violet-700 border-violet-200',
  assessment: 'bg-amber-50 text-amber-700 border-amber-200',
  offer: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  hired: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

const noteTypeIcons: Record<string, typeof MessageSquare> = {
  note: MessageSquare,
  stage_change: ArrowRight,
  interview_feedback: Star,
};

function formatDate(date: Date | string) {
  const d = new Date(date);
  const months = [
    'jan', 'feb', 'mrt', 'apr', 'mei', 'jun',
    'jul', 'aug', 'sep', 'okt', 'nov', 'dec',
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatRelativeTime(date: Date | string) {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return 'Zojuist';
  if (diffMinutes < 60) return `${diffMinutes} min geleden`;
  if (diffHours < 24) return `${diffHours} uur geleden`;
  if (diffDays < 7) return `${diffDays} dag${diffDays === 1 ? '' : 'en'} geleden`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weken'} geleden`;
  }
  return formatDate(date);
}

function daysBetween(from: Date | string, to: Date | string = new Date()) {
  const a = new Date(from);
  const b = new Date(to);
  return Math.floor((b.getTime() - a.getTime()) / 86400000);
}

type CandidateDetail = NonNullable<Awaited<ReturnType<typeof getCandidateById>>>;
type JobOption = { id: number; title: string; department: string | null; location: string | null };

export default function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteContent, setNoteContent] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [availableJobs, setAvailableJobs] = useState<JobOption[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [addingToJob, setAddingToJob] = useState(false);
  const [teamId, setTeamId] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [emojiPickerNoteId, setEmojiPickerNoteId] = useState<number | null>(null);
  const noteInputRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const candidateId = parseInt(id);

  useEffect(() => {
    loadCandidate();
    getTeamIdForClient().then(setTeamId);
    getCurrentUserId().then(setCurrentUserId);
  }, [candidateId]);

  // Close emoji picker on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setEmojiPickerNoteId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Real-time: refresh when notes/stages change for this candidate
  useTeamChannel(teamId, {
    [EVENTS.NOTE_ADDED]: (data: { candidateId: number }) => {
      if (data.candidateId === candidateId) loadCandidate();
    },
    [EVENTS.STAGE_CHANGED]: (data: { candidateId: number }) => {
      if (data.candidateId === candidateId) loadCandidate();
    },
    [EVENTS.CANDIDATE_UPDATED]: (data: { candidateId: number }) => {
      if (data.candidateId === candidateId) loadCandidate();
    },
    [EVENTS.APPLICATION_CREATED]: (data: { candidateId: number }) => {
      if (data.candidateId === candidateId) loadCandidate();
    },
  });

  async function loadCandidate() {
    try {
      const data = await getCandidateById(candidateId);
      setCandidate(data);
    } catch (err) {
      console.error('Fout bij laden kandidaat:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteContent.trim()) return;

    setSubmittingNote(true);
    try {
      await addCandidateNote(
        candidateId,
        noteContent.trim(),
        'note',
        undefined,
        replyingTo || undefined
      );
      setNoteContent('');
      setReplyingTo(null);
      await loadCandidate();
    } catch (err) {
      console.error('Fout bij toevoegen notitie:', err);
    } finally {
      setSubmittingNote(false);
    }
  }

  async function handleReaction(noteId: number, emoji: string) {
    setEmojiPickerNoteId(null);
    try {
      await toggleNoteReaction(noteId, emoji);
      await loadCandidate();
    } catch (err) {
      console.error('Fout bij reactie:', err);
    }
  }

  function startReply(noteId: number) {
    setReplyingTo(noteId);
    noteInputRef.current?.focus();
  }

  async function openJobDialog() {
    setJobDialogOpen(true);
    setLoadingJobs(true);
    try {
      const jobs = await getPublishedJobs();
      setAvailableJobs(jobs as JobOption[]);
    } catch (err) {
      console.error('Fout bij laden vacatures:', err);
    } finally {
      setLoadingJobs(false);
    }
  }

  async function handleAddToJob() {
    if (!selectedJobId) return;

    setAddingToJob(true);
    try {
      await addCandidateToJob(candidateId, parseInt(selectedJobId));
      setJobDialogOpen(false);
      setSelectedJobId('');
      await loadCandidate();
    } catch (err) {
      console.error('Fout bij koppelen aan vacature:', err);
    } finally {
      setAddingToJob(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-24">
        <Loader2 className="h-8 w-8 text-orange-500 animate-spin mb-4" />
        <p className="text-sm text-muted-foreground">Kandidaat laden...</p>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-24 text-center">
        <div className="p-4 bg-muted rounded-full mb-4">
          <UserCircle className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-base font-medium">Kandidaat niet gevonden</p>
        <p className="text-sm text-muted-foreground mt-1">
          Deze kandidaat bestaat niet of je hebt geen toegang.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push('/dashboard/candidates')}
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Terug naar kandidaten
        </Button>
      </div>
    );
  }

  const initials = `${candidate.firstName[0]}${candidate.lastName[0]}`.toUpperCase();
  const fullName = `${candidate.firstName} ${candidate.lastName}`;
  let parsedTags: string[] = [];
  try {
    parsedTags = candidate.tags ? JSON.parse(candidate.tags) : [];
  } catch {
    parsedTags = [];
  }

  const appliedJobIds = new Set(candidate.applications.map((a) => a.jobId));
  const filteredJobs = availableJobs.filter((j) => !appliedJobIds.has(j.id));

  return (
    <div className="p-6 lg:p-8">
      {/* Back navigation */}
      <button
        onClick={() => router.push('/dashboard/candidates')}
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors mb-5"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Kandidaten
      </button>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main column */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Profile header */}
          <Card className="py-0 gap-0 overflow-hidden">
            <div className="px-6 py-5">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-bold">{initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h1 className="text-lg font-semibold truncate">{fullName}</h1>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border flex-shrink-0 ${
                            sourceColors[candidate.source] || sourceColors.other
                          }`}
                        >
                          {sourceLabels[candidate.source] || candidate.source}
                        </span>
                      </div>
                      {(candidate.currentTitle || candidate.currentCompany) && (
                        <p className="text-[13px] text-muted-foreground mt-0.5 truncate">
                          {candidate.currentTitle}
                          {candidate.currentTitle && candidate.currentCompany && ' bij '}
                          {candidate.currentCompany && (
                            <span className="text-foreground/80">{candidate.currentCompany}</span>
                          )}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {candidate.linkedinUrl && (
                        <a
                          href={candidate.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center h-8 w-8 rounded-lg border text-muted-foreground hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors"
                        >
                          <Linkedin className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {candidate.portfolioUrl && (
                        <a
                          href={candidate.portfolioUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center h-8 w-8 rounded-lg border text-muted-foreground hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50 transition-colors"
                        >
                          <Globe className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Contact row */}
            <div className="px-6 py-3 bg-muted/40 border-t flex flex-wrap items-center gap-x-5 gap-y-1.5">
              {candidate.email && (
                <a
                  href={`mailto:${candidate.email}`}
                  className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-orange-600 transition-colors"
                >
                  <Mail className="h-3.5 w-3.5" />
                  {candidate.email}
                </a>
              )}
              {candidate.phone && (
                <a
                  href={`tel:${candidate.phone}`}
                  className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-orange-600 transition-colors"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {candidate.phone}
                </a>
              )}
              {candidate.location && (
                <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {candidate.location}
                </span>
              )}
              {parsedTags.length > 0 && (
                <>
                  <span className="text-border">|</span>
                  {parsedTags.map((tag, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 text-[11px] font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </>
              )}
            </div>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="overview">
            <TabsList variant="line" className="border-b w-full justify-start gap-0">
              <TabsTrigger value="overview" className="text-[13px]">
                Overzicht
              </TabsTrigger>
              <TabsTrigger value="applications" className="text-[13px]">
                Sollicitaties
                {candidate.applications.length > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-orange-100 text-orange-700 text-[11px] font-medium px-1.5">
                    {candidate.applications.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="timeline" className="text-[13px]">
                Notities
                {candidate.candidateNotes.length > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-muted text-muted-foreground text-[11px] font-medium px-1.5">
                    {candidate.candidateNotes.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="documents" className="text-[13px]">
                Documenten
              </TabsTrigger>
            </TabsList>

            {/* Tab: Overzicht */}
            <TabsContent value="overview" className="mt-5">
              <Card className="py-0 gap-0 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                  {/* Contact info */}
                  <div className="p-5">
                    <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      Contactinformatie
                    </h3>
                    <dl className="space-y-3">
                      <div className="flex items-center justify-between">
                        <dt className="text-[13px] text-muted-foreground">E-mail</dt>
                        <dd>
                          <a
                            href={`mailto:${candidate.email}`}
                            className="text-[13px] hover:text-orange-600 transition-colors"
                          >
                            {candidate.email}
                          </a>
                        </dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt className="text-[13px] text-muted-foreground">Telefoon</dt>
                        <dd className="text-[13px]">
                          {candidate.phone || <span className="text-muted-foreground/50">-</span>}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt className="text-[13px] text-muted-foreground">Locatie</dt>
                        <dd className="text-[13px]">
                          {candidate.location || <span className="text-muted-foreground/50">-</span>}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {/* Links */}
                  <div className="p-5">
                    <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
                      <LinkIcon className="h-3.5 w-3.5" />
                      Links
                    </h3>
                    <dl className="space-y-3">
                      <div className="flex items-center justify-between">
                        <dt className="text-[13px] text-muted-foreground">LinkedIn</dt>
                        <dd>
                          {candidate.linkedinUrl ? (
                            <a
                              href={candidate.linkedinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[13px] text-blue-600 hover:text-blue-700"
                            >
                              Profiel bekijken
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-[13px] text-muted-foreground/50">-</span>
                          )}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt className="text-[13px] text-muted-foreground">Portfolio</dt>
                        <dd>
                          {candidate.portfolioUrl ? (
                            <a
                              href={candidate.portfolioUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[13px] text-orange-600 hover:text-orange-700"
                            >
                              Website bekijken
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-[13px] text-muted-foreground/50">-</span>
                          )}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {/* Bottom row: source/tags + notes */}
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border border-t">
                  {/* Bron & Tags */}
                  <div className="p-5">
                    <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5" />
                      Bron & Tags
                    </h3>
                    <dl className="space-y-3">
                      <div className="flex items-center justify-between">
                        <dt className="text-[13px] text-muted-foreground">Bron</dt>
                        <dd>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                              sourceColors[candidate.source] || sourceColors.other
                            }`}
                          >
                            {sourceLabels[candidate.source] || candidate.source}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[13px] text-muted-foreground mb-2">Tags</dt>
                        <dd>
                          {parsedTags.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {parsedTags.map((tag, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 text-[11px] font-medium border border-orange-200"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[13px] text-muted-foreground/50">Geen tags</span>
                          )}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {/* Notities */}
                  <div className="p-5">
                    <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Notities
                    </h3>
                    {candidate.notes ? (
                      <p className="text-[13px] text-foreground/80 whitespace-pre-wrap leading-relaxed">
                        {candidate.notes}
                      </p>
                    ) : (
                      <p className="text-[13px] text-muted-foreground/50">Geen notities</p>
                    )}
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Tab: Sollicitaties */}
            <TabsContent value="applications" className="mt-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[13px] text-muted-foreground">
                  {candidate.applications.length === 0
                    ? 'Nog geen sollicitaties'
                    : `${candidate.applications.length} sollicitatie${candidate.applications.length === 1 ? '' : 's'}`}
                </p>
                <Dialog open={jobDialogOpen} onOpenChange={setJobDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                      onClick={openJobDialog}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Koppel aan vacature
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[440px]">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center">
                          <Briefcase className="h-4 w-4 text-orange-600" />
                        </div>
                        Koppel aan vacature
                      </DialogTitle>
                      <DialogDescription>
                        Koppel {fullName} aan een openstaande vacature.
                      </DialogDescription>
                    </DialogHeader>

                    {loadingJobs ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 text-orange-500 animate-spin" />
                      </div>
                    ) : filteredJobs.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-[13px] text-muted-foreground">
                          {availableJobs.length === 0
                            ? 'Geen gepubliceerde vacatures beschikbaar.'
                            : 'Kandidaat is al gekoppeld aan alle beschikbare vacatures.'}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecteer een vacature..." />
                            </SelectTrigger>
                            <SelectContent>
                              {filteredJobs.map((job) => (
                                <SelectItem key={job.id} value={String(job.id)}>
                                  <div>
                                    <span className="font-medium">{job.title}</span>
                                    {job.department && (
                                      <span className="text-muted-foreground ml-1.5">
                                        - {job.department}
                                      </span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setJobDialogOpen(false)}
                            disabled={addingToJob}
                          >
                            Annuleren
                          </Button>
                          <Button
                            onClick={handleAddToJob}
                            disabled={!selectedJobId || addingToJob}
                            className="bg-orange-500 hover:bg-orange-600 text-white"
                          >
                            {addingToJob ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                                Koppelen...
                              </>
                            ) : (
                              'Koppelen'
                            )}
                          </Button>
                        </DialogFooter>
                      </>
                    )}
                  </DialogContent>
                </Dialog>
              </div>

              {candidate.applications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="p-4 bg-orange-50 rounded-full mb-4">
                    <Briefcase className="h-7 w-7 text-orange-400" />
                  </div>
                  <p className="text-[14px] font-medium">Geen sollicitaties</p>
                  <p className="text-[13px] text-muted-foreground mt-1 max-w-sm">
                    Koppel deze kandidaat aan een vacature om het sollicitatieproces te starten.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {candidate.applications.map((app) => {
                    const daysInStage = daysBetween(app.stageMovedAt);
                    return (
                      <Card key={app.id} className="py-0 gap-0 hover:border-orange-200 transition-colors">
                        <div className="px-5 py-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-orange-500 flex-shrink-0" />
                                <h3 className="text-[14px] font-medium truncate">
                                  {app.jobTitle}
                                </h3>
                              </div>
                              {(app.jobDepartment || app.jobLocation) && (
                                <p className="text-[12px] text-muted-foreground mt-1 ml-6">
                                  {[app.jobDepartment, app.jobLocation].filter(Boolean).join(' - ')}
                                </p>
                              )}
                            </div>
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium border flex-shrink-0 ${
                                stageColors[app.stage] || stageColors.applied
                              }`}
                            >
                              {stageLabels[app.stage] || app.stage}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-2.5 ml-6">
                            <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              Gesolliciteerd op {formatDate(app.createdAt)}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {daysInStage} dag{daysInStage === 1 ? '' : 'en'} in huidige fase
                            </span>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Tab: Notities */}
            <TabsContent value="timeline" className="mt-5 space-y-5">
              {/* Add note form */}
              <Card className="py-0 gap-0">
                <div className="p-4">
                  {/* Reply indicator */}
                  {replyingTo && (
                    <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-orange-50 border border-orange-100 rounded-lg">
                      <CornerDownRight className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                      <span className="text-[12px] text-orange-700 flex-1 truncate">
                        Reageren op{' '}
                        <span className="font-medium">
                          {candidate.candidateNotes.find((n) => n.id === replyingTo)?.authorName ||
                            candidate.candidateNotes.find((n) => n.id === replyingTo)?.authorEmail ||
                            'bericht'}
                        </span>
                      </span>
                      <button
                        onClick={() => setReplyingTo(null)}
                        className="text-orange-400 hover:text-orange-600 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  <form onSubmit={handleAddNote} className="flex items-end gap-3">
                    <div className="flex-1">
                      <Textarea
                        ref={noteInputRef}
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (noteContent.trim()) handleAddNote(e);
                          }
                        }}
                        placeholder={replyingTo ? 'Schrijf een reactie...' : 'Schrijf een bericht...'}
                        rows={2}
                        className="resize-none text-[13px] min-h-[44px]"
                      />
                    </div>
                    <Button
                      type="submit"
                      size="icon"
                      className="bg-orange-500 hover:bg-orange-600 text-white h-[44px] w-[44px] flex-shrink-0"
                      disabled={!noteContent.trim() || submittingNote}
                    >
                      {submittingNote ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </form>
                </div>
              </Card>

              {/* Messages */}
              {candidate.candidateNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-4 bg-muted rounded-full mb-4">
                    <MessageSquare className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-[14px] font-medium">Geen berichten</p>
                  <p className="text-[13px] text-muted-foreground mt-1">
                    Schrijf een bericht om de conversatie te starten.
                  </p>
                </div>
              ) : (() => {
                // Separate top-level notes and replies
                const topLevel = candidate.candidateNotes
                  .filter((n) => !n.parentId)
                  .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                const repliesByParent = new Map<number, typeof candidate.candidateNotes>();
                for (const n of candidate.candidateNotes) {
                  if (n.parentId) {
                    const arr = repliesByParent.get(n.parentId) || [];
                    arr.push(n);
                    repliesByParent.set(n.parentId, arr);
                  }
                }
                // Sort replies chronologically
                for (const [, arr] of repliesByParent) {
                  arr.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                }

                // Group reactions by noteId -> { emoji: string, users: string[], userIds: number[] }
                const reactionsByNote = new Map<number, { emoji: string; users: string[]; userIds: number[] }[]>();
                if (candidate.noteReactions) {
                  for (const r of candidate.noteReactions) {
                    if (!reactionsByNote.has(r.noteId)) reactionsByNote.set(r.noteId, []);
                    const noteReacs = reactionsByNote.get(r.noteId)!;
                    const existing = noteReacs.find((x) => x.emoji === r.emoji);
                    if (existing) {
                      existing.users.push(r.userName || 'Onbekend');
                      existing.userIds.push(r.userId);
                    } else {
                      noteReacs.push({
                        emoji: r.emoji,
                        users: [r.userName || 'Onbekend'],
                        userIds: [r.userId],
                      });
                    }
                  }
                }

                const QUICK_EMOJIS = ['👍', '❤️', '🎉', '👀', '🔥', '💯', '😊', '🤔'];

                function renderActions(noteId: number, showReply = true) {
                  const noteReacs = reactionsByNote.get(noteId) || [];
                  return (
                    <div className="flex items-center gap-1 flex-wrap">
                      {/* Existing reactions */}
                      {noteReacs.map((r) => {
                        const hasReacted = currentUserId ? r.userIds.includes(currentUserId) : false;
                        return (
                          <button
                            key={r.emoji}
                            onClick={() => handleReaction(noteId, r.emoji)}
                            title={r.users.join(', ')}
                            className={`inline-flex items-center gap-1 h-6 px-1.5 rounded-full text-[12px] border transition-colors ${
                              hasReacted
                                ? 'bg-orange-50 border-orange-200'
                                : 'bg-muted/60 border-transparent hover:border-border'
                            }`}
                          >
                            <span>{r.emoji}</span>
                            <span className={`text-[11px] font-medium tabular-nums ${hasReacted ? 'text-orange-700' : 'text-muted-foreground'}`}>
                              {r.users.length}
                            </span>
                          </button>
                        );
                      })}

                      {/* Emoji picker */}
                      <div className="relative">
                        <button
                          onClick={() => setEmojiPickerNoteId(emojiPickerNoteId === noteId ? null : noteId)}
                          className="inline-flex items-center justify-center h-6 w-6 rounded-full text-muted-foreground/30 hover:text-muted-foreground hover:bg-muted transition-colors"
                          title="Reageer met emoji"
                        >
                          <SmilePlus className="h-3.5 w-3.5" />
                        </button>
                        {emojiPickerNoteId === noteId && (
                          <div
                            ref={emojiPickerRef}
                            className="absolute left-0 bottom-full mb-1 bg-white border rounded-xl shadow-lg shadow-black/8 p-1.5 z-50 flex gap-0.5 flex-wrap w-[196px]"
                          >
                            {QUICK_EMOJIS.map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => handleReaction(noteId, emoji)}
                                className="h-9 w-9 rounded-lg flex items-center justify-center text-[18px] hover:bg-muted transition-colors"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Thumbs up shortcut */}
                      <button
                        onClick={() => handleReaction(noteId, '👍')}
                        className="inline-flex items-center justify-center h-6 w-6 rounded-full text-muted-foreground/30 hover:text-muted-foreground hover:bg-muted transition-colors"
                        title="Duimpje"
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                      </button>

                      {/* Reply */}
                      {showReply && (
                        <button
                          onClick={() => startReply(noteId)}
                          className="inline-flex items-center gap-1 h-6 px-1.5 rounded-full text-[11px] text-muted-foreground/30 hover:text-muted-foreground hover:bg-muted transition-colors"
                          title="Beantwoorden"
                        >
                          <Reply className="h-3.5 w-3.5" />
                          <span>Beantwoorden</span>
                        </button>
                      )}
                    </div>
                  );
                }

                function renderNote(note: CandidateDetail['candidateNotes'][number]) {
                  const isStageChange = note.type === 'stage_change';
                  const isFeedback = note.type === 'interview_feedback';
                  const authorInitial = (note.authorName || note.authorEmail || '?')[0].toUpperCase();
                  const replies = repliesByParent.get(note.id) || [];

                  if (isStageChange) {
                    return (
                      <div key={note.id} className="flex items-center gap-3 py-1">
                        <div className="flex-1 h-px bg-border" />
                        <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                          <ArrowRight className="h-3 w-3 text-indigo-500" />
                          <span>
                            <span className="font-medium text-foreground/70">
                              {note.authorName || note.authorEmail}
                            </span>{' '}
                            {note.content}
                          </span>
                          <span className="text-muted-foreground/60">
                            &middot; {formatRelativeTime(note.createdAt)}
                          </span>
                        </div>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                    );
                  }

                  return (
                    <div key={note.id}>
                      <Card className="py-0 gap-0 overflow-hidden">
                        {/* Main message */}
                        <div className="px-5 py-4">
                          {/* Author row */}
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-[11px] font-bold ${
                                isFeedback
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-gradient-to-br from-orange-400 to-orange-600 text-white'
                              }`}
                            >
                              {isFeedback ? <Star className="h-3.5 w-3.5" /> : authorInitial}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-[13px] font-semibold">
                                {note.authorName || note.authorEmail}
                              </span>
                              <span className="ml-2 text-[12px] text-muted-foreground/50">
                                {formatRelativeTime(note.createdAt)}
                              </span>
                            </div>
                          </div>

                          {/* Content */}
                          <p className="text-[13px] whitespace-pre-wrap leading-relaxed text-foreground/85 mt-2">
                            {note.content}
                          </p>

                          {/* Reactions + actions */}
                          <div className="mt-3">
                            {renderActions(note.id, true)}
                          </div>
                        </div>

                        {/* Replies */}
                        {replies.length > 0 && (
                          <div className="border-t bg-muted/20 px-5 py-3 space-y-3">
                            {replies.map((reply) => {
                              const replyInitial = (reply.authorName || reply.authorEmail || '?')[0].toUpperCase();
                              return (
                                <div key={reply.id}>
                                  {/* Reply author */}
                                  <div className="flex items-center gap-2.5">
                                    <div className="flex-shrink-0 h-7 w-7 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                                      <span className="text-[9px] font-bold text-white">{replyInitial}</span>
                                    </div>
                                    <span className="text-[12px] font-semibold">
                                      {reply.authorName || reply.authorEmail}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground/50">
                                      {formatRelativeTime(reply.createdAt)}
                                    </span>
                                  </div>

                                  {/* Reply content */}
                                  <p className="text-[12px] text-foreground/80 whitespace-pre-wrap leading-relaxed mt-1 ml-[38px]">
                                    {reply.content}
                                  </p>

                                  {/* Reply actions */}
                                  <div className="mt-1.5 ml-[38px]">
                                    {renderActions(reply.id, true)}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </Card>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {topLevel.map((note) => renderNote(note))}
                  </div>
                );
              })()}
            </TabsContent>

            {/* Tab: Documenten */}
            <TabsContent value="documents" className="mt-5">
              {!candidate.resumeUrl && !candidate.coverLetterUrl ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="p-4 bg-muted rounded-full mb-4">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-[14px] font-medium">Geen documenten</p>
                  <p className="text-[13px] text-muted-foreground mt-1">
                    Er zijn nog geen documenten geupload voor deze kandidaat.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Card className="py-0 gap-0">
                    <div className="p-5 flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-orange-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[14px] font-medium">Curriculum Vitae</h3>
                        {candidate.resumeUrl ? (
                          <a
                            href={candidate.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[13px] text-orange-600 hover:text-orange-700 mt-1"
                          >
                            Bekijk CV
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <p className="text-[13px] text-muted-foreground/50 mt-1">Geen CV geupload</p>
                        )}
                      </div>
                    </div>
                  </Card>

                  <Card className="py-0 gap-0">
                    <div className="p-5 flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <File className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[14px] font-medium">Motivatiebrief</h3>
                        {candidate.coverLetterUrl ? (
                          <a
                            href={candidate.coverLetterUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[13px] text-blue-600 hover:text-blue-700 mt-1"
                          >
                            Bekijk brief
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <p className="text-[13px] text-muted-foreground/50 mt-1">
                            Geen motivatiebrief geupload
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-72 flex-shrink-0">
          <div className="lg:sticky lg:top-6 space-y-4">
            {/* Quick overview */}
            <Card className="py-0 gap-0">
              <div className="p-5">
                <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Snel overzicht
                </h3>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-muted-foreground flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5" />
                      Sollicitaties
                    </span>
                    <span className="text-[13px] font-semibold tabular-nums">
                      {candidate.applications.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-muted-foreground flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Notities
                    </span>
                    <span className="text-[13px] font-semibold tabular-nums">
                      {candidate.candidateNotes.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Toegevoegd
                    </span>
                    <span className="text-[13px] text-foreground/80">
                      {formatDate(candidate.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Active applications */}
            {candidate.applications.length > 0 && (
              <Card className="py-0 gap-0">
                <div className="p-5">
                  <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Actieve sollicitaties
                  </h3>
                  <div className="space-y-2">
                    {candidate.applications.slice(0, 3).map((app) => (
                      <div
                        key={app.id}
                        className="flex items-center justify-between gap-2 py-1"
                      >
                        <span className="text-[13px] truncate min-w-0">
                          {app.jobTitle}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border flex-shrink-0 ${
                            stageColors[app.stage] || stageColors.applied
                          }`}
                        >
                          {stageLabels[app.stage] || app.stage}
                        </span>
                      </div>
                    ))}
                    {candidate.applications.length > 3 && (
                      <p className="text-[12px] text-muted-foreground pt-1">
                        +{candidate.applications.length - 3} meer
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
