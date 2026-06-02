import { SubQuery } from '../types/types';

/**
 * Parses a LINQ filter expression into a SubQuery object compatible with the
 * /v1/query-instances API. Handles basic equality, date range, severity,
 * properties, keywords, and workspace filters.
 *
 * Unsupported operations (negation, contains on non-text fields, is blank, etc.)
 * are collected into the returned `unsupported` array so callers can decide how
 * to handle them.
 */
export interface ParseResult {
  subQuery: SubQuery;
  unsupported: string[];
}

export function parseFilterToSubQuery(filter: string | undefined): ParseResult {
  const subQuery: SubQuery = {};
  const unsupported: string[] = [];

  if (!filter || filter.trim() === '') {
    return { subQuery, unsupported };
  }

  const normalized = stripOuterParens(filter.trim());
  const conditions = splitTopLevelConditions(normalized);

  for (const condition of conditions) {
    const trimmed = condition.trim();
    if (!trimmed) {
      continue;
    }

    if (!applyCondition(trimmed, subQuery)) {
      unsupported.push(trimmed);
    }
  }

  return { subQuery, unsupported };
}

/**
 * Parses a complex OR-based trend filter into an array of SubQuery objects
 * suitable for the `subQueries` field of the API request.
 */
export function parseTrendFilterToSubQueries(
  filter: string | undefined
): { subQueries: SubQuery[]; topLevel: SubQuery; unsupported: string[] } {
  const topLevel: SubQuery = {};
  const subQueries: SubQuery[] = [];
  const unsupported: string[] = [];

  if (!filter || filter.trim() === '') {
    return { subQueries, topLevel, unsupported };
  }

  const normalized = stripOuterParens(filter.trim());
  const orGroups = splitTopLevelOrGroups(normalized);

  if (orGroups.length <= 1) {
    const result = parseFilterToSubQuery(filter);
    return { subQueries: [], topLevel: result.subQuery, unsupported: result.unsupported };
  }

  for (const group of orGroups) {
    const result = parseFilterToSubQuery(group);
    if (result.unsupported.length > 0) {
      unsupported.push(...result.unsupported);
    }
    subQueries.push(result.subQuery);
  }

  return { subQueries, topLevel, unsupported };
}

function applyCondition(condition: string, subQuery: SubQuery): boolean {
  return (
    tryParseEquality(condition, subQuery) ||
    tryParseBooleanNegation(condition, subQuery) ||
    tryParseDateComparison(condition, subQuery) ||
    tryParseSeverityEquality(condition, subQuery) ||
    tryParseSeverityRange(condition, subQuery) ||
    tryParseContains(condition, subQuery) ||
    tryParseKeywords(condition, subQuery) ||
    tryParseProperties(condition, subQuery) ||
    tryParseDotNotationProperties(condition, subQuery) ||
    tryParseWorkspace(condition, subQuery) ||
    tryParseCompoundGroup(condition, subQuery)
  );
}

// Handles compound groups (OR/AND) produced by multi-value variables or source field transformations
// e.g. "channel = \"ch1\" || channel = \"ch2\"" or "properties.System = \"X\" || properties.MinionId = \"X\""
// e.g. "channel != \"ch1\" && channel != \"ch2\""
function tryParseCompoundGroup(condition: string, subQuery: SubQuery): boolean {
  for (const delimiter of ['||', '&&']) {
    const parts = splitAtTopLevel(condition, delimiter);
    if (parts.length <= 1) {
      continue;
    }

    let allParsed = true;
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) {
        continue;
      }
      if (!applyCondition(trimmed, subQuery)) {
        allParsed = false;
        break;
      }
    }

    if (allParsed) {
      return true;
    }
  }
  return false;
}

