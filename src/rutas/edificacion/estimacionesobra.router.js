const express = require('express');
const verificar = require('../../controladores/verificarToken.controller.js');
const procesadorConsultas = require('../../controladores/procesadorConsultas.controller.js');

const ruta = express.Router();

////////////////////////// CONSULTA DE DATOS //////////////////////////

ruta.post('/montopago/pagoetiquetado/estacion', verificar, async(req,res)=>{
    const datos = req.body.datos;
    let consulta = "Select d.explosionId,"
    consulta += " o.modulo, "
    consulta += " Isnull(p.razonsocial,'N/A') as proveedor,"
    consulta += "p.proveedorid, "
    consulta += "REPLACE(STR(o.manzana,3),' ','0')+' '+ REPLACE(STR(o.lote,3),' ','0')+' '+ REPLACE(STR(o.interior,3),' ','0') +' '"
    consulta += "+ REPLACE(STR(o.subinterior,2),' ','0') as ubicacion, "
    consulta += " d.fechater as semana,"
    consulta += "d.estacion+' '+ s.descripcion as estaciones,"
    consulta += "pagoEtiq as importemaximo,"
    consulta += "pagoEtiq as importeobra,"
    consulta += "(pagoEtiq*" + datos.anticipo + ") as anticipo,"
    consulta += "(pagoEtiq*" + datos.fondogarantia + ") as fondo,"
    consulta += "(pagoEtiq - pagoEtiq*" + datos.anticipo + " - pagoEtiq*" + datos.fondogarantia + ") as acumulado,"
    consulta += "isnull(co.ordencompraid,0) as ordencompraid,"
    consulta += "isnull(oc.folio,0) as foliooc "

    consulta += "FROM poAvanceObra d   "
    consulta += " inner join poAsignaObra pa on pa.explosionId = d.explosionId "
    consulta += " inner join proveedores p on p.proveedorid = pa.proveedorid and p.tipo like '%contratista%' "
    consulta += " Inner JOIN poLotesAsignados o on CAST(o.frente AS INT)=CAST(d.frente AS INT)      "
    consulta += " and CAST(o.manzana AS INT)=CAST(d.manzana AS INT)      and CAST(o.lote AS INT)=CAST(d.lote AS INT)     "
    consulta += " and CAST(o.interior AS INT)=CAST(d.interior AS INT)      and CAST(o.subinterior AS INT)=CAST(d.subinterior AS INT)   "
    consulta += " Inner JOIN poCatalogoEstacionesFrente s On            o.Modelo = s.Modelo And d.Estacion = s.Estacion and s.frente=" + datos.frente
    consulta += " Inner Join poContratosObra co on co.frente=" + datos.frente + "  and co.proveedorid = " + datos.proveedorid;
    consulta += " Inner join ordenescompra oc on oc.ordencompraid=co.ordencompraid and co.ordencompraid = " + datos.ordencompraid;
    consulta += " inner join poAvanceObraContratos de on de.idContrato = co.id and de.explosionId = d.explosionId"
      if (datos.pendientesavance == true) {
        consulta += " Where d.status<>'T'";
      }
      else {
        consulta += " Where d.status='T'";
      };
      if (datos.autorizacionpago) {
        consulta += "  and d.stamat='P'";
      }
      else {
        consulta += "  and d.stamat='1'";
      }
      if (datos.pendientesavance) {
        consulta += "   and d.fechaIni<='" + datos.fechacorte + "'";
      }
      else {
        consulta += "   and d.fechaTer<='" + datos.fechacorte + "'";
      }
        consulta += "           and d.frente=" + datos.frente + "";

      if (datos.ordencompraid > 0) {
        consulta += " and isnull(co.ordencompraid,0)=" + datos.ordencompraid;
      }
      consulta += " group by d.explosionId, o.modulo, p.RazonSocial, p.proveedorId, o.manzana, o.lote, o.interior, "
      + " o.subinterior, d.fechater, d.estacion, s.descripcion, pagoEtiq, amortAnt, retFG, co.ordencompraid, d.status, oc.folio"; 
    const datosEstimacionesPagos = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(datosEstimacionesPagos);
})

