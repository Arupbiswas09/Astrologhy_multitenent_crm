import Link from "next/link";
import { notFound } from "next/navigation";
import { Markdown } from "@/lib/markdown";
import { SiteFooter } from "@/components/site-footer";
import { getTenant, getTenantSettings } from "@/lib/cms";

export const revalidate = 300;

export default async function TermsPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params;
  const tenant = await getTenant(slug);
  if (!tenant) notFound();
  const settings = await getTenantSettings(tenant.id);

  return (
    <main className="mx-auto w-full max-w-md px-6 pt-10 md:max-w-lg">
      <Link href="/" className="font-annotation text-xl text-gold-400">
        ← {tenant.name}
      </Link>
      <Markdown
        className="mt-8 text-paper-300"
        text={settings?.terms ?? "# Terms of Service\n\nThese terms have not been published yet."}
      />
      <SiteFooter settings={settings} tenantName={tenant.name} />
    </main>
  );
}
