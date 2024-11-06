const express = require('express');
const conectarBD = require ('../../bd/db.js');
const verificar = require('../../controladores/verificarToken.controller.js');
const procesadorConsultas = require('../../controladores/procesadorConsultas.controller.js');
const ruta = express.Router();
const fs = require('fs');

//Obtener las actividades de una estación seleccionada en la vista
ruta.get('/actividades/:frente/:modelo/:estacion', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const modelo = req.params.modelo;
    const estacion = req.params.estacion;
    const consulta = "Select id as actividadid,p.modelo,p.estacion,  p.numero," +
    " p.descripcion as nombreActividad, p.obligatoria, isnull(p.rol,'') " +
    " as rol, isnull(p.codigo,'') as codigo, obligatoria as tipoactividad, isnull(rechazosMax, 0) as rechazosMax " +
    " from poListaVerificacion2 p  " +
    " Where modelo = (select nombre from modelos where clavemodelo = " + modelo + ")  "+
    " and frente=" + frente + " and estacion = " + estacion + " Order by estacion,p.numero ";
    const result = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(result)
})
//Obtener el catalogo de especialidades
ruta.get('/especialidades', verificar, async(req,res)=>{
    const consulta = "select especid, descripcion as nombre from espec order by especid"
    const result = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(result);
})
//Obtener las especialidades de frente y modelo seleccionado
ruta.get('/especialidades/:frente/:modelo', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const modelo = req.params.modelo;
    const consulta = " select 0 as especid, '--Todos--' as nombre union all " +
    " select pc.espera as especid, e.descripcion as nombre from poCatalogoEstacionesFrente pc inner join espec e on e.especid = pc.espera " +
    " where pc.frente = " + frente + " and pc.modelo = " + modelo + " group by pc.espera, e.descripcion"
    const result = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta)
    return res.json(result);
})
//Obtener el catálogo de formatos
ruta.get('/formatos', verificar, async(req, res)=>{
    const consulta = "Select '     ' as codigo Union all Select codigo " +
    " from poFormatos " +
    " Order by  codigo";
    const result = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(result);
})
//Catalogo de modelos de ese frente
ruta.get('/modelos/:frente', verificar, async(req, res)=>{
    const frente = req.params.frente;
    const consulta = "Select Distinct m.nombre as [descripcion], m.clavemodelo  as id " + 
    " from lotes l Inner join modelos m On m.modeloId=l.modeloId " + 
    "  Inner Join frentes f on f.frenteId=l.frenteId and f.numero = " + frente +
    " And f.tipo = 'F' order by m.nombre"
    const result = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(result);
})
//Catálogo de estaciones de un frente y un determinado modelo
ruta.get('/estaciones/:frente/:modelo/:especid', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const modelo = req.params.modelo;
    const especid = req.params.especid;
    let consulta = "Select estacionid,modelo,estacion,descripcion";
    consulta += ", duracion as estatus ,espera ,frente, estacionDependiente " 
    consulta += " ,isnull(diasPlan,0) as diasPlan, isnull(diasePlan,0) as diasePlan, porcentaje"
    consulta += " From poCatalogoEstacionesFrente "
    consulta += " Where modelo=" + modelo
    consulta += "  and frente=" + frente
    if(especid != 0){
        consulta += " and espera = " + especid;
    }
     + " Order By frente, estacion";
    const result = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(result);
})
//PARA OBTENER LA DESCRIPCIÓN, ESTACIÓN Y ESTACIÓN DEPENDIENTE
ruta.get('/estaciones/numeroestacion/descripcion/:frente/:modelo', verificar, async(req,res)=>{ 
    const frente = req.params.frente;
    const modelo = req.params.modelo;
    const consulta = "select estacion, descripcion, estaciondependiente, duracion from poCatalogoEstacionesFrente where frente = "
    + frente + " and modelo = " + modelo + " order by estacion";
    const estacionesNumero = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(estacionesNumero);
})

