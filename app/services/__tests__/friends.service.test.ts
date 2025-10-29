import { Tamagotchi } from "@/app/types/tamagotchi.type";
import { UUID } from "crypto";
import { pool, poolQuery } from "../database.service";
import { createTamagotchiForUser, deleteTamagotchi, getTamagotchisForUser, updateTamagotchi } from "../tamagotchi.service";
import { createFriendForUser, deleteFriendForUser, getFriendsForUser } from "../friends.service";
import { Friends } from "@/app/types/friends.type";

let firstTestUserUuid: UUID;
let secondTestUserUuid: UUID;

afterAll(async () => {
  await pool.end();
});

beforeEach(async () => {
  const users = await poolQuery(
    `SELECT * FROM users
    WHERE first_name = 'Ridvik'
    OR first_name = 'Niraaj';`
  );
  firstTestUserUuid = users?.[0].user_uuid;
  secondTestUserUuid = users?.[1].user_uuid;

  await poolQuery(
    `INSERT INTO friends (
      first_user_uuid, 
      second_user_uuid
    )
    VALUES (
      '${firstTestUserUuid}',
      '${secondTestUserUuid}'
    );`
  );
});

afterEach(async () => {
  await poolQuery(
    `DELETE FROM friends
    WHERE (
      first_user_uuid,
      second_user_uuid
    )
    IN (
      ('${firstTestUserUuid}', '${secondTestUserUuid}'),
      ('${secondTestUserUuid}', '${firstTestUserUuid}' )
    );`
  );
})

describe('tamagotchi service', () => {
  it('should retrieve all friends for a given user', async () => {

    const allFriends = await getFriendsForUser(firstTestUserUuid);
    expect(allFriends).toBeDefined();
    expect(allFriends).toContainEqual<Friends>({
      first_user_uuid: firstTestUserUuid,
      second_user_uuid: secondTestUserUuid
    });
  });

  it('should create a friend for a given user', async () => {
    const createdFriends = await createFriendForUser(
      secondTestUserUuid,
      firstTestUserUuid
    );

    expect(createdFriends).toBeDefined();
    expect(createdFriends).toContainEqual<Friends>({
      first_user_uuid: secondTestUserUuid,
      second_user_uuid: firstTestUserUuid
    });
  });

  it('should delete a friend for a given user', async () => {
    const deletedFriends = await deleteFriendForUser(
      firstTestUserUuid,
      secondTestUserUuid
    );

    expect(deletedFriends).toBeDefined();
    expect(deletedFriends).toContainEqual<Friends>({
      first_user_uuid: firstTestUserUuid,
      second_user_uuid: secondTestUserUuid
    });
  });
});
