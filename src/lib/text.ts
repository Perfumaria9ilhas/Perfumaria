const mojibakePattern = /(?:Ã.|Â.|â.|�)/;
const mojibakeCharPattern = /[ÃÂâ�]/g;
const utf8Decoder = new TextDecoder("utf-8");

function countMojibakeChars(value: string) {
  return (value.match(mojibakeCharPattern) ?? []).length;
}

function decodeMojibake(value: string) {
  const bytes = Uint8Array.from(Array.from(value).map((character) => character.charCodeAt(0)));
  return utf8Decoder.decode(bytes);
}

export function normalizeText(value?: string | null) {
  if (!value) {
    return value ?? "";
  }

  if (!mojibakePattern.test(value)) {
    return value;
  }

  try {
    const decoded = decodeMojibake(value);
    return countMojibakeChars(decoded) < countMojibakeChars(value) ? decoded : value;
  } catch {
    return value;
  }
}

export function normalizeObjectText<T>(value: T): T {
  if (typeof value === "string") {
    return normalizeText(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeObjectText(item)) as T;
  }

  if (!value || typeof value !== "object" || value instanceof Date || value instanceof Uint8Array) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [key, normalizeObjectText(nestedValue)]),
  ) as T;
}
