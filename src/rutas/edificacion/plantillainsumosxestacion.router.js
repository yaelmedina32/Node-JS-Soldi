const express = require('express');
const procesadorConsultas = require('../../controladores/procesadorConsultas.controller.js');
const verificar = require('../../controladores/verificarToken.controller.js');
const conectarBD = require('../../bd/db.js');


const ruta = express.Router();

//------------------------------------- CONSULTA DE DATOS ------------------------------------

ruta.get('/modelos', verificar, async(req, res)=>{
    const consulta = "Select m.descripcion, m.nombre, m.clavemodelo as id from vw_insumosfrente m  Order by m.nombre";
    const result = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(result);
})
//Catalogo de modelos de casas
ruta.get('/modelos/:frente', verificar ,async (req, res)=>{
    const frente = req.params.frente;
    const consulta = `select m.nombre as [desc], isnull(mf.nombrecomercial, 'no definido') nombrecomercial, clavemodelo, count(*) as totalviviendas from lotes l 
    inner join frentes f on f.frenteId = l.frenteId
    inner join modelos m on m.modeloId = l.modeloId
    left join modelosxfraccionamiento mf on mf.modeloid = m.modeloId and mf.fraccionamientoid = f.fraccionamientoId
    where l.frenteid = (select frenteid from frentes where numero = ${frente} and tipo = 'F') 
    group by l.modeloid, m.nombre, mf.nombrecomercial, clavemodelo`;
    const result = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
        return res.json(result);
    
});
//Catalogo de estaciones por frente
ruta.get('/estaciones/:frente', verificar ,async (req, res)=>{
    const frente = req.params.frente;    
        let consulta = "Select c.estacion, c.descripcion+' - '+e.descripcion as descripcion , c.modelo "
        consulta += " from poCatalogoEstacionesFrente c ";
        consulta += "  inner join espec e on e.especid=c.espera"
        consulta += " where frente=" + frente + "";
        consulta += " Order by estacion, modelo";        
        const result = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
        return res.json(result)
})
//Catalogo de productos por frente
ruta.get('/productos/:personalObra', verificar, async (req,res)=>{
    //personalObra viene de la casilla en "Mostrar Personal", sí, entonces va a valer true y se valida como si 
    //fuera un string
    const personalObra = req.params.personalObra;
        let consulta = "Select insumoid, producto, nombre, unidad "
        consulta += " from insumos ";
        consulta += " where left(producto,1)<>'4'";
        consulta += "  and isnull(partidaid,0)<>-1"
        if (personalObra == 'true') {
          consulta += " and familiaid=17";
        }
        else {
          consulta += " and familiaid<>17";
        }
        consulta += " Order by nombre";
        const result = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
        return res.json(result);

})
//Catalogo de insumos por frente
ruta.get('/insumos/:nombre', verificar,async (req,res)=>{
    const nombre = req.params.nombre;
    let consulta = "Select nombre,descripcion,modeloid,modelo "
    consulta +=    " from vw_insumosfrente ";
    if (nombre != '_') {
        consulta += " Where nombre='" + nombre + "'";
    }
    consulta += " Order by descripcion ";
    const result = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(result);
})

ruta.get('/catalogo/insumos', verificar, async(req,res)=>{
    const consulta = "select producto as clave, nombre, unidad from insumos where producto like '%-%'"
    const insumos = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(insumos);
})

