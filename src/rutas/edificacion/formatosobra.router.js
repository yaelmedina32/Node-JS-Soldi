const express = require('express');
const verificarToken = require('../../controladores/verificarToken.controller.js');
const procesadorConsultas = require('../../controladores/procesadorConsultas.controller.js');
const convertidor = require('convert-base64-to-image');
const fs = require('fs');

const ruta = express.Router();

// ---------------------------------- CONSULTA DE DATOS ----------------------------------

ruta.get('/formato/id/:formato', verificarToken, async(req,res)=>{
    const formato = req.params.formato;
    const consulta = `Select formatoid From poFormatos Where codigo='${formato}'`;
    const formatoid = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(formatoid);
})

ruta.get('/resultadoid/formatoid/:formatoid/:explosionid',verificarToken, async(req,res)=>{
    const formatoid_ = req.params.formatoid;
    const explosionid_ = req.params.explosionid;
    const consulta = `Select resultadoid from poFormatosResultado2
    Where formatoid =  ${formatoid_}  and explosionid =  ${explosionid_}
    Order by resultadoid desc`;
    const resultadoid = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(resultadoid);
});

ruta.get('/estatusformato/:formato/:explosionid', verificarToken, async(req,res)=> {
    const formato = req.params.formato;
    const explosionid = req.params.explosionid;

    let consulta = ''
    if(explosionid == -1){
        consulta = `Select codigo, definicionid, Left(titulo,75) as titulo, numero
        , tarea ,tipo from vwFormaObra
        Where codigo='${formato}'
        order by numero`;
    }else{
        consulta = `Select estatus from poFormatosResultado2 where estatus=1 and explosionid = ${explosionid};`;
    }
    const estatus = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(estatus);
});

ruta.get('/intentomax/:explosionid/:formato/:rolestacion', verificarToken, async(req,res)=> {
    const explosionid = req.params.explosionid;
    const rolestacion = req.params.rolestacion;
    const formato = req.params.formato;
    const consulta = `select isnull(max(noIntento), 0) as intento
    from poIntentosFormatos pei
    inner join poFormatosResultado2 pf on pf.resultadoid = pei.resultadoId
    where pf.explosionId = ${explosionid} and codigo = '${formato}' and rolId = ${rolestacion}`;
    const intentoMax = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(intentoMax);
});

ruta.post('/capturas/rol', verificarToken, async(req,res)=> {
    const datos = req.body.datos;
    const consulta = `select pd.tipo, pc.valor, pif.rolId from poCapturaFormatos pc
    inner join poFormatosDefinicion pd on pd.definicionid = pc.definicionId
    inner join poIntentosFormatos pif on pif.idIntento = pc.idIntento
    inner join poFormatosResultado2 pr on pr.resultadoid = pif.resultadoId
    where pif.rolId = ${datos.rolEstacion} and pr.explosionid = ${datos.explosionid}
    and pr.codigo = '${datos.formato}' and pif.noIntento = ${datos.oportunidadActual}`;      
    const capturaFormatos = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(capturaFormatos);
})

ruta.get('/actividadid/:explosionid/:numeroactividad/:rolestacion', verificarToken, async(req,res)=>{
    const explosionid = req.params.explosionid;
    const numeroactividad = req.params.numeroactividad;
    const rol = req.params.rolestacion;
    const consulta = `select id from poavanceobratareas where explosionid = ${explosionid} and numero = ${numeroactividad} and rolId = ${rol}`;
    const actividadid = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(actividadid);
})

ruta.get('/resultadoid/codigo/:explosionid/:formato/:rolid', verificarToken, async(req,res)=>{
    const explosionid = req.params.explosionid;
    const formato = req.params.formato;
    const rolid = req.params.rolid;
    const consulta = `Select distinct pr.resultadoid from poFormatosResultado2 pr
    inner join poIntentosFormatos pf on pf.resultadoid = pr.resultadoid
    Where pr.explosionid= ${explosionid} and pr.codigo = '${formato}' and rolid = ${rolid}`;
    const resultadoId = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(resultadoId);
});

