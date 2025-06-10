import { pgTable, text, serial, integer, boolean, doublePrecision, timestamp, varchar, jsonb, uniqueIndex, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table with account type
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  accountType: text("account_type").notNull().default("worker"), // "worker", "poster", or "pending"
  skills: text("skills").array(), // Array of skill names for workers
  rating: doublePrecision("rating"), // Average rating from completed jobs
  isActive: boolean("is_active").notNull().default(true),
  lastActive: timestamp("last_active").defaultNow(),
  // Location data
  latitude: doublePrecision("latitude"), // Latitude coordinate for user's location
  longitude: doublePrecision("longitude"), // Longitude coordinate for user's location
  location: text("location"), // Human-readable location (address, city, etc.)
  // Social login fields
  googleId: text("google_id"), // Google OAuth ID
  facebookId: text("facebook_id"), // Facebook OAuth ID
  // Payment integration fields
  stripeCustomerId: text("stripe_customer_id"), // Stripe Customer ID for payments
  stripeConnectAccountId: text("stripe_connect_account_id"), // Stripe Connect account for receiving payments
  stripeConnectAccountStatus: text("stripe_connect_account_status"), // Status of Connect account
  // Terms acceptance fields
  stripeTermsAccepted: boolean("stripe_terms_accepted").default(false), // Whether user has accepted Stripe's TOS
  stripeTermsAcceptedAt: timestamp("stripe_terms_accepted_at"), // When the user accepted Stripe's TOS
  stripeRepresentativeName: text("stripe_representative_name"), // Name of the representative for Stripe verification
  stripeRepresentativeTitle: text("stripe_representative_title"), // Title of the representative for Stripe
  stripeRepresentativeRequirementsComplete: boolean("stripe_representative_requirements_complete").default(false), // Whether all representative details have been provided
  stripeBankingDetailsComplete: boolean("stripe_banking_details_complete").default(false), // Whether banking details have been provided
  // Contact preferences 
  contactPreferences: jsonb("contact_preferences").default({
    email: true,
    sms: false,
    push: true
  }), // User's preferences for notifications
  // Availability settings
  availability: jsonb("availability").default({
    weekdays: [true, true, true, true, true],
    weekend: [false, false],
    hourStart: 9,
    hourEnd: 17
  }), // User's weekly availability schedule
  // Verification status
  emailVerified: boolean("email_verified").default(false),
  phoneVerified: boolean("phone_verified").default(false),
  identityVerified: boolean("identity_verified").default(false),
  verificationToken: text("verification_token"), // Token for email verification
  verificationTokenExpiry: timestamp("verification_token_expiry"), // Expiry for the verification token
  phoneVerificationCode: text("phone_verification_code"), // SMS verification code
  phoneVerificationExpiry: timestamp("phone_verification_expiry"), // Expiry for SMS verification code
}, (table) => {
  // Create a unique constraint on the combination of email and accountType
  // This allows the same email to have multiple accounts with different types
  return {
    emailAccountTypeUnique: uniqueIndex("email_accounttype_unique").on(table.email, table.accountType)
  }
});

// Job postings table
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // e.g. "Home Maintenance", "Delivery", etc.
  posterId: integer("poster_id").notNull(), // References users.id
  workerId: integer("worker_id"), // References users.id (if assigned)
  status: text("status").notNull().default("open"), // "open", "assigned", "completed", "canceled"
  paymentType: text("payment_type").notNull(), // "hourly" or "fixed"
  paymentAmount: doublePrecision("payment_amount").notNull(),
  serviceFee: doublePrecision("service_fee").notNull().default(2.5), // Service fee of $2.50
  totalAmount: doublePrecision("total_amount").notNull(), // Total amount including service fee
  location: text("location").notNull(), // Address description
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  datePosted: timestamp("date_posted").defaultNow(),
  dateNeeded: timestamp("date_needed").notNull(),
  requiredSkills: text("required_skills").array(), // Skills needed for the job
  equipmentProvided: boolean("equipment_provided").notNull().default(false),
  autoAccept: boolean("auto_accept").notNull().default(false), // Auto accept applications
});

// Applications for jobs
export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(), // References jobs.id
  workerId: integer("worker_id").notNull(), // References users.id
  status: text("status").notNull().default("pending"), // "pending", "accepted", "rejected"
  message: text("message"),
  dateApplied: timestamp("date_applied").defaultNow(),
  hourlyRate: doublePrecision("hourly_rate"), // Proposed hourly rate for hourly jobs
  expectedDuration: text("expected_duration"), // Worker's estimate of job duration
  coverLetter: text("cover_letter"), // Detailed message about worker's approach to the job
});

