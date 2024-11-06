const express = require('express');
const llave = require('../configuraciones/llave.js');
const jwt = require('jsonwebtoken');

const app = express();
app.set('key', llave.llave);
app.use(express.urlencoded({extended:false}));
app.use(express.json());

const verifica = express.Router()
const verificar = verifica.use((req, res,  next) =>{
    const token = req.headers.token;
    jwt.verify(token, app.get('key'), (error, decoded)=>{
        if(!token){
            return res.status(506).send({errorToken: 'Error en el sistema'});
        }
        if(error){
            return res.status(506).send({errorToken: 'Error en el sistema'});
        }
        req.decoded = decoded;
        next();
    })
})
module.exports = verificar;