ruta.get('/valores/formato/:formato', verificarToken, async(req,res)=>{
    const formato = req.params.formato;
    const consulta = `Select codigo, definicionid, Left(titulo,75) as titulo, numero, tarea
    ,tipo, valores, etiquetas, oportunidades
    , firmasincluir,isnull(fechasprogramadas,0) as fechasprogramadas
    from vwFormaObra
    Where codigo='${formato}'
    order by numero`
    const valores = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(valores);
})

ruta.get('/formatoid/formato/:formato', verificarToken, async(req,res)=> {
    const formato = req.params.formato;
    const consulta = `Select formatoid From poFormatos Where codigo='${formato}'`;
    const formatoid = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(formatoid);
});

ruta.get('/idintento/:resultadoid/:rol/:nointento', verificarToken, async(req,res)=> {
    const resultadoid = req.params.resultadoid;
    const rol = req.params.rol;
    const nointento = req.params.nointento;
    const consulta = `select idIntento, 'Insertado' as estatus  from poIntentosFormatos where resultadoid = ${resultadoid}
    and rolId = ${rol} and noIntento = ${nointento}
    union all 
    select MAX(idIntento), 'Maximo' as estatus from poIntentosFormatos `;
    const idIntento = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta)
    return res.json(idIntento);
})

ruta.get('/roles/:explosionid/:formato', verificarToken, async(req,res)=>{
    const explosionid = req.params.explosionid;
    const formato = req.params.formato;
    const consulta = `select pr.descripcion, pr.rolId, pra.secuencia, pr.descripcioncorta from poAvanceObra po
    inner join poLotesAsignados pl on pl.frente = po.frente and pl.manzana = po.manzana and pl.lote = po.lote
    and pl.interior = po.interior and pl.subinterior = po.subinterior
    inner join modelos m on m.clavemodelo = pl.modelo
    inner join polistaverificacion2 pla on pla.frente = po.frente and pla.estacion = po.estacion and pla.modelo = m.nombre
    inner join poRolesActividadesAvanceObra pra on pra.actividadId = pla.id
    inner join poRolesAvanceObra pr on pr.rolId = pra.rolId
    where po.explosionId = ${explosionid} and pla.codigo = '${formato}' `;
    const roles = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(roles);
});

ruta.get('/cantidadrechazos/:explosionid/:rolid/:noAct', verificarToken, async(req,res) => {
    const numeroAct = req.params.noAct;
    const explosionid = req.params.explosionid;
    const rolid = req.params.rolid;
    const consulta = `select bitacoraId, rolid, usuarioid from vwBitacoraAvance
    where explosionid = ${explosionid} and rolid = ${rolid} and numeroActividad = ${numeroAct}`;
    const rechazos = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(rechazos);
})

ruta.get('/modulos/:explosionid', verificarToken, async(req,res)=> {
    const explosionid = req.params.explosionid;
    const consulta = `Select e.explosionid, a.modulo, a.frente
    ,REPLACE(STR(a.manzana,3),' ','0')+'-'+REPLACE(STR(a.LOTE,3),' ','0')+'-'+REPLACE(STR(a.interior,3),' ','0')+'-'+REPLACE(STR(a.subinterior,2),' ','0') as ubicacion
    From poLotesAsignados a 
    Inner join poAvanceObra e on e.frente=a.frente
    and  cast(e.manzana as int)=cast(a.manzana as int)
    and cast(e.lote as int)=cast(a.lote as int)
    and cast(e.interior as int)=cast(a.interior as int)
    and cast(e.subinterior as int)=cast(a.subinterior as int)
    where e.explosionid = '${explosionid}'
    `;
    const modulos = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(modulos);
})

ruta.get('/firmas/:explosionid/:formato', verificarToken, async(req,res)=>{
    const explosionid = req.params.explosionid;
    const formato = req.params.formato;
    const consulta = `select pf.* from poFormatosResultado2 pr 
    left join pofirmasformatos pf on pr.resultadoid = pf.resultadoid
    where explosionid = ${explosionid} and codigo = '${formato}'
    `;
    const firmas = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(firmas);
})

