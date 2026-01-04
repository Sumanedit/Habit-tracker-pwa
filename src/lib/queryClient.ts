import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import localforage from 'localforage';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      gcTime: 1000 * 60 * 60 * 24, // 24 hours (renamed from cacheTime in v5)
      refetchOnWindowFocus: false,
      refetchOnReconnect: true
    }
  }
});

const persister = createAsyncStoragePersister({
  storage: localforage,
  key: 'habit-tracker-cache'
});

persistQueryClient({
  queryClient,
  persister,
  maxAge: 1000 * 60 * 60 * 24 // 24 hours
});
