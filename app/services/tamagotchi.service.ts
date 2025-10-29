import { UUID } from "crypto";
import { Tamagotchi } from "../types/tamagotchi.type";
import { poolQuery } from "./database.service";

export const getTamagotchisForUser = async (
  user_uuid: UUID
): Promise<Tamagotchi[] | undefined> => {
  try {
    const result: Tamagotchi[] | undefined = await poolQuery(
      `SELECT * FROM tamagotchis
      WHERE user_uuid = $1;`,
      [
        user_uuid
      ]
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
): Promise<Tamagotchi[] | undefined> => {
  try {
    const result: Tamagotchi[] | undefined = await poolQuery(
      `INSERT INTO tamagotchis (
        user_uuid, 
        image_path
      )
      VALUES (
        $1,
        $2
      )
      RETURNING *;`,
      [
        user_uuid,
        image_path
      ]
    );

    return result;
  } catch (error) {
    console.log(`An error occurred when creating a tamagotchi for user ${user_uuid} with image_path ${image_path}`);
    console.log(error);
  }
}

export const updateTamagotchi = async (
  tamagotchi_uuid: UUID,
  image_path: string
): Promise<Tamagotchi[] | undefined> => {
  try {
    const result: Tamagotchi[] | undefined = await poolQuery(
      `UPDATE tamagotchis SET 
        image_path = $1
      WHERE 
        tamagotchi_uuid = $2
      RETURNING *;`,
      [
        image_path,
        tamagotchi_uuid
      ]
    );

    return result;
  } catch (error) {
    console.log(`An error occurred when updating tamagotchi with id ${tamagotchi_uuid} and new image_path ${image_path}`);
    console.log(error);
  }
}

export const deleteTamagotchi = async (
  tamagotchi_uuid: UUID
): Promise<Tamagotchi[] | undefined> => {
  try {
    const result: Tamagotchi[] | undefined = await poolQuery(
      `DELETE FROM tamagotchis 
      WHERE
        tamagotchi_uuid = $1
      RETURNING *;`,
      [
        tamagotchi_uuid
      ]
    );

    return result;
  } catch (error) {
    console.log(`An error occurred when deleting tamagotchi with id ${tamagotchi_uuid}`);
    console.log(error);
  }
}
