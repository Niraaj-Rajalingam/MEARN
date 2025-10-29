import { UUID } from "crypto";
import { pool, poolQuery } from "../database.service";
import { 
  getFriendsForUser, 
  sendFriendRequest, 
  updateRequestStatus,
  removeFriend,
  getPendingRequestsForUser
} from "../friends.service";
import { FriendRequest } from "../../types/friends.type";

describe('friend service', () => {
  let firstTestUserUuid: UUID;
  let otherUserUuids: UUID[] = [];
  let allUserUuids: UUID[] = [];

  beforeAll(async () => {
    const usersToCreate = [
      { first_name: 'TestUser1', last_name: 'Friend' },
      { first_name: 'TestUser2', last_name: 'Friend' },
      { first_name: 'TestUser3', last_name: 'Friend' },
      { first_name: 'TestUser4', last_name: 'Friend' },
      { first_name: 'TestUser5', last_name: 'Friend' },
    ];

    for (const user of usersToCreate) {
      const result = await poolQuery(
        `INSERT INTO users (first_name, last_name) VALUES ($1, $2) RETURNING user_uuid;`,
        [user.first_name, user.last_name]
      );
      allUserUuids.push(result?.[0].user_uuid);
    }
    
    firstTestUserUuid = allUserUuids[0];
    otherUserUuids = allUserUuids.slice(1);
  });

  afterAll(async () => {
    await poolQuery(`DELETE FROM friend_requests WHERE requester_uuid = ANY($1) OR recipient_uuid = ANY($1);`, [allUserUuids]);
    await poolQuery(`DELETE FROM users WHERE user_uuid = ANY($1);`, [allUserUuids]);
    await pool.end();
  });

  afterEach(async () => {
    await poolQuery(`DELETE FROM friend_requests WHERE requester_uuid = ANY($1) OR recipient_uuid = ANY($1);`, [allUserUuids]);
  });

  beforeEach(async () => {
    for (const otherId of otherUserUuids) {
      await poolQuery(
        `INSERT INTO friend_requests (requester_uuid, recipient_uuid, status) VALUES ($1, $2, 'accepted');`,
        [firstTestUserUuid, otherId]
      );
    }
  });

  it('should retrieve all accepted friends for a given user', async () => {
    const firstUserFriends = await getFriendsForUser(firstTestUserUuid);
    expect(firstUserFriends).toBeDefined();
    expect(firstUserFriends?.length).toBe(4);
    expect(firstUserFriends?.[0].status).toBe('accepted');

    const secondUserFriends = await getFriendsForUser(otherUserUuids[0]);
    expect(secondUserFriends).toBeDefined();
    expect(secondUserFriends?.length).toBe(1);
    expect(secondUserFriends?.[0].requester_uuid).toBe(firstTestUserUuid);
  });

  it('should send a new friend request', async () => {
    await poolQuery(`DELETE FROM friend_requests WHERE requester_uuid = ANY($1) OR recipient_uuid = ANY($1);`, [allUserUuids]);
    
    const request = await sendFriendRequest(
      firstTestUserUuid,
      otherUserUuids[0]
    );

    expect(request).toBeDefined();
    expect(request?.[0].requester_uuid).toBe(firstTestUserUuid);
    expect(request?.[0].recipient_uuid).toBe(otherUserUuids[0]);
    expect(request?.[0].status).toBe('pending');
  });

  it('should retrieve pending requests for a user', async () => {
    await sendFriendRequest(otherUserUuids[0], firstTestUserUuid);

    const pendingRequests = await getPendingRequestsForUser(firstTestUserUuid);
    
    expect(pendingRequests).toBeDefined();
    expect(pendingRequests?.length).toBe(1);
    expect(pendingRequests?.[0].requester_uuid).toBe(otherUserUuids[0]);
    expect(pendingRequests?.[0].status).toBe('pending');
  });

  it('should update a request status to accepted', async () => {
    await removeFriend(firstTestUserUuid, otherUserUuids[0]);
    
    const request = await sendFriendRequest(
      firstTestUserUuid,
      otherUserUuids[0]
    );
    const requestId = request?.[0].request_uuid;

    const acceptedRequest = await updateRequestStatus(requestId, 'accepted');
    expect(acceptedRequest?.[0].status).toBe('accepted');

    const friends = await getFriendsForUser(firstTestUserUuid);
    expect(friends?.length).toBe(4);
    expect(friends?.find(f => f.recipient_uuid === otherUserUuids[0])).toBeDefined();
  });

  it('should delete a friend relationship', async () => {
    await removeFriend(
      firstTestUserUuid,
      otherUserUuids[0]
    );

    const firstUserFriends = await getFriendsForUser(firstTestUserUuid);
    expect(firstUserFriends?.length).toBe(3);
  });
});

