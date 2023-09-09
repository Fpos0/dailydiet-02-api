import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('meals', (table) => {
    table.uuid('id').primary()
    table.uuid('user_id').unsigned().references('id').inTable('users');
    table.text('name').notNullable()
    table.text('description')
    table.boolean('on_diet').notNullable()
    table.date('date');
    table.time('time')
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable()

  })
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('meals')
}