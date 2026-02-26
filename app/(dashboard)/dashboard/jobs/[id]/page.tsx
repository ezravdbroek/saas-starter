import { notFound } from 'next/navigation';
import { getJobById, getApplicationsForJob } from '@/lib/actions/jobs';
import { JobDetailClient } from './job-detail-client';

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const jobId = parseInt(id, 10);

  if (isNaN(jobId)) {
    notFound();
  }

  const job = await getJobById(jobId);

  if (!job) {
    notFound();
  }

  const applications = await getApplicationsForJob(jobId);

  return <JobDetailClient job={job} applications={applications} />;
}
