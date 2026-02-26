// ============================================================
// TableGov — Global State (React context + localStorage)
// ============================================================

import { createContext, useContext } from 'react';
import type {
  Charter,
  Stakeholder,
  SortitionResult,
  NoConfidencePetition,
  SevenGenAssessment,
  AuditEntry,
  AuditAction,
  View,
} from '../types';
import { sha256, generateId } from '../utils/crypto';

const STORAGE_KEY = 'tablegov_state';

export interface AppState {
  charters: Charter[];
  stakeholders: Stakeholder[];
  sortitionResults: SortitionResult[];
  petitions: NoConfidencePetition[];
  assessments: SevenGenAssessment[];
  auditLog: AuditEntry[];
  currentView: View;
  selectedCharterId: string | null;
}

export const initialState: AppState = {
  charters: [],
  stakeholders: [],
  sortitionResults: [],
  petitions: [],
  assessments: [],
  auditLog: [],
  currentView: 'dashboard',
  selectedCharterId: null,
};

export type Action =
  | { type: 'SET_VIEW'; view: View }
  | { type: 'SELECT_CHARTER'; id: string | null }
  | { type: 'ADD_CHARTER'; charter: Charter }
  | { type: 'UPDATE_CHARTER'; charter: Charter }
  | { type: 'RENEW_CHARTER'; id: string; newSunsetDate: string }
  | { type: 'EXPIRE_CHARTER'; id: string }
  | { type: 'ADD_STAKEHOLDER'; stakeholder: Stakeholder }
  | { type: 'REMOVE_STAKEHOLDER'; id: string }
  | { type: 'ADD_SORTITION_RESULT'; result: SortitionResult }
  | { type: 'ADD_PETITION'; petition: NoConfidencePetition }
  | { type: 'SIGN_PETITION'; petitionId: string; signature: { stakeholderId: string; name: string; timestamp: string } }
  | { type: 'RESOLVE_PETITION'; petitionId: string }
  | { type: 'ADD_ASSESSMENT'; assessment: SevenGenAssessment }
  | { type: 'ADD_AUDIT_ENTRY'; entry: AuditEntry }
  | { type: 'LOAD_STATE'; state: AppState };

export function reducer(state: AppState, action: Action): AppState {
  let next: AppState;
  switch (action.type) {
    case 'SET_VIEW':
      next = { ...state, currentView: action.view };
      break;
    case 'SELECT_CHARTER':
      next = { ...state, selectedCharterId: action.id };
      break;
    case 'ADD_CHARTER':
      next = { ...state, charters: [...state.charters, action.charter] };
      break;
    case 'UPDATE_CHARTER':
      next = {
        ...state,
        charters: state.charters.map((c) =>
          c.id === action.charter.id ? action.charter : c
        ),
      };
      break;
    case 'RENEW_CHARTER':
      next = {
        ...state,
        charters: state.charters.map((c) =>
          c.id === action.id
            ? {
                ...c,
                sunsetDate: action.newSunsetDate,
                status: 'active' as const,
                renewalCount: c.renewalCount + 1,
                updatedAt: new Date().toISOString(),
              }
            : c
        ),
      };
      break;
    case 'EXPIRE_CHARTER':
      next = {
        ...state,
        charters: state.charters.map((c) =>
          c.id === action.id ? { ...c, status: 'expired' as const } : c
        ),
      };
      break;
    case 'ADD_STAKEHOLDER':
      next = { ...state, stakeholders: [...state.stakeholders, action.stakeholder] };
      break;
    case 'REMOVE_STAKEHOLDER':
      next = {
        ...state,
        stakeholders: state.stakeholders.filter((s) => s.id !== action.id),
      };
      break;
    case 'ADD_SORTITION_RESULT':
      next = { ...state, sortitionResults: [...state.sortitionResults, action.result] };
      break;
    case 'ADD_PETITION':
      next = { ...state, petitions: [...state.petitions, action.petition] };
      break;
    case 'SIGN_PETITION': {
      next = {
        ...state,
        petitions: state.petitions.map((p) => {
          if (p.id !== action.petitionId) return p;
          const signatures = [...p.signatures, action.signature];
          const pct = (signatures.length / p.totalStakeholders) * 100;
          return {
            ...p,
            signatures,
            status: pct >= p.thresholdPercent ? 'threshold-met' as const : p.status,
          };
        }),
      };
      break;
    }
    case 'RESOLVE_PETITION':
      next = {
        ...state,
        petitions: state.petitions.map((p) =>
          p.id === action.petitionId ? { ...p, status: 'resolved' as const } : p
        ),
      };
      break;
    case 'ADD_ASSESSMENT':
      next = { ...state, assessments: [...state.assessments, action.assessment] };
      break;
    case 'ADD_AUDIT_ENTRY':
      next = { ...state, auditLog: [...state.auditLog, action.entry] };
      break;
    case 'LOAD_STATE':
      next = action.state;
      break;
    default:
      next = state;
  }
  persist(next);
  return next;
}

function persist(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage full — silent fail
  }
}

export function loadPersistedState(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AppState;
  } catch {
    return null;
  }
}

// Audit log helper — call this from components via dispatch
export async function createAuditEntry(
  action: AuditAction,
  entityType: AuditEntry['entityType'],
  entityId: string,
  description: string,
  previousHash: string
): Promise<AuditEntry> {
  const entry: Omit<AuditEntry, 'hash'> = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    action,
    entityType,
    entityId,
    description,
    previousHash,
  };
  const hash = await sha256(JSON.stringify(entry));
  return { ...entry, hash };
}

// Context
export interface StoreContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  audit: (
    action: AuditAction,
    entityType: AuditEntry['entityType'],
    entityId: string,
    description: string
  ) => Promise<void>;
}

export const StoreContext = createContext<StoreContextValue>(null!);

export function useStore(): StoreContextValue {
  return useContext(StoreContext);
}
