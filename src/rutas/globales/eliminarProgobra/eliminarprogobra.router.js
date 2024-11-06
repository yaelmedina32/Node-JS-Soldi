const express = require('express');
const verificar = require('../../../controladores/verificarToken.controller.js');
const procesadorConsultas = require('../../../controladores/procesadorConsultas.controller.js');


const ruta = express();

ruta.get('/datosprogobra/:frente',verificar, async(req,res)=> {
    const frente = req.params.frente;
    const consulta = `declare @frente int = ${frente}
    select 'Insumos' as apartado, 'Explosión de insumos por contratista' subapartado, count(*) avance from tabDetallesContratistas where left(modulo,4) = @frente union all
    select 'Insumos' as apartado, 'Explosión de insumos por línea de producción' subapartado, count(*) avance from poEstacionesModuloCantidad where left(modulo,4) = @frente union all
    select 'Insumos' as apartado, 'Suministros' subartado, count(*) from detallesSuministros where docid in (select docid from Suministros where left(id,4)=@frente) union all
    select 'Insumos' as apartado, 'Explosión de insumos por vivienda' subapartado, count(*) avance from poAvanceObraInsumos where frente = @frente union all
    select 'Insumos' as apartado, 'Catálogo de insumos por estación' subapartado, count(*) avance from poInsumosxEstacion where frente = @frente union all
    select 'Insumos' as apartado, 'Catálogo de insumos por frente' subapartado, count(*) avance from poInsumosxFrente where frente = @frente union all
    
    select 'Obra' as apartado, 'Captura de formatos' subapartado, count(*) avance from poCapturaFormatos where idIntento in (select idIntento from poIntentosFormatos where resultadoId in (select resultadoId from poFormatosResultado2 where explosionid in (select explosionid from poAvanceObra where frente=@frente))) union all
    select 'Obra' as apartado, 'Asignación de contratistas' subapartado, count(*) avance from poAsignaObra where explosionid in (select explosionid from poAvanceObra where frente = @frente) union all
    select 'Obra' as apartado, 'Programación de obra' subapartado, count(*) avance from poAvanceObra where frente=@frente union all
    select 'Obra' as apartado, 'Asignación de Lotes a módulos' subapartado, count(*) avance from poLotesAsignados where frente=@frente union all
    select 'Obra' as apartado, 'Catálogo de Líneas de Producción' subapartado, count(*) avance from poModulosObra where left(modulo,4)=@frente union all
    select 'Obra' as apartado, 'Costos de especialidades' subapartado, count(*) avance from especEdificacion where frente=@frente union all
    select 'Obra' as apartado, 'Costos de obra' subapartado, count(*) avance from prCostoProduccionModelo where frente like '%' + cast(@frente as varchar) + '%' union all
    select 'Obra' as apartado, 'Catálogo de actividades' subapartado, count(*) avance from polistaverificacion2 where frente = @frente union all
    select 'Obra' as apartado, 'Catálogo de estaciones' subapartado, count(*) avance from poCatalogoEstacionesFrente where frente = @frente`
    const datosprogobra = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(datosprogobra);
})

ruta.delete('/eliminartabla/:tabla/:frente', verificar, async(req,res)=>{
    const tablaAuxiliar = req.params.tabla;
    const frente = req.params.frente;
    //CUANDO TIENE _m ES PORQUE SE ELIMINA POR MODULO, _f CUANDO SE ELIMINA POR FRENTE e _id PORQUE SE ELIMINA POR DOCID (de suministros)
    function auxiliar(auxiliar){
        if(auxiliar.includes('_m')){
            return auxiliar.split("_m")[0] + " where left(modulo, 4) = " + frente;
        }
        if(auxiliar.includes("_f")){
            return auxiliar.split("_f")[0] + " where frente = " + frente;
        }
        if(auxiliar.includes('_id')){
            return auxiliar.split("_id")[0] + " where frenteid = (select frenteid from frentes where numero = " + frente + " and tipo = 'F')";
        }
        if(auxiliar.includes('_like')){
            return auxiliar.split("_like")[0] + " where frente like '%" + frente + "%'";
        }
    }

    if(tablaAuxiliar == 'capturas'){
        console.log(`delete poCapturaFormatos where idIntento in 
        (select idIntento from poIntentosFormatos where resultadoId in
        (select resultadoId from poFormatosResultado2 where explosionid in 
        (select explosionid from poAvanceObra where frente = ${frente})));

        delete poIntentosFormatos where resultadoId in
        (select resultadoId from poFormatosResultado2 where explosionid in 
        (select explosionid from poAvanceObra where frente = ${frente}));

        delete poFormatosResultado2 where explosionid in 
        (select explosionid from poAvanceObra where frente = ${frente});

        delete poBitacoraRechazosTareas where explosionid in 
        (select explosionid from poAvanceObra where frente = ${frente});
        `)
    }

    if(tablaAuxiliar.includes("-")){
        const primertabla = tablaAuxiliar.split('-')[0];
        const segundatabla = tablaAuxiliar.split('-')[1];
        //PRIMERO COMPRUEBO QUE SEA POR FRENTE, EN CASO DE QUE SI, AHORA VA A AGARRAR LA TABLA A ELIMINARSE (PRIMERTABLA) Y EN BASE A LA SEGUNDA, VA A SACAR LOS REGISTROS
        //DE LA ASIGNACIÓN DE CONTRATISTAS A LAS UBICACIONES, DE OTRA FORMA, VA A ELIMINAR LOS SUMINISTROS
        if(tablaAuxiliar.split('-')[1].includes('_f')){
            console.log("delete " + primertabla + " where explosionid in (select explosionid from " + auxiliar(segundatabla) + ")");
        }else{
            console.log("delete " + primertabla + " where docid in (select docid from " + auxiliar(segundatabla) + "); " + "delete " + auxiliar(segundatabla));
        }
    }else{
        console.log("delete " + auxiliar(tablaAuxiliar));
    }
})

module.exports = ruta;
