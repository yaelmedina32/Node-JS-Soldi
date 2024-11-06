const express = require('express');
const verificar = require('../../controladores/verificarToken.controller.js');
const procesadorConsultas = require('../../controladores/procesadorConsultas.controller.js');
// const dotenv = require('dotenv');
// dotenv.config({path: 'src/.env'});
// const OpenAI = require('openai');
// const ai = new OpenAI(
//     {
//         apiKey: process.env.key,
//     }
// );

const ruta = express.Router();

ruta.get('/calculo/bono/:fraccionamiento', verificar, async(req,res) => {
    const fraccionamiento = req.params.fraccionamiento;
    const consulta = `select fr.uen, fr.nombre as fraccionamiento, case when f.numero < 1000 then '0' + cast(cast(f.numero as int) as varchar) else f.numero end frente,
	pm.ccedif as lp, va.secuencia,
    rtrim(l.manzana) + '-' + rtrim(l.lote) + '-' + rtrim(l.interior) + '-' + rtrim(l.subinterior) ubicacion,
	va.nombremodelo, isnull(mf.nombrecomercial, 'Sin Nombre Comercial') nombrecomercial,
    case when l.precio = 999999999 then 'Sin precio establecido' else format(l.precio, 'C', 'en-us' ) end precioventa,
	------------------------------------------------------------ FECHA DE PROGAMADA ------------------------------------------------------------
	case when year(va.fecharea) <= 2001 then 'No progamada' else cast(format(va.fecharea, 'dd/MM/yyyy') as varchar) end fechaprogamada, 
	------------------------------------------------------------ FECHA DE TÉRMINO ------------------------------------------------------------
	case when year(va.fechater) <= 2001 then 'No terminado' else cast(format(va.fechater, 'dd/MM/yyyy') as varchar) end fechatermino, 
	------------------------------------------------------------ CALCULO DE PORCENTAJE DE BONO ------------------------------------------------------------
    isnull(case when va.status = 'T' then
        case when (select max(finIntervalo) from bonoUbicacion where frenteid = va.frenteid) < DATEDIFF(DAY, va.fecharea, va.fechater)
            then '0%'
            else
                cast((select porcentajeBono from  bonoUbicacion bu where bu.frenteId = f.frenteId and inicioIntervalo < DATEDIFF(DAY, va.fecharea, va.fechater)
                    and finIntervalo > DATEDIFF(DAY, va.fecharea, va.fechater)) as varchar) + '%'
            end
        else '0%'  end, '0%') porcentaje,
		------------------------------------------------------------ CALCULO DE TOTAL DE BONO ------------------------------------------------------------
        isnull(case when va.status = 'T' then
            case when (select max(finIntervalo) from bonoUbicacion where frenteid = va.frenteid) < DATEDIFF(DAY, va.fecharea, va.fechater)
                then '$0.00'
                else
                    format((select porcentajeBono from  bonoUbicacion bu where bu.frenteId = f.frenteId and inicioIntervalo < DATEDIFF(DAY, va.fecharea, va.fechater)
                        and finIntervalo > DATEDIFF(DAY, va.fecharea, va.fechater)) / 100 * l.precio * (select min(porcentajeVenta) /100 from bonoVenta), 'C', 'en-us')
                end
            else '$0.00'  end, '$0.00') totalBono
    from fraccionamientos fr
    inner join frentes f on f.fraccionamientoId = fr.fraccionamientoId and f.tipo = 'F'
    inner join lotes l on l.frenteId = f.frenteId
	left join modelosxfraccionamiento mf on mf.modeloid = l.modeloId and mf.fraccionamientoid = fr.fraccionamientoId
    inner join modelos m on m.modeloId = l.modeloId
    left join vwAvanceObraNormalizada va on va.frenteid = l.frenteId and cast(va.manzana as int) = cast(l.manzana as int) and casT(va.lote as int) = cast(l.lote as int)
	left join poModulosObra pm on pm.modulo = va.modulo
    and cast(va.interior as int) = casT(l.interior as int) and cast(va.subinterior as int) = casT(l.subinterior as int) and m.clavemodelo = va.modelo
    where fr.nombre = '${fraccionamiento}' and va.etapa = 2
	order by f.numero, pm.ccedif, cast(va.secuencia as int)`;
    console.log(consulta);
    const ubicacionesBono = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(ubicacionesBono);
});

ruta.get('/bono', verificar, async(req,res) => {
    const consulta = `select inicioIntervalo, finIntervalo, porcentajeBono bono, porcentajeVenta from bonoVenta`;
    console.log(consulta);
    const intervalo = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(intervalo);
});

ruta.post('/bono', verificar, async(req,res) => {
    const datos = req.body.datos;
    try{
        let consulta = `delete bonoVenta`;
        await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
        const promesas = datos.map((dato) => {
            consulta = `insert into bonoVenta (iniciointervalo, finintervalo, porcentajebono) values(${dato.inicioIntervalo}, ${dato.finIntervalo}, ${dato.bono})`;
            return procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
        });
        await Promise.all(promesas);
        return res.status(200).send({mensaje: 'Datos insertados correctamente'});
    }catch(error){
        console.log(error);
        return res.status(500).send(error);
    }

});

module.exports = ruta;