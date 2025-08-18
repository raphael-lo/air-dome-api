"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeMetricFromGroup = exports.addMetricToGroup = exports.getMetricsForGroup = exports.deleteMetricGroup = exports.updateMetricGroup = exports.createMetricGroup = exports.getMetricGroups = void 0;
const pg_1 = require("pg");
const pool = new pg_1.Pool();
const getMetricGroups = () => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield pool.query('SELECT * FROM metric_groups');
    return res.rows;
});
exports.getMetricGroups = getMetricGroups;
const createMetricGroup = (group) => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield pool.query('INSERT INTO metric_groups (name) VALUES ($1) RETURNING *', [group.name]);
    return res.rows[0];
});
exports.createMetricGroup = createMetricGroup;
const updateMetricGroup = (id, group) => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield pool.query('UPDATE metric_groups SET name = $1 WHERE id = $2 RETURNING *', [group.name, id]);
    return res.rows[0];
});
exports.updateMetricGroup = updateMetricGroup;
const deleteMetricGroup = (id) => __awaiter(void 0, void 0, void 0, function* () {
    yield pool.query('DELETE FROM metric_groups WHERE id = $1', [id]);
});
exports.deleteMetricGroup = deleteMetricGroup;
const getMetricsForGroup = (groupId) => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield pool.query('SELECT m.* FROM metrics m JOIN metric_group_items mgi ON m.id = mgi.metric_id WHERE mgi.metric_group_id = $1 ORDER BY mgi.item_order', [groupId]);
    return res.rows;
});
exports.getMetricsForGroup = getMetricsForGroup;
const addMetricToGroup = (groupId, metricId, order) => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield pool.query('INSERT INTO metric_group_items (metric_group_id, metric_id, item_order) VALUES ($1, $2, $3) RETURNING *', [groupId, metricId, order]);
    return res.rows[0];
});
exports.addMetricToGroup = addMetricToGroup;
const removeMetricFromGroup = (groupId, metricId) => __awaiter(void 0, void 0, void 0, function* () {
    yield pool.query('DELETE FROM metric_group_items WHERE metric_group_id = $1 AND metric_id = $2', [groupId, metricId]);
});
exports.removeMetricFromGroup = removeMetricFromGroup;
