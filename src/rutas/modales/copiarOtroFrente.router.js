const express = require('express');
const verificar = require('../../controladores/verificarToken.controller.js');
const conectarBD = require('../../bd/db.js');

const ruta = express.Router();
ruta.get('/:consulta', verificar, async(req,res)=>{
    const pool = await conectarBD;
    const consulta = req.params.consulta.replace('@', '/').replace('@', '/');
    const result = await pool.request().query('use spvnet3; ' + consulta);
    return res.json(result.recordsets[0]);
})

module.exports = ruta;