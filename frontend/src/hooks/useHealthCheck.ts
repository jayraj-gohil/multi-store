import { useEffect, useState } from 'react';
import { getApiErrorMessage } from '../services/api';
import { getReadiness } from '../services/health.service';

type HealthState =
  { status: 'loading' } | { status: 'connected' } | { status: 'error'; message: string };

export function useHealthCheck() {
  const [state, setState] = useState<HealthState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getReadiness()
      .then(() => {
        if (!cancelled) setState({ status: 'connected' });
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({ status: 'error', message: getApiErrorMessage(error) });
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = () => {
    setState({ status: 'loading' });
    setAttempt((n) => n + 1);
  };

  return { ...state, retry };
}
