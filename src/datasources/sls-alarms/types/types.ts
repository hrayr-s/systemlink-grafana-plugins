import { DataQuery } from '@grafana/schema';

export interface AlarmsQuery extends DataQuery {
  queryType?: QueryType;
}

export interface AlarmsVariableQuery extends AlarmsQuery {
  filter?: string;
  descending?: boolean;
  take?: number;
}

export enum QueryType {
  ListAlarms = 'List Alarms',
  AlarmTrend = 'Alarm Trend'
}

export interface SubQuery {
  alarmId?: string;
  description?: string;
  displayName?: string;
  active?: boolean;
  clear?: boolean;
  acknowledged?: boolean;
  acknowledgedAtMin?: string;
  acknowledgedAtMax?: string;
  occurredAtMin?: string;
  occurredAtMax?: string;
  currentSeverityLevelMin?: number;
  currentSeverityLevelMax?: number;
  highestSeverityLevelMin?: number;
  highestSeverityLevelMax?: number;
  createdBy?: string;
  channel?: string;
  resourceType?: string;
  properties?: { [key: string]: string };
  keywords?: string[];
  workspaces?: string[];
}

export enum OrderBy {
  DateUpdatedForward = 'DATE_UPDATED_FORWARD',
  DateUpdatedBackward = 'DATE_UPDATED_BACKWARD',
}

export interface QueryAlarmsRequest extends SubQuery {
  subQueries?: SubQuery[];
  returnMostRecentlyOccurredOnly?: boolean;
  orderBy?: OrderBy;
  skip?: number;
  take?: number;
  /** @deprecated Not in API schema - kept for backward compatibility */
  transitionInclusionOption?: TransitionInclusionOption;
  /** @deprecated Not in API schema - kept for backward compatibility */
  continuationToken?: string;
  /** @deprecated Not in API schema - use totalCount from response instead */
  returnCount?: boolean;
}

export interface QueryAlarmsResponse {
  filterMatches?: Alarm[];
  totalCount?: number;
  continuationToken?: string;
}

export interface Alarm {
  instanceId: string;
  alarmId: string;
  workspace: string;
  active: boolean;
  clear: boolean;
  acknowledged: boolean;
  acknowledgedAt: string | null;
  acknowledgedBy: string | null;
  occurredAt: string;
  updatedAt: string;
  createdBy: string;
  transitions: AlarmTransition[];
  transitionOverflowCount: number;
  currentSeverityLevel: number;
  highestSeverityLevel: number;
  mostRecentSetOccurredAt: string | null;
  mostRecentTransitionOccurredAt: string | null;
  channel: string;
  condition: string;
  displayName: string;
  description: string;
  keywords: string[];
  properties: {
    [key: string]: string;
  };
  resourceType: string;
}

export enum TransitionInclusionOption {
  None = 'NONE',
  MostRecentOnly = 'MOST_RECENT_ONLY',
  All = 'ALL',
};

export interface AlarmTransition {
  transitionType: AlarmTransitionType;
  occurredAt: string;
  severityLevel: number;
  condition: string;
  shortText: string;
  detailText: string;
  keywords: string[];
  properties: {
    [key: string]: string;
  };
}

export enum AlarmTransitionType {
  Clear = 'CLEAR',
  Set = 'SET',
};

export enum AlarmTransitionSeverityLevel {
  Clear = -1,
  Low = 1,
  Moderate = 2,
  High = 3,
  Critical = 4,
}
