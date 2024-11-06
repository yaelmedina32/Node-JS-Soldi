const express = require('express');
const verificar = require('../../controladores/verificarToken.controller.js');
const procesadorConsultas = require('../../controladores/procesadorConsultas.controller.js');

const ruta = express.Router();


//////////////////////////////////////////////// CONSULTA DE DATOS ////////////////////////////////////////////////

/**
 * @swagger
 * /api/v2/proveedores/{frente}:
 *   get:
 *     summary: Proveedores asignados al progobra de ese frente.
 *     tags:
 *       - Contratos de Obra
 *     parameters:
 *       - in: path
 *         name: frente
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               frente:
 *                 type: string
 *     responses:
 *       200:
 *         description: Lista de proveedores asignados o relacionados a poAsignaObra
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
 *                         example: [{proveedorid: 1, razonsocial: 'AMADOR AVILA'}]
 * 
*/

ruta.get('/proveedores/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = `select distinct pa.proveedorid, Upper(p.razonsocial) + ' (' + Upper(nombre)+')' as razonsocial  
    from poavanceobra po
    inner join poAsignaObra pa on pa.explosionId = po.explosionId
    inner join proveedores p on p.proveedorId = pa.proveedorId and p.tipo like '%contratista%'
    where po.frente = ${frente} 
    Order by  Upper(razonsocial)+ ' (' + Upper(nombre)+')'`;
    const proveedores = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(proveedores);
})


/**
 * @swagger
 * /api/v2/viviendas/sincontrato/{frente}/{proveedorid}/{especid}:
 *   get:
 *     summary: explosionId's (viviendas y estaciones) sin Contratos asignados.
 *     tags:
 *       - Contratos de Obra
 *     parameters:
 *       - in: path
 *         name: frente
 *         type: string
 *         required: true
 *       - in: path
 *         name: proveedorid
 *         type: number
 *         required: true
 *       - in: path
 *         name: especid
 *         type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Lista de Viviendas sin contratos, los mismos que se muestran para asignar en contratos de obra,
 *          junto con el total del valor de materiales y obra de esa casa en específico
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
 *                         example: [{especialidad: 'CIMENTACION', lineaProduccion: 1
 *                          , manzana: 1, lote: 1, interior: 0 , subinterior: 0, ubicacion: '001-001-000-00',
 *                          especid: 1, obra: 150000, materiales: 200000, feciaFin: '01/12/2024'}]
 * 
*/

ruta.get('/viviendas/sincontrato/:frente/:proveedorid/:especid', verificar, async(req,res)=> {
    const frente = req.params.frente;
    const proveedorid = req.params.proveedorid;
    const especid = req.params.especid;
    const consulta = `select  e.descripcion as especialidad,
    pm.ccedif as lineaProduccion, po.manzana, po.lote, po.interior, po.subinterior,
        REPLACE(STR(po.manzana,3),' ','0')+'-'+REPLACE(STR(po.LOTE,3),' ','0')+'-'+REPLACE(STR(po.interior,3),' ','0')+'-'
     +REPLACE(STR(po.subinterior,2),' ','0') as ubicacion
        , pc.espera as especid,
        ------------------------------------------ CALCULO DE TOTAL DE MANO DE OBRA ---------------------------------------
        (       select SUM(poa.pagoEtiq) from poAvanceObra poa
                inner join poLotesAsignados pl on pl.frente = poa.frente and pl.manzana = poa.manzana and pl.lote = poa.lote and pl.interior = poa.interior
                and pl.subinterior = poa.subinterior
                inner join poCatalogoEstacionesFrente pcf on pcf.frente = poa.frente and pcf.estacion = poa.estacion
                and pcf.modelo = pl.modelo
                inner join poAsignaObra pa on pa.explosionid = poa.explosionId
                where poa.frente = ${frente} and pa.proveedorId = ${proveedorid}  and po.manzana = poa.manzana
                and poa.lote = po.lote and poa.interior = po.interior and poa.subinterior = po.subinterior and pc.espera = pcf.espera) obra,

        ------------------------------------------ CALCULO DE TOTAL DE MATERIALES ---------------------------------------
        sum(isnull(pe.cantidad * pe.costo, 0)) materiales,
        ------------------------------------------ CALCULO DE TOTAL DE REGISTROS QUE YA ESTÁN ASIGNADOS A UN CONTRATO ---------------------------------------
                case when (select count(*) from poAvanceObraContratos paoc
					inner join vwAvanceObraNormalizada va on va.explosionid = paoc.explosionId
                    where va.frente = po.frente and va.manzana = po.manzana and va.lote = po.lote and va.interior = po.interior and va.subinterior = po.subinterior
                    and va.especid = pc.espera and va.proveedorid = ${proveedorid}
                ) > 0 then -1 else 0 end seleccionado
    , max(po.fechaIni) fechainicio, max(po.fechaTer) fechafin
    from poAvanceObra po
        inner join poLotesAsignados pl on pl.frente = po.frente and pl.manzana = po.manzana and pl.lote = po.lote and pl.interior = po.interior
    and pl.subinterior = po.subinterior
    inner join poCatalogoEstacionesFrente pc on pc.frente = po.frente and pc.estacion = po.estacion
    and pc.modelo = pl.modelo
    inner join poModulosObra pm on pm.modulo = pl.modulo
    inner join espec e on e.especid = pc.espera
    left join poAsignaObra pa on pa.explosionid = po.explosionid
    left join poInsumosxEstacion pe on pe.frente = po.frente and pe.estacion = po.estacion and pe.modelo = pl.modelo
    where po.frente = ${frente} and pa.proveedorId = ${proveedorid}
    group by po.manzana, po.lote, po.interior, po.subinterior, pc.espera, pm.ccedif, e.descripcion , po.frente
    order by especid, lineaProduccion, po.manzana, po.lote, po.interior, po.subinterior`;
    const viviendasNoAsignadas = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(viviendasNoAsignadas);
})


/**
 * @swagger
 * /api/v2/especialidades/contratista/{frente}/{proveedorid}:
 *   get:
 *     summary: Especialidades pendientes de avanzar en ese frente y con ese proveedor.
 *     tags:
 *       - Contratos de Obra
 *     parameters:
 *       - in: path
 *         name: frente
 *         type: number
 *         required: true
 *       - in: path
 *         name: proveedorid
 *         type: number
 *         required: true
 *     responses:
 *       200:
 *         description: Arreglo con las especialidades asignadas a ese frente y a ese proveedor, 
 *          sólo contando las casas que estén pendientes de avanzar.
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
 *                         example: [{especid: 1, especialidad: 'CIMENTACION', contratos: 0}]
 * 
*/

ruta.get('/especialidades/contratista/:frente/:proveedorid', verificar, async(req,res)=> {
    const frente = req.params.frente;
    const proveedorid = req.params.proveedorid;
    const consulta = `	    select distinct pc.espera especid, e.descripcion , count(idContrato) contratos
    from poAvanceObra po
	left join poAsignaObra pa on pa.explosionid = po.explosionId
    inner join poLotesAsignados pl on pl.frente = po.frente and pl.manzana = po.manzana and pl.lote = po.lote
    and pl.interior = po.interior and pl.subinterior = po.subinterior
    inner join poCatalogoEstacionesFrente pc on pc.frente = po.frente and pc.estacion = po.estacion and pc.modelo = pl.modelo
    inner join espec e on e.especid = pc.espera
    left join poAvanceObraContratos pac on pac.explosionId = po.explosionId
    where po.frente = ${frente} and pa.proveedorId = ${proveedorid}  and po.status = 'P'
    group by pc.espera, e.descripcion`
    const catalogoEspecialidades = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(catalogoEspecialidades);
})


/**
 * @swagger
 * /api/v2/contratos/proveedor/{proveedorid}/{frente}/{id}:
 *   get:
 *     summary: Contratos de ese proveedor, en caso de seleccionar un contrato, van a salir los datos de ese contrato,
 *      junto con su orden de compra.
 *     tags:
 *       - Contratos de Obra
 *     parameters:
 *       - in: path
 *         name: id
 *         type: number
 *         required: true
 *       - in: path
 *         name: frente
 *         type: number
 *         required: true
 *       - in: path
 *         name: proveedorid
 *         type: number
 *         required: true
 *     responses:
 *       200:
 *         description: Arreglo con los contratos de ese contratista seleccionado.
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
 *                         example: [{id: 1, foliodg: 'CTR-268/20', foliooc: 1423}]
 * 
*/

ruta.get('/contratos/proveedor/:proveedorid/:frente/:id', verificar, async(req,res)=> {
    const frente = req.params.frente;
    const proveedorid = req.params.proveedorid;
    const contratoId = req.params.id;  
    const consultaAuxiliar = contratoId == -1 || contratoId == 0 ? '' : ' and c.id = ' + contratoId
    //SI EL CONTRATOID TIENE -1 QUIERE DECIR QUE NADA MÁS SE SELECCIONÓ EL PROVEEDOR PERO NO EL CONTRATO
    //O BIEN, PUEDE QUE NO TENGA CONTRATO
    const consulta = `Select id, foliodg ,isnull(o.folio,0) as foliooc 
    From poContratosObra c
    left join ordenescompra o on o.ordencompraid=c.ordencompraid
    Where c.frente=${frente}   and c.proveedorid=${proveedorid} ${consultaAuxiliar}
    group by id, foliodg, o.folio`
    const contratos = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(contratos);
})


/**
 * @swagger
 * /api/v2/detalles/contratos/{proveedorid}/{frente}/{contratoid}:
 *   get:
 *     summary: Datos adicionales del contrato selecccionado.
 *     tags:
 *       - Contratos de Obra
 *     parameters:
 *       - in: path
 *         name: proveedorid
 *         type: number
 *         required: true
 *       - in: path
 *         name: frente
 *         type: number
 *         required: true
 *       - in: path
 *         name: contratoid
 *         type: number
 *         required: true
 *     responses:
 *       200:
 *         description: Regresa los datos adicionales del contrato qeu se seleccionó.
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
 *                         example: [{contratoid(id): 1, obra: 14000, materiales:, 20000, proveedorid: 3, foliooc: 324}]
 * 
*/


ruta.get('/detalles/contratos/:proveedorid/:frente/:contratoid', verificar, async(req,res) => {
    const frente = req.params.frente;
    const proveedorid = req.params.proveedorid;
    const contratoId = req.params.contratoid;
    //SI EL CONTRATOID TIENE -1 QUIERE DECIR QUE NADA MÁS SE SELECCIONÓ EL PROVEEDOR PERO NO EL CONTRATO
    //O BIEN, PUEDE QUE NO TENGA CONTRATO
    const consulta = `Select c.* ,isnull(o.folio,0) as foliooc 
    From poContratosObra c
    left join ordenescompra o on o.ordencompraid=c.ordencompraid
    Where c.frente=${frente}   and c.proveedorid=${proveedorid} and c.id = ${contratoId}`;
    const contratos = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(contratos);
})

/**
 * @swagger
 * /api/v2/precios/{frente}:
 *   get:
 *     summary: Costo de los Insumos.
 *     tags:
 *       - Contratos de Obra
 *     parameters:
 *       - in: path
 *         name: frente
 *         type: number
 *         required: true
 *     responses:
 *       200:
 *         description: Regresa el costo de los insumos totales del frente.
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
 *                         example: [{proveedorid: 3, especid: 2, producto: '1-15-0125', insumoid: 2226, cantidad: 25, importe: 40000}]
 * 
*/

ruta.get('/precios/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta =  `Select proveedorid, especid, i.producto, z.insumoid, sum(cantidad) as cantidad,sum(costo*cantidad) as importe
    from  vwAvanceObraModuloModeloEstacion v 
    inner join poinsumosxestacion i on i.frente=v.frente
                              and i.modelo=v.modelo
                                                and i.estacion=v.estacion
                                             inner join insumos z on z.producto=i.producto
   where v.frente = ${frente}
   group by proveedorid, especid, i.producto, z.insumoid
   order by proveedorid, especid, i.producto, z.insumoid`;
   const precios = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
   return res.json(precios);
})

/**
 * @swagger
 * /api/v2/contratoid/{foliodg}:
 *   get:
 *     summary: ContratoId del folio indicado.
 *     tags:
 *       - Contratos de Obra
 *     parameters:
 *       - in: path
 *         name: foliodg
 *         type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Este Endpoint se utiliza para comprobar si el folio que se indica está insertado en la tabla, para validar su edición.
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
 *                         example: [{contratoid: 1}]
 * 
*/

ruta.get('/contratoid/:foliodg', verificar, async(req,res)=>{
    const foliodg = req.params.foliodg;
    foliodg = foliodg.replace('_', '/');
    const consulta = "Select contratoid from contratos where foliodg='" + foliodg + "'";
    const contratoid = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(contratoid)
})

// ruta.get('/segmentoid/:frente', verificar, async(req,res)=>{
//     const frente = req.params.frente;
//     const consulta = "Select segmentoId from segmentoscontables Where cast(frente as int)=" + frente;
//     const segmentoid = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
//     return res.json(segmentoid);
// })


/**
 * @swagger
 * /api/v2/solicitantes:
 *   get:
 *     summary: Catálogo de Solicitantes.
 *     tags:
 *       - Contratos de Obra
 *     responses:
 *       200:
 *         description: Se obtienen los solicitantes disponibles para que cuando se sincronicen los contratos, se inserte el dato correspondiente.
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
 *                         example: [{solicitanteid: 1, nombre: 'Mario Flores'}]
 * 
*/

ruta.get('/solicitantes', verificar, async(req,res)=>{
    const consulta = `Select solicitanteid, nombre
    from solicitantes
    Order by nombre`;
    const solicitantes = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(solicitantes);
})

/**
 * @swagger
 * /api/v2/partidas/{solicitanteid}:
 *   get:
 *     summary: Catálogo de partidas presupuestales del solicitante seleccionado.
 *     tags:
 *       - Contratos de Obra
 *     parameters:
 *       - in: path
 *         name: solicitanteid
 *         type: number
 *         required: true
 *     responses:
 *       200:
 *         description: Se obtienen las partidas presupuestales que están disponibles para un solicitante.
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
 *                         example: [{partidaid: 1, nombre: 'PGA6.0.0.2.28 Actualización de equipo de computo para recepción (Mem Ram)'}]
 * 
*/

ruta.get('/partidas/:solicitanteid', verificar, async(req,res)=>{
    const solicitanteid = req.params.solicitanteid;
    const consulta = `Select p.partidaid, p.nombre+' '+p.codigo as nombre 
    from partidaspresupuestales p
    inner join usuariospartidas u on p.partidaid=u.partidaid
    inner join solicitantes s     on s.usuarioid=u.usuarioid
    and s.solicitanteid = ${solicitanteid}
    Order by p.nombre+' '+p.codigo
    `
    const partidas = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(partidas);
})

/**
 * @swagger
 * /api/v2/estatus/{frente}:
 *   get:
 *     summary: Bandera para comprobar si es que el frente ya está suministrado, ya tiene contratistas asignados, etc.
 *     tags:
 *       - Contratos de Obra
 *     parameters:
 *       - in: path
 *         name: frente
 *         type: number
 *         required: true
 *     responses:
 *       200:
 *         description: Con este endpoint podemos validar si es que ya tiene avance de obra, si ya tiene contratistas; con el fin de validar
 *          el proceso de contratos de obra.
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
 *                         example: [{suministrado: 1, fechasuministrado: '01/01/2024', asignado: 1, fechaasignado: '01/01/2024', programado: 0, fechaprogramado: null}]
 * 
*/

ruta.get('/estatus/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = `Select * from poEstatusAsignacion where frente = ${frente} and programado=1`
    const estatus = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(estatus);
})

/**
 * @swagger
 * /api/v2/etiquetados/{frente}:
 *   get:
 *     summary: Regresa la cantidad de pagos etiquetados que le toca a cada proveedor del frente indicado.
 *     tags:
 *       - Contratos de Obra
 *     parameters:
 *       - in: path
 *         name: frente
 *         type: number
 *         required: true
 *     responses:
 *       200:
 *         description: Aquí podemos saber cuánto le hay que pagar a los proveedores de ese frente.
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
 *                         example: [{proveedorid: 1, razonsocial: 'AMADOR AVILA', estaciones: 23, financieros: 40000, fechainicio: '01/01/2024', fechafin: '20/10/2024'}]
 * 
*/

ruta.get('/etiquetados/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = `
    Select v.proveedorid,isnull(p.razonsocial,'N/A') as razonsocial
    ,count(*) as estaciones,sum(pagoEtiq) as financieros,0 as contratista
    ,Min(v.fechaini) as fechainicio, Max(v.fechaini) as fechafin
    from vwAvanceObraModulo v
    inner join proveedores p         on v.proveedorid=p.proveedorid
    where v.frente = ${frente}
    group by v.proveedorid, isnull(p.razonsocial,'N/A')
    order by v.proveedorid, isnull(p.razonsocial,'N/A')`
    const etiquetados = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(etiquetados);
})

/**
 * @swagger
 * /api/v2/hayetiquetados/{frente}/{proveedorid}:
 *   get:
 *     summary: Con este endpoint se comprueba si el proveedor seleccionado tiene estaciones asignadas dentro del frente.
 *     tags:
 *       - Contratos de Obra
 *     parameters:
 *       - in: path
 *         name: frente
 *         type: number
 *         required: true
 *       - in: path
 *         name: proveedorid
 *         type: number
 *         required: true
 *     responses:
 *       200:
 *         description: Se regresa un arreglo con todas las explosionid's disponibles de ese proveedor en ese frente.
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
 *                         example: [{explosionid: 1}, {explosionid: 2}]
 * 
*/

ruta.get('/hayetiquetados/:frente/:proveedorid', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const proveedorid = req.params.proveedorid;
    const consulta = `select po.explosionid from poavanceobra po 
    inner join poAsignaObra pa on pa.explosionid = po.explosionid
    where po.frente = ${frente} and pa.proveedorid = ${proveedorid}`
    const datosAvanceObra = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(datosAvanceObra);
})

/**
 * @swagger
 * /api/v2/materiales/{frente}/{proveedorid}:
 *   get:
 *     summary: Cotización de materiales de ese frente y proveedor, junto con un añadido del 1.05%.
 *     tags:
 *       - Contratos de Obra
 *     parameters:
 *       - in: path
 *         name: frente
 *         type: number
 *         required: true
 *       - in: path
 *         name: proveedorid
 *         type: number
 *         required: true
 *     responses:
 *       200:
 *         description: Regresa un arreglo con el proveedor, la especialidad y el importe que toca de esos materiales.
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
 *                         example: [{proveedorid: 1, especid: 1, importe: 430000}]
 * 
*/

ruta.get('/materiales/:frente/:proveedorid', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const proveedorid = req.params.proveedorid;
    const consulta = `Select v.proveedorid,v.especid
    ,Sum(cantidad*preciocotizado*1.0105) as importe
     from vwInsumosxEspecialidad v
       inner join spvnet200.dbo.afExplosionInsumos e on e.frenteid=v.frenteid and e.insumoid=v.insumoid
     where v.frente=${frente} 
    and v.proveedorid=${proveedorid}
     Group by  v.proveedorid,v.especid
     order by  v.proveedorid,v.especid`
     const materiales = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
     return res.json(materiales)
})

/**
 * @swagger
 * /api/v2/total/materiales/{frente}:
 *   get:
 *     summary: Devuelve el total de materiales agrupado por proveedor y sin añadidos.
 *     tags:
 *       - Contratos de Obra
 *     parameters:
 *       - in: path
 *         name: frente
 *         type: number
 *         required: true
 *     responses:
 *       200:
 *         description: Se regresa un arreglo con el total de materiales de todos los proveedores.
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
 *                         example: [{proveedorid: 1, importe: 430000}, {proveedorid: 2, importe: 230000}]
 * 
*/

ruta.get('/total/materiales/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const conslta = `select proveedorid,sum(costo *cantidad) as importe
    from vwAvanceObraModuloModeloEstacion v
     inner join poinsumosxestacion i on i.frente=v.frente and i.modelo=v.modelo and i.estacion=v.estacion
    where v.frente=${frente}
    group by v.proveedorid `;
    const costo = await procesadorConsultas.spvnet.consultaDatosSpvnet(conslta);
    return res.json(costo);
})

/**
 * @swagger
 * /api/v2/saldopendiente/{frente}/{proveedorid}:
 *   get:
 *     summary: Devuelve el total pendiente de las estaciones que no se han pagado.
 *     tags:
 *       - Contratos de Obra
 *     parameters:
 *       - in: path
 *         name: frente
 *         type: number
 *         required: true
 *       - in: path
 *         name: proveedorid
 *         type: number
 *         required: true
 *     responses:
 *       200:
 *         description: Se regresa el importe de obra de la suma de las estaciones cuyo stamat es pendiente ('p').
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
 *                         example: [{proveedorid: 1, importeobra: 23000}]
 * 
*/

ruta.get('/saldopendiente/:frente/:proveedorid', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const proveedorid = req.params.proveedorid;
    const consulta = ` Select 
    isnull(Sum(d.pagoEtiq),0) as importeobra
    FROM poAvanceObra d
	left join poAsignaObra pa on pa.explosionid = d.explosionId
    Inner JOIN poLotesAsignados o on CAST(o.frente AS INT)=CAST(d.frente AS INT)
      and CAST(o.manzana AS INT)=CAST(d.manzana AS INT)
      and CAST(o.lote AS INT)=CAST(d.lote AS INT)
      and CAST(o.interior AS INT)=CAST(d.interior AS INT)
      and CAST(o.subinterior AS INT)=CAST(d.subinterior AS INT)
    Inner Join poContratosObra co on co.frente= ${frente}
     and co.proveedorid= ${proveedorid}
     Inner jOIN proveedores pv on pv.proveedorid=co.proveedorid
    Inner JOIN poCatalogoEstacionesFrente s On 
              o.Modelo = s.Modelo And d.Estacion = s.Estacion 
              and s.frente= ${frente} 
     and d.stamat='P'
    Where d.frente= ${frente}  and pa.proveedorid =  ${proveedorid}`
    const saldopendiente = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(saldopendiente);
})

/**
 * @swagger
 * /api/v2/etiquetados/estacion/{frente}/{proveedorid}:
 *   get:
 *     summary: Devuelve el total del costo de las estaciones por especialidad, junto con la cantidad de estaciones.
 *     tags:
 *       - Contratos de Obra
 *     parameters:
 *       - in: path
 *         name: frente
 *         type: number
 *         required: true
 *       - in: path
 *         name: proveedorid
 *         type: number
 *         required: true
 *     responses:
 *       200:
 *         description: Regresa una arreglo con todas las especialidades contando cada una de las estaciones relacionadas junto con el valor total.
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
 *                         example: [{proveedorid: 1, importeobra: 23000}]
 * 
*/

ruta.get('/etiquetados/estacion/:frente/:proveedorid', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const proveedorid = req.params.proveedorid;
    const consulta = `
    Select v.proveedorid,isnull(p.razonsocial,'N/A') as razonsocial 
    ,v.especid,e.descripcion as especialidad
    ,count(*) as estaciones
    ,sum(isnull(v.pagoEtiq, 0)) as financieros
    ,Min(v.fechaini) as fechainicio
    ,Max(v.fechaini) as fechafin
    ,0 as materiales
    ,0 as seleccionado
    from vwAvanceObraModuloModeloEstacion v 
    inner join espec e on v.especid=e.especid
    inner join proveedores p on v.proveedorid=p.proveedorid
    and p.proveedorid= ${proveedorid}
    where v.frente=  ${frente}
    group by v.proveedorid, isnull(p.razonsocial,'N/A'),v.especid,e.descripcion 
    having sum(v.pagoEtiq)>0
    order by v.proveedorid, isnull(p.razonsocial,'N/A'),v.especid,e.descripcion`;
    const etiquetadosEstacion = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(etiquetadosEstacion);
});

/**
 * @swagger
 * /api/v2/cancelado/{foliooc}:
 *   get:
 *     summary: Checa si el folio de la orden de compra está cancelado.
 *     tags:
 *       - Contratos de Obra
 *     parameters:
 *       - in: path
 *         name: foliooc
 *         type: number
 *         required: true
 *     responses:
 *       200:
 *         description: Regresa un arreglo de un elemento, checando si la orden de compra está cancelada.
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
 *                         example: [{cancelada: 0}]
 * 
*/

ruta.get('/cancelado/:foliooc', verificar, async(req,res)=>{
    const foliooc = req.params.foliooc;
    const consulta = "Select isnull(cancelada,0) as cancelada from ordenescompra where folio=" + foliooc
    const ocCancelada = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(ocCancelada);
})

/**
 * @swagger
 * /api/v2/ubicaciones/contrato/{frente}/{proveedorid}/{especid}:
 *   get:
 *     summary: Este endpoint se usa para saber qué ubicación ya tienen contrato.
 *     tags:
 *       - Contratos de Obra
 *     parameters:
 *       - in: path
 *         name: frente
 *         type: number
 *         required: true
 *       - in: path
 *         name: proveedorid
 *         type: number
 *         required: true
 *       - in: path
 *         name: especid
 *         type: number
 *         required: true
 *     responses:
 *       200:
 *         description: Regresa un arreglo con las ubicaciones que estén relacionadas a un contrato.
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
 *                         example: [{manzana: 1, lote: 1, interior: 0, subinterior: 0}, 
 *                          {manzana: 1, lote: 2, interior: 0, subinterior: 0}]
 * 
*/

ruta.get('/ubicaciones/contrato/:frente/:proveedorid/:especid', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const proveedorid = req.params.proveedorid;
    const especid = req.params.especid;
    const consulta = `select manzana, lote, interior, subinterior from vwAvanceObraNormalizada po
    inner join poAsignaObra pa on pa.explosionid = po.explosionId
    inner join poAvanceObraContratos poc on poc.explosionId = po.explosionId 
    where pa.proveedorid = ${proveedorid} and po.frente = ${frente} and po.especid = ${especid}
    group by manzana, lote, interior, subinterior`;
    const ubicacionesConContrato = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(ubicacionesConContrato);
})

//////////////////////////////////////////////// INSERCIÓN DE DATOS ////////////////////////////////////////////////

/**
 * @swagger
 * /api/v2/sincronizacion/contratos:
 *   post:
 *     summary: Este endpoint se usa para insertar los datos de poContratosObra con la tabla de contratos y así, sincronizarlos.
 *     tags:
 *       - Contratos de Obra
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
 *               anio:
 *                 type: string
 *               fechaactual:
 *                 type: string
 *               fecha1:
 *                 type: string
 *               fecha2:
 *                 type: string
 *               fecha3:
 *                 type: string
 *               empresaid:
 *                 type: number
 *               uen:
 *                 type: string
 *               frenteid:
 *                 type: number
 *               tipoid:
 *                 type: number
 *               conceptoid:
 *                 type: number
 *               proveedorid:
 *                 type: string
 *               foliodg:
 *                 type: string
 *               concepto:
 *                 type: string
 *               totaloc:
 *                 type: number
 *               anticipo:
 *                 type: number
 *               fondo:
 *                 type: number
 *               ordencompraid:
 *                 type: number
 * 
 *             required:
 *               - valor
 *     responses:
 *       200:
 *         description: Inserta los datos anteriores dentro de la tabla de "contratos".
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
 *                         description: Respuesta de confirmación.
 *                         example: {mensaje: "Datos insertados correctamente"}
 * 
*/


ruta.post('/sincronizacion/contratos', verificar, async(req,res)=>{
    const datos = req.body.datos;
    const consulta = `
    Delete from Contratos Where foliodg='${datos.foliodg}';

    Insert Into contratos
    (escontrato, fecha,fechainicio,fechafin,fechafincontrato,anio,empresaid,uen,frente,frenteid,tipoid,conceptoid,proveedorid,foliodg,concepto, partidaid, solicitanteid
    ,monto,anticipo,valoranticipo,fondogarantia,valorfondogarantia,ordencompraid,fechafirma,estatus,estatusfondo, fraccionamientoid,validado,etapafrente ) Values(
    1, '${datos.fechaactual}', '${datos.f1}', '${datos.f2}', '${datos.f2}', ${datos.anio}, ${datos.empresaid}, '${datos.uen}', '${datos.frente}', ${datos.frenteid},
    ${datos.tipoid}, ${datos.conceptoid}, ${datos.proveedorid}, '${datos.foliodg}', '${datos.concepto}', ${datos.partidaid}, ${datos.solicitanteid},
    ${datos.totaloc}, ${datos.anticipo}, ${datos.valoranticipo}, ${datos.fondo}, ${datos.fondo * datos.totaloc / 100}, ${datos.idordencompra}, '${datos.firma}',
    ${datos.estatusInicial}, '0000000', ${datos.fraccionamientoid}, 1, '${datos.frente}')
    `;
    try{
        const datosInsertados = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
        return res.status(200).send({mensaje: "Datos insertados correctamente", result: datosInsertados});
    }catch(error){
        if(error){
            return res.status(400).send({mensaje: "Error en el servidor", error: error})
        }
    }
    
})

/**
 * @swagger
 * /api/v2/contrato:
 *   post:
 *     summary: Aquí se insertan los datos dentro de "poAvanceObraContratos" (relacional de contrato y vivienda) y  "poContratosObra".
 *     tags:
 *       - Contratos de Obra
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
 *               especialidadesseleccionadas:
 *                 type: string
 *               ubicacionesseleccionadas:
 *                 type: string
 *               proveedorid:
 *                 type: number
 * 
 * 
 *             required:
 *               - valor
 *     responses:
 *       200:
 *         description: Inserta los datos anteriores dentro de la tabla de "poContratosObra" y "poAvanceObraContratos",
 *          esto en base a las especialidades, ubicaciones y proveedor seleccionados.
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
 *                         description: Respuesta de confirmación.
 *                         example: {mensaje: "Datos insertados correctamente"}
 * 
*/

ruta.post('/contrato', verificar, async(req,res)=> {
    const datos = req.body.datos;
    let ubicacionesSeleccionadas = "";
    let especialidades = "";
    datos.ubicaciones.forEach(element => {
        ubicacionesSeleccionadas += "'" + element.ubicacion + "',";
        especialidades += element.especid + ',';
    });
    ubicacionesSeleccionadas = ubicacionesSeleccionadas.substring(0, ubicacionesSeleccionadas.length - 1);
    especialidades = especialidades.substring(0, especialidades.length - 1);
    
    //INSERT EL MAX IDCONTRATO PORQUE EL ENDPOINT SE MANDA A LLAMAR JUSTO DESPUES DE QUE SE CREA EL CONTRATO
    try{
        const consulta = `insert into poAvanceObraContratos (explosionId, idContrato, fechaContrato) 
        select po.explosionId, (select max(id) from poContratosObra), GETDATE()
        from poAvanceObra po 
        inner join poAsignaObra pa on pa.explosionId = po.explosionId
        inner join proveedores p on p.proveedorid = pa.proveedorid and p.tipo like '%contratista%'
        inner join poLotesAsignados pl on pl.frente = po.frente and po.manzana = po.manzana and po.lote = pl.lote
        and pl.interior = po.interior and po.subinterior = pl.subinterior
        inner join poCatalogoEstacionesFrente pc on pc.frente = po.frente and pc.estacion = po.estacion and pc.modelo = pl.modelo
        where po.frente = ${datos.frente} and pc.espera in (${especialidades}) and pa.proveedorId = ${datos.proveedorid}  and
        REPLACE(STR(po.manzana,3),' ','0')+'-'+REPLACE(STR(po.LOTE,3),' ','0')+'-'+REPLACE(STR(po.interior,3),' ','0')+'-'
        +REPLACE(STR(po.subinterior,2),' ','0') in (${ubicacionesSeleccionadas}) and po.status = 'P'
        group by po.explosionId`;
        console.log(consulta);
        const resultados =  await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
        if(resultados > 0) return res.status(200).send({mensaje: "Datos insertados correctamente", noInserciones: resultados});
        else return res.json({code: 202, resultado: 0});
    }catch(error){
        if(error) return res.status(400).send({mensaje: "Error en el sistema.", error: error});
    }
})


//////////////////////////////////////////////// ELIMINIACIÓN DE DATOS ////////////////////////////////////////////////

/**
 * @swagger
 * /api/v2/contrato/{foliodg}:
 *   delete:
 *     summary: Este endpoint se usa para eliminar un contrato dentro de la tabla de "poContratosObra" y "poAvanceObraContratos"
 *     tags:
 *       - Contratos de Obra
 *     parameters:
 *       - in: path
 *         name: foliodg
 *         type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Primero elimina los datos de "poAvanceObraContratos" para quitar las relaciones, y finalmente los elimina
 *          de "poContratosObra", como tal elimina el contrato.
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
 *                          example: {mensaje: "Datos Eliminados Correctamente"}
 * 
*/

ruta.delete('/contrato/:foliodg', verificar, async(req,res)=> {
    const foliodg = req.params.foliodg.replace('_', '/');
    try{
        const consulta =  "Delete from poAvanceObraContratos Where idContrato=(select id from poContratosObra Where foliodg='" + foliodg + "');"
        + " Delete from poContratosObra Where foliodg='" + foliodg + "';"
        + " Delete from Contratos Where foliodg='" + foliodg + "'"
        const resultado = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
        if(resultado > 0) return res.status(200).send({mensaje: "Datos eliminados correctamente", result: resultado});
        else return res.json({code: 202, mensaje: "Ningún contrato eliminado"});
    }catch(error){
        if(error) return res.status(400).send({mensaje: "Error en el servidor.", error: error});
    }
})


/**
 * @swagger
 * /api/v2/desasignacion/contrato:
 *   post:
 *     summary: Este endpoint lo uso para eliminar las asignaciones, sólo necesito pasar un arreglo.
 *     tags:
 *       - Contratos de Obra
 *     parameters:
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ubicaciones:
 *                 type: string
 *               moduloCompleto:
 *                 type: boolean
 *               frente:
 *                 type: string
 *             required:
 *               - frente
 *     responses:
 *       200:
 *         description: Elimina las asignaciones del contratista anterior
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
 *                          example: {mensaje: "Datos Eliminados Correctamente"}
 * 
*/

//ES POST, PERO LO VOY A USAR COMO DELETE YA QUE NECESITO PASAR UN ARREGLO
ruta.post('/desasignacion/contrato', verificar, async(req,res)=>{
    const datos = req.body.datos;
    const consultaModulos = datos.moduloCompleto = true ? `inner join poModulosObra pm on pm.modulo = pl.modulo and pm.ccedif = ${datos.modulo}` : "";
    let consultaUbicaciones = "";
    let manzana = "";
    let lote = "";
    let interior = "";
    let subinterior = "";
    //SI TIENE ['UBICACION_ESTACION] QUIERE DECIR QUE NO SE ASIGNÓ TODO EL MÓDULO, SI SE ASIGNA TODO EL MÓDULO, IGUAL SE VALIDA POR EL "TRUE" EN ESE ATRIBUTO
    if(datos['ubicacion_estacion']){
        datos['ubicacion_estacion'].forEach(element => {
            const ubicacion = element.ubicacion.split('_')[0];
            manzana += ubicacion.split('-')[0] + ",";
            lote += ubicacion.split('-')[1] + ",";
            interior += ubicacion.split('-')[2] + ",";
            subinterior += ubicacion.split('-')[3] + ",";
        })
        manzana = manzana.substring(0, manzana.length - 1);
        lote = lote.substring(0, lote.length - 1);
        interior = interior.substring(0, interior.length - 1);
        subinterior = subinterior.substring(0, subinterior.length - 1);

        consultaUbicaciones = ` and po.manzana in (${manzana}) and po.lote in (${lote}) 
        and po.interior in (${interior}) and po.subinterior in (${subinterior})`;
    }
    let consulta = `delete from poAvanceObraContratos where explosionId in
    (
        select explosionid from poAvanceObra po 
        inner join poLotesAsignados pl on pl.frente = po.frente and pl.manzana = po.manzana and pl.lote = po.lote
        and pl.interior = po.interior and pl.subinterior = po.subinterior
        inner join poCatalogoEstacionesFrente pc on pc.frente = po.frente and pc.estacion = po.estacion
        ${consultaModulos}
        where po.frente = ${datos.frente}  ${consultaUbicaciones}
    )`
    try{
        const resultadoDelete = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
        return res.status(200).send({mensaje: "Se modificaron los datos correctamente", resultado: resultadoDelete});
    }catch(error){
        console.log(error)
        if(error){
            return res.status(400).send({mensaje: "Error en el servidor", error: error});
        }
    }
})

//////////////////////////////////////////////// MODIFICACIÓN DE DATOS ////////////////////////////////////////////////


/**
 * @swagger
 * /api/v2/amortizacion/pagosetiquetados:
 *   put:
 *     summary: En este endpoint se actualizan los valores amortizados del anticipo y el fondo de garantía del contrato que se hizo.
 *     tags:
 *       - Contratos de Obra
 *     parameters:
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ubicaciones:
 *                 type: string
 *               proveedorid:
 *                 type: number
 *               frente:
 *                 type: string
 *               anticipo:
 *                 type: number
 *               fondogarantia:
 *                 type: number
 *               especialidades:
 *                 type: string
 *             required:
 *               - frente
 *     responses:
 *       200:
 *         description: Actualiza los valores amortizados de cada pago etiquetado en poAvanceObra
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
 *                          example: {mensaje: "Datos Modificados Correctamente"}
 * 
*/


ruta.put('/amortizacion/pagosetiquetados', verificar, async(req,res)=>{
    const datos = req.body.datos;
    let especialidades = "";
    datos.ubicaciones.forEach((row) => {
        especialidades += row.especid + ',';
    })
    especialidades = especialidades.substring(0, especialidades.length - 1);
    const consulta = " update po set retFG = po.pagoEtiq * " + parseFloat(datos.fondogarantia) / 100
    + ", amortAnt = pagoEtiq * " + parseFloat(datos.anticipo) / 100 + ", importeTotal = pagoEtiq - ( pagoEtiq * " 
    + parseFloat(datos.fondogarantia) / 100
    + " + pagoEtiq *  " + parseFloat(datos.anticipo) / 100 + ") "
    + " from poAvanceObra po "
    + " inner join poasignaobra pa on pa.explosionid = po.explosionid"
    + " inner join poLotesAsignados pl on pl.frente = po.frente and pl.manzana = po.manzana and pl.lote = po.lote"
    + " and pl.interior = po.interior and pl.subinterior = po.subinterior "
    + " inner join poCatalogoEstacionesFrente pc on pc.estacion = po.estacion and pc.frente = po.frente and pc.modelo = pl.modelo"
    + " where po.frente = " + datos.frente + " and pa.proveedorId = " + datos.proveedorid
    + " and pc.espera in (" + especialidades + ")";
    const registrosAfectados = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
    if(registrosAfectados > 0) return res.status(200).send({mensaje: "Registros modificados correctamente", registrosAfectados: registrosAfectados});
    else return res.status(500).send({error: "No se modificó ningún registro"});
})



module.exports = ruta;