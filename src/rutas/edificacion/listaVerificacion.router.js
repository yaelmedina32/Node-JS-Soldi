const express = require('express');
const verificar = require('../../controladores/verificarToken.controller');
const devolverPromesa = require('../../controladores/devolverPromesa.controller.js');

const procesadorDeConsultas = require('../../controladores/procesadorConsultas.controller.js');

const ruta = express.Router();



//----------------------------------------- CONSULTA DE DATOS ----------------------------------------------

/**
 * @swagger
 * /api/v2/listaverificacion/estacestaciondependiente/{frente}/{ubicacion}/{estacion}:
 *   get:
 *     summary: Estación dependiente.
 *     tags:
 *       - Lista de Verificación
 *     parameters:
 *       - in: path
 *         name: frente
 *         type: number
 *         required: true
 *       - in: path
 *         name: ubicacion
 *         type: string
 *         required: true
 *       - in: path
 *         name: estacion
 *         type: number
 *         required: true
 *     responses:
 *       200:
 *         description: Regresa un Arreglo con la estación indicada, junto con su estación dependiente, en base a la ubicación y estación.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       json:
 *                         type: list
 *                         description: Estación Dependiente.
 *                         example: [{estacion: 102, estacionDependiente: 101}]
 * 
*/

ruta.get('/estaciondependiente/:frente/:ubicacion/:estacion', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const ubicacion = req.params.ubicacion;
    const estacion = req.params.estacion;
    const ubicacionDividida = ubicacion.split('-');
    const consulta = " select distinct po.estacion, cef.estacionDependiente "
    + "from poavanceobra po "
    + " inner join poCatalogoEstacionesFrente cef on cef.frente = po.frente and cef.estacion = po.estacion "
    + " inner join poLotesAsignados pl on pl.frente = po.frente and pl.modelo = cef.modelo and "
    + " pl.manzana = po.manzana and pl.lote = po.lote and pl.interior = po.interior and pl.subinterior = po.subinterior "
    + " where po.estacion = " + estacion + " and po.frente = " + frente + " and po.manzana = " + parseInt(ubicacionDividida[0]) + " and po.lote = " + parseInt(ubicacionDividida[1]) + " and po.interior = " 
    + parseInt(ubicacionDividida[2]) + " and po.subinterior = " + parseInt(ubicacionDividida[3]);
    const estacionDependiente = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(estacionDependiente[0]);
});

/**
 * @swagger
 * /api/v2/listaverificacion/fechacierre/{frente}/{clave}:
 *   get:
 *     summary: Fecha de Cierre del Frente.
 *     tags:
 *       - Lista de Verificación
 *     parameters:
 *       - in: path
 *         name: frente
 *         type: string
 *         required: true
 *       - in: path
 *         name: clave
 *         type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Regresa la fecha de cierre del frente especificado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       json:
 *                         type: list
 *                         example: [{fechacierre: '03/08/2024'}]
 * 
*/

ruta.get('/fechacierre/:frente/:clave', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const clave = req.params.clave;
    const consulta = "Select fechacierre "
    + " from cierres c  "
    + "  inner join catalogoCierres k on k.catcierreid=c.catcierreid"
    + "  where c.frente=" + frente
    + "   and c.autorizada=2"
    + "   and isnull(estatus,0)=1"  // activa
    + "   and  k.clave='" + clave + "'"
    const fechaCierre = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(fechaCierre);
});

/**
 * @swagger
 * /api/v2/listaverificacion/puntoscontrol/frente/{frente}:
 *   get:
 *     summary: Catálogo de puntos de control.
 *     tags:
 *       - Lista de Verificación
 *     parameters:
 *       - in: path
 *         name: frente
 *         type: number
 *         required: true
 *     responses:
 *       200:
 *         description: Regresa un arreglo de los puntos de control que están relacionados al frente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       json:
 *                         type: list
 *                         example: [{explosionid: 32, fechater: '01/01/2001', ubicacion: '001-001-000-00', estacion: 101, status: 'P'}]
 * 
*/

//SACA EL CATALOGO DE LOS PUNTOS DE CONTROL
ruta.get('/puntoscontrol/frente/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "Select p.explosionid,p.fechater,p.status "
    + " ,REPLACE(STR(manzana,3),' ','0')+'-'+REPLACE(STR(lote,3),' ','0')+'-'"
    + "  +  REPLACE(STR(interior,3),' ','0')+'-'+REPLACE(STR(subinterior,2),' ','0') as ubicacion"
    + " ,p.estacion"
    + " from poControlObra p "
    + "  inner join poavanceobra  a on a.explosionid=p.explosionid"
    + "  Where p.frente=" + frente
    + " Order by p.explosionid"
    const control = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(control);
})

/**
 * @swagger
 * /api/v2/listaverificacion/catalogoestaciones/avance/estatus/{frente}:
 *   get:
 *     summary: Catálogo de estaciones y estatus de un frente en base al avance de obra.
 *     tags:
 *       - Lista de Verificación
 *     parameters:
 *       - in: path
 *         name: frente
 *         type: number
 *         required: true
 *     responses:
 *       200:
 *         description: Regresa los explosionId's y las fechas de terminación y estatus, junto con sus ubicaciones en forma de arreglo.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       json:
 *                         type: list
 *                         example: [{explosionid: 32, fechater: '01/01/2001', ubicacion: '001-001-000-00', estacion: 101, status: 'P'}]
 * 
*/

//Saca el catálogo de estaciones del avance de obra, junto con su estatus
ruta.get('/catalogoestaciones/avance/estatus/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "Select p.explosionid,p.fechater,p.status "
    + " ,REPLACE(STR(manzana,3),' ','0')+'-'+REPLACE(STR(lote,3),' ','0')+'-'"
    + "  +  REPLACE(STR(interior,3),' ','0')+'-'+REPLACE(STR(subinterior,2),' ','0') as ubicacion"
    + " ,p.estacion"
    + " from poavanceobra p "
    + "  Where p.frente=" + frente
    + " Order by p.explosionid"
    const estaciones = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(estaciones);
})

/**
 * @swagger
 * /api/v2/listaverificacion/consulta/estaciones/avance/control:
 *   post:
 *     summary: Catálogo de estaciones sin repetirse .
 *     tags:
 *       - Lista de Verificación
 *     parameters:
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               frente:
 *                 type: string
 *               estacion:
 *                 type: number
 *               proveedorid:
 *                 type: number
 *               modulo:
 *                 type: number
 *     responses:
 *       200:
 *         description: Regresa un arreglo de las estaciones sin repetirse.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       json:
 *                         type: list
 *                         example: [{estacion: 101}, {estacion: 102}, {estacion: 103}]
 * 
*/

//SE VA A USAR POST PARA SACAR EL MODULO YA QUE HAY VECES QUE PUEDE SER VACÍO Y TRUENA LA URL
ruta.post('/consulta/estaciones/avance/control', verificar, async(req,res)=>{
    const datos = req.body.datos;
    let consulta = "Select distinct a.estacion"
    + " From poAvanceObra a"
    + "  Inner join poControlObra o on "
    + "       o.explosionid=a.explosionid "
    + " Inner join poLotesAsignados l on "
    + "  a.frente=l.frente "
    + "    and a.manzana=l.manzana"
    + "    and a.lote=l.lote"
    + "    and a.interior=l.interior"
    + "    and a.subinterior=l.subinterior"
    + " Inner Join modelos m on m.clavemodelo=l.modelo";
    if(datos.proveedorid == 0){
      consulta += "  where a.frente=" + datos.frente
      + "    and l.modulo='" + datos.modulo + "'"
      + " Order by a.estacion"
    }else{
      consulta += "  Inner join pomodulosobra mo On mo.modulo =l.modulo "
      + "  Where mo.proveedorid=" + datos.proveedorid
      + "   and left(mo.modulo,4)=" + datos.frente
      + " Order by a.estacion"
    }
    const estaciones = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(estaciones);
})

/**
 * @swagger
 * /api/v2/listaverificacion/estacion/avance/{frente}/{estacion}/{ubicacion}:
 *   get:
 *     summary: Obtener el explosionId de un frente y una estación.
 *     tags:
 *       - Lista de Verificación
 *     parameters:
 *       - in: path
 *         name: frente
 *         type: number
 *         required: true
 *       - in: path
 *         name: estacion
 *         type: number
 *         required: true
 *       - in: path
 *         name: ubicacion
 *         type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Regresa un arreglo de un elemento con el explosionid de una ubicacion y una estación dentro de un frente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       json:
 *                         type: list
 *                         example: [{explosionid: 12424}]
 * 
*/

