const express = require('express');
const verificar = require('../../../controladores/verificarToken.controller.js');
const procesadorConsultas = require('../../../controladores/procesadorConsultas.controller.js');
const fs = require('fs');

const ruta = express.Router();

ruta.get('/roles', verificar, async(req,res)=>{
    const consulta = "select rolId, descripcion, descripcioncorta from poRolesAvanceObra"
    try{
        const catalogoRoles = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
        return res.json(catalogoRoles);
    }catch(error){
        return res.status(400).send({error: error});
    }
})

ruta.get('/usuarios/:rolid', verificar, async(req,res) => {
    const rolid = req.params.rolid;
    try{
        const consulta = `select distinct u.usuarioid, nombre from usuarios u
        inner join poRolesUsuarioAvanceObra pr on pr.usuarioid = u.usuarioid
        where pr.rolid = ${rolid}`;
        const usuarios = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
        return res.json(usuarios);
    }catch(error){
        if(error){
            return res.status(500).send({error: error, mensaje: 'Error en el servidor'});
        }
    }
});

ruta.get('/rolesUsuario/:usuarioid', verificar, async(req,res)=> {
    const usuarioid = req.params.usuarioid;
    const consulta = "select pr.* from poRolesUsuarioAvanceObra pra"
    + " inner join poRolesAvanceObra pr on pr.rolId = pra.rolId"
    + " where usuarioId = " + usuarioid;
    const rolesUsuario = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(rolesUsuario);
})

//MATRIZ DE ASIGNACION
ruta.get('/roles/:usuario', verificar, async(req,res)=>{
    const usuario = req.params.usuario;
    const consulta = "select * from ( "
    + " select u.nombre, pr.descripcion as Rol, pr.rolId, pu.usuarioid from poRolesAvanceObra pr"
    + " left join poRolesUsuarioAvanceObra pu on pr.rolId = pu.rolId"
    + " left join spvnet200.dbo.usuario u on u.usuarioId = pu.usuarioId"
    + " ) src Pivot(count(usuarioid) for nombre in ([" + usuario + "])) piV";
    const rolesAsignados = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(rolesAsignados);
})

ruta.post('/asignacionactividades', verificar, async(req,res)=>{
    const datos = req.body.datos;
    let consulta = "";
    if(datos.modo == 'modelo'){
        //SÓLO ENVÍO LAS ACTIVIDADES DE TIPO NORMALES PARA QUE LUEGO CONFIGUREN LAS DE TIPO VERIFICACIÓN O PRUEBA
        consulta = `select * from ( select pr.secuencia as asignacion,  r.descripcion, p.modelo 
            from  polistaverificacion2 p
            inner join modelos m on m.nombre = p.modelo
            inner join poCatalogoEstacionesFrente pc on pc.frente = p.frente and pc.estacion = p.estacion and pc.modelo = m.clavemodelo
            left join poRolesActividadesAvanceObra pr on p.id = pr.actividadid  
            left join poRolesAvanceObra r on r.rolId = pr.rolId
            where p.frente = ${datos.frente} and p.obligatoria < 3 and pc.espera = ${datos.especid}
            group by pr.secuencia, r.descripcion, p.modelo) 
            src pivot (max(asignacion) for descripcion in(${datos.roles})) piV`
    }
    if (datos.modo == 'actividad'){
        consulta = `select * from ( select pr.secuencia as asignacion, r.descripcion as rol,  p.descripcion, p.id actividadId, p.obligatoria as tipoactividad, p.modelo, p.estacion 
            from  polistaverificacion2 p  
            inner join modelos m on m.nombre = p.modelo
            inner join poCatalogoEstacionesFrente pc on pc.frente = p.frente and pc.modelo = m.clavemodelo and pc.estacion = p.estacion
            left join poRolesActividadesAvanceObra pr on p.id = pr.actividadid
            left join poRolesAvanceObra r on r.rolId = pr.rolId where p.frente = ${datos.frente} and p.modelo = '${datos.modelo}' and pc.espera = ${datos.especid}) 
            src pivot (max(asignacion) for rol in(${datos.roles})) piV`;
    }
    const rolesAsignados = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(rolesAsignados);
})

//INSERCION DE DATOS

ruta.post('/asignacion/roles', verificar, async(req,res)=>{
    const datos = req.body.datos;
    consulta = "";
    datos.forEach(currentItem => {
        consulta += currentItem['asignar'] ? "insert into poRolesUsuarioAvanceObra values (" + currentItem['idusuario'] + ", " + currentItem['rolId'] +", getDate()); "
        :  'delete poRolesUsuarioAvanceObra where rolId = ' + currentItem['rolId'] + ' and usuarioid = ' + currentItem['idusuario'] + "; ";
    });
    try{
        const modificacionDatos = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
        return res.status(200).send({mensaje: "Datos modificados correctamente", modificaciones: modificacionDatos});
    }catch(error){
        if(error) return res.status(400).send({mensaje: "Error en el sistema", error: error});
    }
    
    
})

