import { Tamagotchi } from "@/app/types/tamagotchi.type";
import { UUID } from "crypto";
import { pool, poolQuery } from "../database.service";
import { createTamagotchiForUser, deleteTamagotchi, getTamagotchisForUser, updateTamagotchi } from "../tamagotchi.service";

let testUserUuid: UUID;
let testTamagotchiUuid: UUID;

afterAll(async () => {
  await pool.end();
});

beforeEach(async () => {
  const users = await poolQuery(
    `SELECT * FROM users
    WHERE first_name = 'Ridvik';`
  );
  testUserUuid = users?.[0].user_uuid;

  const testTamagotchi = await poolQuery(
    `INSERT INTO tamagotchis (
      user_uuid, 
      image_path
    )
    VALUES (
      '${testUserUuid}',
      '/images/test-tamagotchi.jpg'
    )
    RETURNING *;`
  );

  testTamagotchiUuid = testTamagotchi?.[0]?.tamagotchi_uuid;
});

afterEach(async () => {
  await poolQuery(
    `DELETE FROM tamagotchis
    WHERE tamagotchi_uuid = '${testTamagotchiUuid}';`
  );
})

describe('tamagotchi service', () => {
  it('should retrieve all tamagotchis for a given user', async () => {
    const allTamagotchis = await getTamagotchisForUser(testUserUuid);
    expect(allTamagotchis).toBeDefined();
    expect(allTamagotchis).toContainEqual<Tamagotchi>({
      tamagotchi_uuid: testTamagotchiUuid,
      user_uuid: testUserUuid,
      image_path: '/images/test-tamagotchi.jpg'
    });
  });

  it('should create a tamagotchi for a given user', async () => {
    const createdTamagotchi = await createTamagotchiForUser(
      testUserUuid,
      '/images/test-tamagotchi-2.jpg'
    );

    expect(createdTamagotchi).toBeDefined();
    expect(createdTamagotchi).toContainEqual<Tamagotchi>({
      tamagotchi_uuid: expect.any(String),
      user_uuid: testUserUuid,
      image_path: '/images/test-tamagotchi-2.jpg'
    });
  });

  it('should update a tamagotchi for a given user', async () => {
    const updatedTamagotchi = await updateTamagotchi(
      testTamagotchiUuid,
      '/images/updated-tamagotchi.jpg'
    );

    expect(updatedTamagotchi).toBeDefined();
    expect(updatedTamagotchi).toContainEqual<Tamagotchi>({
      tamagotchi_uuid: testTamagotchiUuid,
      user_uuid: testUserUuid,
      image_path: '/images/updated-tamagotchi.jpg'
    });
  });

  it('should delete a tamagotchi for a given user', async () => {
    const deletedTamagotchi = await deleteTamagotchi(testTamagotchiUuid);

    expect(deletedTamagotchi).toBeDefined();
    expect(deletedTamagotchi).toContainEqual<Tamagotchi>({
      tamagotchi_uuid: testTamagotchiUuid,
      user_uuid: testUserUuid,
      image_path: '/images/test-tamagotchi.jpg'
    });
  });
});