ruta.get('/estacion/avance/:frente/:estacion/:ubicacion', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const estacion = req.params.estacion;
    const ubicacion = req.params.ubicacion;
    const consulta = "Select explosionid from poAvanceObra"
    + " Where estacion='" + estacion + "'"
    + "  and frente=" + frente + ""
    + "  and (REPLACE(STR(manzana,3),' ','0')+'-'+REPLACE(STR(lote,3),' ','0')+'-'"
    + "    +  REPLACE(STR(interior,3),' ','0')+'-'+REPLACE(STR(subinterior,2),' ','0')"
    + " = '" + ubicacion + "' )";
    const estacionUbicada = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(estacionUbicada);
});

/**
 * @swagger
 * /api/v2/listaverificacion/ubicaciones/avance/{frente}/{ccedif}:
 *   get:
 *     summary: Obtener el explosionId de un frente y una estación.
 *     tags:
 *       - Lista de Verificación
 *     parameters:
 *       - in: path
 *         name: frente
 *         type: number
 *         required: true
 *       - in: path
 *         name: modelo
 *         type: string
 *         required: true
 *       - in: path
 *         name: produccion
 *         type: boolean
 *         required: true
 *       - in: path
 *         name: calidad
 *         type: boolean
 *         required: true
 *     responses:
 *       200:
 *         description: Regresa un arreglo de un elemento con el explosionid de una ubicacion y una estación dentro de un frente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       json:
 *                         type: list
 *                         example: [{explosionid: 12424}]
 * 
*/

ruta.get('/ubicaciones/avance/:frente/:ccedif', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const ccedif = req.params.ccedif;
    const consulta = `Select distinct REPLACE(STR(a.manzana,3),' ','0')+'-'+REPLACE(STR(a.LOTE,3),' ','0')+'-'+REPLACE(STR(a.interior,3),' ','0')+'-'+
    REPLACE(STR(a.subinterior,2),' ','0') as valor , m.nombre as modelo, cast(l.secuencia as int) secuencia, mo.ccedif
    From poAvanceObra a 
    Inner join poLotesAsignados l on   a.frente=l.frente     and a.manzana=l.manzana    and a.lote=l.lote    and a.interior=l.interior   
    and a.subinterior=l.subinterior 
    Inner Join modelos m on m.clavemodelo=l.modelo 
    Inner join poModulosObra mo On mo.modulo =l.modulo
    where a.frente = ${frente} and mo.ccedif = ${ccedif}
     Order by cast(l.secuencia as int)`; 
    const ubicaciones = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(ubicaciones);
})

/**
 * @swagger
 * /api/v2/listaverificacion/matriz/avance:
 *   post:
 *     summary: De aquí va a salir la matríz para la lista de verificación (lo uso como get).
 *     tags:
 *       - Lista de Verificación
 *     parameters:
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               frente:
 *                 type: string
 *               ccedif:
 *                 type: number
 *               ubicaciones:
 *                 type: string
 * 
 *             required:
 *               - valor
 *     responses:
 *       200:
 *         description: Se va a devolver un arreglo con las estaciones, frentes y otros datos; así como las ubicaciones en forma de atributos.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       json:
 *                         type: string
 *                         description: Arreglo con datos de avance, cada ubicacion tiene la fecha de terminación o programación, el status, el contratista 
 *                          y la cantidad de actividades realizadas.
 *                         example: [{estacion: '101 1a etapa cimen', frente: 533, 001-001-000-00: '01/01/2024_T_AMADOR_0'}, {estacion: '101 1a etapa cimen', frente: 533, 001-002-000-00: '03/01/2024_T_AMADOR_0'}]
 * 
*/

ruta.post('/matriz/avance', verificar, async(req,res)=>{
      const datos = req.body.datos;
      const consulta = `select * from (   select distinct a.estacion+' '+isnull(left(e.descripcion,35) + ' '+Cast(e.duracion as Varchar),'Error') as estacion,
      REPLACE(STR(a.manzana,3),' ','0')+'-'+REPLACE(STR(a.LOTE,3),' ','0')+'-'+
      REPLACE(STR(a.interior,3),' ','0')+'-'+REPLACE(STR(a.subinterior,2),' ','0')  + '/' + m.nombre as ubicacion, 
      cast(format(case when a.status = 'T' then a.FECHATER else a.FECHAREA end, 'MM/dd/yyyy') as varchar)  + '_' + RTRIM(a.status) + '_' collate Modern_Spanish_CI_AS +  
      isnull(p.nombre, 'No Asignado') + '_' + cast((select count(*) from poAvanceObraTareas pt
      inner join poRolesAvanceObra pr on pr.rolId = pt.rolId
      where pt.explosionId = a.explosionId and pr.descripcionCorta = a.status) as varchar)
      + case when ISNULL(a.bloqueoEstacion, 0) != 0 then '_Rechazado' else '' end  as fec 
      from poAvanceObra a  
      left join poAsignaObra pa on pa.explosionid = a.explosionId
      left join proveedores p on p.proveedorId = pa.proveedorId
      Inner join  poLotesAsignados l on    a.frente=l.frente      and a.manzana=l.manzana      and a.lote=l.lote     and a.interior=l.interior     and a.subinterior=l.subinterior
      Inner join modelos m on m.clavemodelo=l.modelo  Inner Join poCatalogoEstacionesFrente e on  e.modelo=m.clavemodelo  and e.estacion=a.estacion and e.frente = ${datos.frente}
      ${datos.ccedif != 0 ? `Inner join poModulosObra mo On mo.modulo =l.modulo    and mo.ccedif = ${datos.ccedif} and left(mo.modulo,4)= ${datos.frente}` : ''}
      where a.frente = ${datos.frente} ) src pivot
      ( MAX(fec)  for UBICACION in (${datos.ubicaciones}) ) piV`;
      const matrizUbicaciones = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
      return res.json(matrizUbicaciones);
})

/**
 * @swagger
 * /api/v2/listaverificacion/matriz/responsables:
 *   post:
 *     summary: Esta matriz regresa una matriz de casas y ubicaciones con el fin de definir los responsables de obra.
 *     tags:
 *       - Lista de Verificación
 *     parameters:
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               frente:
 *                 type: string
 *               ccedif:
 *                 type: number
 *               ubicaciones:
 *                 type: string
 *               usuarioid:
 *                 type: number
 *               rolid:
 *                 type: number
 * 
 *             required:
 *               - valor
 *     responses:
 *       200:
 *         description: Se va a devolver un arreglo con las estaciones, frentes y otros datos; sólo que en este caso regresa el nombre del responsable de obra.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       json:
 *                         type: string
 *                         description: Arreglo con datos de avance, cada ubicacion tiene la fecha de terminación o programación, el status, el contratista 
 *                          y la cantidad de actividades realizadas.
 *                         example: [{estacion: '101', frente: 533, 001-001-000-00: 'AMADOR_1_14254'}, {estacion: '101', frente: 533, 001-002-000-00: 'AMADOR_1_14255'}]
 * 
*/

ruta.post('/matriz/responsables', verificar, async(req,res)=>{
  const datos = req.body.datos;
  const primeraConsulta =  `select * from (   
    select distinct a.estacion,
    REPLACE(STR(a.manzana,3),' ','0')+'-'+REPLACE(STR(a.LOTE,3),' ','0')+'-'+
    REPLACE(STR(a.interior,3),' ','0')+'-'+REPLACE(STR(a.subinterior,2),' ','0') ubicacion,`;
    const segundaConsulta =  ` from poAvanceObra a
    left join poAsignaObra pa on pa.explosionid = a.explosionId
    left join proveedores p on p.proveedorId = pa.proveedorId
    left join poResponsableEstacion pre on pre.explosionId = a.explosionId and pre.rolid = ${datos.rolid} and pre.usuarioid = ${datos.usuarioid}
    Inner join  poLotesAsignados l on    a.frente=l.frente      and a.manzana=l.manzana      and a.lote=l.lote     and a.interior=l.interior     and a.subinterior=l.subinterior
    Inner join modelos m on m.clavemodelo=l.modelo  Inner Join poCatalogoEstacionesFrente e on  e.modelo=m.clavemodelo  and e.estacion=a.estacion and e.frente = ${datos.frente}
    Inner join poModulosObra mo On mo.modulo =l.modulo    and mo.ccedif = ${datos.ccedif} and left(mo.modulo,4)= ${datos.frente}
  where a.frente = ${datos.frente} ) src pivot
( MAX(fec)  for UBICACION in (${datos.ubicaciones})) piV`;

  let consulta = primeraConsulta + `
  isnull(p.nombre, 'No Asignado') + '_' + cast(case when pre.explosionid is null then 0 else 1 end as varchar) + '_' + cast(a.explosionid as varchar) as fec` 
  + segundaConsulta;
  const matrizResponsables = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
  consulta = `if exists (select * from poResponsableEstacion where explosionid in 
  (select explosionid from vwAvanceObraNormalizada po 
    inner join poModulosObra pm on pm.modulo = po.modulo
    where  po.frente = ${datos.frente} and pm.ccedif = ${datos.ccedif}))
    begin
    ` + primeraConsulta + `
    isnull(p.nombre, 'No Asignado') + '_' + cast(case when pre.explosionid is null then 0 else 1 end as varchar) +
    '_' + cast(case when pre.permisoGps is null then 0 else pre.permisoGps end as varchar) +  '_' + cast(a.explosionid as varchar) as fec ` 
  + segundaConsulta + `
  end;`;
  const matrizPermisos = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
  return res.json({responsables: matrizResponsables, permisos: matrizPermisos});
})

