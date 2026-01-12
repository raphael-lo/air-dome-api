import { Request } from 'express';

export interface User {
  id: number;
  username: string;
  role: 'Admin' | 'Operator' | 'Viewer';
  status: 'active' | 'inactive';
  created_at: string;
  sites?: Site[];
}

export interface Metric {
  id?: number;
  site_id: string; // Foreign key
  topic?: string;
  device_param?: string;
  device_id?: string;
  mqtt_param?: string;
  display_name: string;
  display_name_tc?: string;
  icon?: string;
  unit?: string;
  source?: 'air-dome' | 'esc';
  channel?: number;
  data_type?: string;
}

export interface MetricGroup {
  id?: number;
  site_id: string; // Foreign key
  name: string;
  name_tc?: string;
  icon?: string;
  metric1_id: number;
  metric1_display_name?: string;
  metric1_display_name_tc?: string;
  metric2_id: number;
  metric2_display_name?: string;
  metric2_display_name_tc?: string;
  metrics?: Metric[]; // Virtual property for response structure
}

export interface Section {
  id?: number;
  site_id: string; // Foreign key
  name: string;
  name_tc?: string;
  item_order: number;
  items?: (Metric | MetricGroup)[]; // Virtual property for response structure
}

export interface SectionItem {
  id: number;
  section_id: number;
  item_id: number; // Metric ID or Metric Group ID
  item_type: 'metric' | 'group';
  item_order: number;
}

export interface Site {
  id: string;
  name: string;
  description?: string;
  location?: string;
  contact_person?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export interface AlertThreshold {
  id: string;
  site_id: string;
  metric_id: number;
  metric_name?: string;
  min_warning: number | null;
  max_warning: number | null;
  min_alert: number | null;
  max_alert: number | null;
  display_name?: string;
  display_name_tc?: string;
  mqtt_param?: string;
}

export enum StatusLevel {
  Ok = 'ok',
  Warn = 'warn',
  Danger = 'danger',
}

export interface FanSet {
  id: string;
  name: string;
  status: string; // 'on', 'off'
  mode: string;   // 'auto', 'manual'
  inflow: number;
  outflow: number;
}

export interface LightingState {
  id: number;
  lights_on: boolean;
  brightness: number;
}

// --- New Alert Rules Types ---

export enum AlertOperator {
  GREATER_THAN = '>',
  LESS_THAN = '<',
  EQUALS = '=',
  GREATER_THAN_OR_EQUALS = '>=',
  LESS_THAN_OR_EQUALS = '<=',
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
  INFO = 'info',
}

export interface AlertRule {
  id: number;
  site_id: string;
  metric_id: number;
  name: string;
  operator: AlertOperator;
  threshold: number;
  severity: AlertSeverity;
  active: boolean;
  created_at?: string;
  updated_at?: string;
  // Optional joined fields
  metric_display_name?: string;
  metric_display_name_tc?: string;
  metric_mqtt_param?: string;
}

export enum DerivedMetricOperator {
  ADD = 'ADD',
  SUBTRACT = 'SUBTRACT',
  MULTIPLY = 'MULTIPLY',
  DIVIDE = 'DIVIDE',
}

export interface DerivedMetricRule {
  id: number;
  site_id: string;
  target_metric_id: number;
  metric1_id: number;
  metric2_id: number;
  operator: DerivedMetricOperator;
  active: boolean;
  created_at?: string;
  // Optional joined fields for UI
  target_metric_name?: string;
  metric1_name?: string;
  metric2_name?: string;
}