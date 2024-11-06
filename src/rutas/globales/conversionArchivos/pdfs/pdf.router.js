const verificar = require('../../../../controladores/verificarToken.controller.js');
const procesadorConsultas = require('../../../../controladores/procesadorConsultas.controller.js');
const express = require('express');
const { manejarLogs } = require('../../../../Logs/manejadorLogs.controller.js');
const ruta = express.Router();
var path = require('path');
const rutaArchivo = path.resolve('C:/Users/Administrador/Desktop/Proyecto Reingenieria/nodejs/spvnet_api_nodejs/src/rutas/Globales/ConversionArchivos/pdfs/pdf.router.js');

function obtenerIP(req, address){
    const ip = req.header('x-formwarded-for') || address;
    const ipCliente = ip.substring(7,ip.length)
    return ipCliente
}

    

ruta.get('/disenoprogobra/pagosetiquetados/:frente', verificar, async(req,res)=>{    
    const frente = req.params.frente;
    const consulta = " Select proveedorid,razonsocial,modulo,modelo,estacion"
    + " ,extraproveedor"
    + " ,viviendas,financieros"
    + " ,contratista"
    + " from fn_PagosEtiquetados(" + frente + ") "
    + " order by razonsocial,estacion,modulo,modelo"

    const ipCliente = obtenerIP(req, req.socket.remoteAddress)
    manejarLogs(consulta, "Diseño de ProgObra", rutaArchivo, "", ipCliente);

    const costoxestacion = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(costoxestacion);
})

ruta.get('/plantillaLV/porcentajes/estaciones/:frente/:clavemodelo/:especid', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const clavemodelo = req.params.clavemodelo;
    const especid = req.params.especid;
    const agruparPorEspecid = parseInt(especid) > 0 ? " and c.espera=" + especid : ''
    const consulta = " Select c.espera,e.descripcion,c.estacion+' '+c.descripcion as estacion,c.porcentaje "
    + " from   pocatalogoestacionesfrente c "
    + " inner join espec e  on e.especid=c.espera "
    + " Where c.frente=" + frente + " and  c.modelo='" + clavemodelo + "' and c.estacion=c.estacion  " + agruparPorEspecid
    + " Order by c.espera,c.estacion+' '+c.descripcion  ";


    const ipCliente = obtenerIP(req, req.socket.remoteAddress)
    manejarLogs(consulta, "Plantilla Lista de Verificación", rutaArchivo, "", ipCliente);

    const porcentajes = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(porcentajes);
})

ruta.get('/contenidopdf/:id', verificar, async(req,res)=>{
    const id = req.params.id;
    const consulta = "Select contenido from streams where id=" + id;

    const ipCliente = obtenerIP(req, req.socket.remoteAddress)
    manejarLogs(consulta, "Estimaciones de Obra", rutaArchivo, "", ipCliente);

    const contenidoPDF = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta)
    return res.json(contenidoPDF);
})
//CONSULTA DE DATOS, PERO CON POST
ruta.post('/estimacionesobra/estimaciones', verificar, async(req,res)=>{
    const datos = req.body.datos;
    let consulta = `Select semana,
    max(ap.fecha) as fechapago, sum(ap.monto) as monto,sum(ap.anticipo) as anticipo,sum(ap.fondogarantia) as fondogarantia ,'Obra' as origen
        from poavanceObraPago ap
        inner join foliospago f on f.foliopagoid = ap.foliopagoid
        inner join ordenescompra oc on oc.ordencompraid = f.ordencompraid
        Where ap.proveedorId=${datos.proveedorid} and ap.frente= ${datos.frente} and oc.ordencompraid = ${datos.ordencompraid} and f.foliopagoid>0
    group by semana
    union all         
    Select ap.semana as semana,ap.fecha as fechapago,ap.monto,ap.anticipo,ap.fondogarantia
        ,'Materiales' as origen
        from poavanceObraPagoMateriales ap
        inner join foliospago f on f.foliopagoid = ap.foliopagoid
        inner join ordenescompra oc on oc.ordencompraid = f.ordencompraid
    Where ap.proveedorId=${datos.proveedorid} and frente=${datos.frente} and oc.ordencompraid = ${datos.ordencompraid} and tipo='Materiales'`

    if (datos.estimacionesdesglosadas) {
      consulta += "  Union All ";
      consulta += "  Select  isnull(cast(fa.semana as char(18)),'Programada p/Pago')   as semana,fp.fechaprogramada as fechapago";
      consulta += "  , fp.importe as monto,0 as anticipo,0 as fondogarantia";
      consulta += "   ,'Anticipo' as origen ";
      consulta += "  from foliospago fp ";
      consulta += "  left join foliosaplicar fa on fa.foliopagoid=fp.foliopagoid and fa.ordencompraId=fp.ordencompraid";
      consulta += "  where fp.ordencompraid=" + datos.ordencompraid;
      consulta += "   and cancelada=0 ";
      consulta += "    and  isnull(";
      consulta += "    (Select distinct foliopagoid from poavanceObraPagoMateriales m where m.foliopagoid=fp.foliopagoid ) ,0)=0";
      consulta += "    and isnull(";
      consulta += "    (Select distinct foliopagoid from poavanceObraPago m where m.foliopagoid=fp.foliopagoid ) ,0) = 0 ";
    }
    consulta += "  Order by semana, origen"; 
    const ipCliente = obtenerIP(req, req.socket.remoteAddress)
    manejarLogs(consulta, "Estimaciones de Obra", rutaArchivo, "", ipCliente);

    const datosPDF = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(datosPDF);
})

