"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const httpSensorController_1 = require("../controllers/httpSensorController");
const router = (0, express_1.Router)();
router.post('/v1/sensor-data', httpSensorController_1.postSensorData);
exports.default = router;
