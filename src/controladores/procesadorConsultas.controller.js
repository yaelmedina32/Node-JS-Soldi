const conectarBD = require('../bd/db.js');

const tipoProcesado = {
    //AÑADIDO -> SE AÑADIO UN CONTROLADOR PARA PODER DEVOLVER EL RESULTADO DE LA CONSULTA SIN TENER QUE 
    //HACER UN LLAMADO CONSTANTE AL POOL DE CONEXION A LA BD
    spvnet: {
        consultaDatosSpvnet: async function(consulta){
            const pool = await conectarBD;
            const resultado = await pool.request().query('use spvnet3;' + consulta);
            return resultado.recordsets[0];
        },
        ejecutaConsultaSpvnet: async function(consulta){
            const pool = await conectarBD;
            const resultado = await pool.request().query('use spvnet3;' + consulta);
            return resultado.rowsAffected[0];
        }
    },
    spvnet200:{
        consultaDatosSpvnet200: async function(consulta){
            const pool = await conectarBD;
            const resultado = await pool.request().query('use spvnet200;' + consulta);
            return resultado.recordsets[0];
        },
        ejecutaConsultaSpvnet200: async function(consulta){
            const pool = await conectarBD;
            const resultado = await pool.request().query('use spvnet200;' + consulta);
            return resultado.rowsAffected[0];
        }
    }
}
module.exports = tipoProcesado;
