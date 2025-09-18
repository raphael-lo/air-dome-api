import db from '../services/databaseService';
import { Metric } from '../types'; // Assuming Metric interface is defined here or in types.ts

interface SectionItem {
  item_id: number;
  item_type: 'metric' | 'group';
  item_order: number;
}

interface MetricGroup {
  metric_group_id: number;
  metric_group_name: string;
  metric_group_name_tc?: string;
  metric_group_icon?: string;
  metric1_id?: number;
  metric2_id?: number;
  metric1_display_name?: string;
  metric1_display_name_tc?: string;
  metric2_display_name?: string;
  metric2_display_name_tc?: string;
  metric1_group_display_name?: string;
  metric2_group_display_name?: string;
  metric1Data?: Metric;
  metric2Data?: Metric;
  metrics: Metric[];
  itemId?: number;
  section_item_id?: number;
}

interface Section {
  section_id: number;
  section_name: string;
  section_name_tc?: string;
  item_order: number;
  items: (Metric | MetricGroup)[];
}

export const getDomeMetricsStructureFromDb = async (): Promise<Section[]> => {
  const query = `
    SELECT
        s.id AS section_id,
        s.name AS section_name,
        s.name_tc AS section_name_tc,
        s.item_order,
        si.id AS section_item_id,
        si.item_id,
        si.item_type,
        si.item_order AS section_item_order,
        mg.id AS metric_group_id,
        mg.name AS metric_group_name,
        mg.name_tc AS metric_group_name_tc,
        mg.icon AS metric_group_icon,
        mg.metric1_id,
        mg.metric1_display_name AS metric1_group_display_name,
        mg.metric1_display_name_tc AS metric1_group_display_name_tc,
        mg.metric2_id,
        mg.metric2_display_name AS metric2_group_display_name,
        mg.metric2_display_name_tc AS metric2_group_display_name_tc,
        m.id AS metric_id,
        m.topic AS topic,
        m.mqtt_param,
        m.display_name,
        m.display_name_tc AS metric_display_name_tc,
        m.device_id,
        m.icon AS metric_icon,
        m.unit AS metric_unit,
        m1.topic AS metric1_topic,
        m1.display_name AS metric1_display_name,
        m1.mqtt_param AS metric1_mqtt_param,
        m1.device_id AS metric1_device_id,
        m1.icon AS metric1_icon,
        m1.unit AS metric1_unit,
        m2.topic AS metric2_topic,
        m2.display_name AS metric2_display_name,
        m2.mqtt_param AS metric2_mqtt_param,
        m2.device_id AS metric2_device_id,
        m2.icon AS metric2_icon,
        m2.unit AS metric2_unit
    FROM
        sections s
    LEFT JOIN
        section_items si ON s.id = si.section_id
    LEFT JOIN
        metric_groups mg ON si.item_id = mg.id AND si.item_type = 'group'
    LEFT JOIN
        metrics m ON si.item_id = m.id AND si.item_type = 'metric'
    LEFT JOIN
        metrics m1 ON mg.metric1_id = m1.id
    LEFT JOIN
        metrics m2 ON mg.metric2_id = m2.id
    ORDER BY
        s.item_order, si.item_order;
  `;

  const { rows } = await db.query(query, []);

  const sectionsMap = new Map<number, Section>();
  const metricGroupsMap = new Map<number, MetricGroup>();

  rows.forEach((row: any) => {
    // Process Sections
    if (!sectionsMap.has(row.section_id)) {
      sectionsMap.set(row.section_id, {
        section_id: row.section_id,
        section_name: row.section_name,
        section_name_tc: row.section_name_tc,
        item_order: row.item_order,
        items: [],
      });
    }
    const currentSection = sectionsMap.get(row.section_id)!;

    // Process Section Items (Metrics or Metric Groups)
    if (row.item_id) { // Only if there's an item associated with the section
      if (row.item_type === 'metric') {
        // Direct Metric
        currentSection.items.push({
          id: row.metric_id,
          topic: row.topic,
          mqtt_param: row.mqtt_param,
          display_name: row.display_name,
          display_name_tc: row.metric_display_name_tc,
          device_id: row.device_id,
          icon: row.metric_icon,
          unit: row.metric_unit,
          itemId: row.item_id,
          section_item_id: row.section_item_id,
        } as Metric);
      } else if (row.item_type === 'group') {
        // Metric Group
        if (!metricGroupsMap.has(row.metric_group_id)) {
          const newMetricGroup: MetricGroup = {
            metric_group_id: row.metric_group_id,
            metric_group_name: row.metric_group_name,
            metric_group_name_tc: row.metric_group_name_tc,
            metric_group_icon: row.metric_group_icon,
            metric1_id: row.metric1_id,
            metric1_display_name: row.metric1_group_display_name,
            metric1_display_name_tc: row.metric1_group_display_name_tc,
            metric2_id: row.metric2_id,
            metric2_display_name: row.metric2_group_display_name,
            metric2_display_name_tc: row.metric2_group_display_name_tc,
            metric1_group_display_name: row.metric1_group_display_name,
            metric2_group_display_name: row.metric2_group_display_name,
            metrics: [],
            itemId: row.item_id,
            section_item_id: row.section_item_id,
          };

          if (row.metric1_id && row.metric1_display_name) {
            newMetricGroup.metric1Data = {
              id: row.metric1_id,
              topic: row.metric1_topic,
              mqtt_param: row.metric1_mqtt_param,
              device_param: row.metric1_device_id,
              display_name: row.metric1_display_name,
              device_id: row.metric1_device_id,
              icon: row.metric1_icon,
              unit: row.metric1_unit,
            };
          }
          if (row.metric2_id && row.metric2_display_name) {
            newMetricGroup.metric2Data = {
              id: row.metric2_id,
              topic: row.metric2_topic,
              mqtt_param: row.metric2_mqtt_param,
              device_param: row.metric2_device_id,
              display_name: row.metric2_display_name,
              device_id: row.metric2_device_id,
              icon: row.metric2_icon,
              unit: row.metric2_unit,
            };
          }
          metricGroupsMap.set(row.metric_group_id, newMetricGroup);
        }
        const currentMetricGroup = metricGroupsMap.get(row.metric_group_id)!;

        // Add metric to group if it exists
        if (row.metric_id) {
          currentMetricGroup.metrics.push({
            id: row.metric_id,
            topic: row.topic,
            mqtt_param: row.mqtt_param,
            device_param: row.device_id,
            display_name: row.display_name,
            display_name_tc: row.metric_display_name_tc,
            device_id: row.device_id,
            icon: row.metric_icon,
            unit: row.metric_unit,
          });
        }

        // Add metric group to section if not already added
        const groupAlreadyAdded = currentSection.items.some(item =>
          (item as MetricGroup).metric_group_id === row.metric_group_id
        );
        if (!groupAlreadyAdded) {
          currentSection.items.push(currentMetricGroup);
        }
      }
    }
  });

  const result = Array.from(sectionsMap.values()).sort((a, b) => a.item_order - b.item_order);

  result.forEach(section => {
    section.items.sort((a, b) => {
      const aOrder = (a as any).section_item_order !== undefined ? (a as any).section_item_order : (a as any).item_order;
      const bOrder = (b as any).section_item_order !== undefined ? (b as any).section_item_order : (b as any).item_order;
      return aOrder - bOrder;
    });
    section.items.forEach(item => {
      if ('metrics' in item) {
        (item as MetricGroup).metrics.sort((a: Metric, b: Metric) => (a.id ?? 0) - (b.id ?? 0));
      }
    });
  });

  return result;
};