/**
 * @swagger
 * /api/v2/listaverificacion/cantidadavance/>{frente}/{ccedif}:
 *   get:
 *     summary: Obtener el explosionId de un frente y una estación.
 *     tags:
 *       - Lista de Verificación
 *     parameters:
 *       - in: path
 *         name: frente
 *         type: number
 *         required: true
 *       - in: path
 *         name: ccedif
 *         type: number
 *         required: true
 *     responses:
 *       200:
 *         description: Hace un procesado de varias consultas para regresar un string con la información concatenada del avance financiero y de obra del frente y línea de producción.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: string
 *                   example: "800 estaciones -> 75 avanzadas -> 725 pendientes -> 5% avance -> 3% avance financiero"
 * 
*/

ruta.get('/cantidadavance/:frente/:ccedif', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const ccedif = req.params.ccedif;
    let modulosDelFrente = "";
    let cantidadViviendas = 0;
    let reporteAvance = "";
    const consultaCantidadLotes = "SELECT modulo,sum(lotes)  as son "
    + " FROM poModulosObra Where ccedif=" + ccedif
    + "  and left(modulo,4)=" + frente + " Group by modulo";
    //PARA GENERAR LOS REPORTES DE LOS MÓDULOS
    if(ccedif != 0){
      const cantidadCasasPorModulo = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consultaCantidadLotes);
      if(cantidadCasasPorModulo.length <= 0) return res.status(500).send({error: "Este frente aún no tiene módulos con casas asignadas"});
      cantidadCasasPorModulo.forEach(currentItem => {
          modulosDelFrente += currentItem['modulo'] + ',';
          cantidadViviendas += parseInt(currentItem['son']);
      });
      if(modulosDelFrente.length > 0){
        modulosDelFrente = modulosDelFrente.substring(0, modulosDelFrente.length - 1);
        reporteAvance += cantidadViviendas.toString() + " viviendas -> ";
      }else return res.status(500).send({error: "No hay modulos disponibles para este frente"});
  
      //PARA SACAR LA CANTIDAD DE ESTACIONES DEL FRENTE DE TODOS LAS CASAS
      const consultaCantidadEstaciones = "SELECT count(*) as son "
      + " FROM poAvanceObra g "
      + " INNER JOIN poLotesAsignados p On p.frente=g.frente "
      + " AND p.MANZANA=g.MANZANA AND p.LOTE=g.LOTE  AND p.INTERIOR=g.INTERIOR  AND p.SUBINTERIOR =g.SUBINTERIOR  "
      + " AND P.MODULO in(" + modulosDelFrente + ")";
      const cantidadEstaciones = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consultaCantidadEstaciones);
      if(cantidadEstaciones.length > 0) reporteAvance += cantidadEstaciones[0].son + " estaciones -> ";
      else return res.status(500).send({mensaje: "No se encuentran estaciones asociadas a esta vista"});
      
      //PARA SACAR LA CANTIDAD DE ESTACIONES TERMINADAS Y SEMITERMINADAS
      const consultaEstacionesTerminadas =  `select 
      sum(case when va.status != 'P' and va.status != 'T' then 1 else 0 end) iniciadas ,
      sum(case when va.status = 'P' then 1 else 0 end) pendientes ,
      sum(case when va.status = 'T' then 1 else 0 end) terminadas 
      from vwAvanceObraNormalizada va
      inner join poModulosObra pm on pm.modulo = va.modulo
      where frente = ${frente} and ccedif = ${ccedif}`;
      const estacionesTerminadas_Semiterminadas = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consultaEstacionesTerminadas);
      reporteAvance += estacionesTerminadas_Semiterminadas[0].terminadas + " estaciones terminadas -> " 
      + estacionesTerminadas_Semiterminadas[0].iniciadas + " estaciones iniciadas -> "
      + estacionesTerminadas_Semiterminadas[0].pendientes + " estaciones pendientes -> "
  
      const estacionesTerminadas = estacionesTerminadas_Semiterminadas[0].terminadas;
  
      const porcentajeAvance = (parseFloat(estacionesTerminadas) * 100) / parseFloat(cantidadEstaciones[0].son)
      reporteAvance += Math.round(porcentajeAvance) + " % de avance -> ";
      const consultaFinanciero = `select round((sum(case when va.status = 'T' then va.pagoEtiq else 0 end) / sum(va.pagoEtiq) * 100), 1, 1) financiero  from vwAvanceObraNormalizada va 
      inner join poModulosObra pm on pm.modulo = va.modulo
      where va.frente = ${frente} and pm.ccedif = ${ccedif}`;
      const avanceFinanciero = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consultaFinanciero);
      reporteAvance += avanceFinanciero[0]['financiero'] + "% avance financiero.";
      return res.json(reporteAvance);
    }
})

/**
 * @swagger
 * /api/v2/listaverificacion/explosionid/ubicacion/avance/{estacion}/{frente}/{ubicacion}:
 *   get:
 *     summary: Este endpoint regresa el explosionId de una ubicación y estación.
 *     tags:
 *       - Lista de Verificación
 *     parameters:
 *       - in: path
 *         name: frente
 *         type: number
 *         required: true
 *       - in: path
 *         name: estacion
 *         type: number
 *         required: true
 *       - in: path
 *         name: ubicacion
 *         type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Va a regresar el id del conjunto de la ubicación y la estación.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       json:
 *                         type: list
 *                         description: Lista de Proveedores.
 *                         example: [{explosionid: 45993}]
 * 
*/

ruta.get('/explosionid/ubicacion/avance/:estacion/:frente/:ubicacion', verificar, async(req,res)=>{
  const estacion = req.params.estacion;
  const ubicacion = req.params.ubicacion;
  const frente = req.params.frente;
  const consulta = "Select explosionid from poAvanceObra"
  + " Where estacion='" + estacion + "'"
  + " and frente=" + frente + ""
  + "  and (REPLACE(STR(manzana,3),' ','0')+'-'+REPLACE(STR(lote,3),' ','0')+'-'"
  + "    +  REPLACE(STR(interior,3),' ','0')+'-'+REPLACE(STR(subinterior,2),' ','0')"
  + " = '" + ubicacion + "' )"
  const explosionId = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
  return res.json(explosionId);
})

/**
 * @swagger
 * /api/v2/listaverificacion/tareas/secuencia/{explosionid}/{estacion}/{modelo}:
 *   get:
 *     summary: Aquí se regresan todas las actividades asignadas a esa estación, junto con los roles asignados a las actividades y las secuencias de estos mismos.
 *     tags:
 *       - Lista de Verificación
 *     parameters:
 *       - in: path
 *         name: explosionid
 *         type: number
 *         required: true
 *       - in: path
 *         name: estacion
 *         type: number
 *         required: true
 *       - in: path
 *         name: modelo
 *         type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Se regresa un arreglo con las actividadesId's, nombre, roles, etc (La secuencia real indica la ultima secuencia que insertó datos).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       json:
 *                         type: list
 *                         description: Lista de Proveedores.
 *                         example: [{descripcion: 'Limpieza Gruesa', rol: 'Residente de Contratista', secuenciaasignada: 1, secuenciareal: 0}]
 * 
*/

