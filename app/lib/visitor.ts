export function getVisitorId() {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem("speak-power-visitor-id");
  if (existing) return existing;
  const created = crypto.randomUUID();
  window.localStorage.setItem("speak-power-visitor-id", created);
  return created;
}
