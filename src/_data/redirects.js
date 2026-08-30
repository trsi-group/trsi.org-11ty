/**
 * The redirect table, resolved from src/_data/slugAliases.json.
 *
 * Lives here so src/_redirects.liquid can render it and the build guard can
 * check it against the same source.
 */
import { resolvedRedirects } from '../../cms/scripts/slugAliases.js';

export default function () {
  return resolvedRedirects();
}
