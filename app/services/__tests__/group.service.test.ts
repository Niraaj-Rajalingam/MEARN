import { UUID } from "crypto";
import { pool, poolQuery } from "../database.service";
import { 
  createGroup, 
  getGroupsForUser, 
  getGroupById, 
  addUserToGroup, 
  removeUserFromGroup, 
  deleteGroup 
} from "../group.service";
import { Group } from "../../types/group.type";

describe('group service', () => {
  let adminUserUuid: UUID;
  let memberUserUuid: UUID;
  let testGroup: Group;

  beforeAll(async () => {
    const adminUser = await poolQuery(
      `INSERT INTO users (first_name, user_email, user_password)
       VALUES ('Admin', 'admin@test.com', 'pass123')
       RETURNING user_uuid;`
    );
    adminUserUuid = adminUser?.[0].user_uuid;

    const memberUser = await poolQuery(
      `INSERT INTO users (first_name, user_email, user_password)
       VALUES ('Member', 'member@test.com', 'pass123')
       RETURNING user_uuid;`
    );
    memberUserUuid = memberUser?.[0].user_uuid;
  });

  afterAll(async () => {
    await poolQuery('DELETE FROM users WHERE user_email LIKE $1', ['%@test.com']);
    await poolQuery('DELETE FROM groups WHERE group_name LIKE $1', ['Test Group%']);
    await pool.end();
  });

  beforeEach(async () => {
    const group = await createGroup({
      group_name: 'Test Group',
      creator_uuid: adminUserUuid,
      parent_group_uuid: undefined
    });
    if (!group) {
      throw new Error("Test setup failed: Could not create group");
    }
    testGroup = group;
  });

  afterEach(async () => {
    await poolQuery('DELETE FROM groups WHERE group_name LIKE $1', ['Test Group%']);
    await poolQuery('DELETE FROM groups WHERE group_name = $1', ['Unique Group']);
    await poolQuery('DELETE FROM groups WHERE group_name = $1', ['Shared Name']);
  });

  it('should create a new group and add the creator as admin', async () => {
    expect(testGroup).toBeDefined();
    expect(testGroup.group_name).toBe('Test Group');
    expect(testGroup.parent_group_uuid).toBeNull();

    const groupWithMembers = await getGroupById(testGroup.group_uuid);
    expect(groupWithMembers).toBeDefined();
    expect(groupWithMembers?.members.length).toBe(1);
    expect(groupWithMembers?.members[0].user_uuid).toBe(adminUserUuid);
    expect(groupWithMembers?.members[0].role).toBe('admin');
  });

  it('should create a new subgroup with a parent_group_uuid', async () => {
    const subGroup = await createGroup({
      group_name: 'Test Subgroup',
      creator_uuid: adminUserUuid,
      parent_group_uuid: testGroup.group_uuid
    });

    expect(subGroup).toBeDefined();
    expect(subGroup?.group_name).toBe('Test Subgroup');
    expect(subGroup?.parent_group_uuid).toBe(testGroup.group_uuid);
  });

  it('should get all groups for a specific user', async () => {
    await addUserToGroup({
      group_uuid: testGroup.group_uuid,
      user_uuid: memberUserUuid
    });

    const adminGroups = await getGroupsForUser(adminUserUuid);
    expect(adminGroups).toBeDefined();
    expect(adminGroups?.length).toBe(1);
    expect(adminGroups?.[0].group_name).toBe('Test Group');

    const memberGroups = await getGroupsForUser(memberUserUuid);
    expect(memberGroups).toBeDefined();
    expect(memberGroups?.length).toBe(1);
    expect(memberGroups?.[0].group_name).toBe('Test Group');
  });

  it('should filter groups for a user by parent group', async () => {
    const childGroup = await createGroup({
      group_name: 'Test Group Child',
      creator_uuid: adminUserUuid,
      parent_group_uuid: testGroup.group_uuid
    });

    expect(childGroup).toBeDefined();

    const rootGroups = await getGroupsForUser(adminUserUuid, null);
    expect(rootGroups).toBeDefined();
    expect(rootGroups?.every((group) => group.parent_group_uuid === null)).toBe(true);
    expect(rootGroups?.some((group) => group.group_uuid === testGroup.group_uuid)).toBe(true);

    const childGroups = await getGroupsForUser(adminUserUuid, testGroup.group_uuid);
    expect(childGroups).toBeDefined();
    expect(childGroups?.length).toBe(1);
    expect(childGroups?.[0].group_uuid).toBe(childGroup?.group_uuid);
  });

  it('should not allow duplicate group names under the same parent', async () => {
    const name = 'Unique Group';

    await createGroup({
      group_name: name,
      creator_uuid: adminUserUuid,
      parent_group_uuid: testGroup.group_uuid
    });

    await expect(async () => {
      await createGroup({
        group_name: name,
        creator_uuid: adminUserUuid,
        parent_group_uuid: testGroup.group_uuid
      });
    }).rejects.toThrow('A group with this name already exists for the selected parent.');
  });

  it('should allow different users to reuse group names under the same parent', async () => {
    const name = 'Shared Name';

    const firstGroup = await createGroup({
      group_name: name,
      creator_uuid: adminUserUuid,
      parent_group_uuid: null
    });

    const secondGroup = await createGroup({
      group_name: name,
      creator_uuid: memberUserUuid,
      parent_group_uuid: null
    });

    expect(firstGroup).toBeDefined();
    expect(secondGroup).toBeDefined();
    expect(firstGroup?.group_uuid).not.toBe(secondGroup?.group_uuid);
  });

  it('should get a single group by ID with all its members', async () => {
    await addUserToGroup({
      group_uuid: testGroup.group_uuid,
      user_uuid: memberUserUuid,
      role: 'member'
    });

    const groupWithMembers = await getGroupById(testGroup.group_uuid);
    expect(groupWithMembers).toBeDefined();
    expect(groupWithMembers?.group_name).toBe('Test Group');
    expect(groupWithMembers?.members.length).toBe(2);
    expect(groupWithMembers?.members).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ user_uuid: adminUserUuid, role: 'admin' }),
        expect.objectContaining({ user_uuid: memberUserUuid, role: 'member' })
      ])
    );
  });

  it('should add a new user to a group', async () => {
    const result = await addUserToGroup({
      group_uuid: testGroup.group_uuid,
      user_uuid: memberUserUuid,
      role: 'member'
    });
    expect(result).toBeDefined();
    expect(result.role).toBe('member');

    const groupWithMembers = await getGroupById(testGroup.group_uuid);
    expect(groupWithMembers?.members.length).toBe(2);
  });

  it('should not add a duplicate user to a group', async () => {
    const result1 = await addUserToGroup({
      group_uuid: testGroup.group_uuid,
      user_uuid: memberUserUuid
    });
    const result2 = await addUserToGroup({
      group_uuid: testGroup.group_uuid,
      user_uuid: memberUserUuid
    });

    expect(result1).toBeDefined();
    expect(result2).toBeUndefined();

    const groupWithMembers = await getGroupById(testGroup.group_uuid);
    expect(groupWithMembers?.members.length).toBe(2);
  });

  it('should remove a user from a group', async () => {
    await addUserToGroup({
      group_uuid: testGroup.group_uuid,
      user_uuid: memberUserUuid
    });
    
    const removedMember = await removeUserFromGroup(testGroup.group_uuid, memberUserUuid);
    expect(removedMember).toBeDefined();
    expect(removedMember.user_uuid).toBe(memberUserUuid);

    const groupWithMembers = await getGroupById(testGroup.group_uuid);
    expect(groupWithMembers?.members.length).toBe(1);
    expect(groupWithMembers?.members[0].user_uuid).toBe(adminUserUuid);
  });

  it('should delete an entire group', async () => {
    const deletedGroup = await deleteGroup(testGroup.group_uuid);
    expect(deletedGroup).toBeDefined();
    expect(deletedGroup?.group_name).toBe('Test Group');

    const group = await getGroupById(testGroup.group_uuid);
    expect(group).toBeUndefined();

    const members = await poolQuery(
      'SELECT * FROM group_members WHERE group_uuid = $1',
      [testGroup.group_uuid]
    );
    expect(members?.length).toBe(0);
  });
});
