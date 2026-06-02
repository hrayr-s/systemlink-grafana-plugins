import { parseFilterToSubQuery, parseTrendFilterToSubQueries } from './filter-to-subquery';

describe('parseFilterToSubQuery', () => {
  it('should return empty subQuery for undefined filter', () => {
    const result = parseFilterToSubQuery(undefined);
    expect(result.subQuery).toEqual({});
    expect(result.unsupported).toEqual([]);
  });

  it('should return empty subQuery for empty string', () => {
    const result = parseFilterToSubQuery('');
    expect(result.subQuery).toEqual({});
    expect(result.unsupported).toEqual([]);
  });

  it('should return empty subQuery for whitespace-only string', () => {
    const result = parseFilterToSubQuery('   ');
    expect(result.subQuery).toEqual({});
    expect(result.unsupported).toEqual([]);
  });

  describe('equality conditions', () => {
    it('should parse alarmId equality', () => {
      const result = parseFilterToSubQuery('alarmId = "test-alarm-123"');
      expect(result.subQuery).toEqual({ alarmId: 'test-alarm-123' });
      expect(result.unsupported).toEqual([]);
    });

    it('should parse active = "true"', () => {
      const result = parseFilterToSubQuery('active = "true"');
      expect(result.subQuery).toEqual({ active: true });
    });

    it('should parse active = "false"', () => {
      const result = parseFilterToSubQuery('active = "false"');
      expect(result.subQuery).toEqual({ active: false });
    });

    it('should parse clear boolean', () => {
      const result = parseFilterToSubQuery('clear = "true"');
      expect(result.subQuery).toEqual({ clear: true });
    });

    it('should parse acknowledged boolean', () => {
      const result = parseFilterToSubQuery('acknowledged = "false"');
      expect(result.subQuery).toEqual({ acknowledged: false });
    });

    it('should parse createdBy', () => {
      const result = parseFilterToSubQuery('createdBy = "TagRuleEngine"');
      expect(result.subQuery).toEqual({ createdBy: 'TagRuleEngine' });
    });

    it('should parse channel', () => {
      const result = parseFilterToSubQuery('channel = "*.System.Health"');
      expect(result.subQuery).toEqual({ channel: '*.System.Health' });
    });

    it('should parse resourceType', () => {
      const result = parseFilterToSubQuery('resourceType = "Tag"');
      expect(result.subQuery).toEqual({ resourceType: 'Tag' });
    });

    it('should parse displayName equality', () => {
      const result = parseFilterToSubQuery('displayName = "Low disk space"');
      expect(result.subQuery).toEqual({ displayName: 'Low disk space' });
    });

    it('should parse description equality', () => {
      const result = parseFilterToSubQuery('description = "Disk usage"');
      expect(result.subQuery).toEqual({ description: 'Disk usage' });
    });
  });

  describe('date comparison conditions', () => {
    it('should parse occurredAt > as occurredAtMin', () => {
      const result = parseFilterToSubQuery('occurredAt > "2025-01-01T00:00:00Z"');
      expect(result.subQuery).toEqual({ occurredAtMin: '2025-01-01T00:00:00Z' });
    });

    it('should parse occurredAt >= as occurredAtMin', () => {
      const result = parseFilterToSubQuery('occurredAt >= "2025-01-01T00:00:00Z"');
      expect(result.subQuery).toEqual({ occurredAtMin: '2025-01-01T00:00:00Z' });
    });

    it('should parse occurredAt < as occurredAtMax', () => {
      const result = parseFilterToSubQuery('occurredAt < "2025-12-31T23:59:59Z"');
      expect(result.subQuery).toEqual({ occurredAtMax: '2025-12-31T23:59:59Z' });
    });

    it('should parse occurredAt <= as occurredAtMax', () => {
      const result = parseFilterToSubQuery('occurredAt <= "2025-12-31T23:59:59Z"');
      expect(result.subQuery).toEqual({ occurredAtMax: '2025-12-31T23:59:59Z' });
    });

    it('should parse acknowledgedAt range', () => {
      const result = parseFilterToSubQuery(
        'acknowledgedAt > "2025-01-01T00:00:00Z" && acknowledgedAt < "2025-12-31T23:59:59Z"'
      );
      expect(result.subQuery).toEqual({
        acknowledgedAtMin: '2025-01-01T00:00:00Z',
        acknowledgedAtMax: '2025-12-31T23:59:59Z',
      });
    });

    it('should mark mostRecentSetOccurredAt as unsupported', () => {
      const result = parseFilterToSubQuery('mostRecentSetOccurredAt < "2025-01-01T00:00:00Z"');
      expect(result.subQuery).toEqual({});
      expect(result.unsupported).toEqual(['mostRecentSetOccurredAt < "2025-01-01T00:00:00Z"']);
    });

    it('should mark mostRecentTransitionOccurredAt as unsupported', () => {
      const result = parseFilterToSubQuery('mostRecentTransitionOccurredAt > "2025-01-01T00:00:00Z"');
      expect(result.subQuery).toEqual({});
      expect(result.unsupported).toEqual(['mostRecentTransitionOccurredAt > "2025-01-01T00:00:00Z"']);
    });
  });

  describe('severity conditions', () => {
    it('should parse currentSeverityLevel equality', () => {
      const result = parseFilterToSubQuery('currentSeverityLevel = "2"');
      expect(result.subQuery).toEqual({
        currentSeverityLevelMin: 2,
        currentSeverityLevelMax: 2,
      });
    });

    it('should parse highestSeverityLevel equality', () => {
      const result = parseFilterToSubQuery('highestSeverityLevel = "3"');
      expect(result.subQuery).toEqual({
        highestSeverityLevelMin: 3,
        highestSeverityLevelMax: 3,
      });
    });

    it('should parse currentSeverityLevel equality for clear (-1)', () => {
      const result = parseFilterToSubQuery('currentSeverityLevel = "-1"');
      expect(result.subQuery).toEqual({
        currentSeverityLevelMin: -1,
        currentSeverityLevelMax: -1,
      });
    });

    it('should parse highestSeverityLevel equality for clear (-1)', () => {
      const result = parseFilterToSubQuery('highestSeverityLevel = "-1"');
      expect(result.subQuery).toEqual({
        highestSeverityLevelMin: -1,
        highestSeverityLevelMax: -1,
      });
    });

    it('should parse currentSeverityLevel >= (critical)', () => {
      const result = parseFilterToSubQuery('currentSeverityLevel >= "4"');
      expect(result.subQuery).toEqual({ currentSeverityLevelMin: 4 });
    });

    it('should parse currentSeverityLevel < (not critical)', () => {
      const result = parseFilterToSubQuery('currentSeverityLevel < "4"');
      expect(result.subQuery).toEqual({ currentSeverityLevelMax: 3 });
    });

    it('should parse highestSeverityLevel > as min + 1', () => {
      const result = parseFilterToSubQuery('highestSeverityLevel > "2"');
      expect(result.subQuery).toEqual({ highestSeverityLevelMin: 3 });
    });

    it('should parse highestSeverityLevel <= as max', () => {
      const result = parseFilterToSubQuery('highestSeverityLevel <= "3"');
      expect(result.subQuery).toEqual({ highestSeverityLevelMax: 3 });
    });
  });

  describe('contains conditions', () => {
    it('should parse displayName.Contains', () => {
      const result = parseFilterToSubQuery('displayName.Contains("disk")');
      expect(result.subQuery).toEqual({ displayName: 'disk' });
    });

    it('should parse description.Contains', () => {
      const result = parseFilterToSubQuery('description.Contains("usage")');
      expect(result.subQuery).toEqual({ description: 'usage' });
    });

    it('should mark Contains on unsupported fields as unsupported', () => {
      const result = parseFilterToSubQuery('channel.Contains("system")');
      expect(result.subQuery).toEqual({});
      expect(result.unsupported).toEqual(['channel.Contains("system")']);
    });
  });

  describe('keywords conditions', () => {
    it('should parse keywords.Contains', () => {
      const result = parseFilterToSubQuery('keywords.Contains("critical")');
      expect(result.subQuery).toEqual({ keywords: ['critical'] });
    });

    it('should parse keywords.Any(it.Contains(...))', () => {
      const result = parseFilterToSubQuery('keywords.Any(it.Contains("warning"))');
      expect(result.subQuery).toEqual({ keywords: ['warning'] });
    });
  });

  describe('properties conditions', () => {
    it('should parse properties key-value match', () => {
      const result = parseFilterToSubQuery('properties["system"] = "CRIO1"');
      expect(result.subQuery).toEqual({ properties: { system: 'CRIO1' } });
    });

    it('should accumulate multiple properties', () => {
      const result = parseFilterToSubQuery(
        'properties["system"] = "CRIO1" && properties["minionId"] = "minion-1"'
      );
      expect(result.subQuery).toEqual({
        properties: { system: 'CRIO1', minionId: 'minion-1' },
      });
    });
  });

  describe('workspace conditions', () => {
    it('should parse workspace equality', () => {
      const result = parseFilterToSubQuery('workspace = "ws-123"');
      expect(result.subQuery).toEqual({ workspaces: ['ws-123'] });
    });
  });

  describe('compound conditions', () => {
    it('should parse multiple AND conditions', () => {
      const result = parseFilterToSubQuery(
        'active = "true" && currentSeverityLevel >= "4" && workspace = "ws-1"'
      );
      expect(result.subQuery).toEqual({
        active: true,
        currentSeverityLevelMin: 4,
        workspaces: ['ws-1'],
      });
      expect(result.unsupported).toEqual([]);
    });

    it('should parse compound conditions wrapped in outer parentheses', () => {
      const result = parseFilterToSubQuery(
        '(active = "true" && workspace = "ws-1")'
      );
      expect(result.subQuery).toEqual({
        active: true,
        workspaces: ['ws-1'],
      });
      expect(result.unsupported).toEqual([]);
    });

    it('should parse compound conditions with individually parenthesized parts', () => {
      const result = parseFilterToSubQuery(
        '(active = "true") && (workspace = "ws-1")'
      );
      expect(result.subQuery).toEqual({
        active: true,
        workspaces: ['ws-1'],
      });
      expect(result.unsupported).toEqual([]);
    });

    it('should collect unsupported conditions alongside supported ones', () => {
      const result = parseFilterToSubQuery(
        'active = "true" && unknownField = "value"'
      );
      expect(result.subQuery).toEqual({ active: true });
      expect(result.unsupported).toEqual(['unknownField = "value"']);
    });

    it('should handle date range within AND', () => {
      const result = parseFilterToSubQuery(
        'occurredAt >= "2025-01-01T00:00:00Z" && occurredAt <= "2025-12-31T23:59:59Z"'
      );
      expect(result.subQuery).toEqual({
        occurredAtMin: '2025-01-01T00:00:00Z',
        occurredAtMax: '2025-12-31T23:59:59Z',
      });
    });
  });

  describe('boolean negation', () => {
    it('should parse active != "true" as active: false', () => {
      const result = parseFilterToSubQuery('active != "true"');
      expect(result.subQuery).toEqual({ active: false });
      expect(result.unsupported).toEqual([]);
    });

    it('should parse active != "false" as active: true', () => {
      const result = parseFilterToSubQuery('active != "false"');
      expect(result.subQuery).toEqual({ active: true });
    });

    it('should parse clear != "true" as clear: false', () => {
      const result = parseFilterToSubQuery('clear != "true"');
      expect(result.subQuery).toEqual({ clear: false });
    });

    it('should parse acknowledged != "false" as acknowledged: true', () => {
      const result = parseFilterToSubQuery('acknowledged != "false"');
      expect(result.subQuery).toEqual({ acknowledged: true });
    });

    it('should mark non-boolean field negation as unsupported', () => {
      const result = parseFilterToSubQuery('channel != "test"');
      expect(result.unsupported).toEqual(['channel != "test"']);
    });
  });

  describe('dot-notation properties', () => {
    it('should parse properties.key = "value"', () => {
      const result = parseFilterToSubQuery('properties.system = "CRIO1"');
      expect(result.subQuery).toEqual({ properties: { system: 'CRIO1' } });
    });

    it('should parse multiple dot-notation properties', () => {
      const result = parseFilterToSubQuery(
        'properties.system = "CRIO1" && properties.minionId = "minion-1"'
      );
      expect(result.subQuery).toEqual({
        properties: { system: 'CRIO1', minionId: 'minion-1' },
      });
    });
  });

  describe('unsupported conditions', () => {
    it('should mark non-boolean negation as unsupported', () => {
      const result = parseFilterToSubQuery('channel != "test"');
      expect(result.unsupported).toEqual(['channel != "test"']);
    });

    it('should mark IsNullOrEmpty as unsupported', () => {
      const result = parseFilterToSubQuery('string.IsNullOrEmpty(channel)');
      expect(result.unsupported).toEqual(['string.IsNullOrEmpty(channel)']);
    });

    it('should mark arbitrary text as unsupported', () => {
      const result = parseFilterToSubQuery('some arbitrary filter text');
      expect(result.unsupported).toEqual(['some arbitrary filter text']);
    });
  });

  describe('compound groups (multi-value and source transformations)', () => {
    it('should parse OR group from multi-value variable', () => {
      const result = parseFilterToSubQuery('(channel = "ch1" || channel = "ch2")');
      expect(result.subQuery.channel).toBe('ch2');
      expect(result.unsupported).toEqual([]);
    });

    it('should parse source field OR group with dot-notation properties', () => {
      const result = parseFilterToSubQuery('(properties.System = "CRIO1" || properties.MinionId = "CRIO1")');
      expect(result.subQuery.properties).toEqual({ System: 'CRIO1', MinionId: 'CRIO1' });
      expect(result.unsupported).toEqual([]);
    });

    it('should parse AND group from multi-value NOT EQUALS', () => {
      const result = parseFilterToSubQuery('(active != "true" && clear != "true")');
      expect(result.subQuery.active).toBe(false);
      expect(result.subQuery.clear).toBe(false);
      expect(result.unsupported).toEqual([]);
    });

    it('should parse compound group combined with other conditions', () => {
      const result = parseFilterToSubQuery('active = "true" && (properties.System = "X" || properties.MinionId = "X")');
      expect(result.subQuery.active).toBe(true);
      expect(result.subQuery.properties).toEqual({ System: 'X', MinionId: 'X' });
      expect(result.unsupported).toEqual([]);
    });

    it('should parse multiple workspace OR group', () => {
      const result = parseFilterToSubQuery('(workspace = "ws1" || workspace = "ws2")');
      expect(result.subQuery.workspaces).toEqual(['ws1', 'ws2']);
      expect(result.unsupported).toEqual([]);
    });
  });
});