ruta.post('/estimaciones/especialidad', verificar, async(req,res)=>{
    const datos = req.body.datos;
    let consulta = "Select d.explosionId,"
    consulta += " o.modulo, "
    consulta += " Isnull(p.razonsocial,'N/A') as proveedor,"
    consulta += "p.proveedorid, "
    consulta += "REPLACE(STR(o.manzana,3),' ','0')+' '+ REPLACE(STR(o.lote,3),' ','0')+' '+ REPLACE(STR(o.interior,3),' ','0') +' '"
    consulta += "+ REPLACE(STR(o.subinterior,2),' ','0') as ubicacion, "
    consulta += " cast(d.fechater as date) as semana,"
    consulta += "d.estacion+' '+ s.descripcion as estaciones,"
    consulta += "pagoEtiq as importemaximo,"
    consulta += "pagoEtiq as importeobra,"
    consulta += "(pagoEtiq*" + datos.anticipo + ") as anticipo,"
    consulta += "(pagoEtiq*" + datos.fondogarantia + ") as fondo,"
    consulta += "(pagoEtiq - pagoEtiq*" + datos.anticipo + " - pagoEtiq*" + datos.fondogarantia + ") as acumulado,"
    consulta += "isnull(co.ordencompraid,0) as ordencompraid,"
    consulta += "isnull(oc.folio,0) as foliooc "

    consulta += "FROM poAvanceObra d   "
    consulta += " inner join poAsignaObra pa on pa.explosionId = d.explosionId "
    consulta += " inner join proveedores p on p.proveedorid = pa.proveedorid and p.tipo like '%contratista%' "
    consulta += " Inner JOIN poLotesAsignados o on CAST(o.frente AS INT)=CAST(d.frente AS INT)      "
    consulta += " and CAST(o.manzana AS INT)=CAST(d.manzana AS INT)      and CAST(o.lote AS INT)=CAST(d.lote AS INT)     "
    consulta += " and CAST(o.interior AS INT)=CAST(d.interior AS INT)      and CAST(o.subinterior AS INT)=CAST(d.subinterior AS INT)   "
    consulta += " Inner JOIN poCatalogoEstacionesFrente s On            o.Modelo = s.Modelo And d.Estacion = s.Estacion and s.frente=" + datos.frente
    consulta += " Inner Join poContratosObra co on co.frente=" + datos.frente + "  and co.proveedorid = " + datos.proveedorid;
    consulta += " Inner join ordenescompra oc on oc.ordencompraid=co.ordencompraid and co.ordencompraid = " + datos.ordencompraid;
    consulta += " inner join poAvanceObraContratos de on de.idContrato = co.id and de.explosionId = d.explosionId"
      if (datos.pendientesavance == true) {
        consulta += " Where d.status<>'T'";
      }
      else {
        consulta += " Where d.status='T'";
      };
      if (datos.autorizacionpago) {
        consulta += "  and d.stamat='P'";
      }
      else {
        consulta += "  and d.stamat='1'";
      }
      if (datos.pendientesavance) {
        consulta += "   and d.fechaIni<='" + datos.fechacorte + "'";
      }
      else {
        consulta += "   and d.fechaTer<='" + datos.fechacorte + "'";
      }
        consulta += "           and d.frente=" + datos.frente + "";

      if (datos.ordencompraid > 0) {
        consulta += " and isnull(co.ordencompraid,0)=" + datos.ordencompraid;
      }
      consulta += " group by d.explosionId, o.modulo, p.RazonSocial, p.proveedorId, o.manzana, o.lote, o.interior, "
      + " o.subinterior, d.fechater, d.estacion, s.descripcion, pagoEtiq, amortAnt, retFG, co.ordencompraid, d.status, oc.folio";
    const estimaciones = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(estimaciones);
})

ruta.get('/saldopendiente/:ordencompra', verificar, async(req,res)=>{
    const ordencompra = req.params.ordencompra;
    const consulta = "select pendiente from vwAplicacionPagos where folio = " + ordencompra;
    const saldoPendiente = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(saldoPendiente);
})

ruta.get('/fechacierre/:frente/:clavecierre', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const clavecierre = req.params.clavecierre;
    const consulta = "Select fechacierre "
    + " from cierres c  "
    + "  inner join catalogoCierres k on k.catcierreid=c.catcierreid"
    + "  where c.frente=" + frente
    + "   and c.autorizada=2"
    + "   and isnull(estatus,0)=1"  // activa
    + "   and  k.clave='" + clavecierre + "'"
    const fechaCierre = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(fechaCierre);
})

