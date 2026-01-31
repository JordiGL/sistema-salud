import { metricApi } from '@/lib/api';
import { Dashboard } from '@/components/Dashboard';

interface PageProps {
  params: { locale: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function Home({ params, searchParams }: PageProps) {
  const metrics = await metricApi.getAll();

  return (
    <main>
      <Dashboard initialMetrics={metrics} />
    </main>
  );
}