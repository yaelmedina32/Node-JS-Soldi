const express = require('express');
const verificar = require('../../../controladores/verificarToken.controller.js');
const procesadorConsultas = require('../../../controladores/procesadorConsultas.controller.js');

const ruta = express.Router();


//////////////////////////////////// CONSULTA DE DATOS ////////////////////////////////////

ruta.get('/totalrechazos/:actividadid', verificar, async(req,res)=>{
    const actividadid = req.params.actividadid;
    const consulta = "select rechazosMax from polistaverificacion2 where id = " + actividadid;
    const totalRechazos = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json({rechazos: totalRechazos[0]['rechazosMax']});
})

ruta.get('/catalogo/formatos', verificar, async(req,res)=>{
    const consulta = "Select formatoid,codigo,descripcion+' * '+codigo as descripcion "
    + " from poFormatos "
    + " Order by descripcion";
    const formatos = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(formatos);
})

ruta.get('/catalogo/formatos/clave/:clave', verificar, async(req,res)=>{
    const clave = req.params.clave != 0 ? "  Where codigo='" + req.params.clave + "'" : '';
    const consulta = "Select formatoid, codigo, descripcion, version, fecha, firmasincluir,fechasprogramadas"
    + "  from poFormatos f" + clave + "  Order by codigo";
    const catalogoFormatos = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(catalogoFormatos);
})
 
//////////////////////////////////// MODIFICACIÓN DE DATOS ////////////////////////////////////

ruta.put('/registros/formatos', verificar, async(req,res)=>{
    const datos = req.body.datos.registros;
    let consulta = ""
    datos.forEach(currentItem => {
        if(currentItem.formatoid > 0){
            consulta += "update poFormatos set codigo = '" + currentItem.codigo  + "'"
            + ", descripcion = '" + currentItem.descripcion + "'"
            + ", fechasprogramadas = " + currentItem.fechasprogramadas 
            + " where formatoid = " + currentItem.formatoid + ";";
        }else{
            consulta += "insert into poFormatos (codigo,descripcion,fechasprogramadas) values('"
            + currentItem.codigo + "', '" + currentItem.descripcion + "',"
            + currentItem.fechasprogramadas + ");";
        }
    });
    const insercionDatos = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
    return res.status(200).send({mensaje: "Datos modificados correctamente"});
})

//////////////////////////////////// INSERCIÓN DE DATOS ////////////////////////////////////


//////////////////////////////////// BAJA DE DATOS ////////////////////////////////////

ruta.delete('/formato/:formatoid', verificar, async(req,res)=>{
    const formatoid = req.params.formatoid;
    const consulta = "Delete from poFormatos Where formatoid=" + formatoid
    const registrosAfectados = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
    if(registrosAfectados > 0){
        return res.status(200).send({mensaje: "Registros eliminados correctamente"});
    }
    return res.status(500).send({error: "No se pudo eliminar ningún registro"});
})

module.exports = ruta;
