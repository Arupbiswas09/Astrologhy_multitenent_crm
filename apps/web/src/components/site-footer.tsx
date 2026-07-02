import Link from "next/link";
import type { TenantSettings } from "@astro-note/cms-sdk";

/** Shared footer: CMS links, support email, and the required disclaimer. */
export function SiteFooter({
  settings,
  tenantName,
}: {
  settings: TenantSettings | null;
  tenantName: string;
}) {
  const links = settings?.footer_links ?? [
    { label: "Privacy", url: "/privacy" },
    { label: "Terms", url: "/terms" },
  ];
  return (
    <footer className="mt-16 border-t border-ink-700 px-6 py-10 text-center text-sm text-paper-300">
      <nav className="mb-4 flex justify-center gap-6">
        {links.map((link) => (
          <Link
            key={link.url}
            href={link.url}
            className="underline-offset-4 hover:text-paper-100 hover:underline"
          >
            {link.label}
          </Link>
        ))}
        {settings?.support_email ? (
          <a
            href={`mailto:${settings.support_email}`}
            className="underline-offset-4 hover:text-paper-100 hover:underline"
          >
            Contact
          </a>
        ) : null}
      </nav>
      <p className="mb-2 font-annotation text-base text-paper-300/80">
        For entertainment and self-reflection purposes.
      </p>
      <p>
        © {new Date().getFullYear()} {tenantName}
      </p>
    </footer>
  );
}
