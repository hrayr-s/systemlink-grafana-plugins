import { QueryBuilderOperations } from 'core/query-builder.constants';
import { QBField } from 'core/types';
import { AlarmsSpecificProperties } from '../types/ListAlarms.types';

// Boolean fields (active, clear, acknowledged) — the parser maps both equality
// and negation to the corresponding SubQuery boolean.
const BOOLEAN_FILTER_OPERATIONS = [
  QueryBuilderOperations.EQUALS.name,
  QueryBuilderOperations.DOES_NOT_EQUAL.name,
];

// Fields the query-instances API matches by exact value only. Other operators
// (negation, contains, blank checks) have no SubQuery equivalent and would be
// silently dropped, so they are intentionally omitted.
const EQUALITY_FILTER_OPERATIONS = [
  QueryBuilderOperations.EQUALS.name,
];

// Text fields the API matches by substring (displayName, description). Both the
// equality and contains expressions resolve to the same SubQuery field.
const CONTAINS_FILTER_OPERATIONS = [
  QueryBuilderOperations.EQUALS.name,
  QueryBuilderOperations.CONTAINS.name,
];

const DATE_TIME_FILTER_OPERATIONS = [
  QueryBuilderOperations.DATE_TIME_IS_BEFORE.name,
  QueryBuilderOperations.DATE_TIME_IS_AFTER.name,
];

// Keyword list field — the API supports inclusion checks only.
const KEYWORD_FILTER_OPERATIONS = [
  QueryBuilderOperations.LIST_EQUALS.name,
  QueryBuilderOperations.LIST_CONTAINS.name,
];

// Properties — the API matches exact key/value pairs only.
const PROPERTIES_FILTER_OPERATIONS = [
  QueryBuilderOperations.KEY_VALUE_MATCH.name,
];

export const SEVERITY_LEVELS = [
  { label: 'Low', value: '1' },
  { label: 'Moderate', value: '2' },
  { label: 'High', value: '3' },
  { label: 'Critical', value: '4' },
  { label: 'Clear', value: '-1' },
];

export const BOOLEAN_OPTIONS = [
  { label: 'True', value: 'true' },
  { label: 'False', value: 'false' },
];

export const TIME_OPTIONS = [
  { label: 'From', value: '${__from:date}' },
  { label: 'To', value: '${__to:date}' },
  { label: 'Now', value: '${__now:date}' },
];

export const AlarmsQueryBuilderFields: Record<string, QBField> = {
  ACKNOWLEDGED: {
    label: 'Acknowledged',
    dataField: AlarmsSpecificProperties.acknowledged,
    filterOperations: BOOLEAN_FILTER_OPERATIONS,
    lookup: {
      dataSource: BOOLEAN_OPTIONS,
    },
  },
  ACKNOWLEDGED_ON: {
    label: 'Acknowledged on',
    dataField: AlarmsSpecificProperties.acknowledgedAt,
    filterOperations: DATE_TIME_FILTER_OPERATIONS,
  },
  ACTIVE: {
    label: 'Active',
    dataField: AlarmsSpecificProperties.active,
    filterOperations: BOOLEAN_FILTER_OPERATIONS,
    lookup: {
      dataSource: BOOLEAN_OPTIONS,
    },
  },
  ALARM_ID: {
    label: 'Alarm ID',
    dataField: AlarmsSpecificProperties.alarmId,
    filterOperations: EQUALITY_FILTER_OPERATIONS,
  },
  ALARM_NAME: {
    label: 'Alarm name',
    dataField: AlarmsSpecificProperties.displayName,
    filterOperations: CONTAINS_FILTER_OPERATIONS,
  },
  CHANNEL: {
    label: 'Channel',
    dataField: AlarmsSpecificProperties.channel,
    filterOperations: EQUALITY_FILTER_OPERATIONS,
  },
  CLEAR: {
    label: 'Clear',
    dataField: AlarmsSpecificProperties.clear,
    filterOperations: BOOLEAN_FILTER_OPERATIONS,
    lookup: {
      dataSource: BOOLEAN_OPTIONS,
    },
  },
  CREATED_BY: {
    label: 'Created by',
    dataField: AlarmsSpecificProperties.createdBy,
    filterOperations: EQUALITY_FILTER_OPERATIONS,
  },
  CURRENT_SEVERITY: {
    label: 'Current severity',
    dataField: AlarmsSpecificProperties.currentSeverityLevel,
    filterOperations: EQUALITY_FILTER_OPERATIONS,
    lookup: {
        dataSource: SEVERITY_LEVELS,
    },
  },
  DESCRIPTION: {
    label: 'Description',
    dataField: AlarmsSpecificProperties.description,
    filterOperations: CONTAINS_FILTER_OPERATIONS,
  },
  FIRST_OCCURRENCE: {
    label: 'First occurrence',
    dataField: AlarmsSpecificProperties.occurredAt,
    filterOperations: DATE_TIME_FILTER_OPERATIONS,
  },
  HIGHEST_SEVERITY: {
    label: 'Highest severity',
    dataField: AlarmsSpecificProperties.highestSeverityLevel,
    filterOperations: EQUALITY_FILTER_OPERATIONS,
    lookup: {
      dataSource: SEVERITY_LEVELS,
    },
  },
  KEYWORD: {
    label: 'Keyword',
    dataField: AlarmsSpecificProperties.keywords,
    filterOperations: KEYWORD_FILTER_OPERATIONS,
  },
  PROPERTIES: {
    label: 'Properties',
    dataField: AlarmsSpecificProperties.properties,
    dataType: 'object',
    filterOperations: PROPERTIES_FILTER_OPERATIONS,
  },
  RESOURCE_TYPE: {
    label: 'Resource type',
    dataField: AlarmsSpecificProperties.resourceType,
    filterOperations: EQUALITY_FILTER_OPERATIONS,
  },
  SOURCE: {
    label: 'Source',
    dataField: AlarmsSpecificProperties.source,
    filterOperations: EQUALITY_FILTER_OPERATIONS,
  },
  WORKSPACE: {
    label: 'Workspace',
    dataField: AlarmsSpecificProperties.workspace,
    filterOperations: EQUALITY_FILTER_OPERATIONS,
  }
};

export const AlarmsQueryBuilderStaticFields: QBField[] = [
  AlarmsQueryBuilderFields.ACKNOWLEDGED,
  AlarmsQueryBuilderFields.ACTIVE,
  AlarmsQueryBuilderFields.ALARM_ID,
  AlarmsQueryBuilderFields.ALARM_NAME,
  AlarmsQueryBuilderFields.CHANNEL,
  AlarmsQueryBuilderFields.CLEAR,
  AlarmsQueryBuilderFields.CREATED_BY,
  AlarmsQueryBuilderFields.CURRENT_SEVERITY,
  AlarmsQueryBuilderFields.DESCRIPTION,
  AlarmsQueryBuilderFields.HIGHEST_SEVERITY,
  AlarmsQueryBuilderFields.KEYWORD,
  AlarmsQueryBuilderFields.PROPERTIES,
  AlarmsQueryBuilderFields.RESOURCE_TYPE,
  AlarmsQueryBuilderFields.SOURCE,
];
