'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Briefcase,
  Users,
  Calendar,
  TrendingUp,
  Clock,
  ArrowRight,
  Video,
  Phone,
  MapPin,
  Monitor,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getDashboardData } from '@/lib/actions/dashboard';

type Stats = {
  activeJobs: number;
  totalCandidates: number;
  interviewsThisWeek: number;
  inOfferStage: number;
};

type UpcomingInterview = {
  id: number;
  scheduledAt: Date;
  duration: number;
  type: string;
  status: string;
  candidateFirstName: string;
  candidateLastName: string;
  candidateId: number;
  jobTitle: string;
  interviewerName: string | null;
};

const typeIcons: Record<string, typeof Video> = {
  video: Video,
  phone_screen: Phone,
  onsite: MapPin,
  technical: Monitor,
};

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelativeDate(date: Date) {
  const d = new Date(date);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (d.toDateString() === today.toDateString()) return 'Vandaag';
  if (d.toDateString() === tomorrow.toDateString()) return 'Morgen';
  return d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [upcoming, setUpcoming] = useState<UpcomingInterview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardData().then((data) => {
      setStats(data.stats);
      setUpcoming(data.upcomingInterviews as UpcomingInterview[]);
      setLoading(false);
    });
  }, []);

  const statCards = [
    {
      label: 'Open vacatures',
      value: stats?.activeJobs ?? 0,
      icon: Briefcase,
      href: '/dashboard/jobs',
    },
    {
      label: 'Kandidaten',
      value: stats?.totalCandidates ?? 0,
      icon: Users,
      href: '/dashboard/candidates',
    },
    {
      label: 'Interviews deze week',
      value: stats?.interviewsThisWeek ?? 0,
      icon: Calendar,
      href: '/dashboard/interviews',
    },
    {
      label: 'In aanbieding',
      value: stats?.inOfferStage ?? 0,
      icon: TrendingUp,
      href: '/dashboard/pipeline',
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Overzicht van je recruitment activiteiten
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <Card
            key={stat.label}
            className="gap-0 py-0 p-5 hover:border-orange-200 transition-colors cursor-pointer"
            onClick={() => router.push(stat.href)}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[13px] font-medium text-gray-500">
                  {stat.label}
                </p>
                <p className="text-3xl font-semibold text-gray-900 mt-2 leading-none">
                  {loading ? (
                    <span className="inline-block h-8 w-12 bg-gray-200 animate-pulse rounded" />
                  ) : (
                    stat.value
                  )}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-orange-50">
                <stat.icon className="h-5 w-5 text-orange-500" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Quick actions */}
        <Card className="lg:col-span-2 overflow-hidden gap-0 py-0">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">
              Snel aan de slag
            </h2>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => router.push('/dashboard/jobs/new')}
              className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 transition-all text-left group"
            >
              <div className="p-2 rounded-lg bg-orange-50 group-hover:bg-orange-100 transition-colors">
                <Briefcase className="h-4 w-4 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Vacature aanmaken
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Nieuwe positie openen
                </p>
              </div>
            </button>
            <button
              onClick={() => router.push('/dashboard/candidates')}
              className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 transition-all text-left group"
            >
              <div className="p-2 rounded-lg bg-orange-50 group-hover:bg-orange-100 transition-colors">
                <Users className="h-4 w-4 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Kandidaat toevoegen
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Handmatig invoeren
                </p>
              </div>
            </button>
            <button
              onClick={() => router.push('/dashboard/pipeline')}
              className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 transition-all text-left group"
            >
              <div className="p-2 rounded-lg bg-orange-50 group-hover:bg-orange-100 transition-colors">
                <TrendingUp className="h-4 w-4 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Pipeline bekijken
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Kanban overzicht
                </p>
              </div>
            </button>
          </div>
        </Card>

        {/* Upcoming interviews */}
        <Card className="overflow-hidden gap-0 py-0">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">
              Aankomende interviews
            </h2>
            {upcoming.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-orange-500 hover:text-orange-600"
                onClick={() => router.push('/dashboard/interviews')}
              >
                Alles bekijken
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
          <div className="p-3">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 bg-gray-100 animate-pulse rounded-lg"
                  />
                ))}
              </div>
            ) : upcoming.length === 0 ? (
              <div className="py-10 flex flex-col items-center text-center">
                <div className="p-3 rounded-full bg-orange-50 mb-3">
                  <Calendar className="h-5 w-5 text-orange-400" />
                </div>
                <p className="text-sm font-medium text-gray-900">
                  Geen interviews gepland
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Geplande interviews verschijnen hier
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {upcoming.map((interview) => {
                  const TypeIcon = typeIcons[interview.type] || Video;
                  return (
                    <button
                      key={interview.id}
                      onClick={() =>
                        router.push(
                          `/dashboard/candidates/${interview.candidateId}`
                        )
                      }
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-white">
                          {interview.candidateFirstName[0]}
                          {interview.candidateLastName[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {interview.candidateFirstName}{' '}
                          {interview.candidateLastName}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-gray-400">
                            {formatRelativeDate(interview.scheduledAt)} om{' '}
                            {formatTime(interview.scheduledAt)}
                          </span>
                          <TypeIcon className="h-3 w-3 text-gray-300" />
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[10px] flex-shrink-0"
                      >
                        {interview.jobTitle.length > 15
                          ? interview.jobTitle.slice(0, 15) + '...'
                          : interview.jobTitle}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
