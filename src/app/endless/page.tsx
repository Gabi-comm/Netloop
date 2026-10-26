import { ENDLESS_ID } from "@/data/stages";
import { PlayScreen } from "@/features/play/PlayScreen";

export const metadata = { title: "The Cloud · Endless · Netloop" };

export default function Page() {
  return <PlayScreen stageId={ENDLESS_ID} />;
}