// Reviews for completed jobs
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(), // References jobs.id
  reviewerId: integer("reviewer_id").notNull(), // References users.id (poster or worker)
  revieweeId: integer("reviewee_id").notNull(), // References users.id (poster or worker)
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  dateReviewed: timestamp("date_reviewed").defaultNow(),
});

// Tasks for jobs
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(), // References jobs.id
  description: text("description").notNull(),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  completedBy: integer("completed_by"), // References users.id (worker who completed the task)
  position: integer("position").notNull(), // Order position in the task list
  isOptional: boolean("is_optional").notNull().default(false), // Whether the task is optional (bonus)
  dueTime: timestamp("due_time"), // When the task is due
  estimatedDuration: integer("estimated_duration"), // Estimated time to complete in minutes
  location: text("location"), // Specific location for this task, if different from the job location
  latitude: doublePrecision("latitude"), // Task-specific latitude
  longitude: doublePrecision("longitude"), // Task-specific longitude
  bonusAmount: doublePrecision("bonus_amount"), // Additional payment for optional tasks
  notes: text("notes"), // Additional notes or instructions for the task
});

// Earnings table to track worker earnings
export const earnings = pgTable("earnings", {
  id: serial("id").primaryKey(),
  workerId: integer("worker_id").notNull(), // References users.id
  jobId: integer("job_id"), // References jobs.id (optional for non-job earnings)
  amount: doublePrecision("amount").notNull(), // Total amount earned before fees
  serviceFee: doublePrecision("service_fee").notNull().default(2.5), // Service fee amount
  netAmount: doublePrecision("net_amount").notNull(), // Net amount after service fee
  status: text("status").notNull().default("pending"), // "pending", "paid", "cancelled"
  dateEarned: timestamp("date_earned").defaultNow(), // When the job was completed
  datePaid: timestamp("date_paid"), // When the worker was paid
  transactionId: text("transaction_id"), // Stripe transfer ID or other payment processor ID
  paymentId: integer("payment_id"), // References the associated payment record
  stripeAccountId: text("stripe_account_id"), // Worker's Stripe Connect account ID
  description: text("description"), // Description of the earnings
  metadata: jsonb("metadata"), // Additional data about the earnings
});

// Payments table to track payment transactions
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // References users.id (payer - usually job poster)
  workerId: integer("worker_id"), // References users.id (payee - usually worker)
  amount: doublePrecision("amount").notNull(), // Amount of the payment
  serviceFee: doublePrecision("service_fee"), // Platform fee amount
  type: text("type").notNull(), // "payment", "transfer", "refund", "payout"
  status: text("status").notNull(), // "pending", "processing", "completed", "failed", "refunded"
  paymentMethod: text("payment_method"), // "card", "bank_account", "stripe", etc.
  transactionId: text("transaction_id"), // External payment processor ID (Stripe payment/transfer ID)
  stripePaymentIntentId: text("stripe_payment_intent_id"), // Stripe Payment Intent ID
  stripeCustomerId: text("stripe_customer_id"), // Customer ID for the payer
  stripeConnectAccountId: text("stripe_connect_account_id"), // Connect account ID for the worker
  jobId: integer("job_id"), // Optional reference to the related job
  description: text("description"), // Description of the payment
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"), // When the payment was completed
  metadata: jsonb("metadata"), // Additional payment data
});

// Badges and achievements table
export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  iconUrl: text("icon_url").notNull(),
  category: text("category").notNull(), // "skill", "milestone", "reputation", etc.
  requirements: jsonb("requirements"), // Requirements to earn this badge
  tier: integer("tier").default(1), // 1, 2, 3, etc. for bronze, silver, gold
  createdAt: timestamp("created_at").defaultNow(),
});

// User badges junction table
export const userBadges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // References users.id
  badgeId: integer("badge_id").notNull(), // References badges.id
  earnedAt: timestamp("earned_at").defaultNow(),
  metadata: jsonb("metadata"), // Additional data about how the badge was earned
});

