import { pgTable, serial, text, varchar, boolean, timestamp, integer, jsonb, uuid, decimal, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './schema.js';

// Enhanced quizzes table
export const enhancedQuizzes = pgTable('enhanced_quizzes', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  subject: varchar('subject', { length: 100 }),
  difficulty: varchar('difficulty', { length: 20 }).default('medium'),
  timeLimit: integer('time_limit').default(30),
  isPublic: boolean('is_public').default(false),
  tags: jsonb('tags').default([]),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Enhanced quiz questions table
export const enhancedQuizQuestions = pgTable('enhanced_quiz_questions', {
  id: uuid('id').defaultRandom().primaryKey(),
  quizId: uuid('quiz_id').references(() => enhancedQuizzes.id).notNull(),
  question: text('question').notNull(),
  type: varchar('type', { length: 20 }).default('multiple_choice'),
  options: jsonb('options').default([]),
  correctAnswer: text('correct_answer').notNull(),
  explanation: text('explanation'),
  points: integer('points').default(1),
  order: integer('order').default(0),
  createdAt: timestamp('created_at').defaultNow()
});

// Enhanced quiz attempts table
export const enhancedQuizAttempts = pgTable('enhanced_quiz_attempts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  quizId: uuid('quiz_id').references(() => enhancedQuizzes.id).notNull(),
  answers: jsonb('answers').default({}),
  score: decimal('score', { precision: 5, scale: 2 }).default('0'),
  totalPoints: integer('total_points').default(0),
  timeSpent: integer('time_spent'), // in seconds
  isCompleted: boolean('is_completed').default(false),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow()
});

// Relations
export const enhancedQuizzesRelations = relations(enhancedQuizzes, ({ one, many }) => ({
  user: one(users, {
    fields: [enhancedQuizzes.userId],
    references: [users.id]
  }),
  questions: many(enhancedQuizQuestions),
  attempts: many(enhancedQuizAttempts)
}));

export const enhancedQuizQuestionsRelations = relations(enhancedQuizQuestions, ({ one }) => ({
  quiz: one(enhancedQuizzes, {
    fields: [enhancedQuizQuestions.quizId],
    references: [enhancedQuizzes.id]
  })
}));

export const enhancedQuizAttemptsRelations = relations(enhancedQuizAttempts, ({ one }) => ({
  user: one(users, {
    fields: [enhancedQuizAttempts.userId],
    references: [users.id]
  }),
  quiz: one(enhancedQuizzes, {
    fields: [enhancedQuizAttempts.quizId],
    references: [enhancedQuizzes.id]
  })
}));