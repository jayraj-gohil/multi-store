import { ErrorMessage } from '../components/ErrorMessage';
import { Loader } from '../components/Loader';
import { useHealthCheck } from '../hooks/useHealthCheck';

export function HomePage() {
  const health = useHealthCheck();

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Frontend is running</h1>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 font-semibold text-slate-800">Backend health check</h2>
        {health.status === 'loading' && <Loader label="Checking backend…" />}
        {health.status === 'connected' && (
          <p className="font-medium text-green-700">Connected (API and database are up)</p>
        )}
        {health.status === 'error' && (
          <ErrorMessage title="Not connected" message={health.message} onRetry={health.retry} />
        )}
      </div>
    </section>
  );
}
