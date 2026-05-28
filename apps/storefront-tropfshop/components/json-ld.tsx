/**
 * Rendert ein Schema.org-JSON-LD-Script.
 *
 * XSS-sicher: `data` stammt ausschliesslich aus eigenem Content (Medusa-Katalog,
 * lib/ratgeber.ts, shop-config) — niemals aus Nutzereingaben. `JSON.stringify`
 * escaped die Werte; gleiches Muster wie das Organization-JSON-LD in
 * app/layout.tsx. Siehe Skill `schema` (.claude/skills/schema).
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
