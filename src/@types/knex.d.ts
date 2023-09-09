import { Knex } from 'knex';

declare module 'knex/types/tables' {
  export interface Tables {
    users: {
      id: string;
      name: string;
      email: string;
      password: string;
      created_at: Date;
      user_token: String;
    };
    meals: {
      id: string;
      user_id: string;
      name: string;
      description: string;
      time: string;
      date: string;
      on_diet: boolean;
      created_at: Date;
    }
  }
}


