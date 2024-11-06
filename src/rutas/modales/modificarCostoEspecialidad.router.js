const express = require('express');
const verificar = require('../../controladores/verificarToken.controller.js');
const procesadorConsultas = require('../../controladores/procesadorConsultas.controller.js');

const ruta = express.Router();

//////////////////////////////////// CONSULTA DE DATOS ////////////////////////////////////

//ESTE ENDPOINT LO OCUPO NADA MAS PARA EL COSTO DE LAS ESPECIALIDADES, NO ESPECIFICO DE CADA UBICACION
ruta.post('/costoespecialidad', verificar, async(req,res)=>{
    const datos = req.body.datos;
    let estaciones = ""
    if(datos.estacionesReasignadas.length[0] != null) datos.estacionesReasignadas.forEach(currentItem => {
        //PORQUE VIENE EN FORMATO XXX-NOMBREESTACION-NOMBREESPECIALIDAD
        estaciones += currentItem.split('-')[0] + ","
    });
    

    estaciones = estaciones.substring(0, estaciones.length-1);
    //ESTA CONSULTA LA PONGO ASI PARA QUE, EN CASO DE QUE AUN NO TENGAN COSTOS DE PRODUCCIÓN, TE ARROJE 0's 
    const continuacionQuery = datos.estacionesReasignadas.length[0] == null ? " and pc.espera = " + datos.especid  : " and pc.estacion in (" + estaciones + ")"
    const consulta = "select distinct e.descripcion especialidad, e.especid, pc.frente, m.nombre modelo, isnull(es.importe, 0) importeActual"
    + " from poCatalogoEstacionesFrente pc"
    + " inner join modelos m on pc.modelo collate Modern_Spanish_CI_AS = m.clavemodelo"
    + " inner join espec e on e.especid = pc.espera"
    + " left join especEdificacion es on es.frente = pc.frente and es.especid = pc.espera and  es.modelo collate Modern_Spanish_CI_AS = m.nombre "
    + " where pc.frente = " + datos.frente + continuacionQuery;
    const costoEspecialidades = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta)
    if(costoEspecialidades.length > 0){
        return res.json(costoEspecialidades)
    }else{
        return res.status(204).send({mensaje: "No se ha encontrado ningún registro"});
    }
})


//////////////////////////////////// INSERCION DE DATOS ////////////////////////////////////


//////////////////////////////////// MODIFICACION DE DATOS ////////////////////////////////////

ruta.put('/costoespecialidad', verificar, async(req,res)=>{
    const datos = req.body.datos;
    let consulta = ""
    datos.forEach( element =>{
        consulta += "update especEdificacion set importe = " + element.nuevoimporte 
        + " where frente = " + element.frente + " and modelo = '" + element.modelo + "'"
        + " and especid = " + element.especid + "; ";
    })
    let registrosAfectados = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
    try{
        consulta = " update poavanceobra set pagoetiq = es.importe * (pc.Porcentaje / 100 ) "
        + " from poavanceobra po "
        + " inner join poLotesAsignados pl on pl.frente = po.frente "
        + " and po.manzana = pl.manzana and po.lote = pl.lote and po.interior = pl.interior and po.subinterior = pl.subinterior"
        + " inner join poCatalogoEstacionesFrente pc on pc.estacion = po.estacion and pc.frente = po.frente and pc.modelo = pl.modelo"
        + " inner join modelos m on m.clavemodelo = pl.modelo"
        + " inner join especEdificacion es on es.especid = pc.espera and es.modelo collate Modern_Spanish_CI_AS = m.nombre and cast(es.frente as int) = cast(po.frente as int)"
        + " where po.frente = " + datos[0].frente + " and po.status = 'P' and po.stamat = 'P'"
        registrosAfectados = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
        return res.status(200).send({mensaje: "Se modificaron los registros correctamente"});
    }catch(error){
        if(error){
            return res.status(400).send({mensaje: "Error en el servidor", error: error});
        }
    }
})

//////////////////////////////////// BAJA DE DATOS ///////////////////////////

module.exports = ruta;