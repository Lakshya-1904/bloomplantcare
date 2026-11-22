import { pgTable, text, integer, primaryKey } from 'drizzle-orm/pg-core';
export const wateringSchedules = pgTable('watering_schedules', {
  browserId: text('browser_id').notNull(),
  plantId: text('plant_id').notNull(),
  date: text('date').notNull(),
  time: text('time').notNull(),
  interval: integer('interval').notNull(),
}, table => [primaryKey({columns:[table.browserId,table.plantId]})]);
