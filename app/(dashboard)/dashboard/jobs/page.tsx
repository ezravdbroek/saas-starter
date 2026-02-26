import { getJobs } from '@/lib/actions/jobs';
import { JobsListClient } from './jobs-list-client';

export default async function JobsPage() {
  const jobs = await getJobs();

  return <JobsListClient jobs={jobs} />;
}