//Cantidad de casas por modelo
ruta.get('/lotes/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
        let consulta = "select modelo, lotes";
        consulta += " from vwLotesModeloFrente where frente=" + frente;
        consulta += " order by modelo";

        const result = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
        return res.json(result);
})
//Cargar precios de otros frentes
ruta.get('/precios/:frente', verificar,async(req, res)=>{
    const frente = req.params.preciosFrente;
    let consulta = "Select Distinct producto,costo From poInsumosxEstacion Where frente=" + frente;
    consulta += " Order by producto";
    const result = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(result);
})
//Modelos de los catalogos de estaciones disponibles
ruta.get('/modelosPlantilla/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "select nombre as modelos from modelos where clavemodelo in (select modelo from poCatalogoEstacionesFrente where frente = "  + frente + ")"
    const result = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(result);

})
//PARA VALIDAR QUE EL PRODUCTO SEA DEL RESPECTIVO NOMBRE DEL INSUMO
//EXCEL
ruta.get('/productoinsumo/:producto/:nombre', verificar, async(req,res)=>{
    const producto = req.params.producto;
    //SE PUSO UN ARROBA PARA QUE NO HICIERA CONFLICTO CON EL '/' DE LA API
    const nombre = req.params.nombre.replace("'", "").replace("'","").replace("@", "/").replace("@", "/");
    const consulta = `select insumoid as insumo from insumos where nombre = '${nombre}' and producto = '${producto}'`;
    const result = await pool.request().query('' + consulta);
    if(result.insumo == ''){
        const consultaInsumosValidos = "select nombre from insumos where producto = '" + producto + "'";
        const nombre = await procesadorConsultas.spvnet.consultaDatosSpvnet(consultaInsumosValidos);
        return res.json(nombre);
    }else{
        return res.json(result);
    }
})
//PARA VALIDAR QUE LA UNIDAD DEL PRODUCTO EXISTA
//EXCEL
ruta.get('/unidadinsumo/:clave/:unidad', verificar, async(req,res)=>{
    const clave = req.params.clave.trim();
    const unidad = req.params.unidad.trim();
    const consulta = "select insumoid as insumo from insumos where producto = '" + clave + "' and unidad like '%" + unidad + "%'";
    const result = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(result);
})
//PARA VALIDAR QUE LA CLAVE DEL PRODUCTO EXISTA
//EXCEL
ruta.get('/claveproducto/:clave', verificar, async(req,res)=>{
    const clave = req.params.clave;
    const consulta = "select insumoid as insumo from insumos where producto = '" + clave + "'";
    const result = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(result);
})
//PARA COMPROBAR SI HAY UNA ESTACION DE UNA ESPECIALIDAD EXISTE
//EXCEL
ruta.get('/estacionesespecialidad/:estacion/:especid/:frente/:modelo/:nombre', verificar, async(req, res)=>{
    const modelo = req.params.modelo;
    const frente = req.params.frente;
    const especid = req.params.especid;
    const estacion = req.params.estacion;
    const nombre = req.params.nombre;
     const consultaNombreEstacion = "select estacionid as insumo from pocatalogoestacionesfrente where frente = " + frente +
    " and modelo = (select clavemodelo from modelos where nombre = '" + modelo + "')" + 
    " and espera = " + especid + " and estacion = " + estacion + " and descripcion = '" + nombre + "';";
    const resultadoNombre = await procesadorConsultas.spvnet.consultaDatosSpvnet(consultaNombreEstacion);
    return res.json(resultadoNombre);
})
//SACAR DATOS PARA IMPRIMIR EN PDF
ruta.get('/pdfinsumos/:frente/:modelo/:especid/:personalobra', verificar, async(req, res)=>{
    const frente = req.params.frente;
    const clavemodelo = req.params.modelo;
    const especid = req.params.especid;
    const personalobra = req.params.personalobra === "true";


    let consulta = "Select p.modelo, p.estacion, c.descripcion+ ' - '+e.descripcion as descripcion, p.producto"
    consulta += " ,i.nombre as nombreproducto, i.unidad, cantidad, costo "
    consulta += " From poInsumosxestacion p "
    consulta += "  Inner join modelos m on m.clavemodelo=p.modelo"
    consulta += "  Inner join insumos i on i.producto=p.producto"
    if (personalobra) {
        consulta += " and familiaid=17"  // PERSONAL DE OBRA, 900
    }
    else {
        consulta += " and familiaid<>17"  // PERSONAL DE OBRA, 900
    }
    consulta += "  Inner join poCatalogoEstacionesFrente c On c.estacion=p.estacion"
    consulta += "     and c.frente=p.frente"
    consulta += "     and p.modelo=c.modelo"
    consulta += "    inner join espec e on e.especid=c.espera"
    consulta += "   Where p.frente=" + frente + ""
    consulta += "    and p.modelo='" + clavemodelo + "'"
    if (especid > 0) {
        consulta += " and c.espera=" + especid;
    }
    consulta += " Order by p.estacion,p.modelo,i.nombre";
    const result = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
   return res.json(result);
})
//Estaciones y especialidad de un frente en base al catálogo de estaciones
ruta.get('/plantillaestaciones/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "select nombre, estacion, pc.descripcion, e.descripcion as especialidad " +
    " from poCatalogoEstacionesFrente pc " +
    " inner join  modelos m on m.clavemodelo = pc.modelo " +
    " inner join espec e on e.especid = pc.espera " +
    " where frente = " + frente + " order by nombre,estacion, especialidad "
    const result = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(result);
})
//La última estación que tiene un frente
ruta.get('/maxestacion/:frente/', verificar, async(req, res)=>{
    const frente = req.params.frente;
    const result = await procesadorConsultas.spvnet.consultaDatosSpvnet('select max(estacion) as max from pocatalogoestacionesfrente where frente = ' + frente);
    return res.json(result);
})