describe('parseTrendFilterToSubQueries', () => {
  it('should return empty for undefined filter', () => {
    const result = parseTrendFilterToSubQueries(undefined);
    expect(result.subQueries).toEqual([]);
    expect(result.topLevel).toEqual({});
    expect(result.unsupported).toEqual([]);
  });

  it('should return empty for empty string', () => {
    const result = parseTrendFilterToSubQueries('');
    expect(result.subQueries).toEqual([]);
    expect(result.topLevel).toEqual({});
  });

  it('should return single topLevel for non-OR filter', () => {
    const result = parseTrendFilterToSubQueries('active = "true"');
    expect(result.subQueries).toEqual([]);
    expect(result.topLevel).toEqual({ active: true });
  });

  it('should split OR groups into subQueries', () => {
    const filter = '(active = "true") || (occurredAt >= "2025-01-01T00:00:00Z" && occurredAt <= "2025-12-31T23:59:59Z")';
    const result = parseTrendFilterToSubQueries(filter);

    expect(result.subQueries).toEqual([
      { active: true },
      { occurredAtMin: '2025-01-01T00:00:00Z', occurredAtMax: '2025-12-31T23:59:59Z' },
    ]);
    expect(result.topLevel).toEqual({});
  });

  it('should collect unsupported conditions from OR groups', () => {
    const filter = '(active = "true") || (unknownField = "val")';
    const result = parseTrendFilterToSubQueries(filter);

    expect(result.subQueries).toHaveLength(2);
    expect(result.unsupported).toEqual(['unknownField = "val"']);
  });
});
