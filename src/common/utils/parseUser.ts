export function  parseUsers (raw: unknown): string[] {
  // If already an array of strings
  if (Array.isArray(raw)) {
    // If it looks like ["[...'", "'...]" ] join it
    const joined = raw.join(",").trim();

    // Try JSON parse first
    try {
      const parsed = JSON.parse(joined);
      if (Array.isArray(parsed)) return parsed.map(String).map(s => s.trim()).filter(Boolean);
    } catch {}

    // Fallback: treat as comma list
    return joined
      .replace(/^\[|\]$/g, "")           // remove [ ]
      .replace(/"/g, "")                // remove quotes
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
  }

  // If it's a string
  if (typeof raw === "string") {
    const s = raw.trim();

    // JSON array string?
    if (s.startsWith("[") && s.endsWith("]")) {
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) return parsed.map(String).map(x => x.trim()).filter(Boolean);
      } catch {}
    }

    // Comma separated
    return s.split(",").map(x => x.trim()).filter(Boolean);
  }

  return [];
}