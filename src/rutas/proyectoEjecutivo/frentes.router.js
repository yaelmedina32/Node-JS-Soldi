const express = require('express');
const verificar = require('../../controladores/verificarToken.controller.js');
const procesadorConsultas = require('../../controladores/procesadorConsultas.controller.js');
const ruta = express.Router();


ruta.post('/frentes/tipo', verificar, async(req,res)=>{
    const datos = req.body.datos;
    const tipo = datos.tipoFrente
    if(tipo == 'C'){
        //logica para centro de costos
        //frentes, SEGMENTOSCONTABLES
    let consulta = 
    `   insert into frentes (frenteId, nombre, fraccionamientoId, numero, idSPV, desarrolloSPV, tipo, frenteId2, cabeceraId, m2superficie, residente, spread)
        values ((select max(frenteid) + 1 from frentes),
        'F-${datos.fraccionamientoSeleccionado['nombre']}', ${datos.fraccionamientoSeleccionado['fraccionamientoId']},
        ${datos.frentenumero}, 0, '', '${datos.tipoFrente}', (select max(frenteid) + 1 from frentes), 0, 0.00, '', 0.00);
    
    insert into segmentosContables (codigo, nombre, frente) Values('${datos.frentenumero}','${datos.nombreFrente}','${datos.frentenumero}')
    `;
    console.log(consulta);
        try {
        const resultDatosSPVNet = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta);    
    // Frente
    consulta = ` 
        insert into Frente (frenteid, DFrente, EstatusId, FraccionamientoId) 
        values ((select max(frenteid) + 1 from frente),'${datos.nombreFrente}'
        , 1, ${datos.fraccionamientoSeleccionado['fraccionamientoId']});    `
        
        const resultDatosSPVnet200 = await procesadorConsultas.spvnet200.ejecutaConsultaSpvnet200(consulta);

        return res.status(200).send({
            mensaje: 'Se insertaron los datos correctamente',
            resultDatosSPVNet: resultDatosSPVNet,
            resultDatosSPVnet200: resultDatosSPVnet200
        });
    } catch (error) {
        return res.status(500).send({ mensaje: 'Hubo un error en la inserción', error });
    }

    }else{
        //logiica para frente
          // POESTATUSASIGNACION, FRENESSPVNET2, FRENTESMODEOESTACIONES,FRENTESAPP, frentes
    let consulta = ` 
    insert into poEstatusAsignacion (frente,inicializado,asignado,programado,explosionado,suministrado) 
    Values('${datos.frentenumero}',0,0,0,0,0);

    insert into frentesSPVNet2 (frente) Values('${datos.frentenumero}');
    
    insert into frentesModoEstaciones (frente,modoestaciones) Values('${datos.frentenumero}', 1);

    insert into frentesapp(frente,activo,escritura) Values('${datos.frentenumero}', 1,1)
    
    insert into frentes (frenteId, nombre, fraccionamientoId, numero, idSPV, desarrolloSPV, tipo, frenteId2, cabeceraId, m2superficie, residente, spread)
    values ((select max(frenteid) + 1 from frentes),
    'F-${datos.frentenumero + ' ' + datos.fraccionamientoSeleccionado['nombre']}', ${datos.fraccionamientoSeleccionado['fraccionamientoId']},
    ${datos.frentenumero}, 0, '', '${datos.tipoFrente}', (select max(frenteid) + 1 from frentes), 0, 0.00, '', 0.00);
    `;
    try {
        const resultDatosSPVNet = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta);

        // Frente, AFCONTROLFRENTES, AFREPORTES 
        consulta = ` 
        
            insert into Frente (frenteid, DFrente, EstatusId, FraccionamientoId) 
            values ((select max(frenteid) + 1 from frente),'${datos.nombreFrente.value}'
            , 1, ${datos.fraccionamientoSeleccionado['fraccionamientoId']});    
            
            Insert Into afControlFrentes (frente,autorizada) Values('${datos.frentenumero}',0);
            
            insert into afreportes
            values('ESTADO DE RESULTADOS','EstadoResultados_${datos.frentenumero}.xlsx','XLSX','20200101','${datos.frentenumero}');
            insert into afreportes values('LISTADO DE VIVIENDAS','listadoViviendas_${datos.frentenumero}.pdf','PDF','20200101','${datos.frentenumero}');
            insert into afreportes values('APERTURA DE FRENTE','aperturaFrente_${datos.frentenumero}.pdf','PDF','20200101','${datos.frentenumero}');
            insert into afreportes values('PREMISAS','Premisas_${datos.frentenumero}.pdf','PDF','20200101','${datos.frentenumero}');
            insert into afreportes values('CEDULA DE COSTOS','cedulaCostos_${datos.frentenumero}.pdf','PDF','20200101','${datos.frentenumero}');
            insert into afreportes values('COSTO DE MATERIALES','CostoMateriales_${datos.frentenumero}.xlsx','XLSX','20200101','${datos.frentenumero}');
            insert into afreportes values('DISTRIBUCIÓN DE EFECTIVO','distribucionEfectivo_${datos.frentenumero}.pdf','PDF','20200101','${datos.frentenumero}');
            insert into afreportes values('FLUJO','Flujo_${datos.frentenumero}.xlsx','XLSX','20200101','${datos.frentenumero}');
            insert into afreportes values('PARTIDAS PRESUPUESTALES','partidasPresupuestales_${datos.frentenumero}.pdf','PDF','20200101','${fte}');
            `;
            
            const resultDatosSPVnet200 = await procesadorConsultas.spvnet200.ejecutaConsultaSpvnet200(consulta);

            return res.status(200).send({
                mensaje: 'Se insertaron los datos correctamente',
                resultDatosSPVNet: resultDatosSPVNet,
                resultDatosSPVnet200: resultDatosSPVnet200
            });
    } catch (error) {
        return res.status(500).send({ mensaje: 'Hubo un error en la inserción', error });
    }
}
  
});

module.exports = ruta;