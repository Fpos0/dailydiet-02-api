import { FastifyInstance } from "fastify";
import { knex } from "../database";
import { z } from "zod";
import bcrypt from 'bcrypt';
import { randomUUID } from "crypto";
import { TokenGenerator } from "ts-token-generator";
// id
// name
// email
// password
// created_at

export async function usersRoutes(app: FastifyInstance) {

  app.get('/', async (request) => {
    const users = await knex('users')
      .select()

    return {
      users
    }
  })

  //Criar User
  app.post('/', async (request, reply) => {

    const userBodySchema = z.object({
      name: z.string(),
      email: z.string(),
      password: z.string()
    })

    const { name, email, password } = userBodySchema.parse(
      request.body
    )

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await knex('users').insert({
      id: randomUUID(),
      name,
      email,
      password: hashedPassword,
      created_at: new Date()
    })

    return reply.status(201).send
  })
  // logar user
  // jhon doe test password securePassword123
  app.post('/login', async (request, reply) => {
    const userBodySchema = z.object({
      email: z.string(),
      password: z.string()
    })

    const { email, password } = userBodySchema.parse(
      request.body
    )

    let user = await knex('users').where({ email }).first()

    if (user) {
      let id = user.id;
      const checkPassword = await bcrypt.compare(password, user.password);
      //This is dont work,use Token instead
      // CREATE TOKEN FOR USER
      if (checkPassword) {
        console.log("User Authenticated", user)
        // Create Token
        const tokgen = new TokenGenerator();
        const token = tokgen.generate()
        const tokeninfo = {
          user_token: token
        }
        // Update DB
        await knex('users').where({ id }).update(tokeninfo)

        return { token }
      }
    } else {
      return reply.status(401).send({ error: 'wrong credentials' })
    }



  })
  // deletar

}