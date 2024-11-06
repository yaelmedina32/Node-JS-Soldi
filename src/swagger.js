const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Documentation-Soldi',
      version: '1.0.1',
    },
  },
  security: [
    {
      BearerAuth: [],
    },
  ],
  tags: [
    {
      name: 'Catálogos',
      description: 'Información general de catálogos',
    },
    // Agrega más tags si es necesario
  ],
//    apis: ['routes/proyectoejecutivo/*.js','routes/suministros/*.js'], 
   apis: ['src/controladores/login/*.js', 'src/rutas/globales/catalogos/*.js', 'src/rutas/edificacion/*.js'], 
//   apis: [`${__dirname}/routes/suministros/controlvales.js`], // Ruta a tus archivos de rutas (endpoints)
};

const specs = swaggerJsdoc(options);

module.exports = specs;
