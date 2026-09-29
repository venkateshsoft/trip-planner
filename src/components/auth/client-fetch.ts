export function safeReturnPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export function loginPath(returnPath: string) {
  return `/login?returnTo=${encodeURIComponent(safeReturnPath(returnPath))}`;
}

export async function fetchWithSession(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  const response = await fetch(input, { ...init, credentials: "same-origin" });
  if (response.status === 401 && typeof window !== "undefined") {
    const returnPath = `${window.location.pathname}${window.location.search}`;
    window.location.assign(loginPath(returnPath));
  }
  return response;
}