ruta.get('/firmas/:frente/:ubicacion/:estacion/:formato', (req,res)=>{
    function leerArchivos(ruta){
        return new Promise((resolve, reject) => {
            let firmasReponse = [];
            fs.readdir(ruta, (error, archivos) => {
                if(error){
                    return reject(error);
                }
                for(let archivo of archivos){
                    fs.readFile(ruta + '/' + archivo, (error, contenido) => {
                        if(error){
                            return reject(error);
                        }
                        let buffer = Buffer.from(contenido)
                        buffer = buffer.toString('base64');
                        firmasReponse.push({ rol: archivo.substring(5, archivo.length - 4), firma:  buffer });
                        if(firmasReponse.length === archivos.length) resolve(firmasReponse);
                    })
                }
            })  
        })
    }
    const frente = parseInt(req.params.frente);
    const ubicacion = req.params.ubicacion;
    const estacion = req.params.estacion;
    const formato = req.params.formato;
    try{
        const ruta = `src/IMAGENES/F-${parseInt(frente)}/${ubicacion}/${estacion}/${formato}`;
        leerArchivos(ruta).then((respuesta) => {
            return res.json(respuesta);
        }).catch((error) => {
            if(error){
                return res.json([]);
            }
        })
    }catch(error){
        if(error){
            return [];
        }
    }
});


ruta.get('/rechazosmaximos/:explosionid/:codigo', verificarToken, async(req,res)=>{
    const explosionid = req.params.explosionid;
    const codigo = req.params.codigo;
    const consulta = `select rechazosMax from poAvanceObra po 
    inner join poLotesAsignados pl on pl.frente = po.frente and pl.manzana = po.manzana 
    and pl.lote = po.lote and pl.interior = po.interior and pl.subinterior = po.subinterior 
    inner join modelos m on m.clavemodelo = pl.modelo  
    inner join polistaverificacion2 pla on pla.frente = po.frente and pla.estacion = po.estacion and pla.modelo = m.nombre 
    where po.explosionId = ${explosionid} and pla.codigo = '${codigo}'`;
    const rechazosMaximos = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(rechazosMaximos);
})

ruta.get('/numeroactividad/:formato', verificarToken, async(req,res)=> {
    const formato = req.params.formato;
    const consulta = `Select numero from poListaVerificacion where codigo='${formato}'`;
    const numeroactividad = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(numeroactividad);
})

ruta.get('/resultadoid/maxoportunidad', verificarToken, async(req,res)=>{
    const consulta = `select resultadoid from vwformatosestatus v where resultado=1
    and oportunidad = (Select max(oportunidad) from vwformatosestatus f where f.explosionid=v.explosionid)` 
    const resultadoid = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(resultadoid);
})
//ESTE ENDPOINT LO ADAPTO A COMO LO TENGO EN KLA APLICACIÓN EN BASE A LA ESTACIÓN, YA QUE EN LA APLICACIÓN MANEJO ESTACION + ' ' + DESCRIPCION
ruta.get('/estacion/:explosionid', verificarToken, async(req,res)=> {
    const explosionid = req.params.explosionid;
    const consulta = `select v.estacion, v.estacion + ' ' + pc.descripcion descripcion from vwAvanceObraModuloModelo v
    inner join poCatalogoEstacionesFrente pc on pc.frente = v.frente and pc.modelo = v.modelo and pc.estacion = v.estacion
    where v.explosionid = ${explosionid}`
    const resultado = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json({estacion: resultado[0].estacion, descripcion: resultado[0].descripcion});
})

ruta.post('/formato/insertado', verificarToken, async(req,res) => {
    const datos = req.body.datos;
    const consulta = `select count(*) inserciones from vwAvanceObraNormalizada po
    inner join poavanceobratareas pt on pt.explosionid = po.explosionid
    where po.frente = ${datos.frente} and ubicacion = '${datos.ubicacion}' and estacion = ${datos.estacion.substring(0, 3)}
    and pt.numero = ${datos.numero} and pt.rolid = ${datos.rolid}`;
    const resultado = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(resultado);
})

