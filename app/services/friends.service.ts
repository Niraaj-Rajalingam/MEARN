import { UUID } from "crypto";
import { Friends } from "../types/friends.type";
import { poolQuery } from "./database.service";

export const getFriendsForUser = async (
  user_uuid: UUID
): Promise<Friends[] | undefined> => {
  try {
    const result: Friends[] | undefined = await poolQuery(
      `SELECT * FROM friends
      WHERE first_user_uuid = $1
      OR second_user_uuid = $2;`,
      [
        user_uuid,
        user_uuid
      ]
    );

    return result;
  } catch (error) {
    console.log(`An error occurred when getting friends for user ${user_uuid}`);
    console.log(error);
  }
}

export const createFriendForUser = async (
  user_uuid: UUID,
  friend_user_uuid: UUID
): Promise<Friends[] | undefined> => {
  try {
    const result: Friends[] | undefined = await poolQuery(
      `INSERT INTO friends (
        first_user_uuid,
        second_user_uuid
      )
      VALUES (
        $1,
        $2
      )
      RETURNING *;`,
      [
        user_uuid,
        friend_user_uuid
      ]
    );

    return result;
  } catch (error) {
    console.log(`An error occurred when creating a friend relationship for user ${user_uuid} with their friend ${friend_user_uuid}`);
    console.log(error);
  }
}

export const deleteFriendForUser = async (
  user_uuid: UUID,
  friend_user_uuid: UUID
): Promise<Friends[] | undefined> => {
  try {
    const result: Friends[] | undefined = await poolQuery(
      `DELETE FROM friends
      WHERE (
        first_user_uuid,
        second_user_uuid
      )
      IN (
        ($1, $2),
        ($2, $1)
      )
      RETURNING *;`,
      [
        user_uuid,
        friend_user_uuid
      ]
    );

    return result;
  } catch (error) {
    console.log(`An error occurred when deleting a friend relationship for user ${user_uuid} with their friend ${friend_user_uuid}`);
    console.log(error);
  }
}
