// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  fullName: text('full_name').notNull(),
  avatarUrl: text('avatar_url'),
  role: text('role', { enum: ['STUDENT', 'INSTRUCTOR', 'SPEAKER', 'ADMIN'] }).default('STUDENT').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const userProfiles = sqliteTable('user_profiles', {
  userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  phone: text('phone'),
  githubUrl: text('github_url'),
  linkedinUrl: text('linkedin_url'),
  discordHandle: text('discord_handle'),
  bio: text('bio'),
  city: text('city').default('Multan'),
  skills: text('skills'), // JSON string array
});

export const courses = sqliteTable('courses', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull(),
  price: real('price').default(0.00).notNull(),
  instructorName: text('instructor_name'),
  instructorTitle: text('instructor_title'),
  thumbnailUrl: text('thumbnail_url'),
  isPublished: integer('is_published', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const courseLessons = sqliteTable('course_lessons', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  courseId: text('course_id').references(() => courses.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  videoUrl: text('video_url'),
  duration: integer('duration'), // duration in seconds
  orderIndex: integer('order_index').notNull(),
});

export const lessonProgress = sqliteTable('lesson_progress', {
  userId: text('user_id').notNull(), // maps to both Drizzle users and Supabase auth.users
  lessonId: text('lesson_id').references(() => courseLessons.id, { onDelete: 'cascade' }),
  isCompleted: integer('is_completed', { mode: 'boolean' }).default(false),
  completedAt: text('completed_at'),
});

export const webinars = sqliteTable('webinars', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull(),
  price: real('price').default(0.00).notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  meetingLink: text('meeting_link'),
  maxSeats: integer('max_seats'),
  speakerName: text('speaker_name'),
  speakerTitle: text('speaker_title'),
  venue: text('venue', { enum: ['Online', 'In-Person'] }).default('Online'),
  isPublished: integer('is_published', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const orders = sqliteTable('orders', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull(), // References auth.users or Drizzle users
  itemType: text('item_type', { enum: ['COURSE', 'WEBINAR'] }).notNull(),
  courseId: text('course_id').references(() => courses.id),
  webinarId: text('webinar_id').references(() => webinars.id),
  amount: real('amount').notNull(),
  paymentStatus: text('payment_status', { enum: ['PENDING', 'COMPLETED', 'FAILED'] }).default('PENDING'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const tickets = sqliteTable('tickets', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  ticketCode: text('ticket_code').notNull().unique(),
  orderId: text('order_id').references(() => orders.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  itemType: text('item_type', { enum: ['COURSE', 'WEBINAR'] }).notNull(),
  courseId: text('course_id').references(() => courses.id),
  webinarId: text('webinar_id').references(() => webinars.id),
  qrPayload: text('qr_payload').notNull(),
  isCheckedIn: integer('is_checked_in', { mode: 'boolean' }).default(false),
  issuedAt: text('issued_at').default(sql`CURRENT_TIMESTAMP`),
});

export const enrollments = sqliteTable('enrollments', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull(),
  itemType: text('item_type', { enum: ['COURSE', 'WEBINAR'] }).notNull(),
  courseId: text('course_id').references(() => courses.id, { onDelete: 'cascade' }),
  webinarId: text('webinar_id').references(() => webinars.id, { onDelete: 'cascade' }),
  enrolledAt: text('enrolled_at').default(sql`CURRENT_TIMESTAMP`),
});

export const resources = sqliteTable('resources', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  fileUrl: text('file_url').notNull(),
  fileType: text('file_type').default('PDF'),
  itemType: text('item_type', { enum: ['COURSE', 'WEBINAR'] }).notNull(),
  courseId: text('course_id').references(() => courses.id, { onDelete: 'cascade' }),
  webinarId: text('webinar_id').references(() => webinars.id, { onDelete: 'cascade' }),
});

export const certificates = sqliteTable('certificates', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  certCode: text('cert_code').notNull().unique(),
  userId: text('user_id').notNull(),
  itemType: text('item_type', { enum: ['COURSE', 'WEBINAR'] }).notNull(),
  courseId: text('course_id').references(() => courses.id),
  webinarId: text('webinar_id').references(() => webinars.id),
  pdfUrl: text('pdf_url').notNull(),
  verificationUrl: text('verification_url').notNull(),
  issuedAt: text('issued_at').default(sql`CURRENT_TIMESTAMP`),
});
