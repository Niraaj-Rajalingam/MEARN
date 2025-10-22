import { Tamagotchi } from "../types/tamagotchi.type";
import { poolClientQuery, poolQuery } from "./database.service";

export const getTamagotchisForUser = async (
  user_uuid: string
): Promise<Tamagotchi[] | undefined> => {
  const result: Tamagotchi[] | undefined = await poolQuery(
    `SELECT * FROM tamagotchis
    WHERE user_uuid = '${user_uuid}';`
  );

  return result;
}

export const createTamagotchiForUser = async (
  user_uuid: string,
  image_path: string
) => {
  await poolClientQuery(
    `INSERT INTO tamagotchis (
      user_uuid, 
      image_path
    )
    VALUES (
      '${user_uuid}',
      '${image_path}'
    );`
  );
}

export const updateTamagotchi = async (
  tamagotchi_uuid: string,
  image_path: string
) => {
  await poolClientQuery(
    `UPDATE tamagotchis SET 
      image_path = '${image_path}'
    WHERE 
      tamagotchi_uuid = '${tamagotchi_uuid}';`
  );
}