ruta.get('/foliopago/ultimo', verificar, async(req,res)=>{
    const consulta = "SELECT max(foliopagoid) as folioPagoId FROM foliospago";
    const ultimoFolioPago = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(ultimoFolioPago);
})

ruta.get('/ajuste/ordencompra/:proveedorid/:frenteid', verificar, async(req,res)=>{
    const proveedorid = req.params.proveedorid;
    const frenteid = req.params.frenteid;
    const consulta = "Select Sum(aj.monto) as monto "
    + " from ajustesOrdenesCompra aj "
    + "  Inner Join pocontratosObra c On c.ordencompraid=aj.ordencompraid"
    + "     and c.proveedorid=" + proveedorid + " and c.frenteid=" + frenteid
    + " Where aj.autorizada=1"
    const ajusteCompra = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(ajusteCompra);
})

ruta.get('/monto/ordencompra/:ordencompraid/:frenteid/:proveedorid', verificar, async(req,res)=>{
    const proveedorid = req.params.proveedorid;
    const frenteid = req.params.frenteid;
    const ordencompraid = req.params.ordencompraid;
    const consulta = "Select p.proveedorid, Upper(p.razonsocial)+ ' (' + Upper(p.nombre)+')' as razonsocial "
    + ",estaciones as lotes,monto as edificacion,extras as obraextra,materiales"
    + " ,totalordencompra as montocontrato,0 as modulo"
    + " ,oc.folio,oc.concepto,fondogarantia as fondo,c.anticipo,oc.total, oc.ordencompraid"
    + " ,0.00 as estimar, oc.pendiente,0.00 as ajustes"
    + " from proveedores p "
    + " Inner join poContratosObra c on c.proveedorid=p.proveedorid "
    + "  and c.frenteid=" + frenteid
    + "  and c.proveedorid=" + proveedorid
    + "   and c.ordencompraid=" + ordencompraid
    + " Inner join ordenescompra oc on oc.ordencompraid=c.ordencompraid "
    const datosOrdenCompra = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(datosOrdenCompra);
})

ruta.get('/contratos/frente/:frenteid/proveedor/:proveedorid', verificar, async(req,res)=>{
    const frenteid = req.params.frenteid;
    const proveedorid = req.params.proveedorid;
    const consulta = "Select p.proveedorid, Upper(p.razonsocial)+ ' (' + Upper(p.nombre)+')' as razonsocial "
    + ",estaciones as lotes,monto as edificacion,extras as obraextra,materiales"
    + " ,totalordencompra as montocontrato,0 as modulo"
    + " ,oc.folio,oc.concepto,fondogarantia as fondo,c.anticipo,oc.total, oc.ordencompraid"
    + " ,0.00 as estimar, oc.pendiente,0.00 as ajustes"
    + " from proveedores p "
    + " Inner join poContratosObra c on c.proveedorid=p.proveedorid "
    + "  and c.frenteid=" + frenteid
    + "  and c.proveedorid=" + proveedorid
    + " Inner join ordenescompra oc on oc.ordencompraid=c.ordencompraid and cancelada=0 "
    + " Order by  Upper(p.razonsocial)+ ' (' + Upper(p.nombre)+')' "
    const contratoEspecialidad = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(contratoEspecialidad);
})

ruta.get('/montoextra/contrato/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "Select proveedorid,extras as total"
    + " From poContratosObra"
    + "  where frente=" + frente
    + "  order by proveedorid"
    const pagoExtra = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(pagoExtra);
})

ruta.get('/obranegra/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "Select proveedorid as proveedorid,  monto as costo"
    + " from poContratosObra c"
    + "  where frente=" + frente
    + " Order by proveedorid";
    const obraNegraAvance = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(obraNegraAvance);
})

ruta.get('/anticipo/foliopago/:ordencompraid', verificar, async(req,res)=>{
    const ordencompraid = req.params.ordencompraid;
    const consulta = " select fechaprogramada,importe"
    + " ,(Select min(semana) from foliosaplicar ap where ap.ordencompraid=f.ordencompraid) as semana"
    + " from foliospago f "
    + " where ordencompraid=" + ordencompraid + " and aplicada=1 and cancelada=0 "
    + " and foliopagoid=(Select min(foliopagoid) from foliospago p where p.ordencompraid=f.ordencompraid and aplicada=1 and cancelada=0)"
    const anticipoFolioPago = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(anticipoFolioPago);
})

