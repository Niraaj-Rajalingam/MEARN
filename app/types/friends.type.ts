import { UUID } from "crypto"

export type FriendRequest = {
  request_uuid: UUID;
  requester_uuid: UUID;
  recipient_uuid: UUID;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  created_at: Date;
}
