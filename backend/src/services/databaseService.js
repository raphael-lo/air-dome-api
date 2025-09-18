"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var pg_1 = require("pg");
// Create a new PostgreSQL connection pool
var pool = new pg_1.Pool({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT ? parseInt(process.env.POSTGRES_PORT, 10) : 5432,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
});
// The pool will emit an error on behalf of any idle clients
// it contains if a backend error or network partition happens
pool.on('error', function (err, client) {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});
exports.default = {
    query: function (text, params) { return pool.query(text, params); },
    getClient: function () { return pool.connect(); },
};
