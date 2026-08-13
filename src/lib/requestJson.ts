type RequestJsonOptions = RequestInit & {
  authenticated?: boolean;
};

let pendingRequests = 0;
const apiLoadingListeners = new Set<() => void>();

export function subscribeApiLoading(listener: () => void) {
  apiLoadingListeners.add(listener);
  return () => apiLoadingListeners.delete(listener);
}

export function getApiLoadingSnapshot() {
  return pendingRequests > 0;
}

function getAuthHeaders() {
  const token = localStorage.getItem("finance_token");

  return token
    ? {
        Authorization: `Bearer ${token}`
      }
    : {};
}

function setApiLoading(isLoading: boolean) {
  pendingRequests = isLoading ? pendingRequests + 1 : Math.max(0, pendingRequests - 1);
  apiLoadingListeners.forEach((listener) => listener());
}

export async function requestJson<T>(url: string, options: RequestJsonOptions = {}) {
  const { authenticated = true, headers, ...fetchOptions } = options;
  const requestHeaders = new Headers(headers);
  requestHeaders.set("Content-Type", requestHeaders.get("Content-Type") || "application/json");

  if (authenticated) {
    Object.entries(getAuthHeaders()).forEach(([key, value]) => {
      requestHeaders.set(key, value);
    });
  }

  setApiLoading(true);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: requestHeaders
    });

    const responseBody = response.headers.get("content-type")?.includes("application/json")
      ? await response.json()
      : null;

    if (authenticated && response.status === 401) {
      window.location.href = "/login";
      throw new Error("Nicht autorisiert");
    }

    if (!response.ok) {
      throw new Error(responseBody?.message || "API request failed");
    }

    return responseBody as T;
  } finally {
    setApiLoading(false);
  }
}
