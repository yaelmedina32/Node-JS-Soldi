const express = require('express');
const verificar = require('../../../controladores/verificarToken.controller.js');
const procesadorConsultas = require('../../../controladores/procesadorConsultas.controller.js');

const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');

const ruta = express.Router();

/////////////////////////////////// CATALOGO DE MODELOS ///////////////////////////////////


/**
 * /api/v1/suministrosvales/{frente}:
 *   get:
 *     summary: Obtener datos de la orden de compra a autorizar de un frente dado
 *     tags:
 *       - SUM_Control de Vales
 *     parameters:
 *       - in: path
 *         name: frente
 *         required: true
 *         schema:
 *           type: integer
 *         description: Número del frente a reportar
 *     responses:
 *       200:
 *         description: id, folio, fecha, proveedor, proveedorid, ordencompraid, concepto, conceptooc, total, autorizaoc
 */


/**
 * /api/v1/analiticacosto/{frente}:
 *   post:
 *     summary: Inserta analitica costo en un frente dado
 *     tags:
 *       - EF_Analítica Costo
 *     parameters:
 *       - in: header
 *         name: token
 *         type: string
 *         required: true
 *       - in: path
 *         name: frente
 *         required: true
 *         schema:
 *           type: integer
 *         description: Número del frente a insertar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               valor:
 *                 type: number
 *             required:
 *               - valor
 *     responses:
 *       201:
 *         description:  
*/


/**
 * @swagger
 * /api/v2/catalogos/modelos:
 *   get:
 *     summary: Obtener los nombres de los modelos
 *     tags:
 *       - Catálogos
 *     responses:
 *       200:
 *         description: Lista de modelos.
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
 *                       nombre:
 *                         type: string
 *                         description: Nombre del modelo.
 *                         example: 22235002
 *                       modelo:
 *                         type: int
 *                         description: Clave del modelo.
 *                         example: 4152
 *                       modeloid:
 *                         type: int
 *                         description: ID del modelo.
 *                         example: 3242
  */

// verificar,
ruta.get('/modelos', verificar, async(req,res)=>{
    const consulta = "Select m.nombre, clavemodelo as modelo,modeloid "
    + "  From modelos m  Order by  m.nombre";
    const modelos = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(modelos);
})


/**
 * @swagger
 * /api/v2/catalogos/modelos/nombrecomercial/{frente}:
 *   get:
 *     summary: Obtener los nombres de los modelos
 *     tags:
 *       - Catálogos
 *     parameters:
 *       - in: path
 *         name: frente
 *         required: true
 *     responses:
 *       200:
 *         description: Lista de modelos.
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
 *                       nombre:
 *                         type: string
 *                         description: Nombre del modelo.
 *                         example: 22235002
 *                       modelo:
 *                         type: int
 *                         description: Clave del modelo.
 *                         example: 4152
 *                       modeloid:
 *                         type: int
 *                         description: ID del modelo.
 *                         example: 3242
  */


ruta.get('/modelos/nombrecomercial/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "Select Distinct m.nombre as modelo,Isnull(mf.NombreComercial,'N/A') as nombrecomercial "
    + " from lotes l "
    + " Inner join modelos m         On m.modeloId=l.modeloId  "
    + " inner join empresas e        on e.empresaId=l.empresaId  "
    + " Inner Join frentes f         on f.frenteId=l.frenteId And numero = " + frente + " And tipo = 'F' "
    + " Left join modelosxfraccionamiento mf On mf.modeloId=m.modeloId And f.fraccionamientoId=mf.fraccionamientoId "
    + " Order by  m.nombre; ";
    const modelosConNombreComercial = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(modelosConNombreComercial);
})

ruta.get('/modelos/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "select nombre, clavemodelo from modelos where modeloid in (select modeloid from lotes where " +
    " frenteid = (select frenteid from frentes where numero = " + frente + " and tipo = 'F'))";
    const result = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(result);
});

ruta.get('/modelos/conestaciones/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = " select clavemodelo, nombre from modelos where clavemodelo in (select modelo from "
    + " poCatalogoEstacionesFrente where frente = " + frente + ")"
    const modelosConEstaciones = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(modelosConEstaciones);
});

ruta.get('/frentes/obra', verificar, async(req,res) => {
    const consulta = `select frenteid, numero, nombre from frentes 
    where tipo = 'F' and numero > 99 order by cast(numero as int)`
    const frentes = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(frentes);
})

ruta.get('/catalogomodelos/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = " Select Distinct m.nombre as [descripcion], m.clavemodelo  as id "
    + " from lotes l Inner join .modelos m On m.modeloId=l.modeloId "
    + " Inner Join frentes f on f.frenteId=l.frenteId And numero = " + frente
    + " And tipo='F' Order by m.nombre ";
    const modelos = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(modelos);
})

ruta.get('/cantidadmodelos/lotes/:frenteid', verificar, async(req,res)=>{
    const frenteid = req.params.frenteid
    const consulta = " select Count(Distinct modeloid) as son"
    + " from lotes where frenteid=" + frenteid
    + " and modeloid<>9909"
    const cantidadmodelos = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(cantidadmodelos);
});

ruta.get('/fraccionamiento/uen/:frente', verificar, async(req,res) => {
    const frente = req.params.frente;
    const consulta = `select fr.nombre fraccionamiento, fr.uen from frentes f
    inner join fraccionamientos fr on fr.fraccionamientoid = f.fraccionamientoid 
    where f.numero = ${frente} and f.tipo = 'F'`;
    const fraccionamiento = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(fraccionamiento);
});

ruta.get('/UENS', verificar, async(req,res) => {
    const consulta = `select e.nombre, e.estadoId from frentes f 
    inner join poAvanceObra po on cast(po.frente as int)=f.numero
    inner join fraccionamientos fracc on fracc.fraccionamientoId=f.fraccionamientoId
    inner join ciudades c on fracc.ciudadId=c.ciudadId
    inner join estados e on e.estadoId=c.estadoId
    where f.tipo='F' and f.nombre like 'F-%'
    group by e.nombre, e.estadoId`;
    const uens = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(uens);
})

ruta.get('/frentes/:fraccionamiento', verificar, async(req,res) => {
    const fraccionamiento = req.params.fraccionamiento;
    const consulta = `select case when numero < 999 then '0' + cast(numero as varchar) else cast(numero as varchar) end as frente 
    from frentes where fraccionamientoId in
    (select fraccionamientoId from fraccionamientos where nombre='${fraccionamiento}') and tipo='F' and nombre like 'F-%' order by numero`;
    const frentes = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(frentes);
})


/////////////////////////////////// CATALOGOS DE ESPECIALIDADES ///////////////////////////////////
ruta.get('/catalogo/especialidades/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "select distinct e.descripcion, e.especid from espec e inner join "
    + " poCatalogoEstacionesFrente pc on e.especid = pc.espera "
    + " where pc.frente = " + frente;
    const catalogoEspecialidades = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(catalogoEspecialidades);
})

