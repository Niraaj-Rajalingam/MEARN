import { UUID } from "crypto"

export type Tamagotchi = {
  tamagotchi_uuid: UUID; // unique UUID for a specific Tamagotchi entry
  user_uuid: UUID; // the user that owns this Tamagotchi
  image_path: string; // the path to the image for this specific Tamagotchi
  health: number; // health points (0-100)
  experience_points: number; // total experience earned from completing tasks
  level: number; // current level based on experience
}
