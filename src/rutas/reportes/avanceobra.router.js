const express = require('express');
const verificar = require('../../controladores/verificarToken.controller.js');
const procesadorConsultas = require('../../controladores/procesadorConsultas.controller.js');

const ruta = express.Router();

ruta.get('/fechamaxima/programacion/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "select MAX(fecharea) as fechaMaxima, MIN(fecharea) as fechaMinima from poAvanceObra where frente = "
    + frente + " and YEAR(fecharea) != 2000 and YEAR(fecharea)!= 2001";
    const fechaMaxima = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(fechaMaxima)
})
//SACA LOS RANGOS DE LAS FECHAS
ruta.get('/estaciones/programadas/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "SELECT distinct m.descripcion modulo,  p.nombre contratista, "
    + " a.estacion + ' - ' + po.descripcion as estacion , "
    + " RTRIM(l.manzana) + '-' + RTRIM(l.lote) + '-' + RTRIM(l.interior) + '-' + RTRIM(l.subinterior) as ubicacion, a.fechaRea fechaprogramada, "
    + " cast(YEAR(a.fecharea) as varchar(4)) + '-' + cast(datepart(week, a.fechaRea) as varchar(2)) as semana"
    + " from poAvanceObra a "
    + " inner join poCatalogoEstacionesFrente po on po.frente = a.frente and po.estacion = a.estacion "
    + " inner join frentes f on f.numero = cast(a.frente as int) and f.tipo = 'F' "
    + " inner join lotes l on CAST(l.manzana as int) = CAST(a.manzana as int) "
    + " and CAST(l.lote as int) = CAST(a.lote as int) and CAST(l.interior as int) = CAST(a.interior as int) "
    + " and CAST(l.subinterior as int) = CAST(a.subinterior as int) and f.frenteId = l.frenteId "
    + " inner join proveedores p on p.proveedorId = a.proveedorId "
    + " inner join poLotesAsignados pl on pl.frente = a.frente and pl.manzana = a.manzana and pl.lote = a.lote and pl.interior = a.interior "
    + " and pl.subinterior = a.subinterior "
    + " inner join poModulosObra m on m.modulo = pl.modulo "
    + " where a.frente = " + frente
    + " order by semana, fechaprogramada, modulo, estacion, ubicacion"
    const reporteEstaciones = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(reporteEstaciones);
})


module.exports = ruta;