//Seleccionar los datos de modelos y datos de otros frentes
ruta.get('/frenteOtro', verificar, async(req,res)=>{
    const consulta = "Select Distinct c.frente as id, " +
     " f.nombre+' '+m.nombre as descrip " +
     " ,u.nombre as uen, d.nombre as fraccionamiento" + 
     "  from poCatalogoEstacionesFrente c " + 
     "  Inner Join modelos m          on m.clavemodelo=c.modelo" + 
     "   Inner join frentes f          on cast(f.numero as int) = c.frente and f.tipo='F'" + 
     "   inner join fraccionamientos d on d.fraccionamientoid=f.fraccionamientoid" + 
     "   Inner join uens u             on u.uen=d.uen" + 
     "  Order by u.nombre,d.nombre,c.frente"
     const result = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(result);
})
//Regresa la consulta para poder copiar los datos de otro frente al frente actual
ruta.get('/consultaFrenteOtro', verificar, async(req,res)=>{
    const consulta = "Select Distinct c.frente as id, " +
     " f.nombre+' '+m.nombre as descrip " +
     " ,u.nombre as uen, d.nombre as fraccionamiento" + 
     "  from poCatalogoEstacionesFrente c " + 
     "  Inner Join modelos m          on m.clavemodelo=c.modelo" + 
     "   Inner join frentes f          on cast(f.numero as int) = c.frente and f.tipo='F'" + 
     "   inner join fraccionamientos d on d.fraccionamientoid=f.fraccionamientoid" + 
     "   Inner join uens u             on u.uen=d.uen" + 
     "  Order by u.nombre,d.nombre,c.frente"
     return res.json(consulta);
})
//Generar las estaciones que están iniciadas y las que no están inicadas.
ruta.get('/datospdf/:frente', verificar, async(req, res)=>{
    const frente = req.params.frente;
    const consulta = "Select p.modelo, p.estacion, p.descripcion" +   // , p.duracion "
     ",case when duracion=0 then 'No Aplica' when duracion=1 then 'Iniciada'  when duracion=2 then 'Terminada'" + 
     "      when duracion=3 then 'Habitable' when duracion=4 then 'Finalizada'" +
     " end as duracion ,p.espera ,isnull(diasPlan,0) as diasPlan" + 
     " ,isnull(diasePlan,0) as diasePlan From poCatalogoEstacionesFrente p " + 
     "   Where p.frente=" + frente + " Order by p.modelo, p.estacion";
     
     const result = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta)
     return res.json(result);
})
//Obtener el catálogo de modelos
ruta.get('/modelos', verificar, async(req, res)=>{
    const consulta = 'Select Distinct m.nombre as [descripcion], m.clavemodelo  as id ' +
    ' from lotes l Inner join modelos m On m.modeloId=l.modeloId ' +
    ' Order by m.nombre ';
    const result = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(result);
})
//Saber si ya se generó la plantilla de avance de obra para bloquear la modificación de registros
ruta.get('/avanceobra/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "select count(*) as estaciones from poavanceobra where frente = " + frente;
    const avances = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(avances[0].estaciones);
})
//Para saber si ya tiene costo de especialidades cargados o si ya tiene avance de obra
ruta.get('/avanceobra/costoespecialidad/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    let consulta = "select count(*) as cantidadRegistros from poavanceobra where frente = " + frente;
    console.log(consulta);
    const cantidadRegistrosAvance = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    consulta = "select count(*) as cantidadRegistros from especEdificacion where frente = " + frente;
    const cantidadRegistrosCostos = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json({avance: cantidadRegistrosAvance[0].cantidadRegistros, costos: cantidadRegistrosCostos[0].cantidadRegistros});
})


//----------------------------------------------------------------------------------------