//SACA LA SECUENCIA DE LAS ACTIVIDADES EN TIPO DE LISTA PARA IR VALIDANDO POR CADA REGISTRO DE LA MARTIZ PRINCIPAL
ruta.get('/tareas/secuencia/:explosionid/:estacion/:modelo', verificar, async(req,res)=>{
  const explosionid = req.params.explosionid;
  const estacion = req.params.estacion;
  const modelo = req.params.modelo;
  const consulta = "select pl.descripcion, pra.descripcion as rol, pl.id, pr.secuencia secuenciaasignada , ISNULL(max(pa.secuencia), 0) secuenciareal "
  + " from poRolesActividadesAvanceObra pr "
  + " inner join polistaverificacion2 pl on pr.actividadId = pl.id"
  + " left join poRolesAvanceObra pra on pra.rolId = pr.rolId "
  + " inner join poAvanceObra po on po.frente = pl.frente and po.estacion = pl.estacion"
  + " left join poAvanceObraTareas pa on pa.id = pl.id "
  + " and pa.rolId = pra.rolId and pa.frente = pl.frente and pa.explosionId = po.explosionId"
  + " where po.explosionId = " + explosionid + " and pl.estacion = " + estacion + " and pl.modelo = '" + modelo + "'"
  + " group by pl.descripcion, pra.descripcion, pl.id, pa.secuencia, pr.secuencia order by id, pr.secuencia";
  const resultadoMatriz = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
  return res.json(resultadoMatriz);
})

/**
 * @swagger
 * /api/v2/listaverificacion/tareas/estacion:
 *   post:
 *     summary: Este endpoint va a regresar una matriz de las actividades y los roles.
 *     tags:
 *       - Lista de Verificación
 *     parameters:
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               explosionid:
 *                 type: number
 *               roles:
 *                 type: string
 * 
 *             required:
 *               - valor
 *     responses:
 *       200:
 *         description: Va a devolver un arreglo con las actividades como filas, y los roles como objetos, cada valor dice si ya se insertó la actividad por parte de ese rol.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       json:
 *                         type: string
 *                         example: [{numero: 1, descripcion: 'Inicio de Estación', tipoactividad: 2, roles: 'Residente de Grupo Soldi_3-RS', id: '432/1/1'}]
 * 
*/

//MATRIZ PRINCIPAL DE ASIGNACIONES DE TAREAS PARA ACEPTAR O RECHAZAR ESTAS MISMAS
ruta.post('/tareas/estacion', verificar, async(req,res)=>{
    const datos = req.body.datos;
    const consulta = `select * from ( 
      select pl.numero, pl.descripcion, pl.obligatoria as tipoactividad,  pra.descripcion + '_' + pra.descripcioncorta as roles,
      isnull(cast(pl.id as varchar) + '/' + cast(pa.secuencia as varchar), 'N_I/' + CAST(pr.secuencia as varchar)) id, pl.codigo

      from polistaverificacion2 pl
      inner join modelos m on m.nombre = pl.modelo
      inner join vwAvanceObraNormalizada va on va.frente = pl.frente and va.nombremodelo = pl.modelo and va.estacion = pl.estacion
      left join poRolesActividadesAvanceObra pr on pr.actividadId = pl.id
      left join poRolesAvanceObra pra on pra.rolId = pr.rolId
      left join poAvanceObraTareas pa on pa.rolId = pra.rolId and pa.explosionId = va.explosionId and pa.numero = pl.numero
      where va.explosionId = ${datos.explosionid} 
      group by pl.descripcion, pra.descripcion, pl.id, pl.obligatoria, pa.secuencia, pl.numero, pr.secuencia, pra.descripcioncorta, pl.codigo) 
    src Pivot(max(id) for roles in (${datos.roles})) piV`;
    const actividadesDeEstaciones = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(actividadesDeEstaciones);
})

/**
 * @swagger
 * /api/v2/listaverificacion/roles/{usuarioid}:
 *   get:
 *     summary: Roles de un usuario.
 *     tags:
 *       - Lista de Verificación
 *     parameters:
 *       - in: path
 *         name: usuarioid
 *         type: number
 *         required: true
 *     responses:
 *       200:
 *         description: Se regresa un arreglo con todos los roles asignados a ese usuario.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       json:
 *                         type: list
 *                         description: Lista de Proveedores.
 *                         example: [{rolid: 1, descripcion: 'Residente de Contratista', descripcioncorta: '1 RC'}]
 * 
*/

ruta.get('/roles/:usuarioid', verificar, async(req,res)=>{
    const usuarioid = req.params.usuarioid;
    const consulta = "select pur.rolId, descripcion, descripcioncorta from poRolesAvanceObra pr "
    + " inner join poRolesUsuarioAvanceObra pur on pur.rolId = pr.rolId"
    + " where pur.usuarioId = " + usuarioid
    const roles = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    if(roles.length > 0) return res.json(roles)
    else return res.json({mensaje: "Usuario sin asignación de roles"});
})  

/**
 * @swagger
 * /api/v2/listaverificacion/cantidad/roles/asignados/{frente}/{estacion}/{modelo}:
 *   get:
 *     summary: Regresa la cantidad de roles que están asignados a una actividad en específico.
 *     tags:
 *       - Lista de Verificación
 *     parameters:
 *       - in: path
 *         name: frente
 *         type: number
 *         required: true
 *       - in: path
 *         name: estacion
 *         type: number
 *         required: true
 *       - in: path
 *         name: modelo
 *         type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Se regresa el número de roles asignados a una actividad para saber cuántas tareas debe haber en poAvanceObraTareas
 *          para que se marque como terminada esa actividad.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       json:
 *                         type: list
 *                         description: Lista de Proveedores.
 *                         example: [{cantidadAsignaciones: 8}]
 * 
*/

ruta.get('/cantidad/roles/asignados/:frente/:estacion/:modelo', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const estacion = req.params.estacion;
    const modelo = req.params.modelo;
    const consulta = "select COUNT(*) as cantidadAsignaciones from polistaverificacion2 pl "
    + " inner join  poRolesActividadesAvanceObra pr on pr.actividadId = pl.id"
    + " where pl.frente = " + frente + " and pl.estacion = " + estacion + " and modelo = '"
    + modelo + "'";
    const cantidadAsignaciones = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(cantidadAsignaciones);
});

/**
 * @swagger
 * /api/v2/listaverificacion/estatus/estacion/{explosionid}:
 *   get:
 *     summary: Comprueba cuántas actividades hay que insertar en total para terminar la estación.
 *     tags:
 *       - Lista de Verificación
 *     parameters:
 *       - in: path
 *         name: frente
 *         type: number
 *         required: true
 *       - in: path
 *         name: estacion
 *         type: number
 *         required: true
 *       - in: path
 *         name: modelo
 *         type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Con el explosionId, regresa las inserciones de actividades, la cantidad de actividades que tienen que insertarse
 *          y si es que ha habido un exceso de rechazos.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       json:
 *                         type: list
 *                         description: Lista de Proveedores.
 *                         example: [{inserciones: 8, actividades: 10, rechazo: '' }]
 * 
*/

ruta.get('/estatus/estacion/:explosionid', async(req,res) => {
  const explosionid = req.params.explosionid;
    let consulta = `select COUNT(*) cantidadInserciones from poAvanceObraTareas where explosionId = ${explosionid}`;
  const inserciones = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
  let cantidadInserciones = inserciones[0]['cantidadInserciones'];
    consulta = `select COUNT(*) cantidadActividades from polistaverificacion2 pl
    inner join vwAvanceObraNormalizada va on va.frente = pl.frente and va.nombremodelo = pl.modelo and va.estacion = pl.estacion 
    inner join poRolesActividadesAvanceObra pra on pra.actividadId = pl.id
    where explosionid = ${explosionid}`;
  const actividades = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
  let cantidadAct = actividades[0]['cantidadActividades'];
    consulta = `
    select COUNT(*) cantidadRechazos, numeroActividad, pl.descripcion, isnull(pl.rechazosmax, 3) rechazosmax
    from vwBitacoraAvance vb
    inner join vwAvanceObraNormalizada av on av.explosionid = vb.explosionId
    inner join polistaverificacion2 pl on pl.frente = vb.frente and pl.estacion = vb.estacion and pl.modelo = av.nombremodelo and pl.numero = vb.numeroActividad
    where av.explosionId = ${explosionid} group by numeroActividad, pl.rechazosMax, pl.descripcion`;
  const rechazos = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
  let rechazo = '';
  for(let i = 0; i < rechazos.length; i++){
    if(rechazos[i]['cantidadRechazos'] >= rechazos[i]['rechazosmax']){
      rechazo = rechazos[i]['descripcion'];
      break;
    }
  }
  let estatusJson = {inserciones: cantidadInserciones, actividades: cantidadAct, rechazo: rechazo }
  return res.json(estatusJson);
})

