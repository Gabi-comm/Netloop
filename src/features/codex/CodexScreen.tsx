import { Placeholder } from "@/components/Placeholder";
import { DataPill, Screen, TopBar } from "@/components/ui";

export function CodexScreen() {
  return (
    <Screen>
      <TopBar title="CODEX" right={<DataPill />} />
      <Placeholder owner="the Codex team" folder="src/features/codex/" />
    </Screen>
  );
}