ruta.get('/especialidades/frente/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = " select '-Todos-' as descripcion, 0 as especid union all  " +
    "select e.descripcion, especid from " +
    " poCatalogoEstacionesFrente pc " +
    " inner join espec e on e.especid = pc.espera " +
    " where pc.frente = " + frente +
    " group by e.descripcion, especid";
    const especialidadesFrente = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(especialidadesFrente);
})

ruta.get('/especialidades/especid/:especid', verificar, async(req,res)=>{
    const especid = parseInt(req.params.especid) > 0 ? " Where especid=" + req.params.especid : '';
    const consulta = "Select especid, descripcion "
    + " from espec " + especid
    + " Order by descripcion";
    const especialidades = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(especialidades);
})

ruta.get('/especialidades', verificar, async(req,res)=>{
    const consulta = "Select 0 as especid,' -TODOS-' as descripcion UNION ALL " +
     " Select especid, descripcion  " +
     "  from espec " + 
     " Order by descripcion";
    const especialidades = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(especialidades);
});

ruta.get('/especialidades/estaciones/:frente/:filtromodelo', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const filtromodelo = req.params.filtromodelo != 'n_a' ?  " and m.nombre='" + req.params.filtromodelo + "'" : '';
    const consulta = "Select distinct espera"
    + "    from poCatalogoEstacionesFrente l"
    + "     Inner join modelos m on m.clavemodelo=l.modelo"
      + filtromodelo
    + "     Where frente=" + frente
    + "  Order by espera"
    const especid = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(especid);
})

/////////////////////////////////// CATALOGO DE EMPRESAS ///////////////////////////////////

ruta.get('/empresas', verificar, async(req,res)=>{
    const consulta = "Select empresaid, nombrecorto as corto "
    + " from empresas"
    + " Order by nombrecorto";
    const catalogoEmpresas = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(catalogoEmpresas);
});

ruta.get('/empresa/:frenteid', verificar, async(req,res) => {
    const frenteid = req.params.frenteid;
    const consulta = `select e.nombreCorto, e.empresaId from frentes f
    inner join fraccionamientos fr on fr.fraccionamientoId = f.fraccionamientoId
    inner join empresas e on e.empresaId = fr.empresaId
    where f.frenteid = ${frenteid}`;
    const empresa = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(empresa[0]);
})

ruta.get('/diasfestivos', verificar, async(req,res)=>{
    const consulta = "Select fecha "
    + " from diasfestivos "
    + " Order by fecha"
    const diasfestivos = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(diasfestivos);
});

ruta.get('/frentevalido/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "use spvnet200; Select id from afControlFrentes Where frente = " + frente 
    const idFrente = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(idFrente);
})

ruta.get('/modoestaciones/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "Select id, isnull(multiplesContratos,0) as multiplesContratos from frentesModoestaciones Where frente=" + frente;
    const idModoEstaciones = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(idModoEstaciones);
})

ruta.get('/frente/autorizado/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "use spvnet200; Select autorizada From afControlFrentes Where frente= " + frente;
    const frenteAutorizado = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(frenteAutorizado);
})


/////////////////////////////////// CATALOGO DE PROVEEDORES ///////////////////////////////////


ruta.get('/proveedores/:tipo', verificar, async(req,res)=>{
    const tipo = req.params.tipo;
    const consulta = "select proveedorid, Upper(razonsocial)+ ' (' + Upper(nombre)+')' as razonsocial, nombre as alias "
    + " from proveedores where tipo like '%" + tipo + "%' order by razonsocial";
    const proveedores = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(proveedores);
})

ruta.get('/proveedoresasignados/asignacionobra/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "select distinct p.proveedorid, Upper(p.razonsocial) + ' (' + Upper(nombre)+')' as razonsocial "
    + " from poavanceobra po "
    + " inner join poasignaobra pa on pa.explosionid = po.explosionid "
    + " inner join proveedores p on p.proveedorId = pa.proveedorId "
    + " where po.frente = " + frente;
    const proveedoresAsignados = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    if(proveedoresAsignados.length > 0){
        return res.json(proveedoresAsignados);
    }
    return res.json(null);
})

/////////////////////////////////// CATALOGO DE MÓDULOS ///////////////////////////////////

ruta.get('/modulos/:frente', verificar, async(req,res)=>{ 
    const frente = req.params.frente;
    const consulta = `Select isnull(cast(ccedif as int),0) as ccedif
    From pomodulosobra m   where left(modulo,4)='${frente}'
	group by ccedif
    Order by cast(ccedif  as int)`;
    const modulosFrente = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(modulosFrente);
})

ruta.get('/modulos/descripcion/:frente/:ccedif', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const agruparPorCcedif = parseInt(req.params.ccedif) > 0 ? " and ccedif=" + req.params.ccedif : '';
    const consulta = "Select modulo,descripcion, lotes "
    + " from poModulosObra "
    + "  Where left(modulo,4)=" + frente
    + agruparPorCcedif
    + "  Order by modulo"
    const modulos = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(modulos);
})

ruta.get('/modulos/:frente/cantidadlotes', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta =  "Select modulo,descripcion,lotes from poModulosObra "
    + " Where left(modulo,4)=" + frente
    + " Order by modulo";
    const modulos = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(modulos);
})

ruta.get('/modulos/descripcion/ccedif/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "select distinct descripcion, ccedif from poModulosObra where left(modulo,4) = " + frente
    const catalogoModulos = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(catalogoModulos);
})

ruta.get('/catalogomodulos/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "Select 'Todos' as modulo,'Todos' as descripcion Union All "
    + "Select modulo,nombremodulo as descripcion from vwModulosObraNombre "
    + "  Where left(modulo,4)=" + frente + "  Order by modulo";
    const catalogoModulos = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(catalogoModulos);
})

/////////////////////////////////// CATALOGO DE ESTACIONES ///////////////////////////////////

ruta.get('/estaciones/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "Select modelo,estacion,descripcion,espera "
    + " from poCatalogoEstacionesFrente "
    + "  Where frente=" + frente + ""
    + " Order By modelo,estacion";
    const estaciones = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(estaciones);
});

ruta.get('/numeroestacion/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = " select distinct descripcion, estacion, estacionDependiente from pocatalogoestacionesfrente  "
    + " where frente = " + frente + " order by estacion";
    const estaciones = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(estaciones);
});

ruta.get('/cantidadestaciones/modelo/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "Select m.nombre as modelo,count(*) as estaciones"
    + " from poCatalogoEstacionesFrente c "
    + "  inner join modelos m on m.clavemodelo=c.modelo"
    + "  Where frente=" + frente + ""
    + " Group by m.nombre "
    + " Order by m.nombre ";
    const cantidadestaciones = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(cantidadestaciones);
});

