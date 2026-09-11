/**
 * ROADGUARD AI - Shared TypeScript Types & Contracts
 * Used uniformly across Backend, Frontend, and Mobile
 */

export type UserRole = 'CITIZEN' | 'AUTHORITY' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId?: string;
  phone?: string;
  createdAt: string;
}

export type DamageType =
  | 'pothole'
  | 'crack'
  | 'surface_deterioration'
  | 'waterlogging'
  | 'road_edge_damage'
  | 'drainage_damage'
  | 'signage_damage'
  | 'other';

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ComplaintStatus =
  | 'REPORTED'
  | 'AI_ANALYZED'
  | 'PRIORITY_CALCULATED'
  | 'ASSIGNED'
  | 'ACKNOWLEDGED'
  | 'INSPECTION_SCHEDULED'
  | 'REPAIR_IN_PROGRESS'
  | 'REPAIR_COMPLETED'
  | 'AI_VERIFIED'
  | 'RESOLVED'
  | 'NEEDS_REINSPECTION'
  | 'CANCELLED';

export type SyncStatus = 'PENDING_SYNC' | 'SYNCING' | 'SYNCED' | 'FAILED';

export interface ImageQuality {
  isAcceptable: boolean;
  isBlurry: boolean;
  isTooDark: boolean;
  hasRoadVisible: boolean;
  qualityScore: number; // 0 - 100
  warningMessage?: string;
}

export interface AIAnalysis {
  damageType: DamageType;
  severity: SeverityLevel;
  confidence: number; // 0.0 - 1.0
  visibleDamage: boolean;
  roadSafetyRisk: number; // 0 - 100
  description: string;
  recommendedAction: string;
  imageQuality: ImageQuality;
  potentialDuplicateOf?: string;
  isDuplicate?: boolean;
  rawResponse?: Record<string, unknown>;
}

export interface RiskScoreBreakdown {
  severityScore: number; // weighted contribution
  safetyRiskScore: number;
  densityScore: number;
  roadImportanceScore: number;
  recurrenceScore: number;
  slaUrgencyScore: number;
}

export interface PriorityAssessment {
  overallScore: number; // 0 - 100
  riskLevel: RiskLevel;
  breakdown: RiskScoreBreakdown;
  explanation: string[];
}

export interface StatusTimelineEvent {
  id: string;
  status: ComplaintStatus;
  label: string;
  description: string;
  timestamp: string;
  actorRole?: UserRole;
  actorName?: string;
  notes?: string;
}

export type VerificationStatusType = 'VERIFIED' | 'SOURCE FOUND' | 'DEMO DATA' | 'NOT VERIFIED';

export interface TenderRecord {
  id: string;
  roadName: string;
  roadSegmentId?: string;
  tenderId: string;
  tenderRefNumber: string;
  workDescription: string;
  department: string;
  tenderValue: string; // e.g. "₹1.42 Crore"
  tenderDate: string;
  workPeriod: string;
  tenderStatus: 'Active' | 'Under Maintenance' | 'Awarded' | 'Completed' | 'Tendering';
  invitingAuthority: string;
  contractor: string; // "Verified contractor name" or "Not available in retrieved public record"
  contractorStatus: 'VERIFIED' | 'UNVERIFIED' | 'PUBLIC_RECORD_PENDING';
  officialSourceUrl: string;
  sourceDate: string;
  verificationStatus: VerificationStatusType;
  notes?: string;
}

export interface RoadSegment {
  id: string;
  code: string; // e.g. "MRT-RD-01"
  name: string; // e.g. "Meerut–Pauri Road (ODR)"
  startCoordinates: [number, number]; // [lat, lng]
  endCoordinates: [number, number];
  lengthKm: number;
  departmentId: string;
  departmentName: string;
  importanceLevel: 'HIGHWAY' | 'ARTERIAL' | 'MAJOR_DISTRICT' | 'LOCAL';
  healthScore: number; // 0 - 100 (100 is pristine)
  openComplaints: number;
  criticalComplaints: number;
  resolvedComplaints: number;
  recurringDamageCount: number;
  isRecurringHotspot: boolean;
  reportingCoverage: 'LIMITED' | 'MODERATE' | 'HIGH';
  lastInspectionDate?: string;
  lastRepairDate?: string;
  tenderId?: string;
  tender?: TenderRecord;
}

export type EvidenceSourceType = 'USER_UPLOADED' | 'LICENSED_EXTERNAL' | 'DEMO_SYNTHETIC';

export interface EvidenceMetadata {
  title?: string;
  publication?: string;
  sourceUrl?: string;
  date?: string;
  attribution?: string;
  filename?: string;
  sizeBytes?: number;
  mimeType?: string;
}

export interface RoadReport {
  id: string; // e.g. "RG-MRT-2026-000101"
  clientReportId?: string; // Idempotency UUID
  userId: string;
  userEmail?: string;
  imageUrl: string;
  additionalImages?: string[];
  evidenceSource?: EvidenceSourceType;
  evidenceSourceMetadata?: string; // JSON string
  imageFilename?: string;
  imageMimeType?: string;
  latitude: number;
  longitude: number;
  address?: string;
  description: string;
  damageType: DamageType;
  severity: SeverityLevel;
  status: ComplaintStatus;
  roadSegmentId?: string;
  roadSegment?: RoadSegment;
  departmentId?: string;
  departmentName?: string;
  department?: Department;
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  aiAnalysis?: AIAnalysis;
  priorityAssessment?: PriorityAssessment;
  riskScore: number; // 0 - 100
  isDuplicate: boolean;
  duplicateOfId?: string;
  isRecurring: boolean;
  slaTargetHours: number;
  slaDueAt: string;
  isOverdue: boolean;
  overdueHours?: number;
  repairBeforeImageUrl?: string;
  repairAfterImageUrl?: string;
  verificationResult?: RepairVerification;
  timeline: StatusTimelineEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface RepairVerification {
  id: string;
  reportId: string;
  beforeImageUrl: string;
  afterImageUrl: string;
  locationMatchConfidence: number; // 0 - 100
  visibleImprovementScore: number; // 0 - 100
  remainingDamageScore: number; // 0 - 100
  overallConfidence: number; // 0 - 100
  recommendation: 'PASS' | 'NEEDS_REINSPECTION' | 'INCONCLUSIVE';
  recommendationExplanation: string;
  authorityDecision?: 'APPROVED' | 'REJECTED_REINSPECT';
  authorityNotes?: string;
  verifiedAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  jurisdiction: string;
  nodalOfficer: string;
  contactEmail: string;
  slaDaysDefault: number;
  activeWorkload: number;
}

export interface OfflineQueueItem {
  id: string; // client UUID
  photoUri: string;
  photoBase64?: string;
  latitude: number;
  longitude: number;
  description: string;
  damageTypeHint?: DamageType;
  createdAt: string;
  status: SyncStatus;
  retryCount: number;
  errorMessage?: string;
}

export interface AnalyticsSummary {
  totalReports: number;
  openReports: number;
  criticalReports: number;
  overdueReports: number;
  resolvedReports: number;
  avgResolutionHours: number;
  recurringHotspotsCount: number;
  roadHealthAverage: number;
  reportsBySeverity: Record<SeverityLevel, number>;
  reportsByStatus: Record<string, number>;
  reportsByDepartment: Record<string, number>;
  weeklyTrend: { date: string; created: number; resolved: number }[];
}
