const express = require('express');
const procesadorConsultas = require('../../../controladores/procesadorConsultas.controller');
const verificar = require('../../../controladores/verificarToken.controller');
const ruta = express.Router();

ruta.get('/especialidades', verificar, async(req,res)=>{
    const consulta = `Select especid,numero, descripcion  from  espec Order by numero`;
    const especialidades = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    return res.json(especialidades);
})

ruta.post('/especialidad', verificar, async(req,res)=>{
    const datos = req.body.datos;
    let consulta = "";
    datos.forEach(ele => {
        if(ele.eliminado){
            consulta += "delete espec where especid = " + ele.especid + "; "
        }else{
            if (ele.especid > 0) {
              consulta += "Update espec Set  ";
              consulta += "numero=" + ele.numero;
              consulta += ",descripcion='" + ele.descripcion + "'";
              consulta += " where especid=" + ele.especid + "; ";
            } else {
              consulta += "Insert Into espec (numero,descripcion) ";
              consulta += " values(" + ele.numero + ",";
              consulta += "'"+ ele.descripcion + "'); ";
            }
        }
      });
    try{
        const datosInsertados = await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
        return res.status(200).send({mensaje:"Datos modificados correctamente", result: datosInsertados});
    }catch(error){
        if(error){
            return res.status(200).send({mensaje:"Error en el sistema", error: error});
        }
    }
})

module.exports = ruta;