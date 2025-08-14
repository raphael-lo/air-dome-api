"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const sensorData_1 = __importDefault(require("./routes/sensorData"));
const user_1 = __importDefault(require("./routes/user"));
const alert_1 = __importDefault(require("./routes/alert"));
const fanControl_1 = __importDefault(require("./routes/fanControl"));
const lightingControl_1 = __importDefault(require("./routes/lightingControl"));
const alertThresholds_1 = __importDefault(require("./routes/alertThresholds"));
const httpSensor_1 = __importDefault(require("./routes/httpSensor"));
require("./services/databaseService");
require("./services/mqttService");
const websocketService_1 = require("./services/websocketService");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const port = process.env.PORT || 3001;
const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    optionsSuccessStatus: 200
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
app.use('/api', httpSensor_1.default);
app.use('/api', sensorData_1.default);
app.use('/api', user_1.default);
app.use('/api', alert_1.default);
app.use('/api', fanControl_1.default);
app.use('/api', lightingControl_1.default);
app.use('/api', alertThresholds_1.default);
app.get('/', (req, res) => {
    res.send('Air Dome Backend is running!');
});
(0, websocketService_1.initializeWebSocket)(server);
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
