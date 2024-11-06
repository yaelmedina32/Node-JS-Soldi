const dotenv = require('dotenv');
dotenv.config({path: 'src/.env' });
const llave = {
    llave: process.env.llave
}
module.exports = llave;