// field = "value"
function tryParseEquality(condition: string, subQuery: SubQuery): boolean {
  const match = condition.match(/^(\w+)\s*=\s*"([^"]*)"$/);
  if (!match) {
    return false;
  }

  const [, field, value] = match;

  switch (field) {
    case 'alarmId':
      subQuery.alarmId = value;
      return true;
    case 'active':
      subQuery.active = value === 'true';
      return true;
    case 'clear':
      subQuery.clear = value === 'true';
      return true;
    case 'acknowledged':
      subQuery.acknowledged = value === 'true';
      return true;
    case 'createdBy':
      subQuery.createdBy = value;
      return true;
    case 'channel':
      subQuery.channel = value;
      return true;
    case 'resourceType':
      subQuery.resourceType = value;
      return true;
    case 'displayName':
      subQuery.displayName = value;
      return true;
    case 'description':
      subQuery.description = value;
      return true;
    default:
      return false;
  }
}

// field != "value" for boolean fields (active, clear, acknowledged)
function tryParseBooleanNegation(condition: string, subQuery: SubQuery): boolean {
  const match = condition.match(/^(\w+)\s*!=\s*"([^"]*)"$/);
  if (!match) {
    return false;
  }

  const [, field, value] = match;

  switch (field) {
    case 'active':
      subQuery.active = value !== 'true';
      return true;
    case 'clear':
      subQuery.clear = value !== 'true';
      return true;
    case 'acknowledged':
      subQuery.acknowledged = value !== 'true';
      return true;
    default:
      return false;
  }
}

// field > "datetime" or field < "datetime" or field >= / <=
function tryParseDateComparison(condition: string, subQuery: SubQuery): boolean {
  const match = condition.match(/^(\w+)\s*(>=|<=|>|<)\s*"([^"]*)"$/);
  if (!match) {
    return false;
  }

  const [, field, op, value] = match;

  switch (field) {
    case 'occurredAt':
      if (op === '>' || op === '>=') {
        subQuery.occurredAtMin = value;
      } else {
        subQuery.occurredAtMax = value;
      }
      return true;
    case 'acknowledgedAt':
      if (op === '>' || op === '>=') {
        subQuery.acknowledgedAtMin = value;
      } else {
        subQuery.acknowledgedAtMax = value;
      }
      return true;
    case 'mostRecentSetOccurredAt':
    case 'mostRecentTransitionOccurredAt':
      // These fields are used in trend queries but don't have SubQuery equivalents.
      // They're handled as passthrough — the caller builds subQueries for trend logic.
      return false;
    default:
      return false;
  }
}

// currentSeverityLevel = "2" or highestSeverityLevel = "3" or currentSeverityLevel = "-1" (clear)
function tryParseSeverityEquality(condition: string, subQuery: SubQuery): boolean {
  const match = condition.match(/^(currentSeverityLevel|highestSeverityLevel)\s*=\s*"(-?\d+)"$/);
  if (!match) {
    return false;
  }

  const [, field, value] = match;
  const level = parseInt(value, 10);

  if (field === 'currentSeverityLevel') {
    subQuery.currentSeverityLevelMin = level;
    subQuery.currentSeverityLevelMax = level;
  } else {
    subQuery.highestSeverityLevelMin = level;
    subQuery.highestSeverityLevelMax = level;
  }
  return true;
}

// currentSeverityLevel >= "4" (critical) or currentSeverityLevel < "4" (not critical)
function tryParseSeverityRange(condition: string, subQuery: SubQuery): boolean {
  const match = condition.match(/^(currentSeverityLevel|highestSeverityLevel)\s*(>=|<=|>|<)\s*"(-?\d+)"$/);
  if (!match) {
    return false;
  }

  const [, field, op, value] = match;
  const level = parseInt(value, 10);
  const isCurrent = field === 'currentSeverityLevel';

  switch (op) {
    case '>=':
      if (isCurrent) {
        subQuery.currentSeverityLevelMin = level;
      } else {
        subQuery.highestSeverityLevelMin = level;
      }
      return true;
    case '<=':
      if (isCurrent) {
        subQuery.currentSeverityLevelMax = level;
      } else {
        subQuery.highestSeverityLevelMax = level;
      }
      return true;
    case '>':
      if (isCurrent) {
        subQuery.currentSeverityLevelMin = level + 1;
      } else {
        subQuery.highestSeverityLevelMin = level + 1;
      }
      return true;
    case '<':
      if (isCurrent) {
        subQuery.currentSeverityLevelMax = level - 1;
      } else {
        subQuery.highestSeverityLevelMax = level - 1;
      }
      return true;
    default:
      return false;
  }
}

