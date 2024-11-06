const express = require('express');
const login = require('../../controladores/login/auth.controller.js')
const verificacion = require('../../controladores/login/auth.controller.js')
const jwt = require('jsonwebtoken');
const llave = require('../../configuraciones/llave.js')
const app = express();

    //SE VALIDA LO DEL JWT

        app.set('key', llave.llave);
        app.use(express.urlencoded({extended:false}));
        app.use(express.json());

const ruta = express.Router();

ruta.post('/login', login);

ruta.post('/regenerarsesion', async(req, res)=>{
    const payload = {
        check: true
    };
    const token = jwt.sign(payload, app.get('key'),{
        expiresIn: '1h'
    });
    return res.json({           
        tokennode: token
    });
})
module.exports = ruta;