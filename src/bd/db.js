const sql = require('mssql');
const dotenv = require('dotenv');
dotenv.config({path: 'src/.env' });
const conex = {
    server: process.env.server,
    user:  process.env.user,
    password:  process.env.password,
    database:  process.env.database,
    trustServerCertificate: true,
    requestTimeout: 130000
}
async function conectarBD(){
    const pool = sql.connect(conex);
    return pool;
};
module.exports = conectarBD();
