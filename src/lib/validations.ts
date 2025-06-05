import { z } from 'zod';

// Auth validations
export const registerSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  email: z.string()
    .email('Please enter a valid email address')
    .toLowerCase(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number')
    .optional()
});

export const loginSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .toLowerCase(),
  password: z.string()
    .min(1, 'Password is required')
});

export const otpSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address'),
  otp: z.string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d+$/, 'OTP must contain only numbers')
});

// Event validations
export const createEventSchema = z.object({
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be less than 100 characters')
    .trim(),
  description: z.string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must be less than 2000 characters')
    .trim(),
  category: z.string()
    .min(1, 'Please select a category'),
  location: z.string()
    .min(5, 'Location must be at least 5 characters')
    .max(200, 'Location must be less than 200 characters')
    .trim(),
  latitude: z.number()
    .min(-90, 'Invalid latitude')
    .max(90, 'Invalid latitude'),
  longitude: z.number()
    .min(-180, 'Invalid longitude')
    .max(180, 'Invalid longitude'),
  startDate: z.string()
    .refine((date) => {
      const eventDate = new Date(date);
      const now = new Date();
      return eventDate > now;
    }, 'Event start date must be in the future'),
  endDate: z.string()
    .optional()
    .refine((date) => {
      if (!date) return true;
      return new Date(date) > new Date();
    }, 'Event end date must be in the future'),
  isUrgent: z.boolean().default(false),
  isPaid: z.boolean().default(false),
  ticketTiers: z.string().optional(),
  registrationStart: z.string().optional(),
  registrationEnd: z.string().optional()
}).refine((data) => {
  if (data.endDate && data.startDate) {
    return new Date(data.endDate) > new Date(data.startDate);
  }
  return true;
}, {
  message: 'End date must be after start date',
  path: ['endDate']
}).refine((data) => {
  if (data.registrationEnd && data.registrationStart) {
    return new Date(data.registrationEnd) > new Date(data.registrationStart);
  }
  return true;
}, {
  message: 'Registration end date must be after start date',
  path: ['registrationEnd']
}).refine((data) => {
  if (data.registrationEnd && data.startDate) {
    return new Date(data.registrationEnd) <= new Date(data.startDate);
  }
  return true;
}, {
  message: 'Registration must end before or on event start date',
  path: ['registrationEnd']
});

// Create a new schema that extends the base schema but makes all fields optional
export const updateEventSchema = z.object({
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be less than 100 characters')
    .trim()
    .optional(),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters')
    .trim()
    .optional(),
  category: z.string()
    .min(1, 'Please select a category')
    .optional(),
  location: z.string()
    .min(5, 'Location must be at least 5 characters')
    .max(200, 'Location must be less than 200 characters')
    .trim()
    .optional(),
  latitude: z.number()
    .min(-90, 'Invalid latitude')
    .max(90, 'Invalid latitude')
    .optional(),
  longitude: z.number()
    .min(-180, 'Invalid longitude')
    .max(180, 'Invalid longitude')
    .optional(),
  startDate: z.string()
    .refine((date) => {
      if (!date) return true;
      const eventDate = new Date(date);
      const now = new Date();
      return eventDate > now;
    }, 'Event start date must be in the future')
    .optional(),
  endDate: z.string()
    .refine((date) => {
      if (!date) return true;
      return new Date(date) > new Date();
    }, 'Event end date must be in the future')
    .optional(),
  isUrgent: z.boolean().optional(),
  isPaid: z.boolean().optional(),
  ticketTiers: z.string().optional(),
  registrationStart: z.string().optional(),
  registrationEnd: z.string().optional()
});

// Issue validations
export const createIssueSchema = z.object({
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be less than 100 characters')
    .trim(),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters')
    .trim(),
  category: z.string()
    .min(1, 'Please select a category'),
  location: z.string()
    .min(5, 'Location must be at least 5 characters')
    .max(200, 'Location must be less than 200 characters')
    .trim(),
  latitude: z.number()
    .min(-90, 'Invalid latitude')
    .max(90, 'Invalid latitude'),
  longitude: z.number()
    .min(-180, 'Invalid longitude')
    .max(180, 'Invalid longitude'),
  isAnonymous: z.boolean().default(false)
});

export const updateIssueSchema = createIssueSchema.partial();

export const updateIssueStatusSchema = z.object({
  status: z.enum(['Reported', 'In Progress', 'Under Review', 'Resolved'], {
    required_error: 'Please select a valid status'
  }),
  comment: z.string()
    .max(500, 'Comment must be less than 500 characters')
    .optional()
});

// Category validations
export const createCategorySchema = z.object({
  name: z.string()
    .min(2, 'Category name must be at least 2 characters')
    .max(50, 'Category name must be less than 50 characters')
    .trim(),
  description: z.string()
    .max(200, 'Description must be less than 200 characters')
    .optional()
});

// Admin validations
export const adminUpdateUserSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .optional(),
  email: z.string()
    .email('Please enter a valid email address')
    .optional(),
  isAdmin: z.boolean().optional(),
  isVerifiedOrganizer: z.boolean().optional(),
  isBanned: z.boolean().optional()
});

export const contentModerationSchema = z.object({
  action: z.enum(['approve', 'reject', 'flag'], {
    required_error: 'Please select an action'
  }),
  reason: z.string()
    .max(500, 'Reason must be less than 500 characters')
    .optional()
});

// Filter validations (for search and filtering)
export const filterSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  dateRange: z.string().optional(),
  distance: z.string().optional(),
  status: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional()
});

// Pagination validation
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(9),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type OtpInput = z.infer<typeof otpSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type CreateIssueInput = z.infer<typeof createIssueSchema>;
export type UpdateIssueInput = z.infer<typeof updateIssueSchema>;
export type UpdateIssueStatusInput = z.infer<typeof updateIssueStatusSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
export type ContentModerationInput = z.infer<typeof contentModerationSchema>;
export type FilterInput = z.infer<typeof filterSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>; 