/**
 * @swagger
 * /api/v2/listaverificacion/catalogoroles/{frente}:
 *   get:
 *     summary: Regresa el catálogo de roles que existen en ese frente.
 *     tags:
 *       - Lista de Verificación
 *     parameters:
 *       - in: path
 *         name: frente
 *         type: number
 *         required: true
 *     responses:
 *       200:
 *         description: Regresa un arreglo con el catálogo de roles sin repetirse de un frente específico.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       json:
 *                         type: list
 *                         description: Lista de Proveedores.
 *                         example: [{modelo: '234010001', estacion: 101, rolid: 1, descripcion: 'Residente Contratista', secuencia: 1}, {modelo: '234010001', estacion: 101, rolid: 2, descripcion: 'Contratista', secuencia: 2}]
 * 
*/

ruta.get('/catalogoroles/:frente', verificar, async(req,res)=>{
  const frente = req.params.frente;
  const consulta = `select distinct pl.modelo, pl.estacion, pr.rolId, pr.descripcioncorta, pr.descripcion, pa.secuencia from polistaverificacion2 pl 
  inner join poRolesActividadesAvanceObra pa on pa.actividadId = pl.id
  inner join poRolesAvanceObra pr on pa.rolId = pr.rolId
  where pl.frente = ${frente}
  order by pl.modelo, pl.estacion`;
  const rolesFrente = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
  return res.json(rolesFrente);
})


/**
 * @swagger
 * /api/v2/listaverificacion/secuencia/roles:
 *   post:
 *     summary: Matriz para secuencia de roles.
 *     tags:
 *       - Lista de Verificación
 *     parameters:
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               frente:
 *                 type: number
 *               estacion:
 *                 type: number
 *               modelo:
 *                 type: string
 *               roles:
 *                 type: string
 *             required:
 *               - valor
 *     responses:
 *       200:
 *         description: Se va a devolver una matriz con los roles dados de alta junto con su secuencia dividido por actividad.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       json:
 *                         type: string
 *                         example: [{rol: 'Residente Contratista', actividad: 'Inicio de Estación', secuencia: 1}, {rol: 'Contratista', actividad: 'Inicio de Estación', secuencia: 2}]
 * 
*/

ruta.post('/secuencia/roles', verificar, async(req,res)=>{
  const datos = req.body.datos;
  //ESTA CONSULTA SACA LA SECUENCIA DE UNA ACTIVIDAD EN ESPECIFICO
  const consulta = "select * from (select isnull(secuencia, 0) secuencia, pl.descripcion actividad, pr.descripcion rol "
  + " from polistaverificacion2 pl "
  + " left join poRolesActividadesAvanceObra pra on pra.actividadId = pl.id"
  + " inner join poRolesAvanceObra pr on pr.rolId	= pra.rolId"
  + " where pl.frente = " + datos.frente +  " and estacion = " + datos.estacion + " and modelo = '" + datos.modelo + "') pivote "
  + " pivot (max(secuencia) for rol in (" + datos.roles + ")) piv";
  const secuenciaRoles = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
  return res.json(secuenciaRoles);
})

ruta.post('/permitiravance/roles', verificar, async(req,res)=>{
    const datos = req.body.datos;
    datos.forEach(currentItem => {
      try{

      }catch(error){

      }
    });
})

/**
 * @swagger
 * /api/v2/listaverificacion/explosionid/{frente}/{ubicacion}/{estacion}:
 *   get:
 *     summary: Devuelve la explosionid de una ubicación y una estación.
 *     tags:
 *       - Lista de Verificación
 *     parameters:
 *       - in: path
 *         name: frente
 *         type: number
 *         required: true
 *       - in: path
 *         name: ubicacion
 *         type: string
 *         required: true
 *       - in: path
 *         name: estacion
 *         type: number
 *         required: true
 *     responses:
 *       200:
 *         description: Regresa el explosionId de la ubicación indicada.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       json:
 *                         type: list
 *                         description: Lista de Proveedores.
 *                         example: [{explosionid: 32452 }]
 * 
*/

ruta.get('/explosionid/:frente/:ubicacion/:estacion', verificar, async(req,res)=>{
  const frente = req.params.frente;
  //LA HAGO ARREGLO PARA DIFERENCIARLO EN BASE A LA BD
  const ubicaciones = req.params.ubicacion.split('-');
  const estacion = req.params.estacion;
  const consulta = "select explosionid from poavanceobra where frente = " + frente 
  + " and manzana = " + parseInt(ubicaciones[0]) + " and lote = " + parseInt(ubicaciones[1])
  + " and interior = " + parseInt(ubicaciones[2]) + " and subinterior = " + parseInt(ubicaciones[3]) + " and estacion = " + estacion;
  const explosionId = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
  return res.json(explosionId);
})

/**
 * @swagger
 * /api/v2/listaverificacion/estatustarea/{frente}/{estacion}/{explosionid}:
 *   get:
 *     summary: Devuelve la cantidad de tareas insertadas junto con la cantidad de rechazos a esa estación.
 *     tags:
 *       - Lista de Verificación
 *     parameters:
 *       - in: path
 *         name: frente
 *         type: number
 *         required: true
 *       - in: path
 *         name: explosionid
 *         type: number
 *         required: true
 *       - in: path
 *         name: estacion
 *         type: number
 *         required: true
 *     responses:
 *       200:
 *         description: Regresa un arreglo con las actividades insertadas dentro de la estación, junto con sus rechazos, para posteriormente validar si se tiene que bloquear.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       json:
 *                         type: list
 *                         description: Lista de Proveedores.
 *                         example: [{estatus: 'Rechazado', rolid: 1, numeroactividad: 3, fecha: '02/09/2024' }, {estatus: 'Rechazado', rolid: 1, numeroactividad: 3, fecha: '02/09/2024' }, {estatus: 'Aceptado', rolid: 1, numeroactividad: 2, fecha: '02/09/2024' }]
 * 
*/

ruta.get('/estatustarea/:frente/:estacion/:explosionid', verificar, async(req,res)=> {
  const frente = req.params.frente;
  const estacion = req.params.estacion;
  const explosionid = req.params.explosionid;
  const consulta = "select max(fecha) fecha, 'Aprobado' estatus, rolId, numero as numeroactividad from poAvanceObraTareas pt"
  + " where pt.explosionId = " + explosionid
  + " group by rolId, numero "
  + " union all "
  + " select max(fechaRechazo) fecha, 'Rechazado' estatus, rolId, numeroactividad from poBitacoraRechazosTareas pb"
  + " inner join poAvanceObra po on po.frente = pb.frente and po.estacion = pb.estacion and po.manzana = pb.manzana"
   + " and pb.lote = po.lote and pb.interior = po.interior and pb.subinterior = po.subinterior "
  + " where pb.frente  = " + frente + " and pb.estacion = " + estacion + " and po.explosionid = " + explosionid
  + " group by rolId, numeroActividad";
  const fechas = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
  let arregloAuxiliar = [];
  //HAGO UN ARREGLO PARA CLONAR NADA MÁS LOS NÚMEROS DE ACTIVIDAD, PARA NO REPETIR ACTIVIDADES
  const numeroActividades = [...new Set(fechas.map(item => item.numeroactividad))]; 
  //RECORRO LAS ACTIVIDADES ISN REPETIR PARA AGARRAR EL ULTIMO CAMBIO QUE SE HIZO EN LA FECHA, PARA DETERMINAR SI LO ULTIMO FUE UN RECHAZO O UNA ACEPTACIÓN
  numeroActividades.forEach(element => {
    const fechaMayor = fechas.filter(ele => ele.numeroactividad == element).sort((a,b) => a.fecha < b.fecha ? 1 :  -1)[0]
    arregloAuxiliar.push(fechaMayor);
  });
  //COMAPRA LA FECHA EN FORMA DESCENDENTE, Y AGARRA EL PRIMER VALOR QUE HA SIDO MODIFICADO (RECHAZADO O APROBADO)
  return res.json(arregloAuxiliar);
})

