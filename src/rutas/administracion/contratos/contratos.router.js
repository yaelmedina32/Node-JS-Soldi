const express = require('express');
const procesadorConsultas = require('../../../controladores/procesadorConsultas.controller');
const rutas = express.Router();

rutas.get('/indicador/:vencido', async(req,res) => {
    const vencido = req.params.vencido;
    const textoVencido = vencido == 'true' ? " and estatuscontrato In('Vigente','Vigente Vencido')" : "";
    const consulta = `SELECT r.uen,r.fraccionamiento,r.frente,r.contratista,r.foliodg,r.avancereal,r.avancepresupuestado,r.cumplimiento ,
    CONVERT(VARCHAR(10), r.fechainicio, 103) as fechainicio ,CONVERT(VARCHAR(10), r.fechafin, 103) as fechafin ,CONVERT(VARCHAR(10), r.fechaterminacion, 103) as fechaterminacion,
    r.estatuscontrato,r.avancepago,r.foliooc,r.totaloc,r.pendiente,r.avancetrascurrido,r.diascontrato,r.diastranscurridos,isnull(rechazosproduccion,0) as rechazosproduccion,
    isnull(rechazoscalidad,0) as rechazoscalidad,case when vecesrezagocierre>0 then rezagocierre/vecesrezagocierre*100/100 else 0.00 end as rezagocierreconstruccion,
    case when vecesrezagorecepcion>0 then rezagorecepcion/vecesrezagorecepcion*100/100 else 0.00 end as rezagorecepcionconstruccion,r.solicitudclientes
    FROM ${vencido == 'true' ? 'vwAvanceContratosTiemposAll' : 'vwAvanceContratosTiempos'} r   
    left join vwTiemposRezagosResultado v on v.foliodg=r.foliodg
    Where estatuscontrato not In('Cancelado') ${vencido == 'true' ? " and estatuscontrato In('Vigente','Vigente Vencido')" : ""}`;
    console.log(consulta);
    const resultado = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(resultado);
});

rutas.get('/secuencia/autorizacion', async(req,res) => {
    const consulta = ``;
})

rutas.post('/reporte/generico', async(req,res) => {
    let consultaAcumulada = "exec ('use spvnet3; ";
    const consulta = req.body.consulta;
    for(let letra of consulta){
        if(letra == "'") letra = "'";
        consultaAcumulada += letra;
    }
    consultaAcumulada += "') at [soldiapp\\spvnet3];"
    const resultado = await procesadorConsultas.spvnet.consultaDatosSpvnet(consultaAcumulada);
    return res.json(resultado);
});


module.exports = rutas;