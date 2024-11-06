const express = require('express');
const conectarBD = require('../../bd/db.js')
const verificar = require('../../controladores/verificarToken.controller.js');
const procesadorConsultas = require('../../controladores/procesadorConsultas.controller.js');

const ruta = express.Router();

ruta.get('/catalogousuarios/permisos', verificar, async(req,res)=>{
    const consulta = "use spvnet200; select distinct u.usuarioid, u.nombre from UsuarioMenu um "
    + " inner join Usuario u on u.UsuarioId = um.UsuarioId "
    + " where um.MenuId in (109, 400) and u.estatusId = 1";
    const catalogoUsuarios = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(catalogoUsuarios)
});

ruta.get('/version', async(req,res) => {
    const version = await procesadorConsultas.spvnet.consultaDatosSpvnet('select version from versionapp');
    return res.json(version[0].version);
})

ruta.put('/modificacionusuario', verificar, async(req, res)=>{
    const datos = req.body.datos;
    const pool = await conectarBD;
    const consulta = 'update usuario set estatusid = 2 where usuarioid = ' + datos['id'];
    const result = await pool.request().query('use spvnet200; ' + consulta);
    return res.status(200).send({mensaje: 'Se modificaron los registros correctamente', result: result});
})
module.exports = ruta;