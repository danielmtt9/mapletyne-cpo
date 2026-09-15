import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useLiveEvents() {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let sse: EventSource | null = null;
    let retryTimeout: NodeJS.Timeout;

    const connect = () => {
      try {
        sse = new EventSource('/api/v1/events/stream');

        sse.onopen = () => {
          setIsConnected(true);
        };

        // Handle charger status changes
        sse.addEventListener('charger.status', (e) => {
          try {
            const data = JSON.parse(e.data);
            queryClient.invalidateQueries({ queryKey: ['chargers'] });
            if (data.charge_point) {
              queryClient.invalidateQueries({ queryKey: ['charger', data.charge_point] });
            }
            queryClient.invalidateQueries({ queryKey: ['sessions', 'stats'] });
          } catch {
            // Ignore malformed event
          }
        });

        // Handle live high-frequency meter values
        sse.addEventListener('meter.values', (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.charge_point) {
              queryClient.setQueryData(['telemetry', data.charge_point], data);
            }
          } catch {
            // Ignore
          }
        });

        // Handle session events
        sse.addEventListener('session.started', () => {
          queryClient.invalidateQueries({ queryKey: ['sessions'] });
          queryClient.invalidateQueries({ queryKey: ['chargers'] });
        });

        sse.addEventListener('session.stopped', () => {
          queryClient.invalidateQueries({ queryKey: ['sessions'] });
          queryClient.invalidateQueries({ queryKey: ['chargers'] });
        });

        sse.onerror = () => {
          setIsConnected(false);
          sse?.close();
          retryTimeout = setTimeout(connect, 5000);
        };
      } catch {
        setIsConnected(false);
        retryTimeout = setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      clearTimeout(retryTimeout);
      sse?.close();
    };
  }, [queryClient]);

  return { isConnected };
}
