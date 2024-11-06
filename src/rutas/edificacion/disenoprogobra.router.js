const express = require('express');
const verificar = require('../../controladores/verificarToken.controller');
const procesadorDeConsultas = require('../../controladores/procesadorConsultas.controller.js');


const ruta = express.Router();



//----------------------------------- CONSULTA DE DATOS -----------------------------
ruta.get('/matrizasignaciones/:frente/:modulo/:ubicaciones/:modo', verificar, async(req, res)=>{
    const frente = req.params.frente;
    const modulo = req.params.modulo;
    const ubicaciones = req.params.ubicaciones;
    const modo = req.params.modo;
    let consulta = `select * from (select poCA.estacion + ' - ' + poCA.descripcion + ' - '  + e.descripcion  as Estacion, e.especid,
    REPLACE(STR(a.manzana,3),' ','0')+'-'+REPLACE(STR(a.LOTE,3),' ','0')+'-'+ 
    REPLACE(STR(a.interior,3),' ','0')+'-'+REPLACE(STR(a.subinterior,2),' ','0') + ' _ ' + poCA.modelo as ubicacion, 
    p.nombre + ' - ' COLLATE Modern_Spanish_CI_AS + rtrim(a.status) + ' - ' + cast(pa.proveedorId as varchar) as nombre
    from poAvanceObra a
    left join poAsignaObra pa on pa.explosionId = a.explosionId
    Inner join poCatalogoEstacionesFrente poCA on poCA.estacion = a.estacion and poCA.frente = a.frente
    inner join espec e on e.especid = poCA.espera
    left join proveedores p on p.proveedorId = pa.proveedorid and p.tipo like '%${modo}%'
    left join poLotesAsignados pl on pl.modelo = poCA.modelo and pl.frente =a.frente and 
        pl.manzana = a.manzana and pl.lote = a.lote and pl.interior = a.interior and pl.subinterior = a.subinterior
    inner join poModulosObra pm on pm.modulo = pl.modulo
    ${parseInt(modulo) != 0 ? " where a.frente = " + frente + " and pl.modulo in (select modulo from poModulosobra where ccedif = " + modulo +"))"
    : "where a.frente = " + frente + ")"}
    src Pivot  ( MAX(nombre) for UBICACION in
    (${ubicaciones}) ) piV`;
    const result = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(result);
});

ruta.get('/ubicaciones/:frente/:modulo', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const modulo = req.params.modulo;
    let consulta = " select distinct REPLACE(STR(pl.manzana,3),' ','0')+'-'+REPLACE(STR(pl.LOTE,3),' ','0')+'-'+  REPLACE(STR(pl.interior,3),' ','0')+'-'+REPLACE(STR(pl.subinterior,2),' ','0') ubicacion" +
    " , pm.descripcion, pl.modelo from poLotesAsignados pl " +
    " inner join frentes f on cast(f.numero as int) = cast(pl.frente as int) and f.tipo = 'F' " +
    " inner join lotes l on cast(pl.manzana as int) = cast(l.manzana as int) and " +
    " cast(pl.lote  as int) = cast(l.lote as int) and cast(l.interior as int) = cast(pl.interior as int) " +
    " and cast(pl.subinterior as int) = cast (l.subinterior as int) and l.frenteid = f.frenteid " +
    " inner join poModulosObra pm on pm.modulo = pl.modulo where frente = " + frente;
    if(parseInt(modulo) != 0){
        consulta += " and pm.ccedif = " + modulo + "; ";
    }else{
        consulta += " order by pm.descripcion";
    }
    const result = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(result);
});

ruta.get('/ubicaciones/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = " Select m.nombre as modelo, m.modeloid,m.clavemodelo,  Isnull(mf.NombreComercial,'N/A') as nombreComercial, 0 as modulosasignados, " + 
    " 0 as asignadas, Count(*) as cantidad " +
    " from lotes l Inner join modelos m On m.modeloId=l.modeloId " +
    " inner join empresas e on e.empresaId=l.empresaId  " +
    " Inner Join frentes f on f.frenteId=l.frenteId And f.numero = " + frente + "  and tipo = 'F' " +
    " Left join modelosxfraccionamiento mf On mf.modeloId=m.modeloId     And f.fraccionamientoId=mf.fraccionamientoId  " +
    " Where m.modeloid<>9909 " +
    " Group by  m.nombre, m.modeloid,m.clavemodelo, Isnull(mf.NombreComercial,'N/A') " +
    " Order by m.nombre";
    const ubicaciones = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(ubicaciones);
});

ruta.get('/ubicaciones/avance/:frente/:filtromodelo', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const filtromodelo = req.params.filtromodelo != 'n_a' ? " and m.nombre='" + req.params.filtromodelo + "'" : '';
    const consulta =  " Select distinct Cast(a.secuencia as Int) as secuencia, a.ubicacion as valor"
    + " ,'( '+m.nombre+' )' as modelo, modulo"
    + " from fn_vwAvanceObraModulo(" + frente + ") a "
    + "   Inner Join modelos m on m.clavemodelo=a.modelo"
    + "    where a.frente=" + frente
    + filtromodelo
    + "  Order by  Cast(a.secuencia as Int), a.ubicacion"
    const ubicacionesSecuencia = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(ubicacionesSecuencia);
})

ruta.get('/modulos/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "select '-Todos los módulos-' as descripcion, 0 as ccedif union all "  +
    "select distinct pm.descripcion, ccedif from poModulosObra pm " +
    " inner join poLotesAsignados pl on pl.modulo = pm.modulo " +
    " where pl.frente = " + frente;
    const result = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(result);
});

ruta.get('/plantillaavance/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = " select count(*) from poavanceobra where frente = " + frente;
    const result = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(result);
});

ruta.get('/cantidadlotes/revision/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "Select Isnull(Count(*),0) as son" +
    " from poLotesAsignados Where frente = " + frente;
    const cantidadLotes = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(cantidadLotes);
});

ruta.get('/explosionesmodulos/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "Select Isnull(Count(*),0) as son from poEstacionesModuloCantidad" +
    " Where left(modulo,4)= " + frente;
    const cantidadExplosiones = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(cantidadExplosiones);
});

ruta.get('/controlinicial/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "select count(*) as cantidadAvanceObra from poavanceobra where frente = " + frente;
    const resultado = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(resultado[0].cantidadAvanceObra);
});

ruta.get('/costosextras/:frenteid', verificar, async(req,res)=>{
    const frenteid = req.params.frenteid;
    const consulta = "Select  proveedor1,proveedor2,proveedor3,proveedor4,proveedor5,proveedor6,proveedor7,proveedor8,proveedor9,proveedor10"
    + " ,importe1,importe2,importe3,importe4,importe5,importe6,importe7,importe8,importe9,importe10"
    + " from afObraExtra "
    + " Where frenteId = " + frenteid;
    const costosExtras = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(costosExtras);
})