// field.Contains("value")
function tryParseContains(condition: string, subQuery: SubQuery): boolean {
  const match = condition.match(/^(\w+)\.Contains\("([^"]*)"\)$/);
  if (!match) {
    return false;
  }

  const [, field, value] = match;

  switch (field) {
    case 'displayName':
      subQuery.displayName = value;
      return true;
    case 'description':
      subQuery.description = value;
      return true;
    default:
      return false;
  }
}

// keywords.Contains("value") or keywords.Any(it.Contains("value"))
function tryParseKeywords(condition: string, subQuery: SubQuery): boolean {
  const containsMatch = condition.match(/^keywords\.Contains\("([^"]*)"\)$/);
  if (containsMatch) {
    subQuery.keywords = subQuery.keywords ?? [];
    subQuery.keywords.push(containsMatch[1]);
    return true;
  }

  const anyMatch = condition.match(/^keywords\.Any\(it\.Contains\("([^"]*)"\)\)$/);
  if (anyMatch) {
    subQuery.keywords = subQuery.keywords ?? [];
    subQuery.keywords.push(anyMatch[1]);
    return true;
  }

  return false;
}

// properties["key"] = "value"
function tryParseProperties(condition: string, subQuery: SubQuery): boolean {
  const match = condition.match(/^properties\["([^"]*)"\]\s*=\s*"([^"]*)"$/);
  if (!match) {
    return false;
  }

  const [, key, value] = match;
  subQuery.properties = subQuery.properties ?? {};
  subQuery.properties[key] = value;
  return true;
}

// properties.key = "value" (dot notation from source transformation)
function tryParseDotNotationProperties(condition: string, subQuery: SubQuery): boolean {
  const match = condition.match(/^properties\.(\w+)\s*=\s*"([^"]*)"$/);
  if (!match) {
    return false;
  }

  const [, key, value] = match;
  subQuery.properties = subQuery.properties ?? {};
  subQuery.properties[key] = value;
  return true;
}

// workspace = "id"
function tryParseWorkspace(condition: string, subQuery: SubQuery): boolean {
  const match = condition.match(/^workspace\s*=\s*"([^"]*)"$/);
  if (!match) {
    return false;
  }

  subQuery.workspaces = subQuery.workspaces ?? [];
  subQuery.workspaces.push(match[1]);
  return true;
}

/**
 * Splits a LINQ filter string on top-level `&&` operators,
 * respecting parentheses nesting.
 */
function splitTopLevelConditions(filter: string): string[] {
  return splitAtTopLevel(filter, '&&');
}

/**
 * Splits a LINQ filter string on top-level `||` operators,
 * respecting parentheses nesting.
 */
function splitTopLevelOrGroups(filter: string): string[] {
  return splitAtTopLevel(filter, '||');
}

function splitAtTopLevel(filter: string, delimiter: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';

  for (let i = 0; i < filter.length; i++) {
    const char = filter[i];

    if (char === '(') {
      depth++;
      current += char;
    } else if (char === ')') {
      depth--;
      current += char;
    } else if (depth === 0 && filter.substring(i, i + delimiter.length) === delimiter) {
      parts.push(current.trim());
      current = '';
      i += delimiter.length - 1;
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    parts.push(current.trim());
  }

  return parts.map(stripOuterParens);
}

function stripOuterParens(s: string): string {
  const trimmed = s.trim();
  if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
    let depth = 0;
    for (let i = 0; i < trimmed.length; i++) {
      if (trimmed[i] === '(') {
        depth++;
      }
      if (trimmed[i] === ')') {
        depth--;
      }
      if (depth === 0 && i < trimmed.length - 1) {
        return trimmed;
      }
    }
    return stripOuterParens(trimmed.slice(1, -1));
  }
  return trimmed;
}