ruta.get('/catalogoestaciones/:frente/:modelo', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const modelo = req.params.modelo;
    const consulta = "Select * From poCatalogoEstacionesFrente Where modelo='" + modelo + "' and frente=" + frente;
    const result = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(result);
})

ruta.get('/insumosestaciones/:frente/:modelo/:especid/:personalobra', verificar, async(req, res)=>{
    const frente = req.params.frente;
    const modelo = req.params.modelo;
    const personalobra = req.params.personalobra == 'true' ? true : false;
    const especid = parseInt(req.params.especid);
    let consulta = "Select estaciondetid as id,p.modelo,p.estacion";
        consulta += " ,c.descripcion+' - '+e.descripcion as descripcion"
        consulta += " ,f.nombre as familia, p.producto,i.nombre+' '+i.unidad as nombreproducto";
        consulta += " ,p.cantidad";
        consulta += "  ,p.costo, p.readonly";  // 16.02.22
        consulta += "  from poInsumosxEstacion p  ";
        consulta += "    inner join insumos i        on i.producto=p.producto";
        if (personalobra) {
          consulta += " and familiaid=17";  // PERSONAL DE OBRA, 900
        }
        else {
          consulta += " and familiaid<>17";  // PERSONAL DE OBRA, 900
        }
        consulta += "    inner join familiasInsumo f on f.familiaId=i.familiaId";
        consulta += "    inner join pocatalogoestacionesfrente c on c.modelo=p.modelo";
        consulta += "     and c.estacion=p.estacion";
        consulta += "     and c.frente=" + frente;
        consulta += "     inner join espec e on e.especid=c.espera";
        consulta += "  Where p.modelo='" + modelo + "'";
        consulta += "   and p.frente=" + frente;
        if (especid > 0) {
          consulta += "    and c.espera=" + especid;
        }
        consulta += "  Order by p.estacion,f.nombre,i.nombre+' '+i.unidad";
        const result = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
        return res.json(result);
})
//Devolver la consulta que se necesita para copiar el catálogo de otro frente
ruta.get('/consultafrenteotro', verificar, async(req,res)=>{
    const consulta = "Select Distinct frente as id,f.nombre+'/'+m.nombre as descrip " + 
    " ,u.nombre as uen, d.nombre as fraccionamiento From poInsumosxEstacion p " +
    "  Inner join modelos m  on p.modelo=m.clavemodelo Inner join frentes f" + 
    " on cast(f.numero as int)=p.frente and f.tipo='F'  inner join fraccionamientos d " + 
    " on d.fraccionamientoid=f.fraccionamientoid inner join uens u on u.uen=d.uen" +
    " Order By u.nombre, d.nombre , f.nombre+'/'+m.nombre ";
    return res.json(consulta.replace('/', '@').replace('/', '@'));
})

ruta.get('/contratos/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "Select proveedorid, contratista,fechainicio,fechafin" +
    "    from poContratosObra" +
    "     Where frente=" + frente +
    "   Order by contratista";
    const hayContratos = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    if(hayContratos.length > 1){
        const consultaAvanzadas = "Select count(*)  as avanzadas from poAvanceObra where status<>'P' and frente=" + frente + "";
        const result = await procesadorConsultas.spvnet.consultaDatosSpvnet(consultaAvanzadas);
        return res.json(result);
    }
})

ruta.get('/modeloscostesp/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "Select Distinct v.modelo " +
    " From  vwCostoEspecialidad v " +
    " where frente=" + frente;
    return await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta).then(result=>{
        const rows = result;
        res.status(200).json(rows);
      }).catch(err=>{
        res.status(500).json({error: err});
      });  
})

