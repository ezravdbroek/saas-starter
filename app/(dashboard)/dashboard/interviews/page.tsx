'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  Video,
  Phone,
  MapPin,
  Monitor,
  Wrench,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getInterviews, updateInterviewStatus } from '@/lib/actions/interviews';

type Interview = {
  id: number;
  scheduledAt: Date;
  duration: number;
  type: string;
  status: string;
  feedback: string | null;
  rating: number | null;
  candidateFirstName: string;
  candidateLastName: string;
  candidateId: number;
  jobTitle: string;
  jobId: number;
  interviewerName: string | null;
  interviewerEmail: string;
  interviewerId: number;
};

const typeIcons: Record<string, typeof Video> = {
  video: Video,
  phone_screen: Phone,
  onsite: MapPin,
  technical: Monitor,
};

const typeLabels: Record<string, string> = {
  video: 'Video',
  phone_screen: 'Telefonisch',
  onsite: 'Op locatie',
  technical: 'Technisch',
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle2 }> = {
  scheduled: { label: 'Gepland', variant: 'default', icon: Calendar },
  completed: { label: 'Voltooid', variant: 'secondary', icon: CheckCircle2 },
  cancelled: { label: 'Geannuleerd', variant: 'destructive', icon: XCircle },
  no_show: { label: 'Niet verschenen', variant: 'destructive', icon: AlertCircle },
};

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function groupByDate(items: Interview[]) {
  const groups: Record<string, Interview[]> = {};
  for (const item of items) {
    const key = formatDate(item.scheduledAt);
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return groups;
}

function isToday(date: Date) {
  const today = new Date();
  const d = new Date(date);
  return d.toDateString() === today.toDateString();
}

function isFuture(date: Date) {
  return new Date(date) > new Date();
}

export default function InterviewsPage() {
  const router = useRouter();
  const [allInterviews, setAllInterviews] = useState<Interview[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInterviews().then((data) => {
      setAllInterviews(data as Interview[]);
      setLoading(false);
    });
  }, []);

  const filtered =
    filter === 'all'
      ? allInterviews
      : allInterviews.filter((i) => i.status === filter);

  const upcoming = filtered.filter(
    (i) => i.status === 'scheduled' && isFuture(i.scheduledAt)
  );
  const past = filtered.filter(
    (i) => i.status !== 'scheduled' || !isFuture(i.scheduledAt)
  );

  const grouped = groupByDate(upcoming);

  async function handleStatusChange(interviewId: number, status: string) {
    await updateInterviewStatus(interviewId, status);
    const data = await getInterviews();
    setAllInterviews(data as Interview[]);
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <div className="h-8 w-48 bg-gray-200 animate-pulse rounded" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Interviews</h1>
          <p className="text-sm text-gray-500 mt-1">
            {allInterviews.length} interview{allInterviews.length !== 1 ? 's' : ''} totaal
          </p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter op status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle interviews</SelectItem>
            <SelectItem value="scheduled">Gepland</SelectItem>
            <SelectItem value="completed">Voltooid</SelectItem>
            <SelectItem value="cancelled">Geannuleerd</SelectItem>
            <SelectItem value="no_show">Niet verschenen</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {allInterviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="p-4 bg-orange-50 rounded-full mb-4">
            <Calendar className="h-8 w-8 text-orange-400" />
          </div>
          <p className="text-base font-medium text-gray-900">
            Geen interviews gepland
          </p>
          <p className="text-sm text-gray-500 mt-1 max-w-sm">
            Interviews worden hier getoond zodra ze worden ingepland vanuit een
            kandidaat profiel
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Upcoming */}
          {Object.keys(grouped).length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                Aankomend
              </h2>
              {Object.entries(grouped).map(([date, items]) => (
                <div key={date} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      {date}
                    </span>
                    {items.some((i) => isToday(i.scheduledAt)) && (
                      <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                        Vandaag
                      </Badge>
                    )}
                  </div>
                  {items.map((interview) => {
                    const TypeIcon = typeIcons[interview.type] || Video;
                    return (
                      <Card
                        key={interview.id}
                        className="gap-0 py-0 p-4 hover:border-orange-200 transition-colors cursor-pointer"
                        onClick={() =>
                          router.push(
                            `/dashboard/candidates/${interview.candidateId}`
                          )
                        }
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-white">
                                {interview.candidateFirstName[0]}
                                {interview.candidateLastName[0]}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {interview.candidateFirstName}{' '}
                                {interview.candidateLastName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {interview.jobTitle}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Clock className="h-3.5 w-3.5" />
                              {formatTime(interview.scheduledAt)} –{' '}
                              {interview.duration} min
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <TypeIcon className="h-3.5 w-3.5" />
                              {typeLabels[interview.type] || interview.type}
                            </div>
                            <div className="text-xs text-gray-500">
                              {interview.interviewerName || interview.interviewerEmail}
                            </div>
                            <div
                              className="flex items-center gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Select
                                value={interview.status}
                                onValueChange={(v) =>
                                  handleStatusChange(interview.id, v)
                                }
                              >
                                <SelectTrigger className="h-8 text-xs w-[140px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="scheduled">
                                    Gepland
                                  </SelectItem>
                                  <SelectItem value="completed">
                                    Voltooid
                                  </SelectItem>
                                  <SelectItem value="cancelled">
                                    Geannuleerd
                                  </SelectItem>
                                  <SelectItem value="no_show">
                                    Niet verschenen
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* Past */}
          {past.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                Afgerond
              </h2>
              {past.map((interview) => {
                const TypeIcon = typeIcons[interview.type] || Video;
                const statusCfg = statusConfig[interview.status] || statusConfig.scheduled;
                return (
                  <Card
                    key={interview.id}
                    className="gap-0 py-0 p-4 opacity-75 hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={() =>
                      router.push(
                        `/dashboard/candidates/${interview.candidateId}`
                      )
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-gray-500">
                            {interview.candidateFirstName[0]}
                            {interview.candidateLastName[0]}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-700">
                            {interview.candidateFirstName}{' '}
                            {interview.candidateLastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {interview.jobTitle}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-xs text-gray-400">
                          {formatDate(interview.scheduledAt)} om{' '}
                          {formatTime(interview.scheduledAt)}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <TypeIcon className="h-3.5 w-3.5" />
                          {typeLabels[interview.type] || interview.type}
                        </div>
                        <Badge variant={statusCfg.variant}>
                          {statusCfg.label}
                        </Badge>
                        {interview.rating && (
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={
                                  star <= interview.rating!
                                    ? 'text-orange-400'
                                    : 'text-gray-200'
                                }
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
