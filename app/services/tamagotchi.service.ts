import { createPool } from "./database.service";

interface ICreateTamagotchi {
  user_uuid: string;
  image_path: string;
}

export const createTamagotchi = ({
  user_uuid,
  image_path
}: ICreateTamagotchi) => {
    
}
