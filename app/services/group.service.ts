import { UUID } from "crypto";
import { 
  Group, 
  GroupWithMembers, 
  CreateGroupDTO, 
  AddMemberDTO 
} from "../types/group.type";
import { poolQuery } from "./database.service";

export const createGroup = async (
  groupData: CreateGroupDTO
): Promise<Group | undefined> => {
  try {
    const groupResult: Group[] | undefined = await poolQuery(
      `INSERT INTO groups (group_name, parent_group_uuid) 
       VALUES ($1, $2) RETURNING *;`,
      [
        groupData.group_name,
        groupData.parent_group_uuid || null
      ]
    );

    const newGroup = groupResult?.[0];
    if (!newGroup) {
      throw new Error("Group creation failed");
    }

    await poolQuery(
      `INSERT INTO group_members (group_uuid, user_uuid, role)
       VALUES ($1, $2, 'admin');`,
      [newGroup.group_uuid, groupData.creator_uuid]
    );

    return newGroup;
  } catch (error) {
    console.log(`An error occurred when creating group: ${groupData.group_name}`);
    console.log(error);
    throw error;
  }
}

export const getGroupsForUser = async (
  user_uuid: UUID
): Promise<Group[] | undefined> => {
  try {
    const result: Group[] | undefined = await poolQuery(
      `SELECT g.* FROM groups g
       JOIN group_members gm ON g.group_uuid = gm.group_uuid
       WHERE gm.user_uuid = $1;`,
      [user_uuid]
    );
    return result;
  } catch (error) {
    console.log(`An error occurred getting groups for user ${user_uuid}`);
    console.log(error);
    throw error;
  }
}

export const getGroupById = async (
  group_uuid: UUID
): Promise<GroupWithMembers | undefined> => {
  try {
    // NOTE: No change needed. `SELECT g.*` automatically picks up the new column.
    const result: GroupWithMembers[] | undefined = await poolQuery(
      `SELECT 
        g.*,
        COALESCE(
          json_agg(
            json_build_object('user_uuid', gm.user_uuid, 'role', gm.role)
          ) FILTER (WHERE gm.user_uuid IS NOT NULL), 
          '[]'
        ) AS members
       FROM groups g
       LEFT JOIN group_members gm ON g.group_uuid = gm.group_uuid
       WHERE g.group_uuid = $1
       GROUP BY g.group_uuid;`,
      [group_uuid]
    );
    return result?.[0];
  } catch (error) {
    console.log(`An error occurred getting group ${group_uuid}`);
    console.log(error);
    throw error;
  }
}

export const addUserToGroup = async (
  memberData: AddMemberDTO
): Promise<any | undefined> => {
  try {
    const result = await poolQuery(
      `INSERT INTO group_members (group_uuid, user_uuid, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (group_uuid, user_uuid) DO NOTHING
       RETURNING *;`,
      [
        memberData.group_uuid,
        memberData.user_uuid,
        memberData.role || 'member'
      ]
    );
    return result?.[0];
  } catch (error) {
    console.log(`An error occurred adding user ${memberData.user_uuid} to group ${memberData.group_uuid}`);
    console.log(error);
    throw error;
  }
}

export const removeUserFromGroup = async (
  group_uuid: UUID,
  user_uuid: UUID
): Promise<any | undefined> => {
  try {
    const result = await poolQuery(
      `DELETE FROM group_members
       WHERE group_uuid = $1 AND user_uuid = $2
       RETURNING *;`,
      [group_uuid, user_uuid]
    );
    return result?.[0];
  } catch (error) {
    console.log(`An error occurred removing user ${user_uuid} from group ${group_uuid}`);
    console.log(error);
    throw error;
  }
}

export const deleteGroup = async (
  group_uuid: UUID
): Promise<Group | undefined> => {
  try {
    const result: Group[] | undefined = await poolQuery(
      `DELETE FROM groups WHERE group_uuid = $1 RETURNING *;`,
      [group_uuid]
    );
    return result?.[0];
  } catch (error) {
    console.log(`An error occurred deleting group ${group_uuid}`);
    console.log(error);
    throw error;
  }
}