//Insertar los datos en base a los datos del excel en la tabla de poCatalogoEstacionesFrente
ruta.post('/estacionesexcel', verificar, async(req, res)=>{
    const datos = req.body.datos;
    let consulta = ""
    datos.forEach(ele=>{
        consulta += "insert into poCatalogoEstacionesFrente (modelo, estacion, descripcion, " + 
        " duracion, espera, frente, diasplan, diaseplan, porcentaje, estacionDependiente ) values ('" + ele['modelo']  + 
        "', '" + ele['estacion'] + "', '" + ele['descripcion'] +
        "', " + ele['estatus'] + ", " + ele['espera'] + ", '" + ele['frente'] +
        "', " + ele['diasPlan'] + ", 0, " + ele['porcentaje'] + ", " + ele['estaciondependiente'] +");"
    })
    const result = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.status(200).send({mensaje: 'Se insertaron los datos correctamente', 
    resultado: result});

})
//Insertar los datos en base a los datos del excel en la tabla de poListaVerificacion2
ruta.post('/actividadesexcel', verificar, async(req,res)=>{
    const datos = req.body.datos;
    let consulta = ""
    datos.forEach(ele=>{
        consulta += 'insert into polistaverificacion2 (' + 
        'frente, modelo, estacion, numero, descripcion, obligatoria' + 
        ",codigo) values ('" + ele['frente'] + "', '" + ele.modelo + 
        "', " + ele['estacion'] + ', ' + ele['noactividad'] + ", '" + 
        ele['nombreActividad'].replace('"', '(').replace('"', ')').replace("'", "''''") + "' ," + ele['tipoactividad'] + ", '" + 
        ele['formato'] + "');";
        ele.rol.forEach(roles => {
            consulta += `insert into poRolesActividadesAvanceObra (actividadId, rolid, secuencia) 
            select max(id), ${roles['rol']}, ${roles['secuencia']} from polistaverificacion2; `
        });
    });
    const result = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.status(200).send({mensaje: 'Se insertaron los datos correctamente', 
    resultado: result});
    
})
//Insertar los datos de las estaciones en base a la vista
ruta.post('/estaciones', verificar, async(req, res)=>{
    const datos = req.body.datos;
    let consulta = ""
        consulta += "insert into poCatalogoEstacionesFrente (modelo, estacion, descripcion, " + 
        " duracion, espera, frente, diasplan, diaseplan, porcentaje ) values ('" + datos['modelo']  + 
        "', '" + datos['estacion'] + "', '" + datos['descripcion'] +
        "', " + datos['estatus'] + ", " + datos['espera'] + ", '" + datos['frente'] +
        "', " + datos['diasPlan'] + ", 0, " + datos['porcentaje'] + ");"
    
    const result = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.status(200).send({mensaje: 'Se insertaron los datos correctamente', 
    resultado: result});
})
//Insertar los datos de las actividades en base a la vista
ruta.post('/actividades', verificar, async(req,res)=>{
    const datos = req.body.datos;
    const consulta = "insert into polistaverificacion2 (" + 
    "frente, modelo, estacion, numero, descripcion, obligatoria" + 
    ",codigo, rol) values (" + datos['frente'] + ", '" + datos['modelo'] + 
    "', " + datos['estacion'] + ", " + datos['numero'] + ", '" + 
    datos['descripcion'].replace('"', '(').replace('"', ')') + "' ," + datos['tipoactividad'] + ", " + 
    datos['codigo'] + ",'" + datos['rol'] + "');";
    const result = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.status(200).send({mensaje: 'Se insertaron los datos correctamente', 
    resultado: result});
})
//Insertar las estaciones desde otro frente al seleccionado
ruta.post('/estacionesotrofrente', verificar, async(req,res)=>{
   const datos = req.body.datos[0];
    const consulta = "Insert Into poCatalogoEstacionesFrente " + 
    "(modelo,estacion,descripcion,duracion,espera,frente,diasPlan,diasePlan, porcentaje) " + 
    "Select '" + datos['modelo'] + "' as modelo, estacion, descripcion, duracion, espera, '" + 
    datos['frente'] + "' as frente, diasPlan, diasePlan, porcentaje from poCatalogoEstacionesFrente " + 
    " where modelo = " + datos['modeloCopia'] + " and frente = " + datos['frenteCopia'] + ";" + 

    "\n Insert into poListaVerificacion2 (frente, modelo, estacion, numero, descripcion, obligatoria, codigo, rol) " + 
    " Select '" + datos['frente'] + "' as frente, '" + datos['modeloActividades'] + "' as modelo, estacion, numero, descripcion, obligatoria, codigo, rol " +
    "from poListaVerificacion2 where modelo = (select nombre from modelos where clavemodelo = " + datos['modeloCopia'] + ") and frente = " + datos['frenteCopia']
    const result = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.status(200).send({mensaje: "Frentes insertados correctamente", result: result});
})

//----------------------------------------------------------------------------------------

