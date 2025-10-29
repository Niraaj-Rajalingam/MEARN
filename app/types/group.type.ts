import { UUID } from "crypto";

export type Group = {
  group_uuid: UUID;
  group_name: string;
  parent_group_uuid: UUID | null; 
}

export type GroupWithMembers = Group & {
  members: Array<{
    user_uuid: UUID;
    role: 'admin' | 'member';
  }>;
}

export type CreateGroupDTO = {
  group_name: string;
  creator_uuid: UUID;
  parent_group_uuid?: UUID;
}

export type AddMemberDTO = {
  group_uuid: UUID;
  user_uuid: UUID;
  role?: 'admin' | 'member';
}

