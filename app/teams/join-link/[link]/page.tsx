import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { JoinLinkFlow } from "@/components/join-link-flow";
import { decodeSessionToken } from "@/lib/session";

type PageProps = {
  params: Promise<{ link: string }>;
};

export default async function JoinViaLinkPage({ params }: PageProps) {
  const resolvedParams = await params;
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("zd_session")?.value;
  const isAuthenticated = Boolean(decodeSessionToken(sessionToken));

  if (!isAuthenticated) {
    redirect(`/register?next=${encodeURIComponent(`/teams/join-link/${resolvedParams.link}`)}`);
  }

  return <JoinLinkFlow link={resolvedParams.link} />;
}
