const fs = require('fs');

const manejarLogs = (consulta, vista, ubicacion, descripcionError, ip) =>{    
    let texto  = "\n\n- "
    if(descripcionError != ""){
        texto += "Error: " + descripcionError + " Ubicacion: "  + ubicacion + " Vista: " + vista + 
        " Fecha: " + new Date() + "\n Ip del Cliente: " + ip; 
        fs.appendFile('src/Logs/ErroresRegistrados/logsErrores.txt', texto, (err)=>{
            if(err) throw err;
        })
        texto = "";
    }else{
        let tipoConsulta = consulta.substring(0, 7).toLowerCase();
        texto += tipoConsulta.includes('insert') ? "Actividad: Inserción" : 
        tipoConsulta.includes('select') ? "Actividad: Consulta" : tipoConsulta.includes('delete') ? "Actividad: Baja de datos" :
        "Actividad: Modificación de datos ";
        texto += "\n Ubicacion: " + ubicacion + "\n Vista: " + vista + "\n Fecha: " + new Date() + '\n Ip del Cliente: ' + ip;
        fs.appendFile('src/Logs/ActividadesRegistradas/logsActividades.txt', texto, (err)=>{
            if(err) throw err;
        })
        texto = "";
    }
}

module.exports = {
    manejarLogs: manejarLogs
};