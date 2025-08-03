// hooks/useApi.ts
import { useEffect, useState, useCallback } from 'react';
import { get, post, put, del } from '../lib/apiCall';

type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export function useApi<Res, Req = undefined>(
  method: HTTPMethod,
  url: string,
  options?: {
    body?: Req;
    autoFetch?: boolean;
    skip?: boolean; // useful for conditional fetching
  }
) {
  const [data, setData] = useState<Res | null>(null);
  const [loading, setLoading] = useState<boolean>(!!options?.autoFetch);
  const [error, setError] = useState<unknown>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let response: Res;

      switch (method) {
        case 'GET':
          response = await get<Res>(url);
          break;
        case 'POST':
          response = await post<Res, Req>(url, options?.body as Req);
          break;
        case 'PUT':
          response = await put<Res, Req>(url, options?.body as Req);
          break;
        case 'DELETE':
          response = await del<Res, Req>(url, options?.body);
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }

      setData(response);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [method, url, options?.body]);
  
  useEffect(() => {
    fetchData();
    // if (options?.autoFetch && !options?.skip) {
    // }
  }, [fetchData, options?.autoFetch, options?.skip]);

  return { data, loading, error, refetch: fetchData, setData };
}