const express = require('express');
const verificar = require('../../../controladores/verificarToken.controller.js');
const procesadorConsultas = require('../../../controladores/procesadorConsultas.controller.js');

const ruta = express.Router();

///////////////////////////////// CONSULTA DE DATOS /////////////////////////////////

ruta.get('/catalogo', verificar, async(req,res)=>{
    const consulta =  "Select insumoId, producto, nombre, unidad,"
    + " familiaId, diasSurtido, unidadId, partidaId, redondeo"
    + "  from Insumos "
    + " where producto like '%-%' "
    + " Order by nombre"
    const catalogoInsumos = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(catalogoInsumos);
})

ruta.get('/catalogo/familiainsumos', verificar, async(req,res)=>{
    const consulta = "Select familiaId, nombre "
    + "  from familiasInsumo "
    + " Order by nombre"
    const catalogoFamilias = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(catalogoFamilias);
})


///////////////////////////////// INSERCIÓN DE DATOS /////////////////////////////////


///////////////////////////////// MODIFICACIÓN DE DATOS /////////////////////////////////

ruta.put('/insumos', verificar, async(req,res)=>{
    const datos = req.body.datos;
    let consulta = ""
    if(datos.insumoId > 0){
        consulta = "Update insumos Set producto='" + datos.producto + "'"
        + ",nombre='" + datos.nombre + "'"
        + ",unidad='" + datos.unidad + "'"
        + ",familiaId=" + datos.familiaId
        + ",diasSurtido=" + datos.diasSurtido
        + ",unidadId=" + datos.unidadId
        + ",partidaId=" + datos.partidaId
        + ",redondeo=" + datos.redondeo
        + " where insumoId=" + datos.insumoId;
    }else{
        consulta = "Insert Into insumos (producto, nombre, unidad, familiaId, diasSurtido, unidadId, partidaId, redondeo ) "
        + " values('" + datos.producto + "',"
        + "'" + datos.nombre + "',"
        + "'" + datos.unidad + "',"
        + datos.familiaId + ","
        + datos.diasSurtido + ","
        + datos.unidadId + ","
        + datos.partidaId + ","
        + datos.redondeo + " )";
    }
    const insercionDatos = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
    return res.status(200).send({mensaje: "Datos insertados correctamente"});
})

///////////////////////////////// BAJA DE DATOS /////////////////////////////////

ruta.delete('/insumo/:id', verificar, async(req,res)=>{
    const id = req.params.id;
    const consulta = "Delete from insumos Where insumoid=" + id;
    try{
        const registrosAfectados = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
        if(registrosAfectados > 0) return res.status(200).send({mensaje: "Registros eliminados correctamente"});
        else return res.status(500).send({error: "No se modificó ningún registro"});
    } catch(error){
    }
})

module.exports = ruta;