ruta.get('/insumospivotes/:frente/:especid/:modelos/:tipo', verificar, async(req,res)=>{
    const especid = req.params.especid;
    const frente = req.params.frente;
    const modelos = req.params.modelos;
    const tipo = req.params.tipo;

    let consulta = " Select *";
      consulta += " From (";
      consulta += `  Select v.especialidad,v.familia,${tipo == 'pdf' ? 'v.nombreestacion,' : ""} v.producto,v.unidad,v.insumo,v.modelo,v.cantidad`;
      consulta += "  ,case when v.cantidad>0 then v.costototal/v.cantidad else 0 end as pu";
      consulta += "   From vwCostoEspecialidad  v";
      consulta += "   Inner Join vwLotesModeloFrente m On m.frente=v.frente";
      consulta += "   and m.modelo=v.modelo";
      consulta += "    where v.frente=" + frente;
      if (especid > 0) {
        consulta += " and v.especid=" + especid;
      }
      consulta += "  and v.familia<>'PERSONAL DE OBRA'";
      consulta += " ";
      consulta += " ) as SourceTable";
      consulta += " ";
      consulta += " Pivot (Sum(cantidad) for modelo in (" + modelos + ") )";
      consulta += " as PivotTable ";
      if(tipo == 'pdf') consulta += "  Order by  especialidad, familia, nombreestacion,producto,unidad";
      else consulta += "  Order by  especialidad, familia, insumo,producto,unidad";
      return await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta).then(result=>{
        const rows = result;
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.status(200).json(rows);
      }).catch(err=>{
        res.status(500).json({error: err});
      });
})

ruta.get('/costoproduccion/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "select count(*) cantidadRegistros from prCostoProduccionModelo where frente = 'F-" + frente + "'";
    const cantidadRegistros = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(cantidadRegistros[0].cantidadRegistros);
})


//--------------------------------- INSERCION DE DATOS -----------------------------------------
ruta.post('/insumosexcel', verificar, async(req,res)=>{
    const datos = req.body.datos;
    const pool = await conectarBD;    
    let consulta = "";
    datos.forEach(currentItem => {
        consulta += " insert into poinsumosxestacion (frente, modelo, estacion, producto, cantidad, costo, status, tipo, readonly)" +
        " values ('" + currentItem.frente + "', " + currentItem.modelo + "," + currentItem.estacion + ", '" + currentItem.producto + "', " + currentItem.cantidad +
        ", " + currentItem.costoUnitario + ", 0, 'PR', 0)"
    });
    const result = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta)
    return res.status(200).send({mensaje: 'Se insertaron los datos correctamente', result: result});
})

ruta.post('/insumosotrofrente', verificar, async(req,res)=>{
    const datos = req.body.datos;
    let consulta = "Insert Into poInsumosxEstacion ";
    consulta += " (frente,modelo,estacion,producto,"
    consulta += " cantidad, costo, status,tipo) Select ";
    consulta += "'" + datos.frente + "' as frente";
    consulta += ",'" + datos.modelo + "' as modelo";
    consulta += ",e.estacion";
    consulta += ",producto";
    consulta += ",cantidad,costo,status,tipo "
    consulta += " from poInsumosxEstacion e "
    consulta += " inner join poCatalogoEstacionesFrente c on c.frente=e.frente";
    consulta += " and c.modelo=e.modelo and e.estacion=c.estacion";
    if (this.especid > 0) {
        consulta += "      and c.espera=" + datos.especid.toString();
        consulta += "  inner join poCatalogoEstacionesFrente c2 on c2.frente=" + datos.frente;
        consulta += "    and c2.modelo=" + datos.modelo + " and c2.estacion=e.estacion";
        consulta += "    and c2.espera=" + datos.especid.toString();
    }
    consulta += "  where e.frente=" + datos.frentecopia;
    consulta += "   and e.modelo='" + datos.modelocopia + "'";
    consulta += "   and Left(e.producto,1)<>'4'";
    const result = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
    return res.status(200).send({mensaje: 'Se insertaron los datos correctamente', result: result});
})

