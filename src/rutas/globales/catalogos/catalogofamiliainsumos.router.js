const express = require('express');
const verificar = require('../../../controladores/verificarToken.controller');
const ruta = express.Router();
const procesadorConsultas = require('../../../controladores/procesadorConsultas.controller');

ruta.get('/catalogo', verificar, async(req,res)=>{
    const consulta = `Select familiaId,codigo, nombre 
    from familiasInsumo 
    Order by codigo`
    const familias = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(familias);
})

ruta.post('/faminsumo', verificar, async(req,res)=>{
    const datos = req.body.datos;
    let consulta = ""
    datos.forEach(ele => {
        // console.log(ele);
        if(ele.rechazado){
            consulta += `delete familiasInsumo where familiaid = ${ele.familiaId}; `
        }else{
            if (ele.familiaId > 0) {
                consulta += "Update familiasInsumo Set codigo='" + ele.codigo + "'";
                consulta += ",nombre='" + ele.nombre + "'";
                consulta += " where familiaid=" + ele.familiaId + "; ";
            } else
    
            // Nuevos
            {
                consulta += "Insert Into familiasInsumo (codigo, nombre) ";
                consulta += " values('" + ele.codigo + "',";
                consulta += "'" + ele.nombre + "' )";
            }
        }
    });
    try{
        const insercionDatos = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
        return res.status(200).send({mensaje: "Datos insertados correctamente", result: insercionDatos});
    }catch(error){
        if(error){
            return res.status(400).send({mensaje: "Error en el sistema", error: error});
        }
    }
    
})

module.exports = ruta;