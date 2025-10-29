import { UUID } from "crypto";
import { FriendRequest } from "../types/friends.type";
import { poolQuery } from "./database.service";

export const getFriendsForUser = async (
  user_uuid: UUID
): Promise<FriendRequest[] | undefined> => {
  try {
    const result: FriendRequest[] | undefined = await poolQuery(
      `SELECT * FROM friend_requests
      WHERE (requester_uuid = $1 OR recipient_uuid = $2)
      AND status = 'accepted';`,
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

export const getPendingRequestsForUser = async (
  user_uuid: UUID
): Promise<FriendRequest[] | undefined> => {
  try {
    const result: FriendRequest[] | undefined = await poolQuery(
      `SELECT * FROM friend_requests
      WHERE recipient_uuid = $1
      AND status = 'pending';`,
      [ user_uuid ]
    );
    return result;
  } catch (error) {
    console.log(`An error occurred when getting pending requests for user ${user_uuid}`);
    console.log(error);
  }
}

export const sendFriendRequest = async (
  requester_uuid: UUID,
  recipient_uuid: UUID
): Promise<FriendRequest[] | undefined> => {
  try {
    // CHANGED: Inserts into 'friend_requests'. Status defaults to 'pending'.
    const result: FriendRequest[] | undefined = await poolQuery(
      `INSERT INTO friend_requests (
        requester_uuid,
        recipient_uuid
      )
      VALUES (
        $1,
        $2
      )
      RETURNING *;`,
      [
        requester_uuid,
        recipient_uuid
      ]
    );

    return result;
  } catch (error)
 {
    console.log(`An error occurred when user ${requester_uuid} sent a friend request to ${recipient_uuid}`);
    console.log(error);
  }
}

export const updateRequestStatus = async (
  request_uuid: UUID,
  status: 'accepted' | 'declined' | 'blocked'
): Promise<FriendRequest[] | undefined> => {
  try {
    const result: FriendRequest[] | undefined = await poolQuery(
      `UPDATE friend_requests
      SET status = $1
      WHERE request_uuid = $2
      RETURNING *;`,
      [
        status,
        request_uuid
      ]
    );

    return result;
  } catch (error) {
    console.log(`An error occurred when updating request ${request_uuid}`);
    console.log(error);
  }
}

export const removeFriend = async (
  user_uuid: UUID,
  friend_user_uuid: UUID
): Promise<FriendRequest[] | undefined> => {
  try {
    const result: FriendRequest[] | undefined = await poolQuery(
      `DELETE FROM friend_requests
      WHERE (
        requester_uuid = $1 AND recipient_uuid = $2
      ) OR (
        requester_uuid = $2 AND recipient_uuid = $1
      )
      RETURNING *;`,
      [
        user_uuid,
        friend_user_uuid
      ]
    );

    return result;
  } catch (error) {
    console.log(`An error occurred when deleting friend relationship between ${user_uuid} and ${friend_user_uuid}`);
    console.log(error);
  }
}