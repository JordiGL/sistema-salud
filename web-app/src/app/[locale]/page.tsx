import { metricApi } from '@/lib/api';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { Metric } from '@/types/metrics';

interface PageProps {
  params: { locale: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function Home({ params, searchParams }: PageProps) {
  // Artificial delay for branding experience (Loading.tsx)
  await new Promise((resolve) => setTimeout(resolve, 2500));

  const metrics: Metric[] = await metricApi.getAll();

  return (
    <main>
      <Dashboard initialMetrics={metrics} />
    </main>
  );
}