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
const express_1 = require("express");
const influxdbService_1 = require("../services/influxdbService");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/sensor-data', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const range = req.query.range || '-1h';
        const data = yield (0, influxdbService_1.querySensorData)(range);
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ message: 'Error getting sensor data', error });
    }
}));
router.get('/sensor-data/view', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const range = req.query.range || '-1h';
        const data = yield (0, influxdbService_1.querySensorData)(range);
        res.send(`
        <!DOCTYPE html>
        <html>
            <head>
            <title>Sensor Data</title>
            <style>
                table, th, td {
                border: 1px solid black;
                border-collapse: collapse;
                padding: 5px;
                }
            </style>
            </head>
            <body>
            <h1>Sensor Data</h1>
            <table>
                <tr>
                <th>Timestamp</th>
                <th>Measurement</th>
                <th>Field</th>
                <th>Value</th>
                </tr>
                ${data.map(row => `
                    <tr>
                        <td>${row._time}</td>
                        <td>${row._measurement}</td>
                        <td>${row._field}</td>
                        <td>${row._value}</td>
                    </tr>
                    `).join('')}
            </table>
            </body>
        </html>
        `);
    }
    catch (error) {
        res.status(500).send('Error getting sensor data');
    }
}));
router.get('/sensor-data/history', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { measurement, field, range } = req.query;
        if (!measurement || !field) {
            return res.status(400).json({ message: 'Measurement and field are required.' });
        }
        const data = yield (0, influxdbService_1.queryHistoricalData)(measurement, field, range);
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ message: 'Error getting historical sensor data', error });
    }
}));
exports.default = router;
