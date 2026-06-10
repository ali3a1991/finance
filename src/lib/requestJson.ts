type RequestJsonOptions = RequestInit & {
  authenticated?: boolean;
};

function getAuthHeaders() {
  const token = localStorage.getItem("finance_token");

  return token
    ? {
        Authorization: `Bearer ${token}`
      }
    : {};
}

function setApiLoading(isLoading: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(isLoading ? "finance-api-loading-start" : "finance-api-loading-end"));
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
