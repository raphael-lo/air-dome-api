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
exports.updateSectionItems = exports.deleteSection = exports.updateSection = exports.createSection = exports.getSections = exports.deleteMetric = exports.updateMetric = exports.createMetric = exports.getMetrics = void 0;
const pg_1 = require("pg");
const pool = new pg_1.Pool();
const getMetrics = () => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield pool.query('SELECT * FROM metrics');
    return res.rows;
});
exports.getMetrics = getMetrics;
const createMetric = (metric) => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield pool.query('INSERT INTO metrics (mqtt_param, display_name, device_id) VALUES ($1, $2, $3) RETURNING *', [metric.mqtt_param, metric.display_name, metric.device_id]);
    return res.rows[0];
});
exports.createMetric = createMetric;
const updateMetric = (id, metric) => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield pool.query('UPDATE metrics SET mqtt_param = $1, display_name = $2, device_id = $3 WHERE id = $4 RETURNING *', [metric.mqtt_param, metric.display_name, metric.device_id, id]);
    return res.rows[0];
});
exports.updateMetric = updateMetric;
const deleteMetric = (id) => __awaiter(void 0, void 0, void 0, function* () {
    yield pool.query('DELETE FROM metrics WHERE id = $1', [id]);
});
exports.deleteMetric = deleteMetric;
const getSections = () => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield pool.query('SELECT * FROM sections ORDER BY section_order');
    return res.rows;
});
exports.getSections = getSections;
const createSection = (section) => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield pool.query('INSERT INTO sections (name) VALUES ($1) RETURNING *', [section.name]);
    return res.rows[0];
});
exports.createSection = createSection;
const updateSection = (id, section) => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield pool.query('UPDATE sections SET name = $1 WHERE id = $2 RETURNING *', [section.name, id]);
    return res.rows[0];
});
exports.updateSection = updateSection;
const deleteSection = (id) => __awaiter(void 0, void 0, void 0, function* () {
    yield pool.query('DELETE FROM sections WHERE id = $1', [id]);
});
exports.deleteSection = deleteSection;
const updateSectionItems = (sectionId, items) => __awaiter(void 0, void 0, void 0, function* () {
    // This is a simplified example. You'd need a more robust way to handle item updates.
    // You might have a separate table for section items.
    console.log(`Updating items for section ${sectionId}`, items);
    // For demonstration, this function doesn't actually do anything.
    return;
});
exports.updateSectionItems = updateSectionItems;