ruta.post('/datoscapturados', verificarToken, async(req,res)=>{
    //LA IDEA DE ESTE ENDPOINT ES MOSTRAR LOS 2 ANTERIORES EN CASO DE QUE NO HAYAN TERMINADO, Y EL ULTIMO INTENTO SE VA A COPIAR PERO COMO UN INTENTO + 1
    const datos = req.body.datos;
    //SI ES EL SEGUNDO INTENTO, FUERZO A QUE ELIJA EL PRIMER INTENTO PARA QUE AGARRE LOS DEL PRIMER INTENTO
    let validador = `union all
    Select distinct c.definicionid, d.oportunidades, ${datos.readonly != true ? "pif.noIntento + 1" : "pif.noIntento"} oportunidad, pif.rolId, c.valor, d.tipo , pif.nointento
    from poCapturaFormatos c
    inner join poIntentosFormatos pif on pif.idIntento = c.idIntento
    inner join poFormatosResultado2 r  On r.resultadoid=pif.resultadoid
    inner join poFormatosDefinicion d   On d.definicionid=c.definicionid
    inner join poFormatos           f   On f.formatoid=d.formatoid     and f.codigo= '${datos.formato}'
    Where r.explosionid = ${datos.explosionid} and pif.rolId = ${datos.rol} and pif.noIntento in` 
    + (datos.readonly != true  
        //SI ES EL SEGUNDO INTENTO, LE DIGO QUE TOME NADA MÁS EL ANTERIOR PARA COPIAR EL PRIMER INTENTO Y MOSTRARLO COMO EL 2DO INTENTO
        ? datos.oportunidad != 2 
            ? ` (${datos.intentos[datos.intentos.length - 1]})` 
            : `(1)` 
            //EN CASO DE QUE YA HAYA SIDO INSERTADO, ENTONCES EN VEZ DE COPIAR LOS RESULTADOS ANTERIORES, VA A COPIAR EL DE LA OPORTUNIDAD ACTUAL
        : `(${datos.intentos[datos.intentos.length - 1] + 1})`);
        //EN CASO DE QUE YA SEA UNA SECUENCIA MAYOR A LA ACTUAL, ENTONCES TÓMO LA SECUENCIA ANTERIOR POR MEDIO DE UNA VISTA QUE SACA LAS SECUENCIAS DE ESA VISTA 
    let consulta = `Select distinct c.definicionid, d.oportunidades, pif.noIntento oportunidad, 
    ${datos.secuencia > 1 && datos.oportunidad == 1 ? `(select min(rolid) from vwSecuenciaActividadesObra where secuenciaRol = ${datos.secuencia} and explosionid = r.explosionid) ` : `pif.rolId`} rolId, c.valor, d.tipo , pif.nointento
    from poCapturaFormatos c
    inner join poIntentosFormatos pif on pif.idIntento = c.idIntento
	inner join poRolesActividadesAvanceObra pra on pra.rolId = pif.rolId
    inner join poFormatosResultado2 r  On r.resultadoid=pif.resultadoid
    inner join poFormatosDefinicion d   On d.definicionid=c.definicionid
    inner join poFormatos           f   On f.formatoid=d.formatoid     and f.codigo= '${datos.formato}'
    Where r.explosionid = ${datos.explosionid} and pif.rolId = 
    ${datos.secuencia > 1 && datos.oportunidad == 1 ? `(select min(rolid) from vwSecuenciaActividadesObra where secuenciaRol = ${datos.secuencia - 1} and explosionid = r.explosionid)` : datos.rol} and pif.noIntento 
    in (${datos.secuencia > 1 && datos.oportunidad == 1 ? `(select MAX(noIntento) from poIntentosFormatos pef 
    inner join poFormatosResultado2 pre on pre.resultadoid = pef.resultadoId
    inner join poRolesActividadesAvanceObra prac on prac.rolId = pef.rolId
    where pre.explosionid = r.explosionid and pre.codigo = r.codigo and prac.secuencia = pra.secuencia - 1)`
    : datos.intentos}) ` + validador;
    let capturaDatos = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(capturaDatos);
})