/**
 * @swagger
 * /api/v2/listaverificacion/rechazos/actividades/{explosionid}:
 *   get:
 *     summary: Devuelve la cantidad de rechazos por actividad.
 *     tags:
 *       - Lista de Verificación
 *     parameters:
 *       - in: path
 *         name: explosionid
 *         type: number
 *         required: true
 *     responses:
 *       200:
 *         description: Regresa un arreglo con las actividades existentes dentro de la explosionid indicada que fueron rechazadas.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       json:
 *                         type: list
 *                         description: Lista de Proveedores.
 *                         example: [{numero: 1, descripcion: 'Inicio de Estación', tipoactividad: 2, rechazos: 2, rechazosMax: 3},
 *                          {numero: 2, descripcion: 'Documentación en base a Formato 0704-R04.03', tipoactividad: 2, rechazos: 1, rechazosMax: 3}]
 * 
*/

ruta.get('/rechazos/actividades/:explosionid', verificar, async(req,res)=> {
  const explosionid = req.params.explosionid;
  const consulta = "select pl.numero, pl.descripcion, pl.obligatoria as tipoactividad, count(pb.bitacoraId) rechazos, isnull(pl.rechazosMax, 0) rechazosMax"
  + " from poRolesActividadesAvanceObra pr "
  + " right join polistaverificacion2 pl on pr.actividadId = pl.id "
  + " inner join modelos m on m.nombre = pl.modelo"
  + " left join poRolesAvanceObra pra on pra.rolId = pr.rolId"
  + " inner join poAvanceObra po on po.frente = pl.frente and po.estacion = pl.estacion"
  + " inner join poLotesAsignados pla on pla.frente = po.frente and pla.manzana = po.manzana and pla.lote = po.lote and pla.interior = po.interior"
  + " and pla.subinterior = po.subinterior and m.clavemodelo = pla.modelo"
  + " left join poBitacoraRechazosTareas pb on pb.manzana = po.manzana and pb.lote = po.lote and pb.interior = po.interior and pb.subinterior = po.subinterior"
  + " and pb.frente = po.frente and pb.estacion = po.estacion and pb.rolId = pra.rolId and pb.numeroActividad = pl.numero "
  + " where po.explosionId = " + explosionid
  + " group by pl.numero, pl.descripcion, pl.rechazosMax, pl.obligatoria"
  + " order by numero"
    const rechazos = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(rechazos);
})

//APP

/**
 * @swagger
 * /api/v2/listaverificacion/roles/formato/{frente}/{estacion}/{codigo}/{ubicacion}:
 *   get:
 *     summary: Devuelve los roles que tienen presencia dentro de un formato en específico.
 *     tags:
 *       - Lista de Verificación
 *     parameters:
 *       - in: path
 *         name: frente
 *         type: number
 *         required: true
 *       - in: path
 *         name: estacion
 *         type: number
 *         required: true
 *       - in: path
 *         name: codigo
 *         type: string
 *         required: true
 *       - in: path
 *         name: ubicacion
 *         type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Regresa un arreglo de los roles que tienen que dar avance a ese formato especificado (con el código).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       json:
 *                         type: list
 *                         description: Lista de Proveedores.
 *                         example: [{rolId: 1, descripcion: 'Residente Contratista', descripcionCorta: '1 RC', secuencia: 1}, {rolId: 1, descripcion: 'Contratista', descripcionCorta: '2 C', secuencia: 2}]
 * 
*/

ruta.get('/roles/formato/:frente/:estacion/:codigo/:ubicacion', verificar, async(req,res) => {
  const frente = req.params.frente;
  const codigo = req.params.codigo;
  const estacion = req.params.estacion;
  const ubicacion = req.params.ubicacion;
  const consulta = `select pra.rolId, pr.descripcion, pr.descripcionCorta, pra.secuencia from poRolesActividadesAvanceObra pra
  inner join poRolesAvanceObra pr on pr.rolId = pra.rolId
  inner join polistaverificacion2 plv on plv.id = pra.actividadId
  inner join poAvanceObra po on po.frente = plv.frente and plv.estacion = po.estacion
  inner join modelos m on m.nombre = plv.modelo
  inner join poLotesAsignados pl on pl.frente = po.frente and pl.manzana = po.manzana and po.lote = pl.lote
  and pl.interior = po.interior and pl.subinterior = po.subinterior and pl.modelo = m.clavemodelo
  where po.frente = ${frente} and REPLACE(STR(po.manzana,3),' ','0')+'-'+REPLACE(STR(po.LOTE,3),' ','0')
  +'-'+REPLACE(STR(po.interior,3),' ','0')+'-'+REPLACE(STR(po.subinterior,2),' ','0')  = '${ubicacion}'
  and po.estacion = ${estacion} and plv.codigo = '${codigo}'
  order by pra.secuencia`
  const resultado = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
  return res.json(resultado);
});

/**
 * @swagger
 * /api/v2/listaverificacion/ubicaciones/frente/{frente}:
 *   get:
 *     summary: Devuelve las ubicaciones de un frente  sin repetirse.
 *     tags:
 *       - Lista de Verificación
 *     parameters:
 *       - in: path
 *         name: frente
 *         type: number
 *         required: true
 *     responses:
 *       200:
 *         description: Se regresa un arreglo con las ubicaciones (formateada) de un frente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       json:
 *                         type: list
 *                         description: Lista de Proveedores.
 *                         example: [{ubicacion: '001-001-000-00'}, {ubicacion: '001-002-000-00'}, {ubicacion: '001-003-000-00'}]
 * 
*/

ruta.get('/ubicaciones/frente/:frente', verificar, async(req,res) =>{
  const frente = req.params.frente;
  const consulta = `Select Distinct REPLACE(STR(a.manzana,3),' ','0')+'-'+REPLACE(STR(a.LOTE,3),' ','0')+'-'+
  REPLACE(STR(a.interior,3),' ','0')+'-'+REPLACE(STR(a.subinterior,2),' ','0') as ubicacion
  from poAvanceObra a
  where frente = ${frente}
  order by 1
  `;
  const ubicaciones = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
  return res.json(ubicaciones);
});

/**
 * @swagger
 * /api/v2/listaverificacion/resultadoid/{explosionid}/{codigo}/{rolusuario}:
 *   get:
 *     summary: Devuelve el resultadoId del formato insertado (si es que ya se insertó).
 *     tags:
 *       - Lista de Verificación
 *     parameters:
 *       - in: path
 *         name: explosionid
 *         type: number
 *         required: true
 *       - in: path
 *         name: codigo
 *         type: string
 *         required: true
 *       - in: path
 *         name: rolusuario
 *         type: number
 *         required: true
 *     responses:
 *       200:
 *         description: Se van a devolver los datos del ultimo formato insertado, para validar si es que existe o no.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       json:
 *                         type: list
 *                         description: Lista de Proveedores.
 *                         example: [{explosionid: 52423, resultadoid: 4793, codigo: '0704-R03.04', rolactual: 2, oportunidadactual: 1, numero: 1, descripcionRol: 'Residente Contratista', rolId: 1}]
 * 
*/

ruta.get('/resultadoid/:explosionid/:codigo/:rolusuario', verificar, async(req,res) =>{
  const explosionid = req.params.explosionid;
  const codigo = req.params.codigo;
  const rolid = req.params.rolusuario;
  const consulta = `select top 1 isnull(explosionid,0) as explosionid,isnull(resultadoid,0) as resultadoid, codigo,
  isnull(rolactual,0) as rolactual,isnull(oportunidadactual,1) as oportunidadactual,
  estadoactual,isnull(estatusformato,0) as estatusformato,fechaestacion, numero
  ,ultimafecha
  ,estatusestacion
  ,nombreformato, descripcionRol, rolId
  from vwFormatosEstadoActual
  Where explosionid=${explosionid}
  and codigo='${codigo}' and rolid = ${rolid}
  order by resultadoId desc`;
  const resultadoid = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
  return res.json(resultadoid);
});

/**
 * @swagger
 * /api/v2/listaverificacion/ordencompra/ubicacion/{ubicacion}/{estacion}/{frente}:
 *   get:
 *     summary: Devuelve la orden de compra que tiene esa ubicación y estación.
 *     tags:
 *       - Lista de Verificación
 *     parameters:
 *       - in: path
 *         name: ubicacion
 *         type: string
 *         required: true
 *       - in: path
 *         name: frente
 *         type: number
 *         required: true
 *       - in: path
 *         name: estacion
 *         type: number
 *         required: true
 *     responses:
 *       200:
 *         description: Se va a devolver la orden de compra asociada a esa ubicación, si no tiene, se devuelve un -1.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       json:
 *                         type: list
 *                         description: Lista de Proveedores.
 *                         example: [{ordencompraid: 4532}]
 * 
*/