ruta.post('/insumos', verificar, async(req,res)=>{
    const datos = req.body.datos;
    const consulta = "Insert Into poInsumosXEstacion (frente,modelo,estacion,producto,cantidad,costo,status,tipo, readonly) " +
    " values('" + datos.frente + "'," + 
    "'" + datos.modelo + "'," + 
    "'" + datos.estacion + "'," +
    "'" + datos.producto + "'," +
    datos.cantidad + "," +
    datos.costo + "," +
    " 0,'PR', " + datos.readonly + ")";
    const result = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta)
    return res.status(200).send({mensaje: 'Se insertaron los datos correctamente', result: result});
});

ruta.delete('/plantillacostos/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "Delete From poEstacionesModuloCantidad Where Left(modulo,4)=" + frente;
    const resultadoEliminarPlantilla = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
    return res.status(200).send({result: resultadoEliminarPlantilla});
})

ruta.post('/plantillacostos', verificar, async(req,res)=>{
    const modulo = req.body.datos.modulo;
    const frente = req.body.datos.frente;
    let consulta = "SELECT clavemodelo,NOMBRE AS nombre FROM modelos m " +
    " Where exists (Select * FROM poLotesAsignados p " +
        " where p.modelo=m.clavemodelo and rtrim(p.modulo)=" + modulo + "   ) Order by clavemodelo";
    const lotesAsignados = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    let datosInsertados = 0;
    if(lotesAsignados.length > 0){
        consulta = "";
        lotesAsignados.forEach(async currentItem => {
            consulta += "Insert INTO poEstacionesModuloCantidad (Modulo, Modelo, Estacion, Producto, Cantidad, Tipo) " +
            " Select '" + modulo + "' as Modulo, Modelo, Estacion, Producto, Cantidad, Tipo" +
            " FROM poInsumosxEstacion i " +
            " Where frente = " + frente +
            " And Modelo = '" + currentItem.clavemodelo + "' " +
            " And Not Exists(Select * FROM poEstacionesModuloCantidad e " +
            " Where e.Modulo = '" + modulo + "' " +
            " And e.Modelo = i.Modelo " +
            " And e.Estacion = i.Estacion " +
            " And e.Producto = i.Producto); ";
            consulta += `update poavanceobra set pagoetiq = es.importe * (pc.Porcentaje / 100 )
            from poavanceobra po
            inner join poLotesAsignados pl on pl.frente = po.frente
            and po.manzana = pl.manzana and po.lote = pl.lote and po.interior = pl.interior and po.subinterior = pl.subinterior
            inner join poCatalogoEstacionesFrente pc on pc.estacion = po.estacion and pc.frente = po.frente and pc.modelo = pl.modelo
            inner join modelos m on m.clavemodelo = pl.modelo
            inner join especEdificacion es on es.especid = pc.espera and es.modelo collate Modern_Spanish_CI_AS = m.nombre and es.frente = po.frente
            where po.frente = ${frente}; `;
        });
        const resultadoInsercionEstacionesModuloCantidad = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
        datosInsertados = resultadoInsercionEstacionesModuloCantidad;
        //AQUI YA SE GENERAN LAS INSUMOS X ESTACION
        consulta = "Delete From poAvanceObraInsumos Where frente=" + frente + ";" +
        " Insert into poAvanceObraInsumos (frente, manzana, lote, interior,subinterior,estacion,producto,cantidad) " +
        " Select vw.frente,vw.manzana,vw.lote,vw.interior,vw.subinterior" +
        " ,c.estacion,c.producto,c.cantidad" +
        " from fn_vwAvanceObraModulo(" + frente + ") vw " +
        "    inner join poEstacionesModuloCantidad c on c.modulo=vw.modulo " +
        "      and Left(c.producto,2)<>'90'" +
        "      and vw.modelo=c.modelo " +
        "      and vw.estacion=c.estacion" +
        " where vw.frente=" + frente + ";";

        consulta += " Insert into poAvanceObraInsumos (frente, manzana, lote, interior,subinterior,estacion,producto,cantidad) " +
         " Select vw.frente,vw.manzana,vw.lote,vw.interior,vw.subinterior" +
         " ,c.estacion,c.producto,c.cantidad as cantidad" +
          " from fn_vwAvanceObraModulo(" + frente + ") vw " +
         "    inner join poEstacionesModuloCantidad c on c.modulo=vw.modulo " +
         "      and Left(c.producto,2)='90'" +
         "      and vw.modelo=c.modelo " +
         "      and vw.estacion=c.estacion" +
         " where vw.frente=" + frente + ";";

         const resultadoConsultaInsumosxEstacion = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
         //SE CAMBIA EL ESTADO DEL FRENTE A EXPLOSIONADO
         if(resultadoConsultaInsumosxEstacion){ 
            consulta = "update poEstatusAsignacion set explosionado = 1, fechaexplosionado = getDate() where frente = " + frente;            
            const estatusActualizado = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
            //AHORA SE VAN A INSERTAR LAS EXPLOSIONES POR CONTRATISTA PARA LUEGO CAMBIAR EL ESTATUS A SUMINSITRADO
            consulta = "Delete From tabDetallesContratistas Where Left(modulo,4)=" + frente + ";";
            consulta += " Insert Into tabDetallesContratistas";
            consulta += " Select v.modulo,v.proveedorid,p.nombre as alias, p.razonsocial as proveedor";
            consulta += "  ,producto,insumoid,nombreproducto,unidad";
            consulta += "  ,Sum(cantidad) as cantidad";
            consulta += "  from vwInsumosxContratista v";
            consulta += "   inner join proveedores p on p.proveedorid=v.proveedorid";
            consulta += "  where frente=" + frente;
            consulta += "  group by v.modulo,v.proveedorid,p.nombre, p.razonsocial,producto,insumoid,nombreproducto,unidad;";

            consulta += "update poEstatusAsignacion set suministrado = 1, fechasuministrado = getDate() where frente = " + frente;
            const resultadoInsercionTabDetalles = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
            if(resultadoInsercionTabDetalles){
                return res.status(200).send({mensaje: "Se insertaron los datos correctamente", result: estatusActualizado});
            }
            
        };
    }
});

