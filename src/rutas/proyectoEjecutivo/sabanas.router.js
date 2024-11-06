const express = require('express');
const conectarBD = require ('../../bd/db.js');
const verificar = require('../../controladores/verificarToken.controller.js');
const procesadorConsultas = require('../../controladores/procesadorConsultas.controller.js');

const ruta = express.Router();


//------------------------------- CONSULTA DE DATOS --------------------------------
//para validar que el frente esté autorizado
ruta.get('/frentevalido/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const consulta = "use spvnet200; Select id from afControlFrentes Where frente=" + frente;
    const result = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta)
    return res.json(result);
})
//id de los frentes que arrojen los datos del cliente
ruta.get('/frenteid/:empresaid/:numerofrente', verificar, async(req,res)=>{
    const empresaid = req.params.empresaid;
    const numerofrente = req.params.numerofrente;
    let comparador = ''
    if(numerofrente == '000') comparador = "'%F-" + numerofrente +"%'"
    else comparador = "'%F-0" + numerofrente + "%'"
    const consulta = "select frenteid from frentes where fraccionamientoid in (" +
    " select fraccionamientoid from fraccionamientos where empresaid = " + empresaid + ") " +
    " and nombre like " + comparador + " ";
    const result = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta)
    return res.json(result);
})
//obtener las columnas para el update de lotes
ruta.get('/columnaslotes', verificar, async(req,res)=>{
    //Consulta para sacar los nombres de las columnas de lotes, para ir checando las 
    //columnas a modificar dentro del excel
    const sql = " SELECT COLUMN_NAME as nombrecolumna " +
    " FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'lotes' " +
    " and ordinal_position in( 2, 3, 4, 5, 6, 7, 41, 42, 59, 60, 8, 11, 14, 15, " +
    " 16, 17, 23, 27, 25, 31, 32, 30, 61, " +
    " 49, 50, 51, 52, 53, 36, 35, 75, 39, " +
    " 38, 76, 24, 28, 26, 43, 9,10, 47, 48) order by " +
    " case ORDINAL_POSITION when 2 then 1 when 3 then 2 when 4 then 3 when 5 then 4 " +
    " when 6 then 5 when 7 then 6 when 41 then 7 when 42 then 8 when 59 then 9 " + 
    " when 60 then 10 when 8 then 11 when 11 then 12 when 9 then 13 when 10 then 14 " + 
    " when 47 then 15 when 48 then 16 when 14 then 17 when 15 then 18 when 16 then 19 " +
    " when 17 then 20 when 23 then 21 when 27 then 22 when 25 then 23 when 31 then 24 " +
    " when 32 then 25 when 30 then 26 when 61 then 27 when 43 then 28 when 49 then 29 " +
    " when 50 then 30 when 51 then 31 when 52 then 32 when 53 then 33 when 36 then 34 " +
    " when 35 then 35 when 75 then 36 when 39 then 37 when 38 then 38 when 76 then 39 " + 
    " when 24 then 40 when 28 then 41 when 26 then 42 else 43 end";
    const result = await procesadorConsultas.spvnet.consultaDatosSpvnet(sql);
    return res.json(result)
})
//configuración para validar encabezados de excel
ruta.get('/configuracionexcel', verificar, async(req, res)=>{
    const result = await procesadorConsultas.spvnet.consultaDatosSpvnet("use spvnet3; select nombreConfiguracion as encabezados "+
    "from configuracion");
    res.json(result)
})
//catálogo de lotes para mostrar los datos en la vista de sábanas
ruta.get('/lotes/:frente', verificar, async(req, res)=>{
    const frente = req.params.frente;
    let sql = `Select 'E' as marca, ROW_NUMBER() OVER(ORDER BY l.MANZANA,l.LOTE,l.INTERIOR,l.SUBINTERIOR)  as consecutivo ,
    e.nombrecorto as propietario,Substring(f.nombre,3,4) as frente ,REPLACE(STR(l.manzana,3),' ','0') as manzana,
    REPLACE(STR(l.lote,3),' ','0')  as lote ,REPLACE(STR(l.interior,3),' ','0') as interior, 
    REPLACE(STR(l.subinterior,2),' ','0') as subinterior ,Isnull(l.calleOficial,'') as direccion, 
    Isnull(l.numeroOficial,0) as oficial, isnull(l.colonia, ' ') as colonia, isnull(l.codigopostal, 0) as codigopostal, m.nombre as modelo, l.superficie , isnull(precio, 0) precio, isnull(fechaPrecio, '') fechaprecio,
    isnull(costoTerreno, 0) costoTerreno, isnull(costoEdificacion, 0) costoedificacion, isnull(colindancia1, '') as col1, isnull(colindancia2, '') as col2, isnull(colindancia3, '') as col3, 
    isnull(colindancia4, '') as col4, isnull(n.numero, 0) notaria, 
    isnull(escrituraCompra, '') escrituracompra, isnull(fechaEscrituraCompra, '') fechaescrituracompra, 
    isnull(registroPublico, '') registropublico, isnull(folioReal, '') folioreal, 
    isnull(cuentaCatastral, '') cuentacatastral, isnull(cuentaPredial, '') cuentapredial, 
    isnull(CUV, '') cuv, isnull(predial1, '') predial1, isnull(fechapredial1, '') fechapredial1, isnull(predial2, '') predial2, 
    isnull(fechapredial2, '') fechapredial2, isnull(predial3, '') predial3, 
    isnull(fechapredial3, '') fechapredial3, isnull(predial4, '') predial4, 
    isnull(fechapredial4, '') fechapredial4, isnull(predial5, '') predial5, 
    isnull(fechapredial5, '') fechapredial5, isnull(financiera1, '') financiera1, isnull(liberacion1, '') liberacion1, 
    isnull(fechaliberada, '') fechaliberada1, isnull(financiera2, '') financiera2, 
    isnull(liberacion2, '') liberacion2, isnull(fechaliberada, '') fechaliberada2, 
    isnull(notariaIdVenta, 0) notariaidventa, isnull(escrituraVenta, '') escrituraventa, 
    isnull(fechaEscrituraVenta, '') fechaescrituraventa
    from lotes l   
    left join notarias n	   on n.notariaId = l.notariaIdCompra
    Inner join modelos m       On m.modeloId=l.modeloId   
    inner join empresas e      on e.empresaId=l.empresaId  
    Inner Join frentes f       on f.frenteId=l.frenteId And Substring(f.nombre,3,4)=${frente} And left(f.nombre,2)='F-'   
    Left join modelosxfraccionamiento mf On mf.modeloId=m.modeloId And f.fraccionamientoId=mf.fraccionamientoId 
    Order by manzana,lote,interior,subinterior`;
    const result = await procesadorConsultas.spvnet.consultaDatosSpvnet(sql);
    return res.json(result)
})
//consulta para insertar los datos dentro del pdf
ruta.get('/lotespdf/:frente', verificar, async(req,res)=>{
    const frente = req.params.frente;
    const sql = "Select ROW_NUMBER() OVER(ORDER BY MANZANA,LOTE,INTERIOR,SUBINTERIOR)  as consecutivo ," +
    " Substring(f.nombre,3,4) as frente ,REPLACE(STR(manzana,3),' ','0') as manzana,REPLACE(STR(lote,3),' ','0')  as lote , " +
    " REPLACE(STR(interior,3),' ','0') as interior, REPLACE(STR(subinterior,3),' ','0') as subinterior , " +
    " Left(Isnull(l.calleOficial,''),25) as direccion, Isnull(l.numeroOficial,0) as oficial ,l.superficie  , " +
    " m.construccion as construccion ,m.nombre as modelo , isnull(mf.nombrecomercial,'') as nombrecomercial  " +
    " from lotes l Inner join modelos m On m.modeloId=l.modeloId " +
    " inner join empresas e on e.empresaId=l.empresaId  " +
    " Inner Join frentes f on f.frenteId=l.frenteId And Substring(f.nombre,3,4)=" + frente +" And left(f.nombre,2)='F-' " +
    " Left join modelosxfraccionamiento mf On mf.modeloId=m.modeloId And f.fraccionamientoId=mf.fraccionamientoId " +
    " Order by manzana,lote,interior,subinterior ";
    const result = await procesadorConsultas.spvnet.consultaDatosSpvnet(sql);
    return res.json(result);
})
//para insertar los lotes en la tabla de lotedetalle y hacer que no se repitan los lotesids
ruta.get('/loteidmax', verificar, async(req,res)=>{
    const sql = "select max(loteid) as loteid from lotes";
    const result = await procesadorConsultas.spvnet.consultaDatosSpvnet(sql);
    return res.json(result[0]);
})
//para sacar el id del numero de notaria que viene del excel
ruta.get('/notarias', verificar, async(req,res)=>{
    //select isnull(max(e.nombre), '') nombre, isnull(max(c.nombre), '') ciudad, isnull(max(n.notariaid), 0) notariaid
    const consulta = `select e.nombre estado, c.nombre ciudad, n.notariaid, n.numero
    from notarias n
    inner join ciudades c on c.ciudadId = n.ciudadId
    inner join estados e on e.estadoId = c.estadoId`;
    const result = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(result);
})