ruta.get('/porcentajes', verificar, async(req,res)=>{
    const consulta = "Select rtrim(modelo) as modelo,estacion,porcentaje" 
    + " From afPagosEtiquetados "
    + " Order by modelo, estacion";
    const porcentajes = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(porcentajes);
})  

ruta.get('/porcentajesespecialidad/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "Select espera as especid,rtrim(m.nombre) as modelo,estacion,porcentaje"
    + " From poCatalogoEstacionesFrente pc"
    + " inner join modelos m on m.clavemodelo = pc.modelo "
    + " where frente=" + frente
    + " Order by modelo, estacion";
    const porcentajesEspecialidad = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(porcentajesEspecialidad);
})

ruta.get('/contratos/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "Select isnull(ccedif,0) as ccedif, numero, m.modeloid, nombre as modelo"
    + " From spvnet200.dbo.afContratosObra a inner join modelos m on m.modeloid=a.modeloid"
    + " where substring(left(cast(1000000+numero as varchar),5),2,4)=" + frente
    + " Order by  ccedif, numero";
    const contratos = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(contratos);
})

ruta.get('/cantidadlotes/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "Select isnull(ccedif,0) as ccedif, Sum(lotes) as lotes"
    + "  From spvnet200.dbo.afContratosObra a "
    + " where substring(left(cast(1000000+numero as varchar),5),2,4)=" + frente
    + " Group by isnull(ccedif,0)";
    const cantiadadLotes = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(cantiadadLotes);
})

ruta.get('/estatusmodulo/:frente/:ccedif/:agrupado', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const ccedif = req.params.ccedif;
    const agrupado = req.params.agrupado == 'true' ? "  and isnull(ccedif,0)=" + ccedif : "";
    const consulta = "Select modulo, status "
    + "  From pomodulosobra where left(modulo,4)=" + frente + agrupado
    + " Order by modulo";
    const estatusModulo = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(estatusModulo);
})

ruta.get('/costoedificacion/:frenteid', verificar, async(req,res)=>{
    const frenteid = req.params.frenteid;
    const consulta = "Select Sum(edificacion*lotes) as edificacion,sum(obraextra*lotes) as extras "
    + " from spvnet200.dbo.afContratosObra "
    + " where frenteid=" + frenteid;
    const edificacion = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(edificacion);
})

ruta.get('/modulosasignados/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "Select m.modulo, p.razonsocial, "
    + "  lotes as casas, status,"
    + "   sum(Isnull(a.importe,0)) as monto, sum(isnull(a.porcentaje,0)) as porcentaje"
    + " from pomodulosobra m "
    + "  Inner join proveedores p On m.proveedorid=p.proveedorid "
    + "  Left Join afCostoEstacion a on cast(a.modulo as int)=Cast(Right(m.modulo,4) as Int)"
    + " Where Left(m.modulo,4)='" + frente + "'"
    + " Group by m.modulo, p.razonsocial, lotes, status"
    + " Order By m.modulo, p.razonsocial, lotes, status"
    const modulosasignados = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(modulosasignados);
})

ruta.get('/costoproduccion/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "Select m.modeloid, casas, m2, costo1 as edificacion, costo2 as materiales"
    + "  ,costo3 as obraextra, costo4 as plataformas"
    + "  ,costoacc1 as accesorio1,costoacc2 as accesorio2,costoacc3 as accesorio3"
    + "  ,costoacc4 as accesorio4,costoacc5 as accesorio5, 0 as accesorio6"
    + "  ,costo6 as total "
    + " From prCostoProduccionModelo c"
    + "  inner join modelos m on m.nombre=c.modelo"
    + "  and m.modeloid<>9909"
    + "   Where frente='" + "F-" + frente + "'"
    + "      and Isnull(real,0)=1"
    + " order by m.modeloid";
    const costoproduccion = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(costoproduccion);
})

ruta.get('/costoxestacion/cantidadexplosiones/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "Select count(*)  as son from poAvanceObra Where frente = " + frente + " and isnull(pagoetiq, 0) != 0";
    const cantidadCostos = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(cantidadCostos);
})

ruta.get('/cuadrillas', verificar, async(req,res)=>{
    const consulta = "Select rTrim(producto) as producto,c.insumoid"
    + "  ,factor1 as tradicional, factor2 as medioresidencial"
    + "  from  cuadrillas c "
    + "   inner join insumos i on i.insumoid=c.insumoid"
    + "  Order by rTrim(producto)";
    const cuadrillas = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(cuadrillas);
})

ruta.get('/modelos/cuadrillas', verificar, async(req,res)=>{
    const consulta = "Select clavemodelo as modelo,isnull(tipomodelo,0) as tipomodelo"
    + "  from  modelos"
    + "  Order by clavemodelo";
    const modelosCuadrillas = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(modelosCuadrillas);
})

ruta.get('/cantidadlotesasignados/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente ;
    const consulta = "Select IsNull(Count(*),0) as son From poLotesAsignados Where Left(modulo,4)=" + frente;
    const cantidadlotes = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(cantidadlotes);
})

ruta.get('/productos/lineaproduccion/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "Select * From poEstacionesModuloCantidad"
    + " Where Left(producto,2)='90' And left(modulo,4)='" + frente + "'";
    const insumosLP = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(insumosLP);
})

ruta.get('/modulos/contratos/:frenteid', verificar, async(req,res)=>{
    const frenteid = req.params.frenteid;
    const consulta = "Select  isnull(ccedif,Right(cast(numero as varchar(5)),2) ) as ccedif, "
    + " substring(left(cast(1000000+numero as varchar),7),2,6)  as modulo,proveedorid,lotes, modeloid"
    + " ,edificacion as monto, isnull(edificacionpactado,edificacion) as montomaximo"
    + " ,obraextra as extras,materiales,montocontrato as contratofinal"
    + " ,lotes*edificacion as importe, lotes*edificacion+obraextra as contrato"
    + " , 3 as contratotal, lotes*materiales as materialestotal, 5 as materialestotal2"
    + " ,isnull(accesorio1,0) as accesorio1"
    + " ,isnull(accesorio2,0) as accesorio2"
    + " ,isnull(accesorio3,0) as accesorio3"
    + " ,isnull(accesorio4,0) as accesorio4"
    + " ,isnull(accesorio5,0) as accesorio5"
    + " ,isnull(accesorio6,0) as accesorio6"
    + " From spvnet200.dbo.afContratosObra where frenteid = " + frenteid
    + " and modeloid<>9909 order by right(cast(numero as varchar(5)),2), numero";
    const modulosPorContrato = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(modulosPorContrato);
})

