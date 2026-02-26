// ============================================================
// TableGov — Core Types
// ============================================================

export interface Charter {
  id: string;
  organizationName: string;
  createdAt: string;
  updatedAt: string;
  optimizesFor: string;
  serves: string;
  powerWielded: string;
  powerChecks: string;
  additionalClauses: string[];
  status: 'active' | 'expired' | 'under-review' | 'draft';
  sunsetDate: string; // ISO date
  renewalCount: number;
}

export interface SunsetClock {
  charterId: string;
  expiresAt: string; // ISO date
  renewedAt?: string;
  isExpired: boolean;
  defaultDurationDays: number;
}

export interface Stakeholder {
  id: string;
  name: string;
  email: string;
  stratum?: string; // for stratified sortition
  addedAt: string;
}

export interface SortitionResult {
  id: string;
  charterId: string;
  timestamp: string;
  selectedIds: string[];
  poolSize: number;
  selectionSize: number;
  seed: string; // hex string of cryptographic seed
  stratification?: Record<string, number>; // stratum -> count
  verificationHash: string;
}

export interface NoConfidencePetition {
  id: string;
  charterId: string;
  title: string;
  description: string;
  createdAt: string;
  signatures: PetitionSignature[];
  thresholdPercent: number;
  totalStakeholders: number;
  status: 'open' | 'threshold-met' | 'resolved' | 'dismissed';
}

export interface PetitionSignature {
  stakeholderId: string;
  name: string;
  timestamp: string;
}

export interface SevenGenAssessment {
  id: string;
  charterId: string;
  createdAt: string;
  quarter: string; // e.g. "2026-Q1"
  systemDescription: string;
  generation1: string; // current
  generation2: string; // ~25 years
  generation3: string; // ~50 years
  generation4: string; // ~75 years
  generation5: string; // ~100 years
  generation6: string; // ~125 years
  generation7: string; // ~150+ years
  overallAssessment: 'acceptable' | 'concerning' | 'unacceptable';
  recommendations: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: AuditAction;
  entityType: 'charter' | 'sunset' | 'sortition' | 'petition' | 'assessment';
  entityId: string;
  description: string;
  previousHash: string;
  hash: string;
}

export type AuditAction =
  | 'charter_created'
  | 'charter_updated'
  | 'charter_renewed'
  | 'charter_expired'
  | 'sunset_renewed'
  | 'sunset_expired'
  | 'sortition_performed'
  | 'petition_created'
  | 'petition_signed'
  | 'petition_threshold_met'
  | 'petition_resolved'
  | 'assessment_created';

export type View =
  | 'dashboard'
  | 'charter'
  | 'sunset'
  | 'sortition'
  | 'no-confidence'
  | 'seven-gen'
  | 'audit';
