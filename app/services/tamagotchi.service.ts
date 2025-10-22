import { Tamagotchi } from "../types/tamagotchi.type";
import { poolQuery } from "./database.service";

export const getTamagotchisForUser = async (
  user_uuid: string
): Promise<Tamagotchi[] | undefined> => {
  const result: Tamagotchi[] | undefined = await poolQuery(
    `SELECT * FROM tamagotchis
    WHERE user_uuid = '${user_uuid}';`
  );

  if (!result) {
    console.log("An error occurred retrieving the tamagotchi");
    return;
  }
  
  return result;
}

export const createTamagotchiForUser = async (
  user_uuid: string,
  image_path: string
) => {
}

export const editTamagotchiForUser = async (
  user_uuid: string,
  image_path: string
) => {

}