ruta.get('/estaciones/costoxestacion/modelo/frente/:frente/frenteid/:frenteid/especialidad/:especid', verificar, async(req,res)=>{
    const especid = req.params.especid;
    const validadorEspecid = especid != 0 ? " and e.espera = " + especid : "";
    const frenteid = req.params.frenteid;
    const frente = req.params.frente;
    const consulta = "Select a.modulo,a.modeloid,m.nombre as modelo"
    + "   ,Isnull(mf.NombreComercial,' ') as nombrecomercial"
    + "   ,a.estacion,isnull(e.descripcion,'Error') as nombreestacion"
    + "   ,e.porcentaje,importe,p.razonsocial"
    + "   ,isnull(c.ccedif,0) as ccedif"
    + "  From afCostoEstacion a "
    + "    Inner join modelos m                on m.modeloid=a.modeloid"
    + "    Inner join spvnet200.dbo.afContratosObra c        on c.numero=a.modulo"
    + "    Inner join proveedores p            on p.proveedorid=c.proveedorid"
    + "    Inner Join poCatalogoEstacionesFrente e    on e.frente=" + frente
    + "       and e.modelo=m.clavemodelo  and e.estacion=a.estacion"
    + "    Inner Join frentes f on f.frenteId=a.frenteId"
    + "    Left join modelosxFraccionamiento mf on mf.modeloId=m.modeloId "
    + "       And f.fraccionamientoId=mf.fraccionamientoId "
    + "  where a.frenteid=" + frenteid + validadorEspecid
    + "  order by a.modulo,m.nombre,a.estacion";
    const estacionesPorModelo = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(estacionesPorModelo);
})

ruta.get('/lotesasignados/modelo/:modeloaasignar/modelos/:modelosaasignar/:agrupado/frente/:frente', verificar, async(req,res)=>{
    const agrupado = req.params.agrupado == 'true';
    const frente = req.params.frente;
    const modeloaasignar= req.params.modeloaasignar;
    const modelosaasignar = req.params.modelosaasignar;
    let consulta = " Select  distinct REPLACE(STR(manzana,3),' ','0') as manzana,REPLACE(STR(lote,3),' ','0')  as lote ,REPLACE(STR(interior,3),' ','0') as interior, " +
   " REPLACE(STR(subinterior,2),' ','0') as subinterior ,m.nombre as modelo ,'N/A' as modulo, 0 as secuencia ,0 as rubro1,0 as rubro2,0 as rubro3,0 as rubro4,0 as rubro5  " +
   " from lotes l Inner join modelos m On m.modeloId=l.modeloId       and m.modeloid<>9909 " +
   " inner join empresas e on e.empresaId=l.empresaId " +
   " Inner Join frentes f on f.frenteId=l.frenteId And numero=" + frente + "    And f.tipo ='F' "+
   " Left join modelosxfraccionamiento mf On mf.modeloId=m.modeloId And f.fraccionamientoId=mf.fraccionamientoId  "+
   " Where Not Exists (  Select * From poLotesAsignados po "+
   " Where      po.frente=" + frente + "      and cast(po.manzana as int)=cast(l.manzana as int)      and cast(po.lote as int)=cast(l.lote as int)  "+
   " and cast(po.interior as int)=cast(l.interior as int)      and cast(po.subinterior as int)=cast(l.subinterior as int)) "
    if (!agrupado) {
      if (modeloaasignar != 'n_a') {
        consulta += " and l.modeloid=" + modeloaasignar;
      }
    }
    else {
      if (modelosaasignar != 'n_a') {
        //BUG 06.02.21  consulta += " and l.modeloid IN(" + this.modelosAsignar + ")";
        consulta += " and l.modeloid IN(" + modelosaasignar + ")";
      }
    }
    consulta += " Order by  manzana,lote,interior,subinterior";
    const estacionesAsignadas = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(estacionesAsignadas);
})

ruta.get('/frenteautorizado/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "Select autorizada From afControlFrentes Where frente=" + frente;
    const frenteAutorizado = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(frenteAutorizado);
})

ruta.get('/estacionespdf/:frenteid', verificar, async(req,res)=>{
    const frenteid = req.params.frenteid;
    const consulta = "Select a.proveedorid,p.razonsocial,numero as modulo,lotes, a.modeloid, m.nombre as modelo"
    + " , Isnull(mf.NombreComercial,'N/A') as nombreComercial"
    + " ,edificacion as monto,obraextra as extras,materiales,montocontrato as contratofinal"
    + " From spvnet200.dbo.afContratosObra a"
    + "  Inner join proveedores p on p.proveedorid=a.proveedorid"
    + "  Inner Join frentes f on f.frenteId=a.frenteId"
    + "  Inner join modelos m on m.modeloid=a.modeloid"
    + "   Left join modelosxfraccionamiento mf On mf.modeloId=m.modeloId "
    + "    And f.fraccionamientoId=mf.fraccionamientoId "
    + "  where a.frenteid=" + frenteid
    + "  order by p.razonsocial,numero"
    const datosPDF = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(datosPDF);
})

ruta.get('/secuencialotespdf/:frente/:agrupado', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const agrupado = req.params.agrupado == 'true' ? " Order by l.modulo,Cast(secuencia as Int)" : " Order by mo.ccedif,Cast(secuencia as Int)";
    const consulta = "Select l.modulo, p.razonsocial"
      + ", REPLACE(STR(manzana,3),' ','0') as manzana,REPLACE(STR(lote,3),' ','0')  as lote"
      + ", REPLACE(STR(interior,3),' ','0') as interior, REPLACE(STR(subinterior,2),' ','0') as subinterior"
      + ", m.nombre as modelo, Isnull(mf.NombreComercial,'N/A') as nombreComercial"
      + ", Cast(secuencia as Int) as secuencia"
      + " ,mo.ccedif"
      + " from poLotesAsignados l "
      + "  Inner join modelos m On m.clavemodelo=l.modelo "
      + "  Inner Join frentes f on f.numero =" + frente + " and f.tipo = 'F'"
      + "  Inner join poModulosObra mo On mo.modulo=l.modulo"
      + "  Inner join proveedores p on p.proveedorid=mo.proveedorid"
      + "   Left join modelosxfraccionamiento mf On mf.modeloId=m.modeloId And f.fraccionamientoId=mf.fraccionamientoId "
      + "  Where Left(l.modulo,4)=" + frente + agrupado;
      const secuenciaLotes = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
      return res.json(secuenciaLotes);
})

