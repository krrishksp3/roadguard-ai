import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['CITIZEN', 'AUTHORITY', 'ADMIN']).default('CITIZEN'),
  departmentId: z.string().optional(),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const reportCreateSchema = z.object({
  clientReportId: z.string().optional(),
  imageUrl: z.string().min(1, 'Image or photo evidence is required'),
  additionalImages: z.array(z.string()).optional(),
  evidenceSource: z.enum(['USER_UPLOADED', 'LICENSED_EXTERNAL', 'DEMO_SYNTHETIC']).default('USER_UPLOADED'),
  evidenceSourceMetadata: z.string().optional(),
  imageFilename: z.string().optional(),
  imageMimeType: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional(),
  description: z.string().min(3, 'Please provide a brief description of the road issue'),
  damageTypeHint: z.string().optional(),
});

export const afterPhotoUploadSchema = z.object({
  afterImageUrl: z.string().min(1, 'After-repair image is required'),
  evidenceSource: z.enum(['USER_UPLOADED', 'LICENSED_EXTERNAL', 'DEMO_SYNTHETIC']).default('USER_UPLOADED'),
  evidenceSourceMetadata: z.string().optional(),
  imageFilename: z.string().optional(),
  imageMimeType: z.string().optional(),
  notes: z.string().optional(),
});

export const reportStatusUpdateSchema = z.object({
  status: z.enum([
    'REPORTED',
    'AI_ANALYZED',
    'PRIORITY_CALCULATED',
    'ASSIGNED',
    'ACKNOWLEDGED',
    'INSPECTION_SCHEDULED',
    'REPAIR_IN_PROGRESS',
    'REPAIR_COMPLETED',
    'AI_VERIFIED',
    'RESOLVED',
    'NEEDS_REINSPECTION',
  ]),
  notes: z.string().optional(),
  assignedOfficerId: z.string().optional(),
  departmentId: z.string().optional(),
  damageTypeOverride: z.string().optional(),
  severityOverride: z.string().optional(),
});

export const repairVerificationSchema = z.object({
  reportId: z.string().min(1, 'Report ID is required'),
  afterImageUrl: z.string().min(1, 'After-repair image is required'),
  notes: z.string().optional(),
});

export const authorityDecisionSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED_REINSPECT']),
  notes: z.string().optional(),
});
