'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Briefcase,
  Plus,
  Search,
  MapPin,
  Users,
  Calendar,
  Loader2,
} from 'lucide-react';
import { createJob } from '@/lib/actions/jobs';

type Job = {
  id: number;
  title: string;
  department: string | null;
  location: string | null;
  locationType: string;
  employmentType: string;
  experienceLevel: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  applicationCount: number;
};

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: {
    label: 'Concept',
    className: 'bg-muted text-muted-foreground hover:bg-muted border-border',
  },
  published: {
    label: 'Gepubliceerd',
    className: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200',
  },
  closed: {
    label: 'Gesloten',
    className: 'bg-red-50 text-red-700 hover:bg-red-50 border-red-200',
  },
  archived: {
    label: 'Gearchiveerd',
    className: 'bg-muted text-muted-foreground hover:bg-muted border-border',
  },
};

const employmentTypeLabels: Record<string, string> = {
  fulltime: 'Fulltime',
  parttime: 'Parttime',
  contract: 'Contract',
  internship: 'Stage',
};

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function JobsListClient({ jobs }: { jobs: Job[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    department: '',
    location: '',
    locationType: 'onsite',
    employmentType: 'fulltime',
    experienceLevel: '',
    salaryMin: '',
    salaryMax: '',
    salaryCurrency: 'EUR',
    description: '',
    requirements: '',
    responsibilities: '',
  });

  function resetForm() {
    setForm({
      title: '',
      department: '',
      location: '',
      locationType: 'onsite',
      employmentType: 'fulltime',
      experienceLevel: '',
      salaryMin: '',
      salaryMax: '',
      salaryCurrency: 'EUR',
      description: '',
      requirements: '',
      responsibilities: '',
    });
    setError('');
  }

  async function handleSubmit(status: 'draft' | 'published') {
    if (!form.title.trim()) {
      setError('Titel is verplicht');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await createJob({
        title: form.title.trim(),
        department: form.department.trim() || undefined,
        location: form.location.trim() || undefined,
        locationType: form.locationType,
        employmentType: form.employmentType,
        experienceLevel: form.experienceLevel || undefined,
        salaryMin: form.salaryMin ? parseInt(form.salaryMin, 10) : undefined,
        salaryMax: form.salaryMax ? parseInt(form.salaryMax, 10) : undefined,
        salaryCurrency: form.salaryCurrency,
        description: form.description.trim() || undefined,
        requirements: form.requirements.trim() || undefined,
        responsibilities: form.responsibilities.trim() || undefined,
        status,
      });
    } catch (err) {
      setError('Er is iets misgegaan. Probeer het opnieuw.');
      setIsSubmitting(false);
    }
  }

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      search === '' ||
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      (job.department && job.department.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Vacatures</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {jobs.length === 0
              ? 'Beheer je openstaande vacatures'
              : `${jobs.length} vacature${jobs.length === 1 ? '' : 's'}`}
          </p>
        </div>

        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              <Plus className="h-4 w-4 mr-1.5" />
              Nieuwe vacature
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[580px] max-h-[85vh] overflow-y-auto p-0 gap-0">
            <DialogHeader className="px-6 pt-6 pb-4">
              <DialogTitle className="text-lg">Nieuwe vacature</DialogTitle>
              <DialogDescription className="text-[13px]">
                Vul de details in voor je nieuwe vacature.
              </DialogDescription>
            </DialogHeader>

            {/* Basis informatie */}
            <div className="border-t px-6 py-5 space-y-4">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Basis informatie
              </p>
              <div className="space-y-1.5">
                <Label className="text-[13px]">
                  Titel <span className="text-red-400">*</span>
                </Label>
                <Input
                  placeholder="Bijv. Frontend Developer"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Afdeling</Label>
                  <Input
                    placeholder="Bijv. Engineering"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Locatie</Label>
                  <Input
                    placeholder="Bijv. Amsterdam"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Locatie type</Label>
                  <Select value={form.locationType} onValueChange={(v) => setForm({ ...form, locationType: v })}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="onsite">Op locatie</SelectItem>
                      <SelectItem value="remote">Remote</SelectItem>
                      <SelectItem value="hybrid">Hybride</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Dienstverband</Label>
                  <Select value={form.employmentType} onValueChange={(v) => setForm({ ...form, employmentType: v })}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fulltime">Fulltime</SelectItem>
                      <SelectItem value="parttime">Parttime</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="internship">Stage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Niveau</Label>
                  <Select value={form.experienceLevel} onValueChange={(v) => setForm({ ...form, experienceLevel: v })}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Selecteer" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="junior">Junior</SelectItem>
                      <SelectItem value="medior">Medior</SelectItem>
                      <SelectItem value="senior">Senior</SelectItem>
                      <SelectItem value="lead">Lead</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Salaris */}
            <div className="border-t px-6 py-5 space-y-4">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Salaris
              </p>
              <div className="grid grid-cols-[1fr_1fr_120px] gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Minimum</Label>
                  <Input
                    type="number"
                    placeholder="3000"
                    value={form.salaryMin}
                    onChange={(e) => setForm({ ...form, salaryMin: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Maximum</Label>
                  <Input
                    type="number"
                    placeholder="5000"
                    value={form.salaryMax}
                    onChange={(e) => setForm({ ...form, salaryMax: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Valuta</Label>
                  <Select value={form.salaryCurrency} onValueChange={(v) => setForm({ ...form, salaryCurrency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Beschrijving */}
            <div className="border-t px-6 py-5 space-y-4">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Beschrijving
              </p>
              <div className="space-y-1.5">
                <Label className="text-[13px]">Functiebeschrijving</Label>
                <Textarea
                  placeholder="Beschrijf de functie..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px]">Vereisten</Label>
                <Textarea
                  placeholder="Wat zijn de vereisten?"
                  value={form.requirements}
                  onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                  rows={3}
                  className="resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px]">Verantwoordelijkheden</Label>
                <Textarea
                  placeholder="Wat zijn de verantwoordelijkheden?"
                  value={form.responsibilities}
                  onChange={(e) => setForm({ ...form, responsibilities: e.target.value })}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="border-t bg-muted/30 px-6 py-4 rounded-b-lg">
              {error && (
                <p className="text-sm text-destructive font-medium mb-3">{error}</p>
              )}
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Annuleren
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleSubmit('draft')}
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                  Opslaan als concept
                </Button>
                <Button
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={() => handleSubmit('published')}
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                  Publiceren
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Zoek op titel of afdeling..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Alle statussen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle statussen</SelectItem>
            <SelectItem value="draft">Concept</SelectItem>
            <SelectItem value="published">Gepubliceerd</SelectItem>
            <SelectItem value="closed">Gesloten</SelectItem>
            <SelectItem value="archived">Gearchiveerd</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {filteredJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="p-4 bg-orange-50 rounded-full mb-4">
            <Briefcase className="h-8 w-8 text-orange-400" />
          </div>
          {jobs.length === 0 ? (
            <>
              <p className="text-base font-medium">Geen vacatures</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Maak je eerste vacature aan om kandidaten te werven
              </p>
              <Button
                className="mt-4 bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Eerste vacature aanmaken
              </Button>
            </>
          ) : (
            <>
              <p className="text-base font-medium">Geen resultaten</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Pas je zoekopdracht of filters aan
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Titel
                </TableHead>
                <TableHead className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                  Afdeling
                </TableHead>
                <TableHead className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                  Locatie
                </TableHead>
                <TableHead className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                  Type
                </TableHead>
                <TableHead className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Status
                </TableHead>
                <TableHead className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                  Kandidaten
                </TableHead>
                <TableHead className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                  Datum
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.map((job) => {
                const status = statusConfig[job.status] || statusConfig.draft;
                return (
                  <TableRow
                    key={job.id}
                    className="cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => router.push(`/dashboard/jobs/${job.id}`)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-[13px]">{job.title}</p>
                        <p className="text-[12px] text-muted-foreground mt-0.5 md:hidden">
                          {job.department || '\u2014'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-[13px] text-muted-foreground">
                      {job.department || '\u2014'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {job.location ? (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          <span className="text-[13px]">{job.location}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50">\u2014</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="text-[13px] text-muted-foreground">
                        {employmentTypeLabels[job.employmentType] || job.employmentType}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[11px] font-medium ${status.className}`}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span className="text-[13px] tabular-nums">{job.applicationCount}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-[13px] text-muted-foreground">
                        {formatDate(job.createdAt)}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
