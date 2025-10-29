import { UUID } from "crypto";
import { pool, poolQuery } from "../database.service";
import { 
  login,
  signUp,
  findUserByEmail,
  getUserById
} from "../user.service";
import { User } from "../../types/user.type";

describe('auth service', () => {
  let testUserUuid: UUID;
  const testEmail = 'auth-test@example.com';
  const testPassword = 'password123';
  const testFirstName = 'AuthTest';

  const cleanup = async () => {
    if (testUserUuid) {
      await poolQuery(`DELETE FROM users WHERE user_uuid = $1;`, [testUserUuid]);
    } else {
      await poolQuery(`DELETE FROM users WHERE user_email = $1;`, [testEmail]);
    }
  };

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
  });


  it('should sign up a new user', async () => {
    const user = await signUp({
      email: testEmail,
      password: testPassword,
      firstName: testFirstName
    });

    expect(user).toBeDefined();
    expect(user?.user_email).toBe(testEmail);
    expect(user?.first_name).toBe(testFirstName);
    expect(user).not.toHaveProperty('user_password');

    if (user) testUserUuid = user.user_uuid;
  });

  it('should log in an existing user', async () => {
    await signUp({
      email: testEmail,
      password: testPassword,
      firstName: testFirstName
    });
    
    const user = await login({
      email: testEmail,
      password: testPassword
    });

    expect(user).toBeDefined();
    expect(user?.user_email).toBe(testEmail);
    expect(user).not.toHaveProperty('user_password');

    if (user) testUserUuid = user.user_uuid;
  });

  it('should fail to log in with an incorrect password', async () => {
    const createdUser = await signUp({
      email: testEmail,
      password: testPassword,
      firstName: testFirstName
    });
    if (createdUser) testUserUuid = createdUser.user_uuid;
    
    const user = await login({
      email: testEmail,
      password: 'wrongpassword'
    });

    expect(user).toBeUndefined();
  });

  it('should fail to log in with a non-existent email', async () => {
    const user = await login({
      email: 'nobody@example.com',
      password: 'password123'
    });

    expect(user).toBeUndefined();
  });

  it('should find a user by email', async () => {
    const createdUser = await signUp({
      email: testEmail,
      password: testPassword,
      firstName: testFirstName
    });
    if (createdUser) testUserUuid = createdUser.user_uuid;

    const user = await findUserByEmail(testEmail);

    expect(user).toBeDefined();
    expect(user?.user_email).toBe(testEmail);
    expect(user).not.toHaveProperty('user_password');
  });

  it('should get a user by ID', async () => {
    const createdUser = await signUp({
      email: testEmail,
      password: testPassword,
      firstName: testFirstName
    });
    
    if (!createdUser) throw new Error('Test setup failed: could not create user');
    testUserUuid = createdUser.user_uuid;

    const user = await getUserById(testUserUuid);

    expect(user).toBeDefined();
    expect(user?.user_uuid).toBe(testUserUuid);
    expect(user).not.toHaveProperty('user_password');
  });

  it('should return undefined for a non-existent UUID', async () => {
    const nonExistentUuid = '00000000-0000-0000-0000-000000000000' as UUID;
    const user = await getUserById(nonExistentUuid);
    expect(user).toBeUndefined();
  });

});