//------------------------------ INSERCIÓN DE DATOS ------------------------------
//para insertar los datos a lotes desde el excel
ruta.post('/lotes/:fuente', verificar, async(req, res)=>{
    const fuente = req.params.fuente;
    const datos = req.body.datos;
    let sql = ""
    if(fuente == 'excel'){
        sql = "";
        let consultaDelete = "delete lotes where frenteid in (";
        const frentesSinRepetir = datos.reduce((acumulador, elemento) => {
            if(!acumulador.some(e => JSON.stringify(e) === JSON.stringify(elemento.frenteid))){
                acumulador.push(elemento.frenteid);
            }
            return acumulador;
        }, []);
        frentesSinRepetir.forEach( frenteid => {
            consultaDelete += frenteid + ",";
        })
        consultaDelete = consultaDelete.substring(0, consultaDelete.length - 1) + ");";
        const columnas = Object.keys(datos[0]);
        let nombreColumas = columnas.reduce((acumulador, actual) => acumulador + actual + ", ", "");
        let nombreDatos = "";
        nombreColumas = nombreColumas.substring(0, nombreColumas.length - 2);
        datos.forEach(element => {
            nombreDatos += "(";
            columnas.forEach(columna => {
                nombreDatos += element[columna] + ",";
            });
            nombreDatos = nombreDatos.substring(0, nombreDatos.length - 1) + "),"
        });
        nombreDatos = nombreDatos.substring(0, nombreDatos.length - 1);
        sql = consultaDelete + " Insert Into lotes ";
        sql += "( " + nombreColumas + ") values " + nombreDatos;
    }else{
        sql = "";
        datos.forEach((registro) => {
            console.log(registro);
            if(registro.estatus == 'eliminado'){
                sql += `delete lotes where manzana = '${registro.manzana}' and lote = '${registro.lote}' and interior = '${registro.interior}' 
                and subinterior = '${registro.subinterior}' and frenteid = ${registro.frente}; `;
            }
            if(registro.estatus == 'nuevo'){
                sql += `insert into lotes (empresaid, frenteid, manzana, lote, interior, subinterior, calleoficial, modeloid, superficie) values (${registro.propietario}, ${registro.frente}, 
                    '${registro.manzana}', '${registro.lote}', '${registro.interior}', '${registro.subinterior}', '${registro.direccion}', ${registro.modelo}, ${registro.superficie}); `;
            }
        });
    }
    try{
        const result = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(sql);
        return res.status(200).send({mensaje:'Datos guardados con exito', result:result});   
    }catch(error){
        if(error){
            return res.status(400).send({error: error, mensaje: "Error en el servidor"});
        }
    }            
})

