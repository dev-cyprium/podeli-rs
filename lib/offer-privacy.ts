// Claim-link secrets must not be retained in analytics, including referrers and
// encoded authentication redirect URLs.
export function redactOfferUrl(value: string) {
  return value.replace(/(\/ponuda\/|%2Fponuda%2F)[a-f0-9]{64}/gi, "$1predlog");
}

export function redactOfferLinks<T>(value: T): T {
  if (typeof value === "string") return redactOfferUrl(value) as T;
  if (Array.isArray(value)) return value.map(redactOfferLinks) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [
        key,
        key === "token" &&
        typeof child === "string" &&
        /^[a-f0-9]{64}$/.test(child)
          ? "predlog"
          : redactOfferLinks(child),
      ]),
    ) as T;
  }
  return value;
}
