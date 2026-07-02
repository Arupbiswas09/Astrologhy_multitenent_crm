import { notFound } from "next/navigation";
import { getTenant } from "@/lib/cms";

/** Phase 4 replaces this with the CMS-driven quiz step machine. */
export const revalidate = 300;

export default async function QuizPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params;
  const tenant = await getTenant(slug);
  if (!tenant) notFound();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="font-annotation text-2xl text-gold-400">{tenant.name}</p>
      <h1 className="mt-4 font-display text-3xl">The quiz arrives in Phase 4.</h1>
    </main>
  );
}