//-------------------------------- BAJA DE DATOS -------------------------------- 
//agarrar los datos del excel para eliminar los datos de las 3 tablas
ruta.delete('/lotes/:frenteid/:manzana/:lote/:interior/:subinterior', verificar, async(req,res)=>{    
    const frenteid = req.params.frenteid;
    const manzana = req.params.manzana;
    const lote = req.params.lote;
    const interior = req.params.interior;
    const subinterior = req.params.subinterior;
    const sql = "use spvnet3; delete lotes where frenteid = " + frenteid +
    " and manzana = '" + manzana + "' and lote = '" + lote + 
    "' and interior = '" + interior + "' and subinterior = '" + subinterior + "';" +

    "use spvnet200; delete lotedetalle where loteid in (select loteid from lote where frenteid = " + frenteid +
    " and manzana  = '" + manzana + "' and clavelote = '" + lote + 
    "' and interior = '" + interior + "' and subinterior = '" + subinterior + "');" +

    "delete lote where frenteid = " + frenteid + 
    " and manzana  = '" + manzana + "' and clavelote = '" + lote + 
    "' and interior = '" + interior + "' and subinterior = '" + subinterior + "';" 
    const result = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(sql);
    return res.status(200).send({mensaje: 'Consulta ejecutada correctamente', result: result});
})


//------------------------------- MODIFICACION DE DATOS --------------------------
//actualizar los lotes en base al documento que cargue el cliente
ruta.put('/lotes', verificar, async(req, res)=>{
    const datos = req.body.datos;
    let consulta = "";
    for(let i = 5; i < datos[0].length; i++){
        for(let j = 2; j < datos.length; j++){
            consulta += " update lotes set " + datos[0][i] + " = '" + datos[j][i] + "'"
            consulta += " where frenteid = " + datos[j][0] + " and manzana = " + datos[j][1].substring(1, datos[i][1].length)
            consulta += " and lote = " + datos[j][2].substring(1, datos[i][1].length) + " and interior = " + datos[j][3].substring(1, datos[i][3].length)
            consulta += " and subinterior = " + datos[j][4].substring(1, datos[i][4].length) + "; \n"
            
        }
    }
    const result = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(sql);
    return res.status(200).send({mensaje: "consulta exitosa", result: result});
})



module.exports = ruta;
