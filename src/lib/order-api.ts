import "server-only";
export async function systemOrderRequest(path: string, method: "GET" | "POST", body?: unknown, clientIp?: string) {
  const base = process.env.MATA3_PUBLIC_API_BASE_URL;
  if (!base) throw new Error("System unavailable");
  const response = await fetch(base.replace(/\/$/, "") + "/api/public/v1/" + path, {
    method, cache: "no-store", headers: method === "POST" ? { "Content-Type": "application/json", ...(clientIp ? { "X-MATA3-Client-IP": clientIp } : {}) } : {},
    ...(method === "POST" ? { body: JSON.stringify(body) } : {}),
  });
  const value: unknown = await response.json();
  return { status: response.status, value };
}
