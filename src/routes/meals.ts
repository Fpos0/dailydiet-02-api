import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'

import bcrypt from 'bcrypt'
import { randomUUID } from 'crypto'
import { HandleDateInput } from '../middlewares/handle-date-input'
import { HandleTimeInput } from '../middlewares/handle-time-input'

// O usuário só pode visualizar, editar e apagar as refeições o qual ele criou
export async function mealsRoutes(app: FastifyInstance) {
  const isValidDate = (value: string): boolean => {
    // detect YYYY-MM-DD Format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    return dateRegex.test(value);
  }
  const isValidTime = (value: string): boolean => {
    // detect HH:MM Format
    const timeRegex = /^[0-9]{2}:[0-9]{2}$/;
    return timeRegex.test(value);
  }
  app.get('/', async (request) => {
    // get all stuff
    const headerSchema = z.object({
      authorization: z.string()
    })
    const { authorization } = headerSchema.parse(request.headers)


    let user = await knex('users').where({ user_token: authorization }).first()
    if (user) {
      const meals = await knex('meals').where('user_id', user.id)
      return { meals }
    }
    return { message: 'user not found' }
  })

  /**Registrar Refeicao
    Name
    Description
    user_id
    on_diet
    date
    created_At / updated_at
  */

  // The Format Handle of DAte and Time Must be done inside this code
  // 
  app.post('/', async (request, reply) => {
    const mealBodySchema = z.object({
      name: z.string(),
      description: z.string(),
      on_diet: z.boolean(),
      date: z.string().refine(isValidDate, {
        message: 'Invalid date format. use "YYYY-MM-DD" Format'
      }),
      time: z.string().refine(isValidTime, {
        message: 'Invalid Time format. use "HH:MM" Format'
      })
    })
    const HeadersSchema = z.object({
      authorization: z.string()
    })
    const { authorization } = HeadersSchema.parse(request.headers)

    const { date, description, name, on_diet, time } = mealBodySchema.parse(
      request.body
    )

    let user = await knex('users').where({ user_token: authorization }).first()
    if (time) {
      if (!HandleTimeInput(time)) {
        return {
          "error": "Time Input Invalid"
        }
      }
    }
    if (date) {
      if (!HandleDateInput(date)) {
        return {
          "error": "Date Input Invalid"
        }
      }
    }

    if (user) {

      const meal = await knex('meals').insert({
        id: randomUUID(),
        user_id: user.id,
        name,
        description,
        on_diet,
        time,
        date,
      })

      return {
        meal
      }
    } else {
      return {
        "error": "user not found / token not valid"
      }
    }
    //This is dont work,use Token instead
    //const checkToken = await bcrypt.compare(password, user_token);

  })
  // Editar Meal
  app.put('/:id', async (request, reply) => {
    const editMealParamsSchema = z.object({
      id: z.string().uuid()
    })
    const HeadersSchema = z.object({
      authorization: z.string()
    })
    const mealBodySchema = z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      on_diet: z.boolean().optional(),
      date: z.string().refine(isValidDate, {
        message: 'Invalid date format. use "YYYY-MM-DD" Format'
      }).optional(),
      time: z.string().refine(isValidTime, {
        message: 'Invalid Time format. use "HH:mm" Format'
      }).optional()
    })
    const { authorization } = HeadersSchema.parse(request.headers)
    //console.log(request.headers)
    const { id } = editMealParamsSchema.parse(request.params)
    const { date, description, name, on_diet, time } = mealBodySchema.parse(
      request.body
    )
    const user_token = authorization
    // Search User to Validate Token
    let user = await knex('users').where({ user_token }).first()

    if (time) {
      if (!HandleTimeInput(time)) {
        return {
          "error": "Time Input Invalid"
        }
      }
    }
    if (date) {
      if (!HandleDateInput(date)) {
        return {
          "error": "Date Input Invalid"
        }
      }
    }

    let updateJson = {
      description, name, on_diet,
      updated_at: knex.fn.now(), time, date
    }

    if (user) {
      // Search for ID and validate if it was created by this user
      let meal = await knex('meals').where('id', id).first()
      if (meal?.user_id != user.id) {
        return reply.status(401).send()
      }
      await knex('meals').where('id', id).update({
        ...updateJson,
      })

      return reply.status(200).send()
    } else {
      return {
        "error": "user not found / token not valid"
      }
    }

    // Check if user is authenticated
    //Find by id,grab data
  })
  // Apagar Meal
  app.delete('/:id', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid()
    })
    const headerSchema = z.object({
      authorization: z.string()
    })
    const { authorization } = headerSchema.parse(request.headers)
    const { id } = paramsSchema.parse(request.params)


    let user = await knex('users').where({ user_token: authorization }).first()
    if (user) {
      const meal = await knex('meals').where('id', id).del();
      if (meal > 0) {
        return { message: "Record deleted" }
      } else {
        return { message: "Record not found" }
      }
    }
    return { message: 'user not found' }
  })
  // Visualizar uma unica Meal
  app.get('/:id', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid()
    })
    const headerSchema = z.object({
      authorization: z.string()
    })
    const { authorization } = headerSchema.parse(request.headers)
    const { id } = paramsSchema.parse(request.params)


    let user = await knex('users').where({ user_token: authorization }).first()
    if (user) {
      const meal = await knex('meals').where('id', id);
      if (meal) {
        return { meal }
      } else {
        return { message: "Record not found" }
      }
    }
    return { message: 'user not found' }
  })


  // Recuperar Metricas do Usuario

  app.get('/summary', async (request, reply) => {
    const headerSchema = z.object({
      authorization: z.string()
    })

    const { authorization } = headerSchema.parse(request.headers)
    let user = await knex('users').where({ user_token: authorization }).first()
    let mealsCount = 0
    let onDietCount = 0
    let offDietCount = 0
    let currentSequence = 0;
    let longestSequence = 0;

    if (user) {
      const meals = await knex('meals').where('user_id', user.id).orderBy(['date', 'time'])


      for (const meal of meals) {
        if (meal.on_diet) {
          onDietCount++;
          currentSequence++;
        } else {
          offDietCount++;
          currentSequence = 0;
        }

        if (currentSequence > longestSequence) {
          longestSequence = currentSequence;
        }
      }

      mealsCount++
    } else {
      reply.status(401).send({ error: "unauthorized" })
    }
    console.log('mealscount', mealsCount);
    console.log('onDietCount', onDietCount);
    console.log('offDietCount', offDietCount);
    console.log('longestSequence', longestSequence);

    return {
      mealsCount,
      onDietCount,
      offDietCount,
      longestSequence
    }
  })
}
