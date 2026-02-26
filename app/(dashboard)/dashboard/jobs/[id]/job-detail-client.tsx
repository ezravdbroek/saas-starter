'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { updateJob, updateJobStatus, deleteJob } from '@/lib/actions/jobs';
import type { Job } from '@/lib/db/schema';
import {
  ArrowLeft,
  MapPin,
  Building2,
  Clock,
  GraduationCap,
  Euro,
  Pencil,
  Trash2,
  Users,
  Calendar,
  Loader2,
  Briefcase,
  FileText,
  Globe,
} from 'lucide-react';

type Application = {
  id: number;
  stage: string;
  createdAt: Date;
  candidateId: number;
  firstName: string;
  lastName: string;
  email: string;
  currentTitle: string | null;
};

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: {
    label: 'Concept',
    className: 'bg-muted text-muted-foreground border-border',
  },
  published: {
    label: 'Gepubliceerd',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  closed: {
    label: 'Gesloten',
    className: 'bg-red-50 text-red-700 border-red-200',
  },
  archived: {
    label: 'Gearchiveerd',
    className: 'bg-muted text-muted-foreground border-border',
  },
};

const stageLabels: Record<string, string> = {
  applied: 'Gesolliciteerd',
  screening: 'Screening',
  interview: 'Interview',
  assessment: 'Assessment',
  offer: 'Aanbod',
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

const employmentTypeLabels: Record<string, string> = {
  fulltime: 'Fulltime',
  parttime: 'Parttime',
  contract: 'Contract',
  internship: 'Stage',
};

const locationTypeLabels: Record<string, string> = {
  onsite: 'Op locatie',
  remote: 'Remote',
  hybrid: 'Hybride',
};

const experienceLevelLabels: Record<string, string> = {
  junior: 'Junior',
  medior: 'Medior',
  senior: 'Senior',
  lead: 'Lead',
};

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateShort(date: Date) {
  return new Date(date).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatSalary(min: number | null, max: number | null, currency: string | null) {
  const cur = currency || 'EUR';
  if (min && max) {
    return `${cur} ${min.toLocaleString('nl-NL')} – ${max.toLocaleString('nl-NL')}`;
  }
  if (min) return `Vanaf ${cur} ${min.toLocaleString('nl-NL')}`;
  if (max) return `Tot ${cur} ${max.toLocaleString('nl-NL')}`;
  return null;
}

export function JobDetailClient({
  job,
  applications,
}: {
  job: Job;
  applications: Application[];
}) {
  const router = useRouter();
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [editTitle, setEditTitle] = useState(job.title);
  const [editDepartment, setEditDepartment] = useState(job.department || '');
  const [editLocation, setEditLocation] = useState(job.location || '');
  const [editLocationType, setEditLocationType] = useState(job.locationType);
  const [editEmploymentType, setEditEmploymentType] = useState(job.employmentType);
  const [editExperienceLevel, setEditExperienceLevel] = useState(job.experienceLevel || '');
  const [editSalaryMin, setEditSalaryMin] = useState(job.salaryMin?.toString() || '');
  const [editSalaryMax, setEditSalaryMax] = useState(job.salaryMax?.toString() || '');
  const [editDescription, setEditDescription] = useState(job.description || '');
  const [editRequirements, setEditRequirements] = useState(job.requirements || '');
  const [editResponsibilities, setEditResponsibilities] = useState(job.responsibilities || '');

  const status = statusConfig[job.status] || statusConfig.draft;
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency);

  async function handleStatusChange(newStatus: string) {
    setIsStatusUpdating(true);
    try {
      await updateJobStatus(job.id, newStatus);
      router.refresh();
    } catch {
    } finally {
      setIsStatusUpdating(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteJob(job.id);
    } catch {
      setIsDeleting(false);
    }
  }

  async function handleSaveEdit() {
    if (!editTitle.trim()) return;
    setIsSaving(true);
    try {
      await updateJob(job.id, {
        title: editTitle.trim(),
        department: editDepartment.trim() || undefined,
        location: editLocation.trim() || undefined,
        locationType: editLocationType,
        employmentType: editEmploymentType,
        experienceLevel: editExperienceLevel || undefined,
        salaryMin: editSalaryMin ? parseInt(editSalaryMin, 10) : undefined,
        salaryMax: editSalaryMax ? parseInt(editSalaryMax, 10) : undefined,
        description: editDescription.trim() || undefined,
        requirements: editRequirements.trim() || undefined,
        responsibilities: editResponsibilities.trim() || undefined,
      });
      setIsEditing(false);
      router.refresh();
    } catch {
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Back navigation */}
      <Link
        href="/dashboard/jobs"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors mb-5"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Vacatures
      </Link>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main column */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Header card */}
          <Card className="py-0 gap-0 overflow-hidden">
            <div className="px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-xl font-semibold truncate">{job.title}</h1>
                    <Badge variant="outline" className={`${status.className} text-[11px] flex-shrink-0`}>
                      {status.label}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                    {job.department && (
                      <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5" />
                        {job.department}
                      </span>
                    )}
                    {job.location && (
                      <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {job.location}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {employmentTypeLabels[job.employmentType] || job.employmentType}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setIsEditing(true)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Vacature verwijderen</DialogTitle>
                        <DialogDescription>
                          Weet je zeker dat je &quot;{job.title}&quot; wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                          Annuleren
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                          {isDeleting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                          Verwijderen
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
            {/* Status bar */}
            <div className="px-6 py-3 bg-muted/40 border-t flex items-center justify-between">
              <span className="text-[12px] text-muted-foreground">
                Aangemaakt op {formatDate(job.createdAt)}
              </span>
              <Select value={job.status} onValueChange={handleStatusChange} disabled={isStatusUpdating}>
                <SelectTrigger className="h-7 w-[150px] text-[12px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Concept</SelectItem>
                  <SelectItem value="published">Gepubliceerd</SelectItem>
                  <SelectItem value="closed">Gesloten</SelectItem>
                  <SelectItem value="archived">Gearchiveerd</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="overview">
            <TabsList variant="line" className="border-b w-full justify-start gap-0">
              <TabsTrigger value="overview" className="text-[13px]">
                Overzicht
              </TabsTrigger>
              <TabsTrigger value="candidates" className="text-[13px]">
                Kandidaten
                {applications.length > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-orange-100 text-orange-700 text-[11px] font-medium px-1.5">
                    {applications.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Overzicht Tab */}
            <TabsContent value="overview" className="mt-5 space-y-5">
              {/* Description sections in single card */}
              {(job.description || job.requirements || job.responsibilities) ? (
                <Card className="py-0 gap-0 overflow-hidden">
                  {job.description && (
                    <div className="p-5">
                      <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" />
                        Functiebeschrijving
                      </h3>
                      <p className="text-[13px] text-foreground/80 leading-relaxed whitespace-pre-wrap">
                        {job.description}
                      </p>
                    </div>
                  )}
                  {job.requirements && (
                    <div className={`p-5 ${job.description ? 'border-t' : ''}`}>
                      <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Vereisten
                      </h3>
                      <p className="text-[13px] text-foreground/80 leading-relaxed whitespace-pre-wrap">
                        {job.requirements}
                      </p>
                    </div>
                  )}
                  {job.responsibilities && (
                    <div className={`p-5 ${job.description || job.requirements ? 'border-t' : ''}`}>
                      <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Verantwoordelijkheden
                      </h3>
                      <p className="text-[13px] text-foreground/80 leading-relaxed whitespace-pre-wrap">
                        {job.responsibilities}
                      </p>
                    </div>
                  )}
                </Card>
              ) : (
                <Card className="py-0 gap-0">
                  <div className="py-16 flex flex-col items-center text-center">
                    <div className="p-3 bg-orange-50 rounded-full mb-3">
                      <FileText className="h-6 w-6 text-orange-400" />
                    </div>
                    <p className="text-[14px] font-medium">Nog geen beschrijving</p>
                    <p className="text-[13px] text-muted-foreground mt-1">
                      Voeg een beschrijving, vereisten en verantwoordelijkheden toe
                    </p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => setIsEditing(true)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Bewerken
                    </Button>
                  </div>
                </Card>
              )}
            </TabsContent>

            {/* Kandidaten Tab */}
            <TabsContent value="candidates" className="mt-5">
              {applications.length === 0 ? (
                <div className="py-16 flex flex-col items-center text-center">
                  <div className="p-3 bg-orange-50 rounded-full mb-3">
                    <Users className="h-6 w-6 text-orange-400" />
                  </div>
                  <p className="text-[14px] font-medium">Nog geen kandidaten</p>
                  <p className="text-[13px] text-muted-foreground mt-1">
                    Kandidaten die solliciteren verschijnen hier
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider pl-5">
                          Kandidaat
                        </TableHead>
                        <TableHead className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                          Huidige functie
                        </TableHead>
                        <TableHead className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Fase
                        </TableHead>
                        <TableHead className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell pr-5">
                          Datum
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applications.map((app) => (
                        <TableRow
                          key={app.id}
                          className="cursor-pointer hover:bg-muted/30 transition-colors"
                          onClick={() => router.push(`/dashboard/candidates/${app.candidateId}`)}
                        >
                          <TableCell className="pl-5">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-[11px] font-semibold">
                                  {app.firstName[0]}{app.lastName[0]}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className="text-[13px] font-medium truncate">
                                  {app.firstName} {app.lastName}
                                </p>
                                <p className="text-[12px] text-muted-foreground truncate">{app.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <span className="text-[13px] text-muted-foreground">
                              {app.currentTitle || '\u2014'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                                stageColors[app.stage] || 'bg-muted text-muted-foreground border-border'
                              }`}
                            >
                              {stageLabels[app.stage] || app.stage}
                            </span>
                          </TableCell>
                          <TableCell className="hidden md:table-cell pr-5">
                            <span className="text-[13px] text-muted-foreground">
                              {formatDateShort(app.createdAt)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-72 flex-shrink-0">
          <div className="lg:sticky lg:top-6 space-y-4">
            {/* Details */}
            <Card className="py-0 gap-0">
              <div className="p-5">
                <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Details
                </h3>
                <dl className="space-y-3">
                  <div className="flex items-center justify-between">
                    <dt className="text-[13px] text-muted-foreground flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      Kandidaten
                    </dt>
                    <dd className="text-[13px] font-semibold tabular-nums">{applications.length}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-[13px] text-muted-foreground flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      Dienstverband
                    </dt>
                    <dd className="text-[13px]">{employmentTypeLabels[job.employmentType] || job.employmentType}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-[13px] text-muted-foreground flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5" />
                      Locatie type
                    </dt>
                    <dd className="text-[13px]">{locationTypeLabels[job.locationType] || job.locationType}</dd>
                  </div>
                  {job.experienceLevel && (
                    <div className="flex items-center justify-between">
                      <dt className="text-[13px] text-muted-foreground flex items-center gap-1.5">
                        <GraduationCap className="h-3.5 w-3.5" />
                        Niveau
                      </dt>
                      <dd className="text-[13px]">{experienceLevelLabels[job.experienceLevel] || job.experienceLevel}</dd>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <dt className="text-[13px] text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Aangemaakt
                    </dt>
                    <dd className="text-[13px] text-foreground/80">{formatDateShort(job.createdAt)}</dd>
                  </div>
                </dl>
              </div>
            </Card>

            {/* Salary */}
            {salary && (
              <Card className="py-0 gap-0">
                <div className="p-5">
                  <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Salaris
                  </h3>
                  <p className="text-[15px] font-semibold">{salary}</p>
                </div>
              </Card>
            )}

            {/* Stage breakdown */}
            {applications.length > 0 && (
              <Card className="py-0 gap-0">
                <div className="p-5">
                  <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Per fase
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(
                      applications.reduce<Record<string, number>>((acc, app) => {
                        acc[app.stage] = (acc[app.stage] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([stage, count]) => (
                      <div key={stage} className="flex items-center justify-between py-0.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                            stageColors[stage] || 'bg-muted text-muted-foreground border-border'
                          }`}
                        >
                          {stageLabels[stage] || stage}
                        </span>
                        <span className="text-[13px] font-semibold tabular-nums">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[580px] max-h-[85vh] overflow-y-auto p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-lg">Vacature bewerken</DialogTitle>
            <DialogDescription className="text-[13px]">
              Pas de details van deze vacature aan.
            </DialogDescription>
          </DialogHeader>

          {/* Basis */}
          <div className="border-t px-6 py-5 space-y-4">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Basis informatie
            </p>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Titel <span className="text-red-400">*</span></Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[13px]">Afdeling</Label>
                <Input value={editDepartment} onChange={(e) => setEditDepartment(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px]">Locatie</Label>
                <Input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[13px]">Locatie type</Label>
                <Select value={editLocationType} onValueChange={setEditLocationType}>
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
                <Select value={editEmploymentType} onValueChange={setEditEmploymentType}>
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
                <Select value={editExperienceLevel} onValueChange={setEditExperienceLevel}>
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[13px]">Minimum</Label>
                <Input type="number" value={editSalaryMin} onChange={(e) => setEditSalaryMin(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px]">Maximum</Label>
                <Input type="number" value={editSalaryMax} onChange={(e) => setEditSalaryMax(e.target.value)} />
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
              <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={4} className="resize-none" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Vereisten</Label>
              <Textarea value={editRequirements} onChange={(e) => setEditRequirements(e.target.value)} rows={4} className="resize-none" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Verantwoordelijkheden</Label>
              <Textarea value={editResponsibilities} onChange={(e) => setEditResponsibilities(e.target.value)} rows={4} className="resize-none" />
            </div>
          </div>

          {/* Footer */}
          <div className="border-t bg-muted/30 px-6 py-4 rounded-b-lg">
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsEditing(false)}>
                Annuleren
              </Button>
              <Button
                className="bg-orange-500 hover:bg-orange-600 text-white"
                onClick={handleSaveEdit}
                disabled={isSaving || !editTitle.trim()}
              >
                {isSaving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                Opslaan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