// Notifications table for system and job notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // References users.id (recipient)
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // "job_posted", "application_received", etc.
  isRead: boolean("is_read").notNull().default(false),
  sourceId: integer("source_id"), // Optional ID of related entity (job, application, etc.)
  sourceType: text("source_type"), // "job", "application", etc.
  createdAt: timestamp("created_at").defaultNow(),
  metadata: jsonb("metadata"), // Additional data specific to notification type
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  rating: true,
  lastActive: true,
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  datePosted: true,
  workerId: true,
  serviceFee: true,
  totalAmount: true,
  autoAccept: true, // Will be explicitly set in the form
}).extend({
  paymentAmount: z.number().min(10, "Minimum payment amount is $10"),
  // Allow dateNeeded to be a string which will be converted to a Date on the server
  dateNeeded: z.union([z.string(), z.date()]).transform(val => 
    typeof val === 'string' ? new Date(val) : val
  ),
  autoAccept: z.boolean().default(false),
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  dateApplied: true,
  status: true,
}).extend({
  hourlyRate: z.number().optional(),
  expectedDuration: z.string().optional(),
  coverLetter: z.string().optional(),
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  dateReviewed: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  isCompleted: true,
  completedAt: true,
  completedBy: true,
});

export const insertEarningSchema = createInsertSchema(earnings).omit({
  id: true,
  dateEarned: true,
  datePaid: true,
  status: true,
  paymentId: true, // Optional relation to payment
  metadata: true, // Optional additional data
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  completedAt: true, // Set when payment completes
  metadata: true, // Optional additional data
});

export const insertBadgeSchema = createInsertSchema(badges).omit({
  id: true,
  createdAt: true,
});

export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({
  id: true,
  earnedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  isRead: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect & {
  requiresProfileCompletion?: boolean | null; // Virtual field, not in DB
  needsAccountType?: boolean | null; // Virtual field, not in DB
  skillsVerified?: Record<string, boolean>; // Virtual field, not in DB
  completedJobs?: number; // Virtual field, not in DB
  successRate?: number; // Virtual field, not in DB
  responseTime?: number; // Virtual field, not in DB
  badgeIds?: string[]; // Virtual field, not in DB
  requiresStripeTerms?: boolean; // Virtual field to check if user needs to accept Stripe TOS
  requiresStripeRepresentative?: boolean; // Virtual field to check if user needs to provide representative info
  requiresStripeBankingDetails?: boolean; // Virtual field to check if user needs to provide banking details
  profileCompletionPercentage?: number; // Virtual field showing profile completion status
  stripeConnectId?: string; // For compatibility with existing code (using stripeConnectAccountId internally)
};

// Contact preferences type for better TypeScript support
export type ContactPreferences = {
  email: boolean;
  sms: boolean;
  push: boolean;
};

// Availability type for better TypeScript support
export type Availability = {
  weekdays: boolean[];
  weekend: boolean[];
  hourStart: number;
  hourEnd: number;
};

export type InsertUser = z.infer<typeof insertUserSchema> & {
  requiresProfileCompletion?: boolean | null; // Virtual field, not in DB
  needsAccountType?: boolean | null; // Virtual field, not in DB
  skillsVerified?: Record<string, boolean>; // Virtual field, not in DB
  requiresStripeTerms?: boolean; // Virtual field for Stripe TOS
  requiresStripeRepresentative?: boolean; // Virtual field for Stripe representative
  requiresStripeBankingDetails?: boolean; // Virtual field for Stripe banking details
  contactPreferences?: ContactPreferences; // Optional contact preferences
  availability?: Availability; // Optional availability settings
};

export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;

export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Earning = typeof earnings.$inferSelect;
export type InsertEarning = z.infer<typeof insertEarningSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type Badge = typeof badges.$inferSelect;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;

export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Categories enum for job types
export const JOB_CATEGORIES = [
  "Home Maintenance",
  "Cleaning",
  "Delivery",
  "Event Help",
  "Moving",
  "Tech Support",
  "Shopping",
  "Pet Care",
  "Tutoring",
  "Other"
] as const;

// Skills list
export const SKILLS = [
  "Cleaning",
  "Organization",
  "Decoration",
  "Heavy Lifting",
  "Driving",
  "Computer Repair",
  "Gardening",
  "Cooking",
  "Pet Care",
  "Child Care",
  "Electrical",
  "Plumbing",
  "Painting",
  "Assembly",
  "Tutoring",
  "Photography",
  "Design",
  "Writing"
] as const;

// Badge categories
export const BADGE_CATEGORIES = [
  "Skill Mastery",
  "Milestone",
  "Job Completion",
  "Reputation",
  "Customer Satisfaction",
  "Speed",
  "Reliability",
  "Special Achievement"
] as const;

// Notification types
export const NOTIFICATION_TYPES = [
  "job_posted",
  "job_assigned",
  "job_completed",
  "application_received",
  "application_accepted",
  "application_rejected",
  "payment_received",
  "payment_sent",
  "review_received",
  "system_message"
] as const;