ruta.get('/ubicaciones/avanceobra/:frente', verificar, async(req,res) => {
    const frente = req.params.frente;
    const consulta = `select count(*) ubicaciones from poavanceobra where frente = ${frente}`;
    const ubicacionesAsignadas = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(ubicacionesAsignadas[0]);
})

ruta.get('/ubicacionesasignadas/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = `select count(*) as cantidadNoAsignadas from poAvanceObra po 
    left join poAsignaObra pa on pa.explosionid = po.explosionid
    where po.frente = ${frente} and isnull(pa.proveedorid, 0) != 0`
    const cantidadNoAsignadas = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(cantidadNoAsignadas);
});

ruta.get('/ubicaciones/bonos/:fraccionamiento', verificar, async(req,res )=> {
    const fraccionamiento = req.params.fraccionamiento;
    const consulta = `select distinct * from (
        select consulta.*, case when bu.bonoUbicacionId is null then 'Sin Intervalo' else 'Con intervalo' end estatus from  (
            select  case when f.numero < 1000 then '0' + cast(cast(f.numero as int) as varchar) else f.numero end frente, f.frenteid, fr.fraccionamientoid, 0 seleccionada 
                from fraccionamientos fr
                inner join frentes f on f.fraccionamientoId = fr.fraccionamientoId and f.tipo = 'F'
                inner join lotes l on l.frenteId = f.frenteId
				where fr.nombre = '${fraccionamiento}' 
                group by f.numero, f.frenteId, fr.fraccionamientoId) consulta
            left join bonoUbicacion bu on bu.frenteid = consulta.frenteId
        group by consulta.frente, consulta.frenteId, consulta.fraccionamientoId, 
		seleccionada, bu.bonoUbicacionId
    ) consulta`;
    const ubicaciones = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(ubicaciones);
});

ruta.get('/ubicaciones/fraccionamiento/:fraccionamiento', verificar, async(req,res )=> {
    const fraccionamiento = req.params.fraccionamiento;
    const consulta = `select distinct * from (
        select consulta.*, case when bu.bonoUbicacionId is null then 'Sin Intervalo' else 'Con intervalo' end estatus from  (
            select  case when f.numero < 1000 then '0' + cast(cast(f.numero as int) as varchar) else f.numero end frente, f.frenteid, fr.fraccionamientoid, 0 seleccionada 
                from fraccionamientos fr
                inner join frentes f on f.fraccionamientoId = fr.fraccionamientoId and f.tipo = 'F'
                inner join lotes l on l.frenteId = f.frenteId
				where fr.nombre = '${fraccionamiento}' 
                group by f.numero, f.frenteId, fr.fraccionamientoId) consulta
            left join bonoUbicacion bu on bu.frenteid = consulta.frenteId
        group by consulta.frente, consulta.frenteId, consulta.fraccionamientoId, 
		seleccionada, bu.bonoUbicacionId
    ) consulta`;
    const ubicaciones = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(ubicaciones);
});

ruta.get('/fraccionamientos/nombre', verificar, async(req,res) => {
    const consulta = `select  fr.nombre fraccionamiento
    from fraccionamientos fr
    inner join frentes f on f.fraccionamientoId = fr.fraccionamientoId and f.tipo = 'F'
    inner join lotes l on l.frenteId = f.frenteId
    group by fr.nombre`;
    const fraccionamientos = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(fraccionamientos);
});

ruta.get('/fraccionamientos/estado/:estadoid', verificar, async(req,res) => {
    const estadoid = req.params.estadoid;
    const consulta = `select fracc.nombre
    from frentes f
    inner join poAvanceObra po on cast(po.frente as int)=f.numero 
    inner join fraccionamientos fracc on fracc.fraccionamientoId=f.fraccionamientoId 
    inner join empresas e on e.empresaId = fracc.empresaId 
    inner join ciudades c on c.ciudadId = fracc.ciudadId 
    where f.tipo='F' and f.nombre like 'F-%' and c.estadoId =  ${estadoid}
    group by fracc.nombre`;
    const fraccionamientos = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(fraccionamientos);
})

ruta.get('/intervalo/:frente', verificar, async(req,res) => {
    const frente = req.params.frente;
    const consulta = `select * from bonoUbicacion where frente  = ${frente}`;
    const intervalos = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(intervalos);
})

ruta.get('/estaciones/:frente/modelo/especialidad', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "select estacion, modelo, descripcion nombre, espera as especid, frente from poCatalogoEstacionesFrente where frente = " + frente
    + " order by estacion, modelo ";
    const estaciones = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(estaciones);
});

ruta.get('/estaciones/cantidad/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "Select isnull(Count(*),0) as son "
    + " from poCatalogoEstacionesFrente c "
    + " where frente=" + frente;
    const cantidadEstaciones = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(cantidadEstaciones);
})

/////////////////////////////////// CATALOGO DE CONTRATOS ///////////////////////////////////
 
ruta.get('/contratos/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "Select proveedorid, contratista,fechainicio,fechafin"
    + " from poContratosObra Where frente=" + frente
    + " Order by contratista";
    const contratos = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(contratos);
})

ruta.get('/contratos/especialidad/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "Select distinct a.especid"
    + " from poContratosObra c"
    + " inner join vwAvanceObraNormalizada a on a.frente = c.frente and a.proveedorid = c.proveedorid"
	+ " inner join poAvanceObraContratos pco on pco.explosionId = a.explosionid and pco.idContrato = c.id"
    + " Where c.frente=" + frente
    + " Order by especid";
    const contratosEspecialidad = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(contratosEspecialidad);
})


ruta.get('/semanamaxima', verificar, async(req,res)=>{
    const consulta =  "Select max(semana) as semana from poSemanas where estatus=0 ";
    const semanaActual = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(semanaActual);  
})

ruta.get('/actividades/:frente/:estacion/:modelo', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const estacion = req.params.estacion;
    const modelo = req.params.modelo;
    const consulta = "select id, descripcion from polistaverificacion2 where frente =" + frente 
    + " and estacion = " + estacion + " and modelo = '" + modelo + "'";
    const catalogoActividades = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(catalogoActividades);
})

ruta.post('/bonos', verificar, async(req,res) => {
    const datos = req.body.datos;
    let consulta = "";
    try{
        datos.filter(ele => ele.estatus == 'Con intervalo').forEach(ele => {
            consulta += "delete bonoUbicacion where frenteid = " + ele.frenteid + "; ";
        })
        datos.forEach(bono => {
            consulta += `insert into bonoUbicacion (frenteid, frente, inicioIntervalo, finIntervalo, porcentajeBono) 
            values (${bono.frenteid}, '${bono.frente}', ${bono.iniciointervalo}, ${bono.finintervalo}, ${bono.bono});
            `;
        });
        const resultado = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
        return res.status(200).send({mensaje: "Datos modificados correctamente"});
    }catch(error){
        if(error){
            console.log(error);
            return res.status(500).send({error: error});
        }
    }
})

////////////////////////////////////// REPORTES DE AVANCE DE OBRA /////////////////////////////////

ruta.post('/financieros', verificar, async(req,res) => {
    const datos = req.body.datos;  
    const semanas = [];
    if(datos.anios){
        //PRIMERO VALIDO QUE SEA POR AÑOS, PARA IR SACANDO LAS 53 SEMANAS DE CADA AÑO SELECCIONADO
        datos.anios.forEach((year) => {
            let fechaInicial = new Date(year, 0, 1); // 1 de enero del año dado
            let fechaFinal = new Date(year, 11, 31); // 31 de diciembre del año dado
            let currentWeek = 1;
            //EN CASO DE QUE SEA EL AÑO ACTUAL, QUE NO SAQUE LAS 53 SEMANAS, SI NO HASTA LA DE LA FECHA DE HOY
            if(year == new Date().getFullYear()){    
                while (fechaInicial <= new Date()) {
                    // Encontrar el último día de la semana (domingo)
                    let weekEndDate = new Date(fechaInicial);
                    weekEndDate.setDate(fechaInicial.getDate() + 6);
        
                    // Agregar la semana al array
                    const semana = currentWeek < 10 ? '0' + currentWeek.toString() : currentWeek.toString()
                    semanas.push( year.toString() + ' - ' + semana);
        
                    // Avanzar al siguiente lunes (inicio de la próxima semana)
                    fechaInicial.setDate(fechaInicial.getDate() + 7);
                    currentWeek++;
                }
            }else{
                //EN CASO DE QUE NO SEA EL AÑO ACTUAL, ENTONCES SÍ VA A ISNERTAR LAS 53 SEMANAS
                while (fechaInicial <= fechaFinal) {
                    // Encontrar el último día de la semana (domingo)
                    let weekEndDate = new Date(fechaInicial);
                    weekEndDate.setDate(fechaInicial.getDate() + 6);
        
                    // Agregar la semana al array
                    const semana = currentWeek < 10 ? '0' + currentWeek.toString() : currentWeek.toString()
                    semanas.push( year.toString() + ' - ' + semana);
        
                    // Avanzar al siguiente lunes (inicio de la próxima semana)
                    fechaInicial.setDate(fechaInicial.getDate() + 7);
                    currentWeek++;
                }
            }
        });
    }else{
        //AHORA, EN CASO DE QUE EN EL UI HAYAN SELECCIONADO UN INTERVALO DE FECHAS, ENTONCES VOY A SACAR LAS SEMANAS DE ESAS FECHAS
        
        let fechaInicial = new Date(datos.rango.inicio.year, (datos.rango.inicio.month - 1), datos.rango.inicio.day); 
        let fechaFinal = new Date(datos.rango.fin.year, (datos.rango.fin.month - 1), datos.rango.fin.day); 

        const firstDayOfYear = new Date(fechaInicial.getFullYear(), 0, 1);
        const pastDaysOfYear = (fechaInicial - firstDayOfYear) / 86400000; // 86400000 ms en un día -> PARA SACAR LA DIFERENCIA DE DÍAS Y LUEGO CONVERTIRLOS A SEMANAS

        let currentWeek = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);

        while (fechaInicial <= fechaFinal) {
            // Encontrar el último día de la semana (domingo)
            let weekEndDate = new Date(fechaInicial);
            weekEndDate.setDate(fechaInicial.getDate() + 6);

            // Agregar la semana al array
            const semana = currentWeek < 10 ? '0' + currentWeek.toString() : currentWeek.toString()
            semanas.push( datos.rango.inicio.year.toString() + ' - ' + semana);

            // Avanzar al siguiente lunes (inicio de la próxima semana)
            fechaInicial.setDate(fechaInicial.getDate() + 7);
            currentWeek++;
        }
    }

    let frentes = datos.frentes.reduce((acum, actual) => acum += actual + ',', "");
    frentes = frentes.substring(0, frentes.length - 1);
    let anios = "";
    let fechas = "";
    if(datos.anios){
        anios = datos.anios.reduce((acum, actual) => acum += actual + ',', "");
        anios = anios.substring(0, anios.length - 1);
    }else{
        //VOY A FORMATEAR LA FECHA A TIPO 'YYYYMMDD'
        const mesInicio = datos.rango.inicio.month < 10 ? ('0' + datos.rango.inicio.month.toString()) : datos.rango.inicio.month.toString();
        const diaInicio = datos.rango.inicio.day < 10 ? ('0' + datos.rango.inicio.day.toString()) : datos.rango.inicio.day.toString()
        const inicio = datos.rango.inicio.year.toString()  + mesInicio + diaInicio;
        
        const mesFin = datos.rango.fin.month < 10 ? ('0' + datos.rango.fin.month.toString()) : datos.rango.fin.month.toString();
        const diaFin = datos.rango.fin.day < 10 ? ('0' + datos.rango.fin.day.toString()) : datos.rango.fin.day.toString();
        const fin = datos.rango.fin.year.toString() + mesFin + diaFin;
        fechas = `'${inicio}' and '${fin}'`;
    }
    
    let consulta = `
	select distinct frente, ccedif, semana,
    sum(case when status = 'T' then pagoEtiq else 0 end) etiquetado
    from (
    select va.frente, pm.ccedif, cast(year(va.fechater) as varchar) + ' - ' 
    + case when DATEPART(wk, va.fechater)  < 10 then '0' + cast(DATEPART(wk, va.fechater) as varchar) else 
    cast(DATEPART(wk, va.fechater) as varchar) end semana, va.status, va.pagoEtiq
        from vwAvanceObraNormalizada va
        inner join poModulosObra pm on pm.modulo = va.modulo 
        where va.frente in (${frentes}) and ${datos.anios ? `year(va.fechater) in (${anios})` : `va.fechater between ${fechas}`}
    ) consulta
    group by frente, ccedif, semana`;
    
    const avanceTerminados = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    
    consulta = `select distinct frente, ccedif, semana,
    sum(pagoEtiq) etiquetado
    from (
    select va.frente, pm.ccedif, cast(year(va.fecharea) as varchar) + ' - ' + case when DATEPART(wk, va.fecharea) < 10 
        then '0' + cast(DATEPART(wk, va.fecharea) as varchar) else 
    cast(DATEPART(wk, va.fecharea) as varchar) end semana, va.status, va.pagoEtiq
        from vwAvanceObraNormalizada va
        inner join poModulosObra pm on pm.modulo = va.modulo 
        where va.frente in (${frentes}) and ${datos.anios ? `year(va.fecharea) in (${anios})` : `va.fecharea between ${fechas}`}
    ) consulta
    group by frente, ccedif, semana
	order by frente, ccedif, semana`;

    const avanceProgramadas = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);

    if(avanceProgramadas.length == 0 && avanceTerminados.length == 0){
        return res.status(500).send({error: "Frentes sin avance ni programación de fechas"});
    }

    const avanceProgramadasDividida = [];

    const avanceTerminadasDividida = [];

//////////////////////////////////////////////// FRENTES SIN REPETIRSE //////////////////////////////////////////////////////////////////////////

    const frentesProgramados = avanceProgramadas.reduce((acum, actual) => {
        if(!acum.some(ele => ele == actual.frente)){
            acum.push(actual.frente);
        }
        return acum;
    }, []);

    const frentesTerminados = avanceTerminados.reduce((acum, actual) => {
        if(!acum.some(ele => ele == actual.frente)){
            acum.push(actual.frente);
        }
        return acum;
    }, []);

    //EN CASO DE QUE HAYA FRENTES QUE NO HAYAN AVANZADO, PERO SI SE HAYAN PROGRAMADO, ENTONCES NECESITO FORZAR A QUE APAREZCAN PARA QUE INDIQUE 0

    frentesProgramados.forEach((frente) => {
        if(!frentesTerminados.some((ele) => ele == frente)){
            frentesTerminados.push(frente);
        }
    })

    //CASO CONTRARIO CON EL ANTERIOR, EN CASO DE QUE YA ESTÉN AVANZANDO PERO NO HAYA PROGRAMACIÓN DE FECHAS, ENTONCES NO APARECERÁN DENTRO DEL ARREGLO

    frentesTerminados.forEach((frente) => {
        if(!frentesProgramados.some((ele) => ele == frente)){
            frentesProgramados.push(frente);
        }
    })

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////// COMPARACIÓN DE SEMANAS PARA QUE COMPARE SOLO LAS QUE DEBE///////////////////////////////////////

    frentesProgramados.forEach((frente) => {
        const lineasProduccionTerminadas = avanceTerminados.filter(ele => ele.frente == frente).reduce((acum, actual) => {
            if(!acum.some(ele => ele== actual.ccedif)){
                acum.push(actual.ccedif);
            }
            return acum;
        }, []);

        const lineasProduccionProgramadas = avanceProgramadas.filter(ele => ele.frente == frente).reduce((acum, actual) => {
            if(!acum.some(ele => ele== actual.ccedif)){
                acum.push(actual.ccedif);
            }
            return acum;
        }, []);

        lineasProduccionProgramadas.forEach((lp) => {
            if(!lineasProduccionTerminadas.some((ele) => ele == lp)){
                lineasProduccionTerminadas.push(lp);
            }
        });
    
        //CASO CONTRARIO CON EL ANTERIOR, EN CASO DE QUE YA ESTÉN AVANZANDO PERO NO HAYA PROGRAMACIÓN DE FECHAS, ENTONCES NO APARECERÁN DENTRO DEL ARREGLO
    
        lineasProduccionTerminadas.forEach((lp) => {
            if(!lineasProduccionProgramadas.some((ele) => ele == lp)){
                lineasProduccionProgramadas.push(lp);
            }
        });

        const primerSemanaHecha = avanceTerminados.filter(ele => ele.frente == frente).sort((a,b) => a.semana > b.semana ? 1 : -1)[0] || semanas[0];
        const primerSemanaProgramada = avanceProgramadas.filter(ele => ele.frente == frente).sort((a,b) => a.semana > b.semana ? 1 : -1)[0] || semanas[0]
        
        const ultimaSemanaHecha = avanceTerminados.filter(ele => ele.frente == frente).sort((a,b) => a.semana < b.semana ? 1 : -1)[0] || semanas[semanas.length - 1]
        const ultimaSemanaProgramada = avanceProgramadas.filter(ele => ele.frente == frente).sort((a,b) => a.semana < b.semana ? 1 : -1)[0] || semanas[semanas.length - 1]

        
    
        const primerSemanaComparar = primerSemanaHecha.semana > primerSemanaProgramada.semana ? primerSemanaProgramada.semana : primerSemanaHecha.semana;
        const ultimaSemanaComparar = ultimaSemanaHecha.semana > ultimaSemanaProgramada.semana ? ultimaSemanaProgramada.semana : ultimaSemanaHecha.semana;
    
        const indiceSemanaInicial = semanas.findIndex(ele => ele == primerSemanaComparar);
        const indiceSemanaFinal = semanas.findIndex(ele => ele == ultimaSemanaComparar);
        
            lineasProduccionTerminadas.forEach((lp) => {
                const auxiliarSemanas = Array.from(semanas);
                const semanasRecorrer = !datos.anios ? Array.from(semanas) : auxiliarSemanas.slice(indiceSemanaInicial, indiceSemanaFinal)
                semanasRecorrer.forEach((semana) => {
                    // avanceTerminados.filter(ele => ele.ccedif == lp).forEach((element) => {})
                    avanceTerminadasDividida.push(
                        {
                            frente: frente,
                            ccedif: lp,
                            semana: semana,
                            etiquetado: avanceTerminados.some(ele => ele.frente == frente && ele.semana == semana && ele.ccedif == lp) 
                            ? 
                                avanceTerminados.find(ele => ele.frente == frente && ele.semana == semana && ele.ccedif == lp).etiquetado
                            : 
                                0,
                        }
                    )

                    avanceProgramadasDividida.push(
                        {
                            frente: frente,
                            ccedif: lp,
                            semana: semana,
                            etiquetado: avanceProgramadas.some(ele => ele.frente == frente && ele.semana == semana && ele.ccedif == lp) 
                            ? 
                                avanceProgramadas.find(ele => ele.frente == frente && ele.semana == semana && ele.ccedif == lp).etiquetado
                            : 
                                0,
                        }
                    )
                })  
            })
    });

    const acumuladosTerminados = JSON.parse(JSON.stringify(avanceTerminadasDividida));
    const acumuladosProgramados =  JSON.parse(JSON.stringify(avanceProgramadasDividida));
    //EN ESTA PARTE LE ESTOY SUMANDO LOS TOTALES DE LA POSICION ACTUAL HASTA LA POSICION n PARA SACAR EL ACUMULADO DE CADA SEMANA
    for(let i = 1; i < acumuladosProgramados.length; i++){
        const indiceFrente = acumuladosProgramados.findIndex(ele => ele.frente == acumuladosProgramados[i].frente && ele.ccedif == acumuladosProgramados[i].ccedif);
        const auxiliar = avanceProgramadasDividida.slice(indiceFrente, (i));
        acumuladosProgramados[i].etiquetado += auxiliar.reduce((acum, actual) => acum += !actual.etiquetado ? 0 : actual.etiquetado, 0);
    }
    //LO MISMO PERO CON LOS TERMINADOS
    for(let i = 0; i < acumuladosTerminados.length; i++){
        //ESTE INDICEFRENTE LO USO PARA VALIDAR QUE HAYA UN FRENTE NUEVO, PARA QUE NO SE ACUMULE EL TOTAL DE TODOS LOS FRENTES Y SE REINICIE 
        //EL TOTAL DEL FRENTE, YA QUE EL FINDINDEX AGARRA EL PRIMER ELEMENTO ENCONTRADO, Y YA LO TENGO ORDENADO POR FRENTE Y CCEDIF
        if(i > 0){
            const indiceFrente = acumuladosTerminados.findIndex(ele => ele.frente == acumuladosTerminados[i].frente  && ele.ccedif == acumuladosTerminados[i].ccedif);
            const auxiliar = avanceTerminadasDividida.slice(indiceFrente, (i));
            acumuladosTerminados[i].etiquetado += auxiliar.reduce((acum, actual) => acum += !actual.etiquetado ? 0 : actual.etiquetado, 0);
        }
    }

    const objeto = {
        cerrados: avanceTerminadasDividida,
        cerradosAcumulados: acumuladosTerminados,
        programados: avanceProgramadasDividida,
        programadosAcumulados: acumuladosProgramados,
    }
    return res.json(objeto);
});

ruta.post('/anios', verificar, async(req,res) => {
    const datos = req.body.datos;
    let frentes = datos.reduce((acum, actual) => acum += actual + ',', "");
    frentes = frentes.substring(0, frentes.length - 1);
    const consulta = `
    select distinct anios from (
        select distinct year(fecharea) anios from poavanceobra where frente in (${frentes}) and year(fechaRea) > 2002
        union all
        select distinct year(fechater) anios from poAvanceObra where frente in (${frentes}) and year(fechater) > 2002
    ) consulta
    `;
    const anios = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(anios);
});

ruta.post('/graficas/estaciones', async(req,res) => {
    const datos = req.body.datos;
    const width = 1200;
    const height = 800;
    const canvas = new ChartJSNodeCanvas({width, height})
    const frentes = Object.keys(datos);
    const arreglo = [];
    for(let i = 0; i < frentes.length; i++){
        const frente = frentes[i];
        const lineasProduccion = Object.keys(datos[frente]);
        for(let j = 0; j < lineasProduccion.length; j++){
            const lp = lineasProduccion[j];
            const arregloFiltradoCerradas = datos[frente][lp].cerradas
            const arregloFiltradoCerradasAcumuladas = datos[frente][lp].cerradasAcumuladas
            const arregloFiltradoProgramadas = datos[frente][lp].programadas
            const arregloFiltradoProgramadasAcumuladas = datos[frente][lp].programadasAcumuladas

            const semanas = []
            
            datos[frente][lp].cerradas.forEach((semana) => {
                semanas.push(semana.semana);
            })
            
            const valoresCerradas = [];
            const valoresCerradasA = [];
            const valoresProgramadas = [];
            const valoresProgramadasA = [];
            
            arregloFiltradoCerradas.forEach((row, index) => {
                valoresCerradas.push(
                    {
                        x: (index + 1),
                        y: row.etiquetado
                    }
                );
            });

            arregloFiltradoCerradasAcumuladas.forEach((row, index) => {
                valoresCerradasA.push(
                    {
                        x: (index + 1),
                        y: row.etiquetado
                    }
                )
            })

            arregloFiltradoProgramadas.forEach((row, index) => {
                valoresProgramadas.push(
                    {
                        x: (index + 1),
                        y: row.etiquetado
                    }
                )
            })

            arregloFiltradoProgramadasAcumuladas.forEach((row, index) => {
                valoresProgramadasA.push(
                    {
                        x: (index + 1),
                        y: row.etiquetado
                    }
                )
            })
            const configuration = {
                type: 'line',
                data: {
                  datasets: [{
                    label: 'Cerradas',
                    data: valoresCerradas,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    showLine: true, // Esta opción une los puntos con una línea
                  },
                  {
                    label: 'Programadas',
                    data: valoresProgramadas,
                    backgroundColor: 'rgba(97, 245, 39, 0.8)',
                    borderColor: 'rgba(97, 245, 39, 0.8)',
                    showLine: true, // Esta opción une los puntos con una línea
                  },
                  {
                    label: 'Cerradas Acumuladas',
                    data: valoresCerradasA,
                    backgroundColor: 'rgba(245, 234, 39, 0.8)',
                    borderColor: 'rgba(245, 234, 39, 0.8)',
                    showLine: true, // Esta opción une los puntos con una línea
                  },
                  {
                    label: 'Programadas Acumuladas',
                    data: valoresProgramadasA,
                    backgroundColor: 'rgba(224, 145, 244, 0.8)',
                    borderColor: 'rgba(224, 234, 244, 0.8)',
                    showLine: true, // Esta opción une los puntos con una línea
                  }
                ]
                },
                options: {
                    plugins: {
                        background:{
                            color: 'rgba(228, 227, 206, 0.8)'
                        }
                    },
                  scales: {
                    x: { 
                        type: 'linear', 
                        position: 'bottom' ,
                        title: {
                            display: true,               // Mostrar el título del eje X
                            text: 'Semana',      // Texto del título
                            color: '#000000',               // Color del título
                            font: {
                              size: 22,                  // Tamaño de la fuente
                              weight: 'bold',            // Grosor de la fuente
                            }
                        },
                        min: 1,               // Mínimo valor en el eje X
                        max: semanas.length,              // Máximo valor en el eje X
                        ticks: {
                          stepSize: 1,
                          callback: function(value, index, ticks){
                            return semanas[value - 1];
                          }
                        }
                    },
                    y: { 
                        type: 'linear',
                        title: {
                            display: true,               // Mostrar el título del eje X
                            text: 'Financiero',      // Texto del título
                            color: '#000000',               // Color del título
                            font: {
                              size: 22,                  // Tamaño de la fuente
                              weight: 'bold',            // Grosor de la fuente
                            }
                        },
                        min: 0,               // Mínimo valor en el eje X
                        max: 10000000,              // Máximo valor en el eje X
                        ticks: {
                          stepSize: 1000000      // Intervalo entre cada marca de valor (tick) en X
                        }
                    }
                  }
                },
                plugins: [{
                    id: 'custom_canvas_background_color',
                    beforeDraw: (chart) => {
                      const ctx = chart.ctx;
                      ctx.save();
                      ctx.globalCompositeOperation = 'destination-over';
                      ctx.fillStyle = 'white'; // Color sólido de fondo (blanco en este caso)
                      ctx.fillRect(0, 0, chart.width, chart.height);
                      ctx.restore();
                    }
                  }]
            };
            const chart = await generarRenderizado(configuration, canvas);
            const b64 = chart.toString('base64');
            arreglo.push(
                {
                    frente: frente,
                    lp: lp,
                    imagen: `data:iamge/png;base64,${b64}`,
                }
            );
        }
    }
    return res.json(arreglo);
})

const generarRenderizado = async(configuracion, canvas) => {
    return await canvas.renderToBuffer(configuracion);
};

ruta.post('/promediosPonderados', verificar, async(req,res) => {
    const datos = req.body.datos;
    let fechaInicial = "";
    let fechaFinal = "";
    if(datos.fechas){
        let mesInicio = datos.fechas.beginDate.month < 10 ? '0' + datos.fechas.beginDate.month.toString() : datos.fechas.beginDate.month.toString();
        let diaInicio = datos.fechas.beginDate.day < 10 ? '0' + datos.fechas.beginDate.day.toString() : datos.fechas.beginDate.day.toString();
        fechaInicial = `${datos.fechas.beginDate.year}${mesInicio}${diaInicio}`;
        let mesFin = datos.fechas.endDate.month < 10 ? '0' + datos.fechas.endDate.month.toString() : datos.fechas.endDate.month.toString();
        let diaFin = datos.fechas.endDate.day < 10 ? '0' + datos.fechas.endDate.day.toString() : datos.fechas.endDate.day.toString();
        fechaFinal = `${datos.fechas.endDate.year}${mesFin}${diaFin}`;
    }
    const consulta = `
    SELECT frente, lineaProduccion, 
        DATEPART(week, fechater) AS semana,
        DATEPART(year, fechater) AS anio,
        CASE WHEN SUM(diasEstacion) <= 0 THEN 0 
        ELSE ROUND(SUM(CAST(diasDiferenciaDuracion AS float) * CAST(diasEstacion AS float)) / SUM(CAST(diasEstacion AS float)), 2) 
        END AS ponderado
    FROM (
        SELECT va.frente, pm.ccedif AS lineaProduccion, va.estacion, va.fechater, 
            CASE WHEN pc.diasPlan < 0 THEN 0 ELSE pc.diasPlan END AS diasEstacion,
            CASE WHEN va.estacion = 100 THEN 0 
            ELSE CASE WHEN YEAR(va.fechater) <= 2003 THEN 0 
            ELSE CAST(DATEDIFF(day, (SELECT fechater 
                                    FROM poavanceobra po 
                                    WHERE po.frente = va.frente AND po.manzana = va.manzana AND po.lote = va.lote 
                                    AND va.interior = po.interior AND va.subinterior = po.subinterior AND po.estacion = va.estacion - 1), va.fechater) AS varchar) 
            END END AS diasDiferencia,
            CASE WHEN va.estacion = 100 THEN 0 
            ELSE CASE WHEN YEAR(va.fechater) <= 2003 or year((SELECT fechater 
                FROM poavanceobra po 
                WHERE po.frente = va.frente AND po.manzana = va.manzana AND po.lote = va.lote 
                AND va.interior = po.interior AND va.subinterior = po.subinterior AND po.estacion = va.estacion - 1)) <= 2003 THEN 0 
            ELSE CAST(DATEDIFF(day, (SELECT fechater 
                                    FROM poavanceobra po 
                                    WHERE po.frente = va.frente AND po.manzana = va.manzana AND po.lote = va.lote 
                                    AND va.interior = po.interior AND va.subinterior = po.subinterior AND po.estacion = va.estacion - 1), va.fechater) 
                                    - CASE WHEN pc.diasPlan < 0 THEN 0 ELSE pc.diasplan END AS varchar) 
            END END AS diasDiferenciaDuracion
        FROM vwAvanceObraNormalizada va
        INNER JOIN poCatalogoEstacionesFrente pc ON pc.frente = va.frente AND pc.estacion = va.estacion AND pc.modelo = va.modelo
        INNER JOIN poModulosObra pm ON pm.modulo = va.modulo
        WHERE va.frente in (${datos.frentes}) ${datos.fechas ? ` and va.fechater between '${fechaInicial}' and '${fechaFinal}'` : ""} and pc.duracion != 3
    ) consulta
    where DATEPART(year, fechater) > 2003
    GROUP BY frente, lineaProduccion, DATEPART(week, fechater), DATEPART(year, fechater)
    order by frente, lineaProduccion, DATEPART(year, fechater), DATEPART(week, fechater)`;
    const promedios = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    let objetoGrafica = {};
    // const width = 1200;
    // const height = 800;
    // const canvas = new ChartJSNodeCanvas({width, height})

    // const frentesSinRepetirse = promedios.reduce((acum, actual) => {
    //     if (!acum.some(ele => ele == actual.frente)) { acum.push(actual.frente); }
    //     return acum;
    // }, []);
    // for(let i = 0;  i < frentesSinRepetirse.length; i++) {
    //     const frente = frentesSinRepetirse[i];
    //     const ponderados = [];
    //     const aniosSinRepetirse = promedios.filter(ele => ele.frente == frente).reduce((acum, actual) => {
    //     if (!acum.some(ele => ele == actual.anio)) {
    //         acum.push(actual.anio);
    //     }
    //     return acum;
    //     }, []);

    //     const semanas = [];

    //     aniosSinRepetirse.forEach((anio) => {
    //         const semanasSinRepetirse = promedios
    //         .filter(ele => ele.frente == frente && ele.anio == anio)
    //         .reduce((acum, actual) => {
    //             if (!acum.some(ele => ele == actual.semana)) {
    //                 acum.push(actual.semana);
    //             }
    //             return acum;
    //         }, []);

    //         semanasSinRepetirse.forEach((semana) => {
    //             semanas.push(anio + ' - ' + semana);
    //             const promedio = promedios
    //             .filter(ele => ele.frente == frente && ele.anio == anio && ele.semana == semana)
    //             .reduce((acum, actual) => {
    //             acum += actual.ponderado;
    //                 return acum;
    //             }, 0);
    //             const promedioFinal = promedio / promedios
    //             .filter(ele => ele.frente == frente && ele.anio == anio && ele.semana == semana).length;
    //             ponderados.push({ anio: anio, semana: semana, promedio: promedioFinal.toFixed(2) });
    //         });
    //     });

    //     const promedioFrente = [];

    //     ponderados.forEach((row, index) => {
    //         promedioFrente.push(
    //             {
    //                 x: (index + 1),
    //                 y: row.promedio
    //             }
    //         );
    //     });
    //     semanas.sort((a,b) => a > b ? 1 : -1);

    //     let maximaEstacion = 0;
    //     let minimaEstacion = 0;

    //     ponderados.forEach((row) => {
    //         if(row.promedio > maximaEstacion){
    //             maximaEstacion = row.promedio;
    //         }
    //         if(row.promedio < minimaEstacion){
    //             minimaEstacion = row.promedio;
    //         }
    //     });

    //     console.log(frente, maximaEstacion, minimaEstacion);

    //     const configuration = {
    //         type: 'line',
    //         data: {
    //           datasets: [{
    //             label: 'Cerradas',
    //             data: promedioFrente,
    //             backgroundColor: 'rgba(75, 192, 192, 0.6)',
    //             borderColor: 'rgba(75, 192, 192, 1)',
    //             showLine: true, // Esta opción une los puntos con una línea
    //           },
    //         ]
    //         },
    //         options: {
    //             plugins: {
    //                 background:{
    //                     color: 'rgba(228, 227, 206, 0.8)'
    //                 }
    //             },
    //           scales: {
    //             x: { 
    //                 type: 'linear', 
    //                 position: 'bottom' ,
    //                 title: {
    //                     display: true,               // Mostrar el título del eje X
    //                     text: 'Semana',      // Texto del título
    //                     color: '#000000',               // Color del título
    //                     font: {
    //                       size: 22,                  // Tamaño de la fuente
    //                       weight: 'bold',            // Grosor de la fuente
    //                     }
    //                 },
    //                 min: 1,               // Mínimo valor en el eje X
    //                 max: semanas.length,              // Máximo valor en el eje X
    //                 ticks: {
    //                   stepSize: 1,
    //                   callback: function(value, index, ticks){
    //                     return semanas[value - 1];
    //                   }
    //                 }
    //             },
    //             y: { 
    //                 type: 'linear',
    //                 title: {
    //                     display: true,               // Mostrar el título del eje X
    //                     text: 'Estaciones',      // Texto del título
    //                     color: '#000000',               // Color del título
    //                     font: {
    //                       size: 22,                  // Tamaño de la fuente
    //                       weight: 'bold',            // Grosor de la fuente
    //                     }
    //                 },
    //                 min: minimaEstacion,               // Mínimo valor en el eje X
    //                 max: maximaEstacion,              // Máximo valor en el eje X
    //                 ticks: {
    //                   stepSize: 5      // Intervalo entre cada marca de valor (tick) en X
    //                 }
    //             }
    //           }
    //         },
    //         plugins: [{
    //             id: 'custom_canvas_background_color',
    //             beforeDraw: (chart) => {
    //               const ctx = chart.ctx;
    //               ctx.save();
    //               ctx.globalCompositeOperation = 'destination-over';
    //               ctx.fillStyle = 'white'; // Color sólido de fondo (blanco en este caso)
    //               ctx.fillRect(0, 0, chart.width, chart.height);
    //               ctx.restore();
    //             }
    //           }]
    //     };
    //     const chart = await generarRenderizado(configuration, canvas);
    //     const b64 = chart.toString('base64');
    // }
    objetoGrafica = 2;
    return res.json({graficas: objetoGrafica, detalles: promedios});
});
ruta.post('/detalle/promedios', verificar, async(req,res) => {
    const datos = req.body.datos;
    const frentes = datos.frentes;
    const response = {};
    let fechasMatriz = {};
    let detallesMatriz = {};
    let consulta = `Select left(modulo, 4) as frente,  isnull(cast(ccedif as int),0) as ccedif
    From pomodulosobra m   where left(modulo,4) in (${frentes})
	group by ccedif, left(modulo, 4)
    Order by left(modulo, 4), cast(ccedif  as int)`
    const lineasProduccion = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    const objectoDetalle = {};
    const frenteDividio = frentes.split(',');
    console.log(frenteDividio);
    for(let i = 0; i < frenteDividio.length; i++){
        const frente = frenteDividio[i];
        const objetoLineas = {};
        for(let j = 0 ; j < lineasProduccion.filter(ele => ele.frente == frente).length; j++){
            const lp = lineasProduccion.filter(ele => ele.frente == frente)[j].ccedif;
            consulta = `select distinct '[' + cast(cast(secuencia as int) as varchar) + '_' + ubicacion + ']' ubicacion, ubicacion as normal, cast(va.secuencia as int) secuencia
            from vwAvanceObraNormalizada va 
            inner join poModulosObra pm on pm.modulo = va.modulo
            where frente = ${frente} and pm.ccedif = ${lp}
            order by cast(secuencia as int)`;
            const arregloUbicaciones = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
            let ubicaciones = arregloUbicaciones.reduce((acum, actual) => acum += actual.ubicacion + ',', "");
            ubicaciones = ubicaciones.substring(0, ubicaciones.length - 1);
            consulta = `select ubicacion, va.estacion, case when pc.diasPlan < 0 then 0 else pc.diasPlan end diasPlan
            , format(fechater, 'dd/MM/yyyy') fechater, datepart(wk, fechater) semana
            from vwAvanceObraNormalizada va
            inner join poModulosObra pm on pm.modulo = va.modulo
            inner join poCatalogoEstacionesFrente pc on pc.frente = va.frente and pc.modelo = va.modelo and pc.estacion = va.estacion
            where va.frente = ${frente} and pm.ccedif = ${lp}
            order by ubicacion, estacion, semana`;
            const detalle = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
            consulta = `select * from (
                select cast(cast(secuencia as int) as varchar) + '_' + ubicacion ubicacion, va.estacion, pc.descripcion as nombreestacion, case when pc.diasPlan < 0 then 0 else pc.diasPlan end diasPlan
                        , format(fechater, 'dd/MM/yyyy') fechater
                        from vwAvanceObraNormalizada va
                        inner join poModulosObra pm on pm.modulo = va.modulo
                        inner join poCatalogoEstacionesFrente pc on pc.frente = va.frente and pc.modelo = va.modelo and pc.estacion = va.estacion
                        where va.frente = ${frente} and pm.ccedif = ${lp}) consulta
                    pivot (max(fechater) for ubicacion in (${ubicaciones})) as pivote
                    order by estacion`;
            const fechas = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
            objetoLineas[lp] = fechas;
            objectoDetalle[lp] = detalle;
        }
        fechasMatriz[frente] = objetoLineas;
        detallesMatriz[frente] = objectoDetalle;
    }
    response['detalle'] = detallesMatriz;

    response['matriz'] = fechasMatriz;
    return res.json(response);
});

ruta.get('/diasLimite', verificar, async(req,res) => {
    const datos = req.body.datos;
    const consulta = `select * from limiteDiasPonderados`;
    try{
        const dias = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
        return res.json(dias);
    }catch(error){
        return res.status(500).send(error);
    }
})

ruta.post('/diasLimite', verificar, async(req,res) => {
    const datos = req.body.datos;
    const consulta = `delete limiteDiasPonderados; insert into limiteDiasPonderados values (${datos})`;
    try{
        await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
        return res.status(200).send({mensaje: "Datos modificados correctamente"});
    }catch(error){
        return res.status(500).send(error);
    }
})

module.exports = ruta;