import { UUID } from "crypto";

export type User = {
  user_uuid: UUID;
  first_name: string | null;
  last_name: string | null;
  user_email: string;
};

export type FullUser = User & {
  user_password?: string;
};

export type SignUpDTO = {
  email: string;
  password?: string;
  firstName: string;
};

export type LoginDTO = {
  email: string;
  password?: string;
};
