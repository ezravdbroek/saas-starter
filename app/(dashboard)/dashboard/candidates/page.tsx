'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Users,
  Plus,
  Search,
  Filter,
  MapPin,
  Building2,
  Loader2,
  X,
} from 'lucide-react';
import { getCandidates, createCandidate } from '@/lib/actions/candidates';

type CandidateRow = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  currentTitle: string | null;
  currentCompany: string | null;
  location: string | null;
  source: string;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  notes: string | null;
  tags: string | null;
  createdAt: Date;
  updatedAt: Date;
  applicationCount: number;
};

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
  manual: 'bg-muted text-muted-foreground border-border',
  other: 'bg-muted text-muted-foreground border-border',
};

function formatDate(date: Date | string) {
  const d = new Date(date);
  const months = [
    'jan', 'feb', 'mrt', 'apr', 'mei', 'jun',
    'jul', 'aug', 'sep', 'okt', 'nov', 'dec',
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function CandidatesPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    currentTitle: '',
    currentCompany: '',
    location: '',
    source: 'manual',
    linkedinUrl: '',
    notes: '',
  });

  useEffect(() => {
    loadCandidates();
  }, []);

  async function loadCandidates() {
    try {
      const data = await getCandidates();
      setCandidates(data as CandidateRow[]);
    } catch (err) {
      console.error('Fout bij laden kandidaten:', err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    let result = candidates;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.currentTitle && c.currentTitle.toLowerCase().includes(q)) ||
          (c.currentCompany && c.currentCompany.toLowerCase().includes(q))
      );
    }

    if (sourceFilter !== 'all') {
      result = result.filter((c) => c.source === sourceFilter);
    }

    return result;
  }, [candidates, searchQuery, sourceFilter]);

  function resetForm() {
    setForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      currentTitle: '',
      currentCompany: '',
      location: '',
      source: 'manual',
      linkedinUrl: '',
      notes: '',
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) return;

    setSubmitting(true);
    try {
      await createCandidate({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        currentTitle: form.currentTitle.trim() || undefined,
        currentCompany: form.currentCompany.trim() || undefined,
        location: form.location.trim() || undefined,
        source: form.source,
        linkedinUrl: form.linkedinUrl.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });

      resetForm();
      setDialogOpen(false);
      await loadCandidates();
    } catch (err) {
      console.error('Fout bij aanmaken kandidaat:', err);
    } finally {
      setSubmitting(false);
    }
  }

  const activeFilters = sourceFilter !== 'all' ? 1 : 0;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Kandidaten</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading
              ? 'Laden...'
              : candidates.length === 0
              ? 'Je kandidaten database'
              : `${candidates.length} kandidat${candidates.length === 1 ? '' : 'en'} in je database`}
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
              Kandidaat toevoegen
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[540px] max-h-[85vh] overflow-y-auto p-0 gap-0">
            <DialogHeader className="px-6 pt-6 pb-4">
              <DialogTitle className="text-lg">Nieuwe kandidaat</DialogTitle>
              <DialogDescription className="text-[13px]">
                Voeg een nieuwe kandidaat toe aan je database.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit}>
              {/* Persoonlijke gegevens */}
              <div className="border-t px-6 py-5 space-y-4">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Persoonlijke gegevens
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[13px]">
                      Voornaam <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      placeholder="Jan"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[13px]">
                      Achternaam <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      placeholder="de Vries"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[13px]">
                      E-mail <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="jan@voorbeeld.nl"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[13px]">Telefoon</Label>
                    <Input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+31 6 12345678"
                    />
                  </div>
                </div>
              </div>

              {/* Professioneel */}
              <div className="border-t px-6 py-5 space-y-4">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Professioneel
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[13px]">Huidige functie</Label>
                    <Input
                      value={form.currentTitle}
                      onChange={(e) => setForm({ ...form, currentTitle: e.target.value })}
                      placeholder="Software Engineer"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[13px]">Huidig bedrijf</Label>
                    <Input
                      value={form.currentCompany}
                      onChange={(e) => setForm({ ...form, currentCompany: e.target.value })}
                      placeholder="Voorbeeld B.V."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[13px]">Locatie</Label>
                    <Input
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      placeholder="Amsterdam"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[13px]">Bron</Label>
                    <Select value={form.source} onValueChange={(val) => setForm({ ...form, source: val })}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Handmatig</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                        <SelectItem value="indeed">Indeed</SelectItem>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="referral">Referral</SelectItem>
                        <SelectItem value="other">Anders</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px]">LinkedIn URL</Label>
                  <Input
                    value={form.linkedinUrl}
                    onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
              </div>

              {/* Extra */}
              <div className="border-t px-6 py-5 space-y-4">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Extra
                </p>
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Notities</Label>
                  <Textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Eventuele opmerkingen over deze kandidaat..."
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="border-t bg-muted/30 px-6 py-4 flex items-center justify-end gap-2 rounded-b-lg">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setDialogOpen(false)}
                  disabled={submitting}
                >
                  Annuleren
                </Button>
                <Button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                      Toevoegen...
                    </>
                  ) : (
                    'Toevoegen'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Zoek op naam, e-mail, functie..."
            className="pl-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[160px]">
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue placeholder="Bron" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle bronnen</SelectItem>
            <SelectItem value="linkedin">LinkedIn</SelectItem>
            <SelectItem value="indeed">Indeed</SelectItem>
            <SelectItem value="website">Website</SelectItem>
            <SelectItem value="referral">Referral</SelectItem>
            <SelectItem value="manual">Handmatig</SelectItem>
            <SelectItem value="other">Anders</SelectItem>
          </SelectContent>
        </Select>

        {activeFilters > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSourceFilter('all')}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Filters wissen
          </Button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider pl-5">Naam</TableHead>
                <TableHead className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Functie</TableHead>
                <TableHead className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Bedrijf</TableHead>
                <TableHead className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Locatie</TableHead>
                <TableHead className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Bron</TableHead>
                <TableHead className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider text-center hidden sm:table-cell">Sollicitaties</TableHead>
                <TableHead className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider pr-5 hidden md:table-cell">Toegevoegd</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  <TableCell className="pl-5">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-muted animate-pulse flex-shrink-0" />
                      <div className="space-y-1.5">
                        <div className="h-3.5 w-28 bg-muted animate-pulse rounded" />
                        <div className="h-3 w-36 bg-muted/60 animate-pulse rounded" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell"><div className="h-3.5 w-24 bg-muted/60 animate-pulse rounded" /></TableCell>
                  <TableCell className="hidden lg:table-cell"><div className="h-3.5 w-20 bg-muted/60 animate-pulse rounded" /></TableCell>
                  <TableCell className="hidden lg:table-cell"><div className="h-3.5 w-20 bg-muted/60 animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-5 w-16 bg-muted/60 animate-pulse rounded-full" /></TableCell>
                  <TableCell className="text-center hidden sm:table-cell"><div className="h-3.5 w-6 bg-muted/60 animate-pulse rounded mx-auto" /></TableCell>
                  <TableCell className="pr-5 hidden md:table-cell"><div className="h-3.5 w-20 bg-muted/60 animate-pulse rounded" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : candidates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="p-4 bg-orange-50 rounded-full mb-4">
            <Users className="h-8 w-8 text-orange-400" />
          </div>
          <p className="text-base font-medium">Geen kandidaten</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Kandidaten verschijnen hier zodra ze solliciteren of worden toegevoegd
          </p>
          <Button
            className="mt-4 bg-orange-500 hover:bg-orange-600 text-white"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Eerste kandidaat toevoegen
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="p-4 bg-muted rounded-full mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-base font-medium">Geen resultaten</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Probeer andere zoektermen of filters
          </p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider pl-5">
                  Naam
                </TableHead>
                <TableHead className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                  Functie
                </TableHead>
                <TableHead className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                  Bedrijf
                </TableHead>
                <TableHead className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                  Locatie
                </TableHead>
                <TableHead className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Bron
                </TableHead>
                <TableHead className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider text-center hidden sm:table-cell">
                  Sollicitaties
                </TableHead>
                <TableHead className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider pr-5 hidden md:table-cell">
                  Toegevoegd
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((candidate) => (
                <TableRow
                  key={candidate.id}
                  onClick={() => router.push(`/dashboard/candidates/${candidate.id}`)}
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="pl-5">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-[12px] font-semibold">
                          {candidate.firstName[0]}{candidate.lastName[0]}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium truncate">
                          {candidate.firstName} {candidate.lastName}
                        </p>
                        <p className="text-[12px] text-muted-foreground truncate">
                          {candidate.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-[13px] text-muted-foreground">
                      {candidate.currentTitle || <span className="opacity-40">\u2014</span>}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {candidate.currentCompany ? (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="text-[13px]">{candidate.currentCompany}</span>
                      </div>
                    ) : (
                      <span className="text-[13px] text-muted-foreground/40">\u2014</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {candidate.location ? (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="text-[13px]">{candidate.location}</span>
                      </div>
                    ) : (
                      <span className="text-[13px] text-muted-foreground/40">\u2014</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                        sourceColors[candidate.source] || sourceColors.other
                      }`}
                    >
                      {sourceLabels[candidate.source] || candidate.source}
                    </span>
                  </TableCell>
                  <TableCell className="text-center hidden sm:table-cell">
                    <span className="text-[13px] tabular-nums">
                      {candidate.applicationCount}
                    </span>
                  </TableCell>
                  <TableCell className="pr-5 hidden md:table-cell">
                    <span className="text-[13px] text-muted-foreground">
                      {formatDate(candidate.createdAt)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
