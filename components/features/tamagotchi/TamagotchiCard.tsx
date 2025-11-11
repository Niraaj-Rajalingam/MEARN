import { Tamagotchi } from "@/app/types/tamagotchi.type";

interface TamagotchiCardProps {
  tamagotchi: Tamagotchi;
}

export function TamagotchiCard({ tamagotchi }: TamagotchiCardProps) {
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
        {/* Tamagotchi image will go here */}
        <p className="text-muted-foreground">Tamagotchi Display</p>
      </div>
      <div className="text-sm text-center">
        <p className="font-medium">ID: {tamagotchi.tamagotchi_uuid.slice(0, 8)}...</p>
      </div>
    </div>
  );
}