import { UUID } from "crypto"

export type Tamagotchi = {
  uuid: UUID; // the UUID used to identify a specific Tamagotchi entry
  user_uuid: UUID; // the user that owns this Tamagotchi
  image_path: string; // the path to the image for this specific Tamagotchi
}
