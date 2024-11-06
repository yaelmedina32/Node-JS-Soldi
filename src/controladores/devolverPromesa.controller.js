const devolverPromesa = (consulta) => {
    return new Promise((resolve, reject) => {
        try{
            resolve(consulta)
        }catch(error){
            if(error){
                reject(error);
            }
        }
    })
}

module.exports = devolverPromesa;