ruta.get('/estimacionesdeobra/estimacionessemanales/:frente/:semana/:proveedorid/:ordencompraid', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const semana = req.params.semana;
    const proveedorid = req.params.proveedorid;
    const ordencompraid = req.params.ordencompraid;
    const consulta= "Select id, nombrearchivo from streams where frente=" + frente + " and proveedorid=" + 
    proveedorid + " and tipostreamid=3 and semana='" + semana + "' and ordencompraid = " + ordencompraid;
    const datosPDF = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(datosPDF);
})

ruta.get('/estimacionesobra/estimaciones/semanal/:frente/:proveedorid/:ordencompraid', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const proveedorid = req.params.proveedorid;
    const ordencompraid = req.params.ordencompraid;
    const consulta = `Select semana,
    max(ap.fecha) as fechapago, sum(ap.monto) as monto,sum(ap.anticipo) as anticipo,sum(ap.fondogarantia) as fondogarantia ,'Obra' as origen
        from poavanceObraPago ap
        inner join foliospago f on f.foliopagoid = ap.foliopagoid
        inner join ordenescompra oc on oc.ordencompraid = f.ordencompraid
        Where ap.proveedorId=${proveedorid} and ap.frente= ${frente} and oc.ordencompraid = ${ordencompraid} and foliopagoid>0
    group by semana
    union all         
    Select ap.semana as semana,ap.fecha as fechapago,ap.monto,ap.anticipo,ap.fondogarantia
        ,'Materiales' as origen
        from poavanceObraPagoMateriales ap
        inner join foliospago f on f.foliopagoid = ap.foliopagoid
        inner join ordenescompra oc on oc.ordencompraid = f.ordencompraid
    Where proveedorId=${proveedorid} and frente=${frente} and oc.ordencompraid = ${ordencompraid} and tipo='Materiales'
    `
    console.log(consulta);
    const datosPDF = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(datosPDF);
})
//DEVUELVE UNA CONSULTA EN CASO DE QUE NO EXISTAN REPORTES EN ESA TABLA (DE LO CONTRARIO, DEVUELVE ESE MISMO REPORTE EXISTENTE)
ruta.get('/estimacionesobra/estadocuenta/existente/:frente/:proveedorid/:semana', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const proveedorid = req.params.proveedorid;
    const semana = req.params.semana;
    const consulta = "Select id, nombrearchivo from streams where frente=" + frente + " and proveedorid="
    + proveedorid + " and tipostreamid=6  and semana='" + semana + "'";

    const ipCliente = obtenerIP(req, req.socket.remoteAddress)
    manejarLogs(consulta, "Estimaciones de Obra", rutaArchivo, "", ipCliente);

    const comprobarPdfExistente = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    if(comprobarPdfExistente.length > 0) return res.json(comprobarPdfExistente)
    else {
        const consultaReporteSemanal = "Select semana,"
        + " max(fecha) as fechapago, sum(monto) as monto,sum(anticipo) as anticipo,sum(fondogarantia) as fondogarantia"
        + " ,'Obra' as origen"
        + " from poavanceObraPago"
        + " Where proveedorId=" + proveedorid
        + "  and frente=" + frente
        + "  and semana<='" + semana + "'"
        + "  and foliopagoid>0"
        + "  group by semana"
        // RICARDO
        + " Union  All"
        + " Select semana as semana,fecha as fechapago,monto,anticipo,fondogarantia"
        + " ,'Materiales' as origen"
        + " from poavanceObraPagoMateriales"
        + " Where proveedorId=" + proveedorid
        + "  and frente=" + frente
        + "  and tipo='Materiales'"   // Anticipo Extra
        + "  and semana<='" + semana + "'"  
        + "  Order by max(fecha)";

        const ipCliente = obtenerIP(req, req.socket.remoteAddress)
        manejarLogs(consulta, "Estimaciones de Obra", rutaArchivo, "", ipCliente);

        return res.json({consulta: consultaReporteSemanal});
    }
})



///////////////////////////////////// INSERCIÓN DE DATOS ///////////////////////////////////
ruta.post('/estimacionesobra/reportes', verificar, async(req,res)=>{
    const datos = req.body.datos;
    const consulta = "Insert Into streams (origen, tipostreamid, frente, proveedorid, ordencompraid, nombrearchivo, contenido, semana) Values("
    + "'ESTADO DE CUENTA',"
    + datos.documento + ","   // ECTA CONTRATISTA
    + datos.frente + ","
    + datos.proveedorid + ","
    + datos.ordencompraid + ","
    + "'" + datos.nombrearchivo + "', convert(varchar(MAX),'"
    + datos.contenido + "'),"
    + "'" + datos.semana + "')";
    try{
        const insercionDatos = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
    }catch(error){
        if(error){
            manejarLogs(consulta, "Estimaciones de Obra", rutaArchivo, error, ipCliente);
            return res.status(500).send({error: "Error al insertar los datos", descripcion: error});
        }
    }

    const ipCliente = obtenerIP(req, req.socket.remoteAddress)
    manejarLogs(consulta, "Estimaciones de Obra", rutaArchivo, "", ipCliente);
    
    return res.status(200).send({mensaje: "Datos insertados correctamente"});
})

module.exports = ruta;