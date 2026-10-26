import { Placeholder } from "@/components/Placeholder";
import { DataPill, Screen, TopBar } from "@/components/ui";

export function ShopScreen() {
  return (
    <Screen>
      <TopBar title="SHOP" right={<DataPill />} />
      <Placeholder owner="the Shop team" folder="src/features/shop/" />
    </Screen>
  );
}
