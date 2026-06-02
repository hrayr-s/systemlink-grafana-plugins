import { SlQueryBuilder } from 'core/components/SlQueryBuilder/SlQueryBuilder';
import { queryBuilderMessages, QueryBuilderOperations } from 'core/query-builder.constants';
import { expressionBuilderCallbackWithRef, expressionReaderCallbackWithRef } from 'core/query-builder.utils';
import { QBField, QueryBuilderOption, Workspace } from 'core/types';
import { addOptionsToLookup, filterXSSField } from 'core/utils';
import { AlarmsQueryBuilderFields, AlarmsQueryBuilderStaticFields, TIME_OPTIONS } from '../../constants/AlarmsQueryBuilder.constants';
import React, { useState, useEffect, useMemo } from 'react';
import { QueryBuilderCustomOperation, QueryBuilderProps } from 'smart-webcomponents-react/querybuilder';

type AlarmsQueryBuilderProps = QueryBuilderProps &
  React.HTMLAttributes<Element> & {
    globalVariableOptions: QueryBuilderOption[];
    workspaces: Workspace[]
    filter?: string;
  };

export const AlarmsQueryBuilder: React.FC<AlarmsQueryBuilderProps> = ({ filter, onChange, globalVariableOptions, workspaces }) => {
  const [fields, setFields] = useState<QBField[]>([]);
  const [operations, setOperations] = useState<QueryBuilderCustomOperation[]>([]);
  const optionsRef = React.useRef<Record<string, QueryBuilderOption[]>>({});

  const callbacks = useMemo(
    () => ({
      expressionBuilderCallback: expressionBuilderCallbackWithRef(optionsRef),
      expressionReaderCallback: expressionReaderCallbackWithRef(optionsRef),
    }),
    [optionsRef]
  );

  const timeFields = useMemo(() => {
    // Only `acknowledgedAt` and `occurredAt` are queryable date fields per the
    // query-instances API schema. `mostRecentSetOccurredAt` and
    // `mostRecentTransitionOccurredAt` have no SubQuery equivalent, so they are
    // intentionally excluded as filter fields (they remain valid output columns).
    return [
      addOptionsToLookup(AlarmsQueryBuilderFields.ACKNOWLEDGED_ON, TIME_OPTIONS),
      addOptionsToLookup(AlarmsQueryBuilderFields.FIRST_OCCURRENCE, TIME_OPTIONS),
    ];
  }, []);

  const workspaceField = useMemo(() => {
    const workspaceOptions = workspaces.map(({ id, name }) => ({ label: name, value: id }));

    return addOptionsToLookup(AlarmsQueryBuilderFields.WORKSPACE, workspaceOptions);
  }, [workspaces]);

  useEffect(() => {
    if (!timeFields) {
      return;
    }

    const updatedFields = [...AlarmsQueryBuilderStaticFields, ...timeFields, workspaceField].map(field => {
      if (field.lookup?.dataSource) {
        return {
          ...field,
          lookup: {
            dataSource: [...globalVariableOptions, ...field.lookup?.dataSource].map(filterXSSField),
          },
        };
      }
      return field;
    })

    setFields(updatedFields);

    const options = updatedFields.reduce((accumulator, fieldConfig) => {
      if (fieldConfig.lookup) {
        accumulator[fieldConfig.dataField!] = fieldConfig.lookup.dataSource;
      }

      return accumulator;
    }, {} as Record<string, QueryBuilderOption[]>);

    optionsRef.current = options;

    const customOperations = [
      QueryBuilderOperations.EQUALS,
      QueryBuilderOperations.DOES_NOT_EQUAL,
      QueryBuilderOperations.CONTAINS,
      QueryBuilderOperations.DATE_TIME_IS_BEFORE,
      QueryBuilderOperations.DATE_TIME_IS_AFTER,
      QueryBuilderOperations.LIST_EQUALS,
      QueryBuilderOperations.LIST_CONTAINS,
    ].map(operation => {
      return {
        ...operation,
        ...callbacks,
      };
    });

    const keyValueOperations = [
      QueryBuilderOperations.KEY_VALUE_MATCH,
    ];

    setOperations([...customOperations, ...keyValueOperations]);
  }, [globalVariableOptions, callbacks, timeFields, workspaceField]);

  return (
    <SlQueryBuilder
      customOperations={operations}
      fields={fields}
      messages={queryBuilderMessages}
      onChange={onChange}
      value={filter}
    />
  );
};
