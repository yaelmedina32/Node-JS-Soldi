const express = require('express');
const verificar = require('../../controladores/verificarToken.controller.js');
const procesadorConsultas = require('../../controladores/procesadorConsultas.controller.js');

const ruta = express.Router();

//--------------------- CONSULTA DE DATOS --------------------

ruta.get('/costo/frente/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "Select p.modelo,Isnull(mf.NombreComercial,'N/A') as nombrecomercial"
    + "  ,casas, Isnull(m2,0) as m2, costo1 as edificacion, costo2 as materiales"
    + "  ,costo3 as obraextra, costo4 as plataformas"
    + "  ,isnull(costoacc1,0) as accesorio1,isnull(costoacc2,0) as accesorio2,isnull(costoacc3,0) as accesorio3, "
    + " isnull(costoacc4,0) as accesorio4,isnull(costoacc5,0) as accesorio5"
    + "  ,costo6 as total "
    + " From prCostoProduccionModelo p "
    + "  Inner join modelos m On m.nombre=p.modelo "
    + "  Inner Join frentes f on f.numero =" + frente + " and f.tipo = 'F-'" 
    + "   Left join modelosxfraccionamiento mf On mf.modeloId=m.modeloId And f.fraccionamientoId=mf.fraccionamientoId "
    + " Where p.frente='" + "F-" + frente + "'"
    + " and isnull(real,0)=1" 
    const costos = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(costos);
});

ruta.get('/equipamientos/frente/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "Select isnull(accesorio1,'Equipamiento 1') as accesorio1 "
    + ", isnull(accesorio2,'Equipamiento 2') as accesorio2"
    + ", isnull(accesorio3,'Equipamiento 3') as accesorio3"
    + ", isnull(accesorio4,'Equipamiento 4') as accesorio4"
    + ", isnull(accesorio5,'Equipamiento 5') as accesorio5"
    + " from prVariablesFrente "
    + " Where substring(frente,3,4)=" + frente
    + "  and isnull(real,0)=1 ";
    const equipamientos = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(equipamientos);
});

ruta.get('/cantidadcasas/modelo/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = " Select m.nombre as modelo, m.modeloid,   Isnull(mf.NombreComercial,'N/A') as nombrecomercial  "
    + " ,m.construccion  ,Count(*) as cantidad  "
    + " from lotes l  Inner join modelos m On m.modeloId=l.modeloId "
    + " inner join empresas e on e.empresaId=l.empresaId  "
    + " Inner Join frentes f   on f.frenteId=l.frenteId    And numero = " + frente + " And tipo = 'F' "
    + " Left join modelosxfraccionamiento mf On mf.modeloId=m.modeloId      And f.fraccionamientoId=mf.fraccionamientoId  "
    + " Group by  m.nombre, m.modeloid, Isnull(mf.NombreComercial,'N/A'), m.construccion "
    + " Order by m.nombre "
    const casasPorModelo = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(casasPorModelo);
});

ruta.get('/insumos/frente/:frenteid', verificar, async(req,res)=>{
    const frenteid = req.params.frenteid;
    const consulta = "Select isnull(autorizada,0) as autorizada "
    + " from afExplosionInsumos Where frenteid=" + frenteid;
    const explosionInsumos = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(explosionInsumos);
});

ruta.get('/costo/especialidad/:frente', verificar, async(req,res)=>{
    const frente  = req.params.frente;
    const consulta = " select modelo,sum(importe) as importe "
    + " from especedificacion "
    + "  where frente=" + frente
    + " group by modelo";
    const costoProduccionPorEspecialidad = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(costoProduccionPorEspecialidad);
});

ruta.get('/costo/edificacion/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = " select cast(e.frente as int) as frente,e.modelo, sum(e.importe) as edificacion"
    + " from especEdificacion  e" 
    + " where e.frente=" + frente
    + " group by cast(e.frente as int),e.modelo "
    + " order by cast(e.frente as int),e.modelo "
    const costoEdificacion = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(costoEdificacion);
});

ruta.get('/costo/materiales/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "Select modeloid, clavemodelo, modelo as nombre"
    + " ,sum(costototal) as materiales"
    + " from vwCostoEspecialidad2"
    + " where frente=" + frente
    + " group by modeloid, clavemodelo, modelo";
    const costoMateriales = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(costoMateriales);
});

ruta.get('/costo/desplegado/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = " Select p.modelo,Isnull(mf.NombreComercial,'') as nombrecomercial  ,casas, Isnull(m2,0) as m2, costo1 as edificacion, costo2 as materiales  , "
    + " costo3 as obraextra, costo4 as plataformas  ,isnull(costoacc1,0) as accesorio1,isnull(costoacc2,0) as accesorio2  ,isnull(costoacc3,0) as accesorio3," 
    + " isnull(costoacc4,0) as accesorio4  ,isnull(costoacc5,0) as accesorio5,costo6 as total   ,casas*costo6 as grantotal "
    + " From prCostoProduccionModelo p  "
    + " Inner join modelos m On m.nombre=p.modelo  "
    + " Inner Join frentes f on numero = " + frente + " And tipo ='F'   "
    + " Left join modelosxfraccionamiento mf On mf.modeloId=m.modeloId And f.fraccionamientoId=mf.fraccionamientoId "
    + " Where p.frente='F-" + frente + "' and Isnull(real,0)=1 "
    + " order by p.modelo ";
    const costosDesplegados = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(costosDesplegados);
});

//--------------------- INSERCIÓN DE DATOS --------------------

ruta.post('/costo/produccion', verificar, async(req,res)=>{
    const datos = req.body.datos;
    const consulta = "Insert Into prCostoProduccionModelo (frente,modelo,casas,m2,"
    + " costo1,costo2,costo3,costo4,costoacc1,costoacc2,costoacc3,costoacc4,costoacc5,costo6,real) Values("
    + "'F-" + datos.frente + "','" + datos.modelo + "'"
    + "," + datos.casas + "," + datos.m2
    + "," + datos.edificacion + "," + datos.materiales
    + "," + datos.obraextra + "," + datos.plataformas
    + "," + datos.accesorio1 + "," + datos.accesorio2
    + "," + datos.accesorio3 + "," + datos.accesorio4
    + "," + datos.accesorio5 + "," + datos.total + ",1)";
    const insercionDatos = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
    return res.status(200).send({mensaje: "Datos insertados correctamente", result: insercionDatos});
})

//--------------------- MODIFICACIÓN DE DATOS -------------------


//--------------------- BAJA DE DATOS ---------------------------

ruta.delete('/costo/produccion/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "Delete from prCostoProduccionModelo Where Substring(frente,3,4)=" + frente + " and isnull(real,0)=1";
    const registrosAfectados = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
    return res.status(200).send({mensaje: "Registros eliminados correctamente"});
})

module.exports = ruta;