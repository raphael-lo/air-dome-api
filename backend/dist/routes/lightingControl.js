"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const lightingController_1 = require("../controllers/lightingController");
const router = (0, express_1.Router)();
router.get('/lighting-state', lightingController_1.getLightingState);
router.put('/lighting-state', lightingController_1.updateLightingState);
exports.default = router;
