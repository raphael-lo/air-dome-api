"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fanController_1 = require("../controllers/fanController");
const router = (0, express_1.Router)();
router.get('/fan-sets', fanController_1.getFanSets);
router.put('/fan-sets/:id', fanController_1.updateFanSet);
exports.default = router;