ruta.post('/roles/actividades', verificar, async(req,res)=>{
    const datos = req.body.datos;
    //FUNCION CALLBACK PARA SACAR UN ARREGLO DE LOS MODELOS SIN REPETIRSE
    const nuevoArreglo = datos.reduce((acumulador, elemento) => {
        if(!acumulador.some(e => JSON.stringify(e) === JSON.stringify(elemento.modelo))){
            acumulador.push(elemento.modelo);
        }
        return acumulador;
    }, []);
    let idActividades = "";
    datos.forEach(modo => {
        idActividades += modo['modo'] == "actividad" ? modo['idActividad'] + ", ": "";
    })
    let modelos = "";
    nuevoArreglo.forEach(modelo => { 
        if(modelo) modelos += "'" + modelo + "', ";
    })

    let consulta = "";
    consulta = `delete poRolesActividadesAvanceObra where actividadId in 
    (select id from poListaVerificacion2 pl 
    inner join modelos m on m.nombre = pl.modelo
    inner join poCatalogoEstacionesFrente pc on pc.modelo = m.clavemodelo and pc.frente = pl.frente and pl.estacion = pc.estacion
    where pl.frente = ${datos[0]['frente']} and pc.espera = ${datos[0]['especid']}
    ${modelos != "" ? " and pl.modelo in (" +  modelos.substring(0, modelos.length - 2) + ")" : ""}
    ${idActividades != "" ? " and id in (" + idActividades.substring(0, idActividades.length - 2) + ")" : ""});`;
    let arregloAuxiliar = [];
    //EN CASO DE QUE SEA POR ACTIVIDAD, ENTONCES VOY A ELIMINAR DE ACTIVIDAD POR ACTIVIDAD
    if(datos[0]['modo'] == 'actividad'){
        consulta = "";
        arregloAuxiliar = datos.reduce((acumulador, elemento) => {
            if(!acumulador.some(e => JSON.stringify(e) === JSON.stringify(elemento['idActividad']))){
                acumulador.push(elemento['idActividad']);
            }
            return acumulador;
        }, []);

        arregloAuxiliar.forEach(ele => {
            consulta += `delete poRolesActividadesAvanceObra where actividadid = ${ele}; `;
        });
    }
    datos.forEach(currentItem => {
        if(currentItem['modo'] == 'actividad'){
            consulta += `insert into poRolesActividadesAvanceObra (actividadId, rolId, secuencia) values (${currentItem['idActividad']}, ${currentItem['rolid']}, ${currentItem['secuencia']});`;
        }else{
            consulta += `insert into poRolesActividadesAvanceObra (actividadId, rolId, secuencia) select id, ${currentItem['rolid']}, ${currentItem['secuencia']}
            from polistaverificacion2 pl 
            inner join modelos m on m.nombre = pl.modelo
            inner join poCatalogoEstacionesFrente pc on pc.frente = pl.frente and pc.modelo = m.clavemodelo and pc.estacion = pl.estacion
            where pl.frente = ${currentItem.frente} and pl.modelo = '${currentItem['modelo']}' and pc.espera = ${currentItem.especid};`;
        }
    });
    try{
        const datosInsertados = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
        if(datosInsertados > 0) return res.status(200).send({mensaje: "Datos insertados correctamente"});
        else return res.json({status: 204});
    }catch(error){
        if(error) return res.status(400).send({error: error});
    }
})

//MODIFICACION DE DATOS

ruta.put('/roles', verificar, async(req,res)=>{
    const datos = req.body.datos;
    let consulta = "";
    datos.forEach(currentItem => {
        consulta += currentItem['eliminado'] == -1 ? " Delete poRolesAvanceObra where rolId = " + currentItem['rolId'] :
        currentItem['rolId'] == 0 ? " Insert into poRolesAvanceObra (descripcion, descripcioncorta) values('"
        + currentItem['descripcion'] + "', '" + currentItem['descripcioncorta'] + "'); " : " Update poRolesAvanceObra set descripcion = '"
        + currentItem['descripcion'] + "', descripcioncorta = '" + currentItem['descripcioncorta'] + "' where rolId = " + currentItem['rolId'] + ";";
    });
    try{
        const insercionRoles = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
        if(insercionRoles > 0) return res.status(200).send({mensaje: 'Datos insertados'});
        else return res.json({status: 24});
    }catch(error){
        return res.status(400).send({error: error});
    }
})

module.exports = ruta;