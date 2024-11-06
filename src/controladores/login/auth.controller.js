const express = require('express');
const conectarBD = require('../../bd/db.js')
const jwt = require('jsonwebtoken');
const llave = require('../../configuraciones/llave.js')
const app = express();

    //SE VALIDA LO DEL JWT

        app.set('key', llave.llave);
        app.use(express.urlencoded({extended:false}));
        app.use(express.json());

/**
 * @swagger
 * /api/v2/login:
 *   post:
 *     summary: LogIn
 *     tags:
 *       - Acceso del sistema
 *     parameters:
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               usuario:
 *                 type: string
 *               clave:
 *                 type: string
 *             required:
 *               - valor
 *     responses:
 *       201:
 *         description: Token de sesión del usuario.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       tokennode:
 *                         type: string
 *                         description: Token de sesión.
 *                         example: ey9182jdlaksnbfasiun.askidaoi.asda2grg3
 * 
*/
const login = async (req,res) => {
    //SE HACE LA CONSULTA PARA COMPROBAR EL USUARIO
    const pool = await conectarBD;
    const usuarioacceso = req.body.usuario;
    const claveacceso = req.body.clave;
    const actualizado = req.body.actualizado;
    if(actualizado == true){
        const result = await pool.request().query("use spvnet200; select usuarioid, acceso, clave, correoelectronico as correo, estatusId " +
        " from usuario where acceso = '" + usuarioacceso + "' and clave = '" + 
        claveacceso + "'");
        //Validacion de si existe el usuario con las credenciales tecleadas
        
        if(result.recordsets[0].length == 1){
            const payload = {
                check: true
            };
            const token = jwt.sign(payload, app.get('key'),{
                expiresIn: '1h'
            });
            return res.json({           
                tokennode: token,
                estatus: result.recordsets[0].estatusId
            });

        }
        else{
            return res.json({
                message: 'Usuario y/o contraseña incorrecta'
            })
        }
    }
}
module.exports = login;

//module.exports = verificacion;