import {
  EntityType, Weekday
} from "./types";
import { SelectableValue } from "@grafana/data";
import { enumToOptions } from "../../core/utils";

export const entityTypeOptions: SelectableValue[] = enumToOptions(EntityType);
export const minuteInSeconds = 60 * 1000;
export const hourInSeconds = 60 * minuteInSeconds;
export const secondsInDay = 24 * hourInSeconds;
export const peakDays = [Weekday.Monday, Weekday.Tuesday, Weekday.Wednesday, Weekday.Thursday, Weekday.Friday];

export const defaultProjection = [
  'id',
  'alias',
  'connected.data.state',
  'grains.data.minion_blackout as locked',
  'grains.data.boottime as systemStartTime',
  'grains.data.productname as model',
  'grains.data.manufacturer as vendor',
  'grains.data.osfullname as osFullName',
  'grains.data.ip4_interfaces as ip4Interfaces',
  'grains.data.ip6_interfaces as ip6Interfaces',
  'workspace',
];

export const defaultOrderBy = 'createdTimeStamp DESC';