//Eliminar el catalogo de estaciones para insertar los datos de excel
ruta.delete('/estaciones/:frente/:modelo', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const modelo = req.params.modelo;
    const consulta = "Delete from poCatalogoEstacionesFrente Where frente = " + frente + " and modelo = '" + modelo + "'";
    const result = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.status(200).send({resultado:result, mensaje: 'Se eliminaron los datos correctamente'});
})
//Eliminar el catalogo de las actividades para insertar los datos de excel
ruta.delete('/actividades/:frente/:modelo', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const modelo = req.params.modelo;
    const consulta = `
    delete poRolesActividadesAvanceObra where actividadId in (select id from polistaverificacion2 where frente = ${frente}
        and modelo = '${modelo}');
    Delete from poListaVerificacion2 Where frente = ${frente} and modelo = '${modelo}'`;
    const result = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.status(200).send({resultado:result, mensaje:'Se eliminaron los datos correctamente'});
})
//Eliminar las actividades de una estación seleccionada
ruta.delete('/actividades/:frente/:modelo/:estacion', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const modelo = req.params.modelo;
    const estacion = req.params.estacion;


    const consulta = 'Delete from poListaVerificacion2 Where frente =' + frente + 
    " and modelo = '" + modelo + "' and estacion = '" + estacion + "';"
    const result = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.status(200).send({mensaje:'Se eliminaron las estaciones correctamente',
    result: result});
})
//Eliminar el catalogo de las actividades para insertar los datos de excel
ruta.delete('/estacion/:estacionid', verificar, async(req,res)=>{
    const estacionid = req.params.estacionid;
    const consulta = ' Delete from poCatalogoEstacionesFrente Where estacionid=' + estacionid
    const result = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.status(200).send({mensaje: "Se eliminó el registro correctamente", result:result});
})

ruta.delete('/actividad/:actividadid', verificar, async(req,res)=>{
    const actividadid = req.params.actividadid;
    const result = await procesadorConsultas.spvnet.consultaDatosSpvnet('delete polistaverificacion2 where id = ' + actividadid);
    return res.status(200).send({mensaje: "Se eliminaron los datos correctamente", result: result});
})

ruta.delete('/plantilla/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "delete pocatalogoestacionesfrente where frente = " + frente;
    let registrosAfectados;
    try{
        registrosAfectados = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
    }catch(error){
        if(error) return res.status(500).send({mensaje:"Error en el servidor", error: error});
    }
    return res.status(200).send({mensaje: "Se eliminaron los datos correctamente", registrosAfectados: registrosAfectados});
})


//----------------------------------------------------------------------------------------

//Modificar los datos de las estaciones en la vista
ruta.put('/estaciones', verificar, async(req, res)=>{
    const datos = req.body.datos;
    const consulta = "Update poCatalogoEstacionesFrente set descripcion = '"
    + datos['descripcion'] + "', estacion = '" + datos['estacion'] + "', espera = '" 
    + datos['espera'] + "', duracion = '" + datos['estatus'] + "', diasplan = " 
    + datos['diasPlan'] + ", diaseplan = 0, porcentaje = " + datos['porcentaje']
    + " where estacionid = '" + datos['estacionid'] + "'"
    const result = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.status(200).send({mensaje: "Se actualizaron los datos correctamente", result: result});
})
//Modificar los datos de las activdades en la vista
ruta.put('/actividades', verificar, async(req, res)=>{
    const datos = req.body.datos;
    const consulta = "Update poListaVerificacion2 set descripcion = '"
    + datos['nombreActividad'] + "', estacion = '" + datos['estacion'] + "', numero = " 
    + datos['numero'] + ", rol = '" + datos['rol'] + "', codigo = '" 
    + datos['codigo'] + "', obligatoria = " + datos['tipoactividad'] + " where id = " + datos['actividadid'];
    const result = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.status(200).send({mensaje: "Se actualizaron los datos correctamente", result: result});
})

ruta.put('/estacionesdependientes', verificar, async(req,res)=>{
    const datos = req.body.datos;
    const hayModeloSeleccionado = datos['clavemodelo'] ? ' and modelo = ' + datos['clavemodelo'] : '';
    const consulta = "update pocatalogoestacionesfrente set estaciondependiente = " + datos['estaciondependiente'] 
    + " where estacion = " + datos['estacion'] + " and frente = " + datos['frente'] + hayModeloSeleccionado;
    const actualizacionDatos = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
    return res.status(200).send({mensaje: 'Modificación de datos correcta', registrosAfectados: actualizacionDatos});
})

module.exports = ruta;