ruta.get('/ordencompra/ubicacion/:ubicacion/:estacion/:frente', verificar, async(req,res) => {
  const ubicacion = req.params.ubicacion;
  const estacion = req.params.estacion;
  const frente = req.params.frente;
  const consulta  = `select isnull(pco.ordencompraid, -1) ordencompraid from poAvanceObra po
    inner join poLotesAsignados pl on pl.frente = po.frente and pl.manzana = po.manzana and pl.lote = po.lote
    and pl.interior = po.interior and pl.subinterior = po.subinterior
    inner join poCatalogoEstacionesFrente pc on pc.frente = po.frente and pc.estacion = po.estacion and pl.modelo = pc.modelo
    inner join poAsignaObra pa on pa.explosionid = po.explosionId
    inner join poContratosObra pco on pco.frente = po.frente and pco.proveedorid = pa.proveedorid
    inner join poAvanceObraContratos pac on pac.explosionId = po.explosionId and pac.idContrato = pco.id
    where po.frente = ${frente} and 
    REPLACE(STR(po.manzana,3),' ','0')+'-'+REPLACE(STR(po.LOTE,3),' ','0')+'-'+REPLACE(STR(po.interior,3),' ','0')+'-'+REPLACE(STR(po.subinterior,2),' ','0') = '${ubicacion}'
     and po.estacion = ${estacion}`;
    const ordencompra = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(ordencompra);
});

/**
 * @swagger
 * /api/v2/listaverificacion/maxsecuencia/{frente}/{ubicacion}/{estacion}:
 *   get:
 *     summary: Regresa información procesada de las actividades que faltan por dar avance, así como los que ya dieron avance.
 *     tags:
 *       - Lista de Verificación
 *     parameters:
 *       - in: path
 *         name: ubicacion
 *         type: string
 *         required: true
 *       - in: path
 *         name: frente
 *         type: number
 *         required: true
 *       - in: path
 *         name: estacion
 *         type: number
 *         required: true
 *     responses:
 *       200:
 *         description: Devuelve un objeto con el número de actividades insertadas, las que deben de insertarse, y las mayores secuencias insertadas con las que deben insertarse.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       json:
 *                         type: list
 *                         description: Lista de Proveedores.
 *                         example: [{maxSecIns: 2, maxActIns: 4,maxActReal: 6,maxSecReal: 3}]
 * 
*/

ruta.get('/maxsecuencia/:frente/:ubicacion/:estacion', verificar, async(req,res) => {
  //AQUI SACO QUÉ ACTIVIDAD Y SECUENCIA ES LA QUE SIGUE EN DAR AVANCE, LO USO PARA 
  //SACAR EL SIGUIENTE ROL
  const frente = req.params.frente;
  const ubicacion = req.params.ubicacion;
  const estacion = req.params.estacion;
  //PARA NO REPETIR EL WHERE DENTRO DE LAS CONSULTAS
  let whereUbicaciones = ` po.frente = ${frente} and po.estacion = ${estacion}
  and po.manzana =  ${ubicacion.split('-')[0]} and po.lote = ${ubicacion.split('-')[1]}
  and po.interior = ${ubicacion.split('-')[2]} and po.subinterior = ${ubicacion.split('-')[3]}`;

  //PARA NO REPETIR EL FROM EN LAS CONSULTAS
  let from = `poAvanceObra po
  inner join poLotesAsignados pla on pla.frente = po.frente and pla.manzana = po.manzana and pla.lote = po.lote
  and pla.interior = po.interior and po.subinterior = pla.subinterior
  inner join modelos m on m.clavemodelo = pla.modelo
  inner join polistaverificacion2 pl on po.frente = pl.frente
  and pl.estacion = po.estacion and pl.modelo = m.nombre
  and pla.interior = po.interior and pla.subinterior = po.subinterior and pla.modelo = m.clavemodelo
  inner join poRolesActividadesAvanceObra pr on pr.actividadId = pl.id
  where ${whereUbicaciones}`;

  //INICIO DE CONSULTAS
  let consulta = `select consulta.secInsertada, min(rolId) rolid from (select isnull(max(secuencia), 1) as secInsertada
  from
    poAvanceObra po
    left join poAvanceObraTareas pt on pt.explosionId = po.explosionId
    where ${whereUbicaciones}) consulta
    inner join poRolesActividadesAvanceObra pra on pra.secuencia = consulta.secInsertada
    inner join polistaverificacion2 pl on pl.id = pra.actividadId
    inner join vwAvanceObraNormalizada po on po.frente = pl.frente and po.nombremodelo = pl.modelo and po.estacion = pl.estacion  
  where ${whereUbicaciones}
  group by  consulta.secInsertada`;
  
  //PRIMERO SACO LA MÁXIMA SECUENCIA INSERTADA
  const promesaMaxInsertada = devolverPromesa(procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta));
  promesaMaxInsertada.then((valor) => {
    let maxSecIns = valor[0]['secInsertada'];
    let rolIdIns = valor[0]['rolid'];
    consulta = ` select count(*) as actInsertada
    from
    poAvanceObra po
    left join poAvanceObraTareas pt on pt.explosionId = po.explosionId
    where pt.rolid = ${rolIdIns} and ${whereUbicaciones}`;
    const promesaMaxReal = devolverPromesa(procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta));
    promesaMaxReal.then((actIns) => {  
      let maxActIns = actIns[0]['actInsertada'];
      consulta = `Select MAX(pr.secuencia) secReal from  ${from}`;
      const resultadoSecReal = devolverPromesa(procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta));
      resultadoSecReal.then((secReal) => {
        const maxSecReal = secReal[0]['secReal'];
        consulta = ` Select count(*) actReal from 
        ${from} and pr.rolid = ${rolIdIns}`
        const resultadoActReal = devolverPromesa(procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta));
        resultadoActReal.then((actReal) => {
          const maxActReal = actReal[0]['actReal'];
          const estatus = {
            maxSecIns: maxSecIns,
            maxActIns: maxActIns,
            maxActReal: maxActReal,
            maxSecReal: maxSecReal
          }
          return res.json(estatus);
        })
      })
    })
  })
})

/**
 * @swagger
 * /api/v2/listaverificacion/responsable/{explosionid}/{rolid}:
 *   get:
 *     summary: Regresa los datos del usuario responsable de obra en esa estación y casa.
 *     tags:
 *       - Lista de Verificación
 *     parameters:
 *       - in: path
 *         name: explosionid
 *         type: string
 *         required: true
 *       - in: path
 *         name: rolid
 *         type: number
 *         required: true
 *     responses:
 *       200:
 *         description: Devuelve un arreglo con los datos de los usuario que están asignados como responsable dentro de esa estación y casa.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       json:
 *                         type: list
 *                         description: Lista de Proveedores.
 *                         example: [{usuarioid: 18, rolid: 4, permisoGPS: 1, nombre: 'Alejandro Perez'}]
 * 
*/

ruta.get('/responsable/:explosionid/:rolid', verificar, async(req,res) => {
  const explosionid = req.params.explosionid; 
  const rolid = req.params.rolid;
  const consulta = `select pr.*, (select nombre from usuarios u where u.usuarioid = pr.usuarioid) nombre from poAvanceObra po
  inner join poResponsableEstacion pr on pr.explosionId = po.explosionId
  where po.explosionid = ${explosionid} and pr.rolid = ${rolid}`;
  const responsable = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
  return res.json(responsable);
})

//----------------------------------------- INSERCIÓN DE DATOS ----------------------------------------------


/**
 * @swagger
 * /api/v2/check/actividad:
 *   post:
 *     summary: En este endpoint se insertan las actividades que estén marcadas como aceptadas o rechazadas.
 *     tags:
 *       - Lista de Verificación
 *     parameters:
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               aceptado:
 *                 type: boolean
 *               numero:
 *                 type: number
 *               frente:
 *                 type: string
 *               explosionid:
 *                 type: number
 *               usuarioid:
 *                 type: number
 *               rolid:
 *                 type: number
 *               secuencia:
 *                 type: number
 *             required:
 *               - frente
 *     responses:
 *       200:
 *         description: Se insertan las actividades o rechazos de las actividades.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                      json:
 *                          type: string
 *                          description: Confirmación de Eliminación de Datos
 *                          example: {mensaje: "Datos Insertados Correctamente"}
 * 
*/

