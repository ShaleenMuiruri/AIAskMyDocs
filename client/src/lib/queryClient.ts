import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Ensure URL has /api prefix
  // Simplified URL handling for proxy compatibility
  const apiUrl = url.startsWith('/api') 
    ? url 
    : `/api${url.startsWith('/') ? url : `/${url}`}`;
  
  
  const res = await fetch(apiUrl, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Extract and format URL from queryKey
    const url = queryKey[0] as string;
    const params = queryKey[1] as Record<string, string> | undefined;
    
    // Ensure URL has /api prefix (simple and reliable)
    const apiUrl = url.startsWith('/api') 
      ? url 
      : `/api${url.startsWith('/') ? url : `/${url}`}`;
    
    // Add query parameters if present
    const fullUrl = params 
      ? `${apiUrl}${apiUrl.includes('?') ? '&' : '?'}${new URLSearchParams(params)}` 
      : apiUrl;
    
    console.log(`Making query request to: ${fullUrl}`);
    
    const res = await fetch(fullUrl, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