// ---------------------------------- INSERCIÓN DE DATOS ----------------------------------

ruta.post('/rechazotarea', verificarToken, async(req,res)=> {
    const datos = req.body.datos;
    let consulta = `Insert Into poBitacoraRechazosTareas (frente, estacion, manzana, lote, interior, subinterior, numeroActividad , rolId, usuarioid, fechaRechazo, estatus)
    select frente, estacion, manzana, lote, interior, subinterior, ${datos.numeroActividad}, ${datos.rolEstacion}, ${datos.usuarioid}, getDate(), 
    '${datos.capturaInicial ? 'inicial' : 'posterior'}'
    from poAvanceObra where explosionid = ${datos.explosionid};`
    if(!datos.capturaInicial){
        consulta = ""
        if(datos.capturaCorrecta){
            consulta = "delete poBitacoraRechazosTareas where bitacoraId = (select MAX(bitacoraId) from poBitacoraRechazosTareas)";
        }else{
            consulta = `update poBitacoraRechazosTareas set estatus = 'posterior' 
            where bitacoraId = (select bitacoraId from vwBitacoraAvance where
            explosionid = ${datos.explosionid } and numeroActividad = ${datos.numeroActividad} and rolid = ${datos.rolEstacion})`;
        }
    }
    else{
        if(!datos.capturaCorrecta){
            consulta += `update poBitacoraRechazosTareas set estatus = 'posterior' 
            where bitacoraId = (select bitacoraId from vwBitacoraAvance where
            explosionid = ${datos.explosionid } and numeroActividad = ${datos.numeroActividad} and rolid = ${datos.rolEstacion})`;
            console.log(consulta);
        }
    }
    try{
        if(consulta != ""){
            const resultado = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
            return res.status(200).send({mensaje: "Datos modificados correctamente", resultado: resultado});
        }
        return res.json(null);
    }catch(error){
        if(error){
            return res.status(400).send({mensaje: "Error en el servidor", error: error});
        }
    }
})

ruta.post('/avancetarea', verificarToken, async(req,res)=> {
    const datos = req.body.datos;
    const consulta = `insert into poavanceobratareas (frente, explosionid, numero, fecha, usuarioid, rolId, secuencia) values 
    ('${datos.frente.trim()}', ${datos.explosionid}, ${datos.numeroactividad}, getDate(), ${datos.usuarioid}, ${datos.rol}, ${datos.secuencia})`;
    try{
        const resultado = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
        return res.status(200).send({mensaje: "Datos modificados correctamente", resultado: resultado});
    }catch(error){
        if(error){
            return res.status(400).send({mensaje: "Error en el servidor", error: error});
        }
    }
})

ruta.post('/intento/formato', verificarToken, async(req,res)=>{
    const datos = req.body.datos;
    let consulta = ""   
    if (datos.oportunidad == 1 && datos.resultadoid == 0) {
        consulta = `Insert Into poFormatosResultado2 (formatoid, explosionid, codigo, comentario
        ,estatus,usuarioid) values(${datos.formatoid}, ${datos.explosionid}, '${datos.formato}', 'Captura Inicial', 0, ${datos.usuarioid}); `;
      }
      else {
        // Corrigiendo errores
        consulta = "Update poFormatosResultado2 ";
        consulta += " Set oportunidad1= " + datos.oportunidad;
        consulta += " ,comentario='Editando'";
        consulta += " Where explosionid=" + datos.explosionid + " and resultadoid=" + datos.resultadoid + ";";
      }
      const seleccionarResId = datos.resultadoid == 0 ? "max(resultadoid) " : datos.resultadoid;
      const whereResId = datos.resultadoid == 0 ? "" : "where resultadoid = " + datos.resultadoid;

      consulta += "insert into poIntentosFormatos (resultadoId, usuarioId, rolId, fechaIntento, estatus, noIntento)"
      consulta += "select " + seleccionarResId + ", " + datos.usuarioid + ", " + datos.rolEstacion + ", getDate(), 'Pendiente', " 
      + datos.oportunidad + " from poFormatosResultado2 " + whereResId;
      try{
        const datosInsertados = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
        return res.status(200).send({mensaje: "Datos modificados correctamente", resultado: datosInsertados});
      }catch(error){
        if(error){
            return res.status(400).send({mensaje: "Error en el servidor", error: error});
        }
      }

});

