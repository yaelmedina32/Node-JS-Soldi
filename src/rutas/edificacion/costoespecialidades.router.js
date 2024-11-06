const verificar = require('../../controladores/verificarToken.controller.js');
const express = require('express');
const procesadorConsultas = require('../../controladores/procesadorConsultas.controller.js');

const ruta = express.Router();

//---------------------------------- Consulta de datos ----------------------------------
ruta.get('/modelos/especialidades/:frente/:especid', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const agruparPorEspecialidad = parseInt(req.params.especid) > 0 ? " and x.especid=" + req.params.especid : '';
    const consulta = "Select x.edificid, x.frente,x.especid, m.clavemodelo"
    + "  ,x.modelo,x.importe, m.clavemodelo "
    + "   from  especEdificacion x "
    + "   inner join espec e       on e.especid=x.especid"
    + "   inner join modelos m on m.nombre collate  SQL_Latin1_General_CP1_CI_AS = x.modelo"
    + "  Where x.frente=" + frente
    + agruparPorEspecialidad
    + "  Order by x.frente,x.modelo,x.especid"
    const especialidadModelo = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(especialidadModelo);
});

ruta.get('/costoxespecialidad/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "Select x.especid"
    + " ,x.modelo,x.importe, m.clavemodelo"
    + " from especEdificacion x"
    + " inner join modelos m on m.nombre collate Modern_Spanish_CI_AS = x.modelo "
    + "   Where x.frente=" + frente
    + "  Order by x.frente,x.modelo,x.especid";
    const costoEspecialidad = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(costoEspecialidad);
})

ruta.get('/contrato/especialidad/:frente/:especid', verificar, async(req,res)=>{
    const especid = req.params.especid;
    const frente = req.params.frente;
    const consulta = " Select foliodg,"
    + " c.fechainicio,c.fechafin"
    + " ,a.especid"
    + " ,a.especialidad"
    + " ,a.proveedor"
    + " from pocontratosobra c"
    + "  inner join vwAvanceObraNormalizada a on c.frente=a.frente "
    + "       and a.frente=" + frente
    + "       and c.proveedorid=a.proveedorid"
    + " inner join poAvanceObraContratos pc on pc.explosionId = a.explosionid "
    + "and pc.idContrato = c.id and a.especid = " + especid
    const contratoAsociado = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(contratoAsociado);
})

ruta.get('/costoespecialidad/:frente/:especid', verificar, async(req,res)=> {
    const frente = req.params.frente;
    const especid = req.params.especid;
    const consulta = "select importe from especEdificacion where frente = " 
    + frente + " and especid = " + especid;
    const importes = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(importes);
})

//---------------------------------- Modificación de datos ------------------------------
ruta.put('/edificacion', verificar, async(req,res)=>{
    const datos = req.body.datos;
    let consulta = ""
    if (datos.edificid > 0) {
        consulta = "Update especEdificacion Set especid = ";
        consulta += "'" + datos.especid + "'";
        consulta += ",frente=" + datos.frente + "";
        consulta += ",modelo='" + datos.modelo + "'";
        consulta += ",importe=" + datos.importe + "";
        consulta += " where edificid=" + datos.edificid.toString();
        
      } else {
        consulta = "Insert Into especEdificacion (especid, frente, modelo, importe) ";
        consulta += " values(" + datos.especid + ",'" + datos.frente + "','";
        consulta += datos.modelo + "',";
        consulta += datos.importe + " )";
      }
      const resultActualizacion = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
      return res.status(200).send({mensaje: "Registros modificados correctamente"});
})

//--------------------------------- Eliminación de datos --------------------------------
ruta.delete('/pagosetiquetados/:edificid', verificar, async(req,res)=>{
    const edificid = req.params.edificid;
    const consulta = 'Delete from especEdificacion Where edificid= ' + edificid;
    const registrosEliminados = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
    if(registrosEliminados > 0) return res.status(200).send({mensaje: "Registros eliminados correctamente", rowsAffected: registrosEliminados});
})

module.exports = ruta;