//SE MANDA A LLAMAR CADA QUE ACEPTAN UN RECHAZAN CIERTA ACTIVIDAD
ruta.post('/check/actividad', verificar, async(req,res)=>{
  const datos = req.body.datos;
  let consulta = ""
  datos.forEach(element => {
    if(element.aceptado == true){
      //SE INSERTA EN POAVANCEOBRA EN CASO DE QUE SEAN ACEPTADOS
      consulta += "insert into poAvanceObraTareas (numero, frente, explosionId, fecha, usuarioid, rolId, secuencia) "
      + "values(" + element.numero + ",'" + element.frente.trim() + "', " + element.explosionId + ", GETDATE(), " + element.usuarioId + ", " 
      + element.rolId + ", " + element.secuencia + "); ";
    }else{
      //AQUI SE INSERTA EN CASO DE QUE SE RECHACE LA TAREA (EN LA TABLA DE BITACORARECHAZOS)
      consulta += "insert into poBitacoraRechazosTareas (numeroActividad, fechaRechazo, frente, estacion, manzana, lote, interior, subinterior, usuarioid, rolId) "
      + ` select ${element.numero}, getdate(), frente, estacion, manzana, lote, interior, subinterior, ${element.usuarioId}, ${element.rolId}
      from poAvanceObra where explosionid = ${element.explosionId}; `
      //"values (" + element.numero + ", GETDATE()," + element.explosionId + "," + element.usuarioId + ",  " + element.rolId + "); "
    }
  })
  try{
    const datosInsertados = await procesadorDeConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
    return res.status(200).send({mensaje:"Datos insertados correctamente", datosInsertados: datosInsertados});
  }catch(error){
    if(error) return res.status(400).send({mensaje: "Error en el sistema.", error: error});
  }
})

/**
 * @swagger
 * /api/v2/listaverificacion/responsable:
 *   post:
 *     summary: En este endpoint insertan o eliminan a los responsables de obra.
 *     tags:
 *       - Lista de Verificación
 *     parameters:
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               valor(explosionid):
 *                 type: number
 *               usuarioid:
 *                 type: number
 *               event:
 *                 type: boolean
 *               rolid:
 *                 type: number
 *             required:
 *               - frente
 *     responses:
 *       200:
 *         description: Recorre un arreglo que tiene los datos del responsable, el explosionid, y si está asignado se inserta, si no se elimina, y 
 *          luego lo que hace es actualizar el permiso de los GPS's.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                      json:
 *                          type: string
 *                          description: Confirmación de Eliminación de Datos
 *                          example: {mensaje: "Datos Insertados Correctamente"}
 * 
*/

ruta.post('/responsable', verificar, async(req,res) => {
  const datos = req.body.datos;
  let consulta = "";
  try{
    datos.responsables.forEach(responsable => {
      consulta += responsable['event'] == 0 
      ? `delete poResponsableEstacion where usuarioid = ${responsable['usuarioid']} and rolid = ${responsable['rolid']}
          and explosionid = ${responsable['valor']}; ` 
      : !responsable['preasignado'] 
        ? `insert into poResponsableEstacion (explosionid, usuarioid, rolid) values (${responsable['valor']}, ${responsable['usuarioid']}, ${responsable['rolid']}); `
        : "";
    });

    const resultado = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);

    consulta = "";
    datos.permisos.forEach(permiso => {
      consulta += `update poResponsableEstacion set permisoGps = ${permiso['event'] == 1 ? '1' : '0'} where usuarioid = ${permiso['usuarioid']} and rolid = ${permiso['rolid']}
          and explosionid = ${permiso['valor']}; ` 
    })
    
    const resultadoPermisos = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.status(200).send({mensaje: 'Se modificaron los datos correctamente'});
  }catch(error){
    if(error){
      return res.status(500).send({error: error});
    }
  }
    
})


//----------------------------------------- MODIFICACIÓN DE DATOS ----------------------------------------------


/**
 * @swagger
 * /api/v2/listaverificacion/estatus/ubicacion/terminada:
 *   put:
 *     summary: En este endpoint se actualiza el estatus de la estación, ya sea terminada o avanzada.
 *     tags:
 *       - Lista de Verificación
 *     parameters:
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               frente:
 *                 type: number
 *               estacion:
 *                 type: number
 *               status:
 *                 type: string
 *               usuario:
 *                 type: number
 *             required:
 *               - frente
 *     responses:
 *       200:
 *         description: Checa qué estatus tiene, y en caso de estar terminada siempre pone la estación como no bloqueada con estatus 'T', su no es terminada, entonces
 *          sólo cambia el estatus al rol que le toca dar avance.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                      json:
 *                          type: string
 *                          description: Confirmación de Eliminación de Datos
 *                          example: {mensaje: "Datos Insertados Correctamente"}
 * 
*/

ruta.put('/estatus/ubicacion/terminada', verificar, async(req,res)=>{
    const datos = req.body.datos;
    let where = " Where estacion='" + datos.estacion + "'"
    + "  and frente=" + datos.frente 
    + "  and REPLACE(STR(manzana,3),' ','0')+'-'+REPLACE(STR(lote,3),' ','0')+'-'"
    + "    +  REPLACE(STR(interior,3),' ','0')+'-'+REPLACE(STR(subinterior,2),' ','0')"
    + " = '" + datos.ubicacion + "'";

    let validadorBloqueo = datos.status == 'T' ? "; Update poAvanceObra set bloqueoEstacion = 0 " + where : "";
    let validadorEstatus = datos.status == 'T' ? " , fechaTer= getDate()" : ""

    const consulta = "Update poAvanceObra set status='" + datos.status + "'"
    + validadorEstatus
    + ", usuarioIdAvance = " + datos.usuario
    + where + validadorBloqueo;
    const registrosAfectados = await procesadorDeConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
    if(registrosAfectados > 0) return res.status(200).send({mensaje: "Datos modificados correctamente"});
    else return res.status(500).send({error: "No se pudo modificar el registro"});
})

/**
 * @swagger
 * /api/v2/listaverificacion/desbloqueo/estacion:
 *   put:
 *     summary: En este endpoint sirve para desbloquear alguna estación bloqueada por rechazos.
 *     tags:
 *       - Lista de Verificación
 *     parameters:
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ubicacion:
 *                 type: string
 *               estacion:
 *                 type: number
 *               frente:
 *                 type: number
 *             required:
 *               - frente
 *     responses:
 *       200:
 *         description: La bandera de poAvanceObra (bloqueoEstacion) se cambia a 0 (que sería desbloqueado).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                      json:
 *                          type: string
 *                          description: Confirmación de Eliminación de Datos
 *                          example: {mensaje: "Datos Actualizados Correctamente"}
 * 
*/

ruta.put('/desbloqueo/estacion', verificar, async(req,res) => {
  const datos = req.body.datos;
  const consulta = `update poAvanceObra set bloqueoEstacion = 0 
  where (REPLACE(STR(manzana,3),' ','0')+'-'+REPLACE(STR(lote,3),' ','0') 
  + '-' + REPLACE(STR(interior,3),' ','0')+'-'+REPLACE(STR(subinterior,2),' ','0')) = '${datos.ubicacion}' and estacion = ${datos.estacion}
  and frente = ${datos.frente}`;
  try{
    const response = await procesadorDeConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
    return res.status(200).send({mensaje: "Datos modificados correctamente"});
  }catch(error){
    if(error){
      return res.status(500).send({error: error});
    }
  }
})

/**
 * @swagger
 * /api/v2/listaverificacion/bloqueo/ubicacion:
 *   put:
 *     summary: Este endpoint sirve para bloquear alguna estación por exceso de rechazos.
 *     tags:
 *       - Lista de Verificación
 *     parameters:
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               explosionid:
 *                 type: number
 *             required:
 *               - frente
 *     responses:
 *       200:
 *         description: La bandera de poAvanceObra (bloqueoEstacion) se cambia a 1 (que sería bloqueado).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                      json:
 *                          type: string
 *                          description: Confirmación de Actualización de Datos
 *                          example: {mensaje: "Datos Actualizados Correctamente"}
 * 
*/

ruta.put('/bloqueo/ubicacion', verificar, async(req,res)=> {
  const datos = req.body.datos;
  const consulta = "update poavanceobra set bloqueoEstacion = 1 where explosionid = " + datos.explosionid;
  const resultado = await procesadorDeConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
  return res.json(resultado);
})


////----------------------------------------- BAJA DE DATOS ----------------------------------------------

module.exports = ruta;