ruta.post('/rechazo/actividad', verificarToken, async(req,res) => {
    const datos = req.body.datos;
    const consulta = `Insert Into poBitacoraRechazosTareas (frente, manzana, lote, interior, subinterior, estacion, fechaRechazo, numeroActividad, usuarioid, rolId, estatus) 
    select frente, manzana, lote, interior, subinterior, estacion, getDate(), ${datos.numero.toString()}, ${datos.usuarioid}, ${datos.rolid}, 'inicial'
    from poAvanceObra where explosionid = ${datos.explosionid}; 
    Insert into poIntentosFormatos (usuarioId, rolId, estatus, noIntento, fechaIntento, resultadoId) values 
          (${datos.usuarioid},
          ${datos.rolid}, 
          'Pendiente', 
          (select max(noIntento) + 1 from poIntentosFormatos where resultadoid = 
          (select distinct pf.resultadoid from poFormatosResultado2 pf
            inner join poIntentosFormatos pif on pif.resultadoid = pf.resultadoid
            where pf.codigo = '${datos.codigo}' and pf.explosionid = ${datos.explosionid}
            and pif.rolId = ${datos.rolid})), 
          getDate(), 
          (select max(resultadoId) from poformatosResultado2));`;
          try{
            const resultado = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
            return res.status(200).send({mensaje: "Datos insertados correctamente", rows: resultado});
          }catch(error){
            return res.status(500).send({error: error});
          }
});

ruta.post('/capturainicial', verificarToken, async(req,res)=>{
    const datos = req.body.datos;
    let consulta = ""
    datos.arregloCaptura.forEach(ele => {
        // FIltra solo campos de captura, NO etiquetas!!! 25.07.2019
        if (ele.tipo == 'BOOLEANA' || ele.tipo == 'NUMERO' || ele.tipo == 'TEXTO') {
            consulta += `Insert Into poCapturaFormatos (definicionid, idIntento,
                valor,observacion)
                values (
                    ${ele.definicionid},
                    ${datos.intentoId},`
            consulta += ele.tipo == 'BOOLEANA' ? "'0'," : "'',";
            consulta += "''); "
          }
    });
    try{
        const insercionDatos = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
        return res.status(200).send({mensaje: "Datos modificados correctamente", resultado: insercionDatos});
    }catch(error){
        if(error){
            return res.status(400).send({mensaje: "Error en el servidor", error: error});
        }
    }
});

ruta.post('/firmas', verificarToken, async(req,res)=>{
    const datos = req.body.datos;
    datos.forEach(ele => {
        try{
            const base64 = ele['png'];
            const pathImagen = './src/IMAGENES/F-' + ele['frente'] + '/' + ele['ubicacion'] 
                    + '/' + ele['estacion'].substring(0,3) + '/' + ele['formato'] + '/firma' + ele['nombre'] + '.png';
            convertidor.converBase64ToImage(base64, pathImagen);
        }catch(error){
            if(error){
                return res.status(500).send({error: error});
            }
        }
    })
    return res.status(200).send({mensaje: "Se guardaron las firmas correctamente"});
});

// ---------------------------------- MODIFICACIÓN DE DATOS ----------------------------------

ruta.put('/capturadatos', verificarToken, async(req,res)=>{
    const datos = req.body.datos;
    const consulta = `Update poCapturaFormatos Set valor = '${datos.valor}',
    observacion = '${datos.comentario}'
    where definicionid = ${datos.definicionid} and idIntento = ${datos.idintento}`;
    try{
        const insercionDatos = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
        return res.status(200).send({mensaje: "Datos modificados correctamente", resultado: insercionDatos});
    }catch(error){
        if(error){
            return res.status(400).send({mensaje: "Error en el servidor", error: error});
        }
    }
    
})

module.exports = ruta;