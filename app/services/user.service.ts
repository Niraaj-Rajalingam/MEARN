import { UUID } from "crypto";
import { User, FullUser, SignUpDTO, LoginDTO } from "../types/user.type";
import { poolQuery } from "./database.service";

export const login = async (
  loginData: LoginDTO
): Promise<User | undefined> => {
  try {
    const result: FullUser[] | undefined = await poolQuery(
      `SELECT * FROM users
      WHERE user_email = $1
      AND user_password = $2;`,
      [
        loginData.email,
        loginData.password || null
      ]
    );
    
    const user = result?.[0];

    if (user) {
      delete user.user_password;
      return user;
    }
    
    return undefined;

  } catch (error) {
    console.log(`An error occurred during login for ${loginData.email}`);
    console.log(error);
    throw error;
  }
}

export const signUp = async (
  signUpData: SignUpDTO
): Promise<User | undefined> => {
  try {
    const result: FullUser[] | undefined = await poolQuery(
      `INSERT INTO users (
        first_name,
        user_email,
        user_password
      )
      VALUES (
        $1, $2, $3
      )
      RETURNING *;`,
      [
        signUpData.firstName,
        signUpData.email,
        signUpData.password || null
      ]
    );

    const user = result?.[0];

    if (user) {
      delete user.user_password;
      return user;
    }

    return undefined;
  } catch (error) {
    console.log(`An error occurred during sign up for ${signUpData.email}`);
    console.log(error);
    throw error;
  }
}

export const findUserByEmail = async (
  email: string
): Promise<User | undefined> => {
  try {
    const result: User[] | undefined = await poolQuery(
      `SELECT user_uuid, first_name, last_name, user_email 
      FROM users
      WHERE user_email = $1;`,
      [ email ]
    );
    
    return result?.[0];
  } catch (error) {
    console.log(`An error occurred searching for user ${email}`);
    console.log(error);
    throw error;
  }
}

export const getUserById = async (
  user_uuid: UUID
): Promise<User | undefined> => {
  try {
    const result: User[] | undefined = await poolQuery(
      `SELECT user_uuid, first_name, last_name, user_email 
      FROM users
      WHERE user_uuid = $1;`,
      [ user_uuid ]
    );
    
    return result?.[0];
  } catch (error) {
    console.log(`An error occurred getting user ${user_uuid}`);
    console.log(error);
    throw error;
  }
}
