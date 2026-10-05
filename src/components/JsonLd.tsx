import type React from 'react';
import type { Node } from '@/content/structuredData';

/**
 * Structured data for one page, as one `@graph`. A server component: it is
 * markup for crawlers and has nothing to hydrate.
 *
 * `<` is escaped because the graph carries CMS text, and a string containing
 * `</script>` would otherwise close the tag early — the sanitising Next's own
 * JSON-LD guide asks for.
 */
export default function JsonLd({ graph }: { graph: Node[] }): React.ReactElement {
  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: serialised JSON-LD, with < escaped
      dangerouslySetInnerHTML={{ __html: json.replace(/</g, '\\u003c') }}
    />
  );
}
