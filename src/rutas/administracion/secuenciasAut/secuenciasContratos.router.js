const express = require('express');
const procesadorConsultas = require('../../../controladores/procesadorConsultas.controller');
const verificar = require('../../../controladores/verificarToken.controller');

const rutas = express.Router();

rutas.get('/permisos', verificar, async(req,res) => {
    const consulta = `select sa.*, u.nombre from secuenciaAutorizacionContrato sa
    left join usuarios u on u.usuarioId = sa.usuarioId`;
    const secuencias = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(secuencias);
})

module.exports = rutas;