//-------------------------------- ELIMINACIÓN DE DATOS --------------------------------
ruta.delete('/insumos/:frente/:modelo', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const modelo = req.params.modelo;
    const consulta = 'Delete poInsumosXEstacion where frente = ' + frente + " and modelo = " + modelo;
    const result = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta)
    return res.json({mensaje: 'Se eliminaron los datos correctamente', result: result});
})

ruta.delete('/insumos/frente/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = 'Delete poInsumosXEstacion where frente = ' + frente;
    const result = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta)
    return res.json({mensaje: 'Se eliminaron los datos correctamente', result: result});
})

ruta.delete('/insumo/:id', verificar, async(req,res)=>{
    const id = req.params.id;
    const consulta = "delete poinsumosxestacion where estaciondetid = " + id;
    const result = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta)
    return res.status(200).send({mensaje: 'Se eliminaron los datos correctamente', result: result});
})

ruta.delete('/plantilla/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "delete poInsumosxEstacion where frente = " + frente;
    try{
         const registrosAfectados = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
         if(registrosAfectados == 0) {
            return res.json({mensaje: "No se eliminó ningún dato", status: 204});
         }else {
            return res.status(200).json({mensaje: "Datos eliminados correctamente", status:200});
        }
    } catch(error){
        if(error) return res.status(200).json({mensajeerror:"Error en el servidor", error: error, status:500});
    }
})




//-------------------------------- MODIFICACION DE DATOS ----------------------------
//PARA BLOQUEAR LAS ESTACIONES
ruta.put('/bloqueoestaciones', verificar, async(req, res)=>{
    const datos = req.body.datos;
    const consulta = 'update poinsumosxestacion set readonly = ' + datos['readonly'] + ' where estaciondetid = ' + datos['id'];
    const result = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta)
    return res.status(200).send({mensaje: 'Se modificaron los registros correctamente', result: result});
})

ruta.put('/insumos', verificar, async(req,res)=>{
    const datos = req.body.datos;
    const consulta = "Update poInsumosXEstacion Set cantidad = " +
     datos.cantidad +
     ",estacion='" + datos.estacion + "'" +
     ",producto='" + datos.producto.trim() + "'" +
     ",costo=" + datos.costo + "" +
     ", readonly = " + datos.readonly +
     " where estaciondetid=" + datos.id;
    const result = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta)
    return res.status(200).send({mensaje: 'Se modificaron los datos correctamente', result: result});
})

module.exports = ruta;