ruta.get('/pagos/:frente/:proveedorid/:ordencompraid', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const proveedorid = req.params.proveedorid;
    const ordencompraid = req.params.ordencompraid;
    let consulta =  " Select Distinct semana,foliopagoid,fechaprogramada,importe"
    consulta += " from vw_EstimacionesAutorizadas "
    consulta += "  where proveedorid=" + proveedorid
    consulta += "  and frente=" + frente + ""
    consulta += "  and foliopagoid>0"
    if (ordencompraid > 0) {
      consulta += "   and ordencompraid=" + ordencompraid
    }
    const pagoEstimaciones = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(pagoEstimaciones);
})

ruta.get('/foliopago/:ordencompraid/:importe', verificar, async(req,res)=>{
    const ordencompraid = req.params.ordencompraid;
    const importe = req.params.importe;
    const consulta =  "SELECT foliopagoid as folioPagoId FROM foliospago where ordencompraid=" 
    + ordencompraid + " and importe=" + importe + " and aplicada=0";
    const folioPagoId = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(folioPagoId);
})

ruta.get('/foliopago/pagoprevio/:proveedorid/:semana/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const semana = req.params.semana;
    const proveedorid = req.params.proveedorid;
    const consulta = "Select Distinct p.foliopagoid"
    + "  from poAvanceObraPago p"
    + "   Where p.proveedorid=" + proveedorid
    + "    And Left(p.semana,7)='" + semana
    + "'    And p.frente=" + frente
    + "   And p.foliopagoid>0"
    const pagosPrevios = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(pagosPrevios);
})

ruta.get('/estadocuenta/estimaciones/pdf/existentes/:frente/:semana/:proveedorid/:ordencompraid', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const proveedorid = req.params.proveedorid;
    const semana = req.params.semana;
    const ordencompraid = req.params.ordencompraid;
    //SE DEVUELVE EL ID Y EL TIPOSTREAM PARA EN VISTA, TOMAR SI ES QUE ES ESTADO DE CUENTA O ESTIMACIONES
    const consulta = "select id, tipostreamid, proveedorid as proveedorid from streams where tipostreamid in (3,6) and frente = " + frente
    + " and proveedorid = " + proveedorid + " and semana = '" + semana + "' and ordencompraid = " + ordencompraid;
    const hayPDFs = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(hayPDFs);

})

////////////////////////// INSERCION DE DATOS //////////////////////////

ruta.post('/foliopago', verificar, async(req,res)=>{
    const datos = req.body.datos;
    const consulta = "Insert Into foliospago (ordencompraid, fechaprogramada, importe, aplicada, cancelada, folioid, seleccionada,"
    + " estatus, fechacancelada) values("
    + datos.ordencompraid + ",getDate()," + datos.importePagar + ",0,0,0,0,0,'19000101')";
    const insercionDatos = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
    return res.status(200).send({mensaje: "Se insertaron los datos correctamente", result: insercionDatos});
})

ruta.post('/foliopago/ordenescompra/multiples', verificar, async(req,res)=>{
    const datos = req.body.datos;
    const consulta = " Insert Into foliospago (ordencompraid, fechaprogramada, importe, aplicada, cancelada, folioid, seleccionada, estatus, fechacancelada) "
    + " values(" + datos.ordencompraid + ",getDate()," + datos.estimar + ",0,0,0,0,0,'19000101')";
    const insercionDatos = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
    return res.status(200).send({mensaje: "Se insertaron los datos correctamente"});
})

ruta.post('/avancepago', verificar, async(req,res)=>{
    const datos = req.body.datos;
    let consulta = ""
    datos.forEach(ele => {
      consulta += ` if not exists (select * from poavanceobrapago where explosionid = ${ele.explosionId})
      begin
        Insert into poAvanceObraPago 
        (folio,frente,proveedorid,explosionid,fecha,semana,monto,anticipo,fondogarantia,foliopagoid,tipo, usuarioid)
        values(1,'${ele.frente}', ${ele.proveedorid}, ${ele.explosionId}, getDate(),'${ele.semanaPago}', ${ele.importeobra}
        ,${(ele.importeobra * ele.anticipo / 100)},${(ele.importeobra * ele.fondo / 100)}, ${ele.folioPagoId}, 'Obra', ${ele.usuarioid})
      end`;
    })
    const insercionDatos = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
    return res.status(200).send({mensaje: "Datos insertados correctamente", result: insercionDatos});
})