ruta.get('/asignacionespdf/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "Select distinct l.modulo, p.razonsocial "
      + ", REPLACE(STR(l.manzana,3),' ','0') as manzana,REPLACE(STR(l.lote,3),' ','0')  as lote "
      + " , REPLACE(STR(l.interior,3),' ','0') as interior, REPLACE(STR(l.subinterior,2),' ','0') as subinterior "
      + ", m.nombre as modelo, Isnull(mf.NombreComercial,'N/A') as nombreComercial "
      + ", Cast(secuencia as Int) as secuencia "
      + " from   poLotesAsignados l "
      + " inner join poAvanceObra pa on pa.frente = l.frente and pa.manzana = l.manzana and "
      + " pa.lote = l.lote and pa.interior = l.interior and pa.subinterior = l.subinterior "
      + " inner join poAsignaObra a on a.explosionId = pa.explosionId"
      + " inner join proveedores p on p.proveedorid = pa.proveedorid and p.tipo like '%contratista%' "
      + " Inner join   modelos m On m.clavemodelo=l.modelo "
      + " Inner Join frentes f on numero = " + frente
      + " and tipo = 'F' "
      + " Inner join   poModulosObra mo On mo.modulo=l.modulo "
      + " Inner join   proveedores p on p.proveedorid=a.proveedorid "
      + " Left join modelosxfraccionamiento mf On mf.modeloId=m.modeloId And f.fraccionamientoId=mf.fraccionamientoId  "
      + " Where Left(l.modulo,4)= " + frente
      + " Order by p.razonsocial,m.nombre,l.modulo,Cast(secuencia as Int) "
    const asignacion = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(asignacion);

})

ruta.get('/cantidadcontratos/cantidadavance/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    let consulta = "Select count(*) as cantidadcontratos from poContratosObra Where frente=" + frente 
    const resultcontratos = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    const cantidadContratos = resultcontratos[0].cantidadcontratos;
    consulta = "Select count(*)  as avanzadas from poAvanceObra where status<>'P' and frente=" + frente;
    const resultAvances = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    const cantidadAvance = resultAvances[0].avanzadas;
    return res.json({cantidadcontratos: cantidadContratos, cantidadavance: cantidadAvance});
})
//////////////////////// PROGRAMACIÓN DE FECHAS ////////////////////////////////////

ruta.get('/programacionfechas/fechascierre/:frente/:clave', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const clave = req.params.clave;
    const consulta = "Select fechacierre "
    + " from cierres c  "
    + "  inner join catalogoCierres k on k.catcierreid=c.catcierreid"
    + "  where c.frente=" + frente
    + "   and c.autorizada=2"
    + "   and isnull(estatus,0)=1"  // activa
    + "   and  k.clave='" + clave + "'"
    const fechaCierre = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(fechaCierre);
})

ruta.get('/programacionfechas/plantilladias/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "Select d.modelo,d.estacion,c.descripcion as nombreestacion,d.dias"
    + " from poPlantillasModeloDias d  "
    + "  Inner join poCatalogoEstacionesFrente c On c.estacion=d.estacion   and d.modelo=c.modelo "
    + "   And c.frente=" + frente
    + "  Order by d.modelo,d.estacion";
    const plantillaDias = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(plantillaDias);
})

ruta.get('/programacionfechas/diasestacion/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "Select d.modelo,d.estacion,d.descripcion as nombreestacion,d.diasPlan as dias, d.diasePlan as diasEst"
    + " from poCatalogoEstacionesFrente d  "
    + "   where d.frente=" + frente
    + "  Order by d.modelo,d.estacion";
    const diasEstaciones = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(diasEstaciones);
})

ruta.get('/programacionfechas/estaciones/modelo/:frente/:filtromodelo', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const filtromodelo = req.params.filtromodelo != 'n_a' ? " and m.nombre='" + req.params.filtromodelo + "'" : '';
    const consulta = "Select l.modelo,estacion,descripcion,espera"
    + "    from poCatalogoEstacionesFrente l"
    + "  Inner join modelos m on m.clavemodelo=l.modelo"
    + filtromodelo
    + "     Where frente=" + frente
    + "   Order by l.modelo,estacion,descripcion,espera";
    const estaciones = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(estaciones);
})

ruta.get('/programacionfechas/cantidadmodelos/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "Select m.nombre as modelo,count(*) as son"
    + "    from poCatalogoEstacionesFrente l "
    + "  inner join modelos m on m.clavemodelo=l.modelo"
    + "     Where frente=" + frente
    + "   Group by m.nombre"
    const cantidadmodelos = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(cantidadmodelos);
})

//USO UN POST PORQUE NECESITO RECORRER UN ARREGLO
ruta.post('/consultadatos/programacionfechas/fechas', verificar, async(req,res)=>{
    const datos = req.body.datos;
    const seleccionModulos = datos.modulos[0] == 'Todos' ? " Where  Left(o.modulo,4)=" + datos.frente : " Where o.Modulo  In(" + datos.modulosSeleccionados + ")";
    const consulta = "Select e.explosionid, o.modelo, o.manzana, o.lote, o.interior, o.subinterior, e.estacion"
    + " ,isnull(k.diasPlan,0) as diascasa, isnull(k.diasePlan,0) as diasestaciones, 5 as estacionesPorSemana, secuencia "
    + " ,e.fechaini, e.fecharea, o.modulo, k.espera"
    + " From poLotesAsignados o "
    + "     Inner Join poAvanceObra e               On o.Frente = e.Frente And o.Manzana = e.Manzana"
    + "            And o.Lote = e.Lote and o.Interior = e.Interior And o.SubInterior = e.SubInterior "
    + "             And e.Status <> 'T'"
    + "     Inner Join poCatalogoEstacionesFrente k on k.frente=Left(o.modulo,4)"
    + "           and k.modelo=o.modelo and k.estacion=e.estacion"
    + seleccionModulos 
    + " Order By Cast(o.Secuencia as Int), o.manzana, o.lote, o.interior, o.subinterior,e.Estacion";
    const fechas = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(fechas);
})

ruta.get('/montosextra/:frenteid', verificar, async(req,res)=>{
    const frenteid = req.params.frenteid;
    const consulta = "select isnull(Sum(extra),0) as extra from vw_obraextra10 where frenteid=" + frenteid;
    const extras = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(extras);
})

