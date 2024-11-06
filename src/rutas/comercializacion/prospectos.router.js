const express = require('express');
const rutas = express.Router();
const procesadorConsultas = require('../../controladores/procesadorConsultas.controller.js');
const verificar = require('../../controladores/verificarToken.controller.js');
const nodemiler = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config({path: 'src/.env'});
const fs = require('fs');

rutas.get('/mensajeFelicitacion', verificar, async(req,res) => {
    const consulta = `select * from mensajeFelicitacion`;
    const mensajes = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    mensajes[0].imagen = fs.readFileSync('src/IMAGEN FELICITACION/logo.jpg', 'base64');
    //console.log(mensajes[0].texto.split('*cliente*').join('Yael Medina'));
    return res.json(mensajes);
})

rutas.get('/prospectos', async(req,res) => {
    const consulta = `select * from mensajeFelicitacion`;
    const mensajes = await procesadorConsultas.spvnet.consultaDatosSpvnet(consulta);
    const selloPath = 'src/IMAGEN FELICITACION/logo.jpg';
    const transporter = nodemiler.createTransport({
        host: process.env.host,
        port: process.env.puertoCorreo,
        secure: false,
        auth: {
            user: process.env.usuarioCorreo,
            pass: process.env.passwordCorreo,
        },
        tls: {
            ciphers: process.env.cifrado
        }
    });
    
    let mensaje = {
        from: '"Grupo Soldi - " ' + process.env.usuarioCorreo,
        to: "yael_medina9@outlook.com",
        subject: mensajes[0].asunto,
        text: `${mensajes[0].texto}`,
        html: `<h1>${mensajes[0].asunto}</h1>
        <p>${mensajes[0].texto}</p>
        <img src="cid:sello" alt="Sello" style="width:200px;height:auto;">`,
        attachments: [{
            filename: 'logo.jpg',
            path: selloPath,
            cid: 'sello' // Identificador que usarás en el HTML
          }]
        
    };
    transporter.sendMail(mensaje, (error, info) => {
        if (error) {
            console.log("Error al enviar el correo: ", error);
            return res.json({error: "Error al enviar el correo"});
        }
        console.log("Correo enviado: ", info.messageId);
        return res.json({mensaje: "Correo enviado"});
    });
});

rutas.post('/mensajeFelicitacion', verificar, async(req,res) => {
    const datos = req.body.datos;
    try{
        const consulta = `delete mensajeFelicitacion;
        insert into mensajeFelicitacion values ('${datos.asunto}', '${datos.texto}')`;
        console.log(consulta);
        await procesadorConsultas.spvnet.ejecutaConsultaSpvnet(consulta);
        fs.writeFileSync('src/IMAGEN FELICITACION/logo.jpg', datos.imagen, 'base64');
        return res.status(200).send({mensaje: "Mensaje actualizado"});
    }catch(error){
        console.log(error);
        return res.status(500).send(error);
    }

})

module.exports = rutas;