////////////////////////// MODIFICACION DE DATOS //////////////////////////


ruta.put('/estacion/estatuspago/pagado', verificar, async(req,res)=>{
    const datos = req.body.datos;
    let consulta = "";
    datos.forEach((element) => {
      consulta += "Update poAvanceObra Set staMat='A' Where explosionId=" + element.explosionId;
    })
    const registrosAfectados = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
    if(registrosAfectados > 0) return res.status(200).send({mensaje: "Se modificaron los datos correctamente"});
    else return res.status(500).send({mensaje: "No se pudieron modificar los datos"});
})

ruta.put('/estacion/estatuspago/seleccionadopago', verificar, async(req,res)=>{
    const datos = req.body.datos;
    let consulta = ""
    datos.forEach((ele) => {
      consulta += "Update poAvanceObra Set staMat='1' Where explosionId=" + ele.explosionId;
    });
    const registrosAfectados = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
    if(registrosAfectados > 0) return res.status(200).send({mensaje: "Registros modificados correctamente"});
    else return res.status(500).send({error: "No se modificó ningún registro"});
})

ruta.put('/estacion/avancepago', verificar, async(req,res)=>{
    const datos = req.body.datos;
    // let consulta = ""; "Update poAvanceObraPago "
    // + " Set folioPagoId=" + datos.folioPagoId
    // + ", semana='" + datos.semanaPago + "' "
    // + " Where explosionid=" + datos.explosionId;
    let consulta = "";
    datos.forEach(element => {
      consulta += `Update poAvanceObraPago set foliopagoid = ${element.folioPagoId}, semana = '${element.semanaPago}'
      where explosionid = ${element.explosionId}; `;
    });
    const registrosAfectados = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
    if(registrosAfectados > 0) return res.status(200).send({mensaje: "Se modificaron los datos correctamente"});
    else return res.status(500).send({error: "No se pudieron modificar los registros"});
})

ruta.put('/ordencompra', verificar, async(req,res)=>{
    const datos = req.body.datos;
    const consulta = "Update ordenesCompra Set pendiente = pendiente-" + datos[0].neto
    + " Where ordencompraid = " + datos[0].ordencompraid;
    const registrosAfectados = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
    if(registrosAfectados > 0) return res.status(200).send({mensaje: "Registros modificados correctamente"});
    else return res.status(500).send({mensaje: "No se modificó ningún registro"});
})

ruta.put('/foliopago', verificar, async(req,res)=>{
    const datos = req.body.datos;
    const consulta = "Update foliospago Set importe=" + datos.monto + " where foliopagoid=" + datos.folio
    const registrosAfectados = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
    if(registrosAfectados > 0) return res.status(200).send({mensaje: "Registros modificados"});
    else return res.status(500).send({error: "No se modificó ningún registro"});
})
////////////////////////// BAJA DE DATOS //////////////////////////

ruta.delete('/reporte/:frente/:semana/:proveedorid/:tipodocumento', verificar, async(req,res)=>{
  const frente = req.params.frente;
  const proveedorid = req.params.proveedorid;
  const semana = req.params.semana;
  const tipodocumento = req.params.tipodocumento;
  //SE DEVUELVE EL ID Y EL TIPOSTREAM PARA EN VISTA, TOMAR SI ES QUE ES ESTADO DE CUENTA O ESTIMACIONES
  const consulta = "delete streams where frente = " + frente
  + " and proveedorid = " + proveedorid + " and semana = '" + semana + "' and tipostreamid = " + tipodocumento;
  // const registrosAfectados = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
  return res.status(200).send({mensaje:"Se eliminaron los datos correctamente"});
  /** 
  if(registrosAfectados > 0) return res.status(200).send({mensaje:"Se eliminaron los datos correctamente"});
  else return res.status(500).send({error: "No se eliminó ningún dato"});*/

})


///////////////////////// MODALES ESTIMACIONES Y ESTADO DE CUENTA /////////////////////////////

ruta.get('/estadocuenta/desglosado/:consulta', verificar, async(req,res)=>{
    const consulta = req.params.consulta;
    const datosEstadoCuenta = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(datosEstadoCuenta);
})


module.exports = ruta;