ruta.get('/avances/estaciones/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = `Select av.explosionid, av.proveedorid,isnull(p.nombre,'N/a') as alias, isnull(av.fechaini,'') as fechainicio
    ,av.status, av.fechater, av.modulo,av.modelo
    From vwAvanceObraNormalizada  av
    inner join poModulosObra pm on pm.modulo = av.modulo
    Left join proveedores p          on p.proveedorid=av.proveedorid
    Where av.frente=${frente} 
    Order by explosionid`;
    const estacionesAvance = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(estacionesAvance);
})


ruta.get('/ubicaciones/modulo/:frente/:ccedif', verificar, async(req,res) => {
    const frente = req.params.frente; 
    const ccedif = req.params.ccedif;
    const consulta = `select cast(pl.manzana as int) manzana, cast(pl.lote as int) lote, cast(pl.interior as int) interior, cast(pl.subinterior as int) subinterior 
    from poLotesAsignados pl 
    inner join poModulosObra pm on pm.modulo = pl.modulo
    where pl.frente = ${frente} and pm.ccedif = ${ccedif}
    order by cast(pl.secuencia as int)`;
    const ubicaciones = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(ubicaciones);
})

ruta.get('/ubicaciones/matriz/:frente/:filtromodelo/:ubicaciones', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const ubicaciones = req.params.ubicaciones;
    const consulta = `select * from  (select a.estacion + ' ' + substring(es.descripcion, 1, 6) as estacion, a.especid,
        e.duracion diasestacion
       ,a.ubicacion as ubicacion, case when year(a.fecharea) <= 2001 then format(a.fechaini, 'dd/MM/yyyy') 
       else format(a.fecharea, 'dd/MM/yyyy') end + '_' + cast(a.explosionid as varchar) + '_' + a.status as explosionid
        from vwAvanceObraNormalizada a
        inner join espec es on es.especid = a.especid
       Inner join modelos m on m.clavemodelo=a.modelo
       inner join poModulosObra pm on pm.modulo = a.modulo
       Inner Join poCatalogoEstacionesFrente e on
       e.modelo=m.clavemodelo  and e.estacion=a.estacion  and a.frente= ${frente}
       ) src pivot ( MAX(explosionid)  for ubicacion in ( ${ubicaciones}) ) piV
       order by estacion`;
    console.log(consulta);
    const matrizUbicaciones = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(matrizUbicaciones);
})

ruta.get('/estaciones/min_max/:frente/:filtromodelo', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const filtromodelo = req.params.filtromodelo != 'n_a' ?  "Inner join modelos m on m.clavemodelo=l.modelo and m.nombre='" + req.params.filtromodelo + "'" : '';
    const consulta = "Select espera as especid,"
    + "  Min(estacion) as estacionIni, Max(estacion) as estacionFin  "
    + " From pocatalogoestacionesfrente l "

    + filtromodelo
    + "    where frente=" + frente
    + " Group by espera"
    const rangosEstaciones = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(rangosEstaciones);
})

ruta.post('/totalcontratos', verificar, async(req,res)=>{
    const datos = req.body.datos;
    const proveedorid = datos.proveedorid;
    const frente = datos.frente;
    const especid = datos.especid;
    let consulta = `select count(pco.id) as totalContratos from poAvanceObra po 
    inner join poAsignaObra pa on pa.explosionid = po.explosionId
    inner join poLotesAsignados pl on pl.frente = po.frente and pl.manzana = po.manzana and pl.lote = po.lote
    and pl.interior = po.interior and pl.subinterior = po.subinterior
    inner join poCatalogoEstacionesFrente pc on pc.frente = po.frente and pc.estacion = po.estacion and pc.modelo = pl.modelo
    left join poContratosObra pco on pco.frente = po.frente and pco.proveedorid = pa.proveedorid 
    where po.frente = ${frente} and pa.proveedorid = ${proveedorid}
    group by pco.id`;
    const totalContratos = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    if(totalContratos[0] && totalContratos[0].totalContratos > 0){
        consulta = `select pc.concepto, pc.monto from poContratosObra pc
        inner join vwAvanceObraNormalizada a on a.frente = pc.frente and a.proveedorid = pc.proveedorid
	    inner join poAvanceObraContratos pco on pco.explosionId = a.explosionid and pco.idContrato = pc.id
        where a.frente = ${frente} and a.especid = ${especid} and pc.proveedorid = ${proveedorid}`;
        const nombresContratos = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
        return res.json({tieneContrato: true, datosContratos: nombresContratos});
    }else{
        return res.json({tieneContrato: false});
    }
})

ruta.get('/permisoEspecialidades/:usuarioid/:menuid', verificar, async(req,res)=>{
    const usuarioid = req.params.usuarioid;
    const menuid = req.params.menuid;
    const consulta = "select menuid from spvnet200.dbo.usuariomenu where menuid = " + menuid + " and usuarioid = " + usuarioid;
    const resultado = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json({aprobado: resultado.length > 0 ? true : false});
})


//---------------------------------- ACTUALIZACION DE DATOS -------------------------

ruta.put('/contratista', verificar, async(req, res)=>{
    const datos = req.body.datos;
    const especialidad = datos.especid;
    let consultaAuxiliar = " update pa set pa.proveedorid = " + datos.proveedorid + " from " +
    " poAvanceObra po " +
    " left join poAsignaObra pa on pa.explosionId = po.explosionId" +
    " left join proveedores p on p.proveedorid = pa.proveedorid and p.tipo like '%contratista%' " +
    " inner join poLotesAsignados pl on " +
    " pl.frente = po.frente and pl.manzana = po.manzana and pl.lote = po.lote " +
    " and po.interior = pl.interior and po.subinterior = pl.subinterior " +
    " inner join poCatalogoEstacionesFrente pc " +
    " on pc.frente = po.frente " +
    " and pc.estacion = po.estacion and pc.modelo = pl.modelo "
    let consulta = "";
    if(datos.moduloCompleto){
        consulta += consultaAuxiliar + " inner join poModulosObra pm on pm.modulo = pl.modulo and pm.ccedif = " + datos.modulo
        + " where po.frente = " + datos.frente 
        + " and pc.espera = " + especialidad 
        + " and po.status = 'P'; "
    }
    if(datos.ubicacion_estacion){
        datos.ubicacion_estacion.forEach(currentItem => {
            //SE VALIDA POR MEDIO DEL UPDATE QUE ESTÉ EN STATUS 'P' PARA QUE PUEDA ACTUALIZAR EL PROVEEDOR
            const ubicaciones = currentItem.ubicacion.split("-");
            //CON EL PARSEINT ELIMINA LOS STRINGS Y SE QUEDA CON LA PRIMERA PARTE ENTERA DE LA UBICACION
            const manzana = parseInt(ubicaciones[0]);
            const lote = parseInt(ubicaciones[1]);
            const interior = parseInt(ubicaciones[2]);
            const subinterior = parseInt(ubicaciones[3]);
            consulta += consultaAuxiliar + " where po.frente = " + datos.frente +
            " and po.manzana = " + manzana + " and po.lote = " + lote + " and po.interior = " + interior + " and po.subinterior = " + subinterior +
            " and pc.espera = " + especialidad +
            " and po.status = 'P'; ";
        });
    }
    const result = await procesadorDeConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
    if(result && result > 0){
        //PARA REVISAR LAS UBICACIONES YA ASIGNADAS
        consulta = `select count(*) as cantidadNoAsignados 
        from poAvanceObra po 
        inner join poAsignaObra pa on pa.explosionId = po.explosionId
        inner join proveedores p on p.proveedorid = pa.proveedorid and p.tipo like '%contratista%' 
        where isnull(pa.proveedorid, 0) = 0 and po.frente =  ${datos.frente}` 
        const cantidadNoAsignados = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
        if(cantidadNoAsignados[0].cantidadNoAsignados == 0){
            //EN CASO DE QUE TODAS LAS UBICACIONES ESTÉN ASIGNADAS, EL FRENTE SE MARCA COMO YA ASIGNADO
            consulta = "update poEstatusAsignacion set asignado = 1, fechaasignado = getDate() where frente = " + datos.frente;
            const actualizarEstusAsignado = await procesadorDeConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
                //ESTO LO USO PARA DESASOCIAR TODOS LOS CONTRATOS DE SUS RESPECTIVAS ASIGNACIONES
            consulta = "delete poAvanceObraContratos where explosionId in ( "
                + " select po.explosionId from poAvanceObra po "
                + " inner join poLotesAsignados pl on pl.frente = po.frente and pl.manzana = po.manzana and pl.lote = po.lote"
                + " and pl.interior = po.interior and pl.subinterior = po.subinterior"
                + " inner join poCatalogoEstacionesFrente pc on pc.frente = po.frente and pc.estacion = po.estacion and pc.modelo = pl.modelo"
                if(datos.moduloCompleto){
                    consulta += " inner join poModulosObra pm on pm.modulo = pl.modulo"
                    + " where po.frente = " + datos.frente + " and pm.ccedif = " + datos.modulo + " and pc.espera = " + especialidad + " and po.status = 'P')";
                }else{
                    let manzanaAuxiliar = "";
                    let loteAuxiliar = "";
                    let interiorAuxiliar = "";
                    let subinteriorAuxiliar = "";
                    datos.ubicacion_estacion.forEach(currentItem => {
                        //SE VALIDA POR MEDIO DEL UPDATE QUE ESTÉ EN STATUS 'P' PARA QUE PUEDA ACTUALIZAR EL PROVEEDOR
                        const ubicaciones = currentItem.ubicacion.split("-");
                        //CON EL PARSEINT ELIMINA LOS STRINGS Y SE QUEDA CON LA PRIMERA PARTE ENTERA DE LA UBICACION
                        const manzana = parseInt(ubicaciones[0]);
                        const lote = parseInt(ubicaciones[1]);
                        const interior = parseInt(ubicaciones[2]);
                        const subinterior = parseInt(ubicaciones[3]);
                        manzanaAuxiliar += manzana + ",";
                        loteAuxiliar += lote + ",";
                        interiorAuxiliar += interior + ",";
                        subinteriorAuxiliar += subinterior + ",";
                    });
                    manzanaAuxiliar = manzanaAuxiliar.substring(0, manzanaAuxiliar.length - 1);
                    loteAuxiliar = loteAuxiliar.substring(0, loteAuxiliar.length - 1);
                    interiorAuxiliar = interiorAuxiliar.substring(0, interiorAuxiliar.length - 1);
                    subinteriorAuxiliar = subinteriorAuxiliar.substring(0, subinteriorAuxiliar.length - 1);
                    consulta += " where po.frente = " + datos.frente + " and po.manzana in (" + manzanaAuxiliar + ")" + " and po.lote in (" + loteAuxiliar + ")";
                    consulta += " and po.interior in (" + interiorAuxiliar + ") and po.subinterior in (" + subinteriorAuxiliar + ") " +
                    "and pc.espera = " + especialidad + " and po.status = 'P')";
                }
                return res.status(200).send({mensaje: "Se modificaron los datos correctamente", result: actualizarEstusAsignado});
        }
    }
    return res.status(200).send({mensaje: "Se modificaron los datos correctamente", result: result});
});

ruta.put('/modulos/asignar', verificar, async(req,res)=>{
    const datos = req.body.datos;
    const consulta = "UPDATE poModulosObra Set status='D' Where ccedif=" + datos.ccedif + " and left(modulo,4)=" + datos.frente
    const actualizacionModulos = await procesadorDeConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
    return res.json(actualizacionModulos);
})

ruta.put('/modulos/desasignar', verificar, async(req,res)=>{
    const datos = req.body.datos;
    const consulta = "UPDATE pomodulosobra  Set status='A' Where left(modulo,4)=" + datos.frente + " and ccedif=" + datos.ccedif;    
    const actualizacionModulos = await procesadorDeConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
    return res.json(actualizacionModulos);
})

ruta.put('/fechas', verificar, async(req,res)=>{
    const datos = req.body.datos;
    let consulta = "";
    if(datos.modoprograma == 'P'){
        consulta = "Update poAvanceObra Set fechaini="  + "'" + datos.fecha + "'"
        + ", fecharea="  + "'" + datos.fecha + "'"
        + " where explosionid=" + datos.explosionid
        + "  and status<>'T';";   // 08.12.21
    }else{
        consulta = "Update poAvanceObra Set fecharea="
        + "'" + datos.fecha + "'"
        + " where explosionid=" + datos.explosionid
        + "  and status<>'T';";
    }
    const registrosAfectados = await procesadorDeConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
    return res.status(200).send({mensaje: 'Datos modificados correctamnete', registrosAfectados: registrosAfectados});
})

ruta.put('/estatusfrente', verificar, async(req,res)=>{
    const datos = req.body.datos;
    const consulta = "Update poEstatusAsignacion Set programado=1,fechaprogramado=getDate() Where frente=" + datos.frente;
    const actualizacionfrente = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.status(200).send({mensaje: "Datos modificados correctamente", rowsAffected: actualizacionfrente});
})


ruta.put('/plantillaavance/fechas', verificar, async(req,res)=>{
    const datos = req.body.datos;
})

//------------------------------------ INSERCION DE DATOS --------------------------
ruta.post('/plantillaavance', verificar, async(req,res)=>{
    const frente = req.body.datos.frente;
    const consulta = " Insert into poAvanceObra ( " +
          "   frente,manzana,lote,interior,subinterior,estacion" +
          "  ,fechaini,fecharea,fechater,status,stamat)" +
          "  Select a.frente,manzana,lote,interior,subinterior,p.estacion," +
          "  '20010101' as fechaini,'20010101' as fecharea,'20010101' as fechater,'P' as status,'P' as stamat" +
          "   from poLotesAsignados a" +
          "     inner join modelos m                on m.clavemodelo=a.modelo" +
          "     inner join poCatalogoEstacionesFrente p on p.modelo=m.clavemodelo" +
          "      and p.frente=a.frente" +
          "    where a.frente=" + frente + ";" +
          " update poEstatusAsignacion set inicializado = 1, fechainicializado = getDate() where frente = " + frente +
          "; insert into poAsignaObra (explosionid, frente)" +
          " select explosionid, frente from poAvanceobra where frente = " + frente;
    const result = await procesadorDeConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
    const consultaPagosEtiquetados = " update poavanceobra set pagoetiq = es.importe * (pc.Porcentaje / 100 ) "
        + " from poavanceobra po "
        + " inner join poLotesAsignados pl on pl.frente = po.frente "
        + " and po.manzana = pl.manzana and po.lote = pl.lote and po.interior = pl.interior and po.subinterior = pl.subinterior"
        + " inner join poCatalogoEstacionesFrente pc on pc.estacion = po.estacion and pc.frente = po.frente and pc.modelo = pl.modelo"
        + " inner join modelos m on m.clavemodelo = pl.modelo"
        + " inner join especEdificacion es on es.especid = pc.espera and es.modelo collate Modern_Spanish_CI_AS = m.nombre and es.frente = po.frente"
        + " where po.frente = " + frente
    const registrosAfectados = await procesadorDeConsultas.spvnet.ejecutaConsultaSpvnet(consultaPagosEtiquetados);

    return res.status(200).send({mensaje: "Se insertaron los datos correctamente con los pagos etiquetados", rowsAffected: registrosAfectados});
});

ruta.delete('/plantillacostos/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "Delete From poEstacionesModuloCantidad Where Left(modulo,4)=" + frente;
    const resultadoEliminarPlantilla = await procesadorDeConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
    return res.status(200).send({result: resultadoEliminarPlantilla});
})

ruta.delete('/plantillacostos/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "Delete From poEstacionesModuloCantidad Where Left(modulo,4)=" + frente;
    const resultadoEliminarPlantilla = await procesadorDeConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
    return res.status(200).send({result: resultadoEliminarPlantilla});
})

ruta.post('/plantillacostos', verificar, async(req,res)=>{
    const modulo = req.body.datos.modulo;
    const frente = req.body.datos.frente;
    let consulta = "SELECT clavemodelo,NOMBRE AS nombre FROM modelos m " +
    " Where exists (Select * FROM poLotesAsignados p " +
        " where p.modelo=m.clavemodelo and rtrim(p.modulo)=" + modulo + "   ) Order by clavemodelo";
    console.log(consulta);
    const lotesAsignados = await procesadorDeConsultas.spvnet.consultaDatosSpvnet(consulta);
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
            consulta += `update poavanceobra set pagoetiq = es.importe * (pc.Porcentaje / 100 )
            from poavanceobra po
            inner join poLotesAsignados pl on pl.frente = po.frente
            and po.manzana = pl.manzana and po.lote = pl.lote and po.interior = pl.interior and po.subinterior = pl.subinterior
            inner join poCatalogoEstacionesFrente pc on pc.estacion = po.estacion and pc.frente = po.frente and pc.modelo = pl.modelo
            inner join modelos m on m.clavemodelo = pl.modelo
            inner join especEdificacion es on es.especid = pc.espera and es.modelo collate Modern_Spanish_CI_AS = m.nombre and es.frente = po.frente
            where po.frente = ${frente}; `;
        });
        const resultadoInsercionEstacionesModuloCantidad = await procesadorDeConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
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

         const resultadoConsultaInsumosxEstacion = await procesadorDeConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
         //SE CAMBIA EL ESTADO DEL FRENTE A EXPLOSIONADO
         if(resultadoConsultaInsumosxEstacion){ 
            consulta = "update poEstatusAsignacion set explosionado = 1, fechaexplosionado = getDate() where frente = " + frente;            
            const estatusActualizado = await procesadorDeConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
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
            const resultadoInsercionTabDetalles = await procesadorDeConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
            if(resultadoInsercionTabDetalles){
                return res.status(200).send({mensaje: "Se insertaron los datos correctamente", result: estatusActualizado});
            }
            
        };
    }
});







ruta.post('/asignacionmodulos', verificar, async(req,res)=>{
    const datos = req.body.datos;
    const consulta = "Insert Into spvnet200.dbo.afContratosObra "
    + "(frenteid,numero,proveedorid,lotes,modeloid"
    + ",edificacion,edificacionpactado,obraextra,materiales,montocontrato"
    + " ,accesorio1,accesorio2,accesorio3,accesorio4,accesorio5,accesorio6"
    + ",anticipo,fondo ,ccedif)"
    + " values(" + datos.frenteid + "," + datos.modulo + ","
    + datos.proveedorid + "," + datos.lotes + "," + datos.modeloid + ","
    + datos.monto + "," + datos.montomaximo + ","
    + datos.extras + "," + datos.materiales + ","
    + datos.contratofinal + "," + datos.accesorio1 + ","
    + datos.accesorio2 + "," + datos.accesorio3 + ","
    + datos.accesorio4 + "," + datos.accesorio5 + ","
    + datos.accesorio6 + "," + "10," + "6.5,"      // Fondo de Garantía
    + datos.ccedif + ")";
    const insercionModulos = await procesadorDeConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
    return res.status(200).send({mensaje: "Se insertaron los datos correctamente", result: insercionModulos});
})

ruta.post('/modulos/obra', verificar, async(req,res)=>{
    const datos = req.body.datos;
    let consulta = "Insert Into poModulosObra "
    + "(modulo,descripcion,lotes,status,tipo,ccedif,proveedorid,responsable)"
    + " values('" 
    if(datos.agrupado){
        consulta+= datos.modulo + "',"
        + "'Módulo " + datos.ccedif.toString() + " " + datos.modulo.toString().substr(0, 4)
        + (100 + parseInt(datos.ccedif)).toString().substr(1, 2) + "',"
        + datos.lotes + ",'A','C',"
        + "'" + datos.ccedif + "',"
        + datos.proveedorid + ",'Por asignar')"
    }else{
        consulta += "'" + datos.modulo + "',"
        + "'Módulo " + datos.numeromodulo + "',"
        + datos.lotes + ",'A','C',"  // D==>A
        + datos.ccedif + ", "
        // 0,"   //
        + datos.proveedorid + ",'Por asignar')"
    }
    const insercionModulosObra = await procesadorDeConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
    return res.status(200).send({mensaje: "Datos insertados correctamente", result: insercionModulosObra});
})

ruta.post('/lotes/asignacion', verificar, async(req,res)=>{
    const datos = req.body.datos;
    const consulta = "Insert Into poLotesAsignados "
    + "(frente,manzana,lote, interior, subinterior, modelo, modulo, secuencia)"
    + " values("  +"'" + datos.frente + "',"
    + datos.manzana + "," + datos.lote + "," + datos.interior + "," + datos.subinterior + ","
    + datos.clavemodelo + "," + "'" + datos.modulo + "'," + datos.secuencia + ")";
    const insertarAsignaciones = await procesadorDeConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
    return res.json(insertarAsignaciones);
})

ruta.post('/pagosetiquetados', verificar, async(req,res)=>{
    const datos = req.body.datos;
    const consulta = "Insert into poCostoxEstacionEspecialidad ("
    + "modulo,modelo,proveedorid,lotes,estacion,edificacion,extra,total,autorizado,fechaautorizado )"
    + " values(" + "'" + datos['modulo'] + "',"  + "'" + datos['modelo'] + "',"
    + datos['proveedorid'] + ","  + datos['viviendas'] + ", '" + datos['estacion'] + "',"
    + Math.round(datos['financierosextras'] * 1000) / 1000 + "," + Math.round(datos['costocasa'] / datos['viviendas'] * 1000) / 1000 + ","
    + Math.round((datos['financierosextras'] + datos['costocasa'] / datos['viviendas']) * 1000) / 1000 + ",0 ,null)";
    const filasInsertadas = await procesadorDeConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
    return res.status(200).send({mensaje: 'Se insertaron los datos correctamente', filasInsertadas: filasInsertadas});
})

ruta.post('/pdfetiquetados', verificar, async(req,res)=>{
    const datos = req.body.datos;

    const consulta = "Delete from streamsEtiquetados Where frente=" + datos['frente'] + ";"
    + " Insert Into streamsEtiquetados (frente,tipo,titulo,nombrearchivo,contenido) Values("
    + datos['frente'].toString() + ",'C'" 
    + ",'Etiquetados' ,'pagosEtiquetados'"
    + ", convert(varchar(MAX),'" + datos['out'] + "'))";
    const insercionDatos = await procesadorDeConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
    return res.status(200).send({mensaje: 'Se insertaron los datos correctamente', filasAfectadas: insercionDatos});
})

ruta.post('/fechas/programacion', verificar, async(req,res) => {
    const datos = req.body.datos;
    let consulta = "";
    let total = 0;
    try{
        datos.forEach(async (row) => {
            consulta = `
            if (select year(fechaini) from poavanceobra where frente = ${row.frente} 
                and estacion = ${row.estacion} and manzana = ${row.manzana} and lote = ${row.lote} and interior = ${row.interior} and subinterior = ${row.subint}) <= 2001
                    begin
                        update poavanceobra set fechaini = '${row.valor}' where frente = ${row.frente} and manzana = ${row.manzana} and lote = ${row.lote}
                        and interior = ${row.interior} and subinterior = ${row.subint} and estacion = ${row.estacion}
                    end
                else
                    begin
                        update poavanceobra set fecharea = '${row.valor}' where frente = ${row.frente} and manzana = ${row.manzana} and lote = ${row.lote}
                        and interior = ${row.interior} and subinterior = ${row.subint} and estacion = ${row.estacion}
                    end;
                `
                await procesadorDeConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
        })
        return res.status(200).send({mensaje: "Datos modificados correctamente"});
    }catch(error){
        if(error){
            return res.status(500).send({error: error});
        }
    }
})


//------------------------------------ BAJA DE DATOS ------------------------------

ruta.delete('/plantillaavance/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "Delete From poAvanceObraInsumos Where frente=" + frente + ";" +
    "Delete From poAvanceObra " +
    " Where frente=" + frente + ";";
    const result = procesadorDeConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
    return res.status(200).send({mensaje: 'Se eliminaron los datos correctamente', result: result});
});



ruta.delete('/asignacioncompleta/:frente/:frenteid', verificar, async(req,res)=> {
    const frente = req.params.frente;
    const frenteid = req.params.frenteid;
    let consulta = "Delete from spvnet200.dbo.afContratosObra Where frenteid=" + frenteid + ";"
    + "Delete from afCostoEstacion Where frenteid=" + frenteid
    const eliminarContratos = await procesadorDeConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
    
    consulta = "Delete from especAsignacion Where frente=" + frente + ";"
    + "Delete from poEstacionesModuloCantidad Where Left(modulo,4)=" + frente + ";"
    + "Delete from poModulosObra Where Left(modulo,4)=" + frente + ";"
    + "Delete from poLotesAsignados Where Left(modulo,4)=" + frente + ";"
    + "Delete from poCostoxEstacion Where left(modulo,4)=" + frente + ";";
    const eliminarAsignaciones= await procesadorDeConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
    return res.status(200).send({mensaje: "Datos eliminados correctamente", result:{primerBorrado: eliminarAsignaciones, segundoBorrado: eliminarContratos}});
})

ruta.delete('/modulos/:frenteid', verificar, async(req,res)=>{
    const frenteid = req.params.frenteid;
    const consulta = "Delete from spvnet200.dbo.afContratosObra Where frenteid=" + frenteid
    const resultEliminarModulos = await procesadorDeConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
    return res.status(200).send({mensaje:"Datos eliminados correctamente", result: resultEliminarModulos});
})

ruta.delete('/modulos/obra/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "Delete from poEstacionesModuloCantidad Where Left(modulo,4)='" + frente + "';"
    + "Delete from poModulosObra Where Left(modulo,4)='" + frente + "'"
    const resultModulos = await procesadorDeConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
    return res.status(200).send({resultModulos: resultModulos});
})

ruta.delete('/asignacionlotes/:frente/:ccedif', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const ccedif = req.params.ccedif;
    const consulta = "DELETE polotesasignados " 
    + " FROM polotesasignados a "
    + " INNER JOIN pomodulosobra b"
    + " ON b.modulo = a.modulo"
    + " and left(b.modulo,4)=" + frente + " and ccedif=" + ccedif;
    const desasignacionLotes = await procesadorDeConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
    return res.status(200).send({mensaje:"Datos eliminados correctamente"});
})

ruta.delete('/pagosetiquetados/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "Delete from poCostoxEstacionEspecialidad Where left(modulo,4) = " + frente;
    const registrosAfectados = await procesadorDeConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
    return res.status(200).send({mensaje: "Se eliminaron los datos correctamente", registrosAfectados: registrosAfectados});
})

module.exports = ruta;