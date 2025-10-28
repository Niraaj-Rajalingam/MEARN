import { UUID } from "crypto";
import { Tamagotchi } from "../types/tamagotchi.type";
import { poolQuery } from "./database.service";

export const getTamagotchisForUser = async (
  user_uuid: UUID
): Promise<Tamagotchi[] | undefined> => {
  try {
    const result: Tamagotchi[] | undefined = await poolQuery(
      `SELECT * FROM tamagotchis
      WHERE user_uuid = '${user_uuid}';`
    );
  
    return result;
  } catch (error) {
    console.log(`An error occurred when getting tamagotchis for user ${user_uuid}`);
    console.log(error);
  }
}

export const createTamagotchiForUser = async (
  user_uuid: UUID,
  image_path: string
): Promise<boolean> => {
  try {
    await poolQuery(
      `INSERT INTO tamagotchis (
        user_uuid, 
        image_path
      )
      VALUES (
        '${user_uuid}',
        '${image_path}'
      );`
    );
  } catch (error) {
    console.log(`An error occurred when creating a tamagotchi for user ${user_uuid} with image_path ${image_path}`);
    console.log(error);
    
    return false;
  }

  return true;
}

export const updateTamagotchi = async (
  tamagotchi_uuid: UUID,
  image_path: string
): Promise<boolean> => {
  try {
    await poolQuery(
      `UPDATE tamagotchis SET 
        image_path = '${image_path}'
      WHERE 
        tamagotchi_uuid = '${tamagotchi_uuid}';`
    );
  } catch (error) {
    console.log(`An error occurred when updating tamagotchi with id ${tamagotchi_uuid} and new image_path ${image_path}`);
    console.log(error);

    return false;
  }

  return true;
}
