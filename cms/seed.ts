/**
 * Runner shim — the seed implementation lives in the cms-sdk workspace package
 * so it is linted/typechecked with the rest of the code.
 * Run via: pnpm cms:seed   (or: pnpm --filter @astro-note/cms-sdk seed)
 */
import "../packages/cms-sdk/scripts/seed";
