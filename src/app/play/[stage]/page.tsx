import { notFound } from "next/navigation";
import { getStage, Stages } from "@/data/stages";
import { PlayScreen } from "@/features/play/PlayScreen";

export function generateStaticParams() {
  return Stages.map((s) => ({ stage: String(s.id) }));
}

export async function generateMetadata({ params }: { params: Promise<{ stage: string }> }) {
  const stage = getStage(Number((await params).stage));
  return { title: stage ? `${stage.name} · Netloop` : "Netloop" };
}

export default async function Page({ params }: { params: Promise<{ stage: string }> }) {
  const id = Number((await params).stage);
  if (!getStage(id)) notFound();
  return <PlayScreen key={id} stageId={id} />;
}
