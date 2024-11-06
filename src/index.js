const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./swagger'); // Ruta al archivo de configuración Swagger
const cors = require('cors');
const cron = require('node-cron');
const rutasGestoria = {
	rutasBonos: require('./rutas/gestoria/bonos.router.js'),
}

const rutasComercializacion = {
	rutasProspectos: require('./rutas/comercializacion/prospectos.router.js'),
}

const rutasAdministracion = {
	rutasContratos: require('./rutas/administracion/contratos/contratos.router.js'),
	rutasSecuencias: require('./rutas/administracion/secuenciasAut/secuenciasContratos.router.js'),
}

const rutasEdificacion = {
	rutasEstimacionesObra: require('./rutas/edificacion/estimacionesobra.router.js'),
	rutasContratosObra : require('./rutas/edificacion/contratosobra.router.js'),
	rutasDisenoProgobra : require('./rutas/edificacion/disenoprogobra.router.js'),
	rutasListaVerificacion : require('./rutas/edificacion/listaVerificacion.router.js'),	
	rutasPlantillaVerificacion : require('./rutas/edificacion/plantillaListaVerificacion.router'),
	rutasCostoEspecialidades : require('./rutas/edificacion/costoespecialidades.router.js'),
	rutasPlantillaInsumos : require('./rutas/edificacion/plantillainsumosxestacion.router.js'),
	rutasRolesAvanceObra: require('./rutas/globales/catalogos/catalogorolesedificacion.router.js'),
	rutasFormatosObra: require('./rutas/edificacion/formatosObra.router.js'),
}
const rutasProyectoEjecutivo = {
	rutasSabanas : require('./rutas/proyectoEjecutivo/sabanas.router.js'),
	rutasCostoProduccion : require('./rutas/proyectoEjecutivo/costoproduccion.router.js'),
	rutasfrentes : require('./rutas/proyectoEjecutivo/frentes.router.js')
}

const rutasGlobales = {
	rutasCatalogosInsumos : require('./rutas/globales/catalogos/catalogoinsumos.router.js'),
	rutasCatalogosGlobales : require('./rutas/globales/catalogos/catalogos.router.js'),
	rutasCatalogosFormatos: require('./rutas/globales/catalogos/catalogoformatos.router.js'),
	rutasFamiliasInsumos: require('./rutas/globales/catalogos/catalogofamiliainsumos.router.js'),
	rutasEspecialidades: require('./rutas/globales/catalogos/catalogoespecialidades.router.js'),
};


const rutasModales = {
	rutasCambioCostoEspecialidad : require('./rutas/modales/modificarcostoespecialidad.router.js'),
	rutasCopiarOtroFrente: require('./rutas/modales/copiarOtroFrente.router.js'),
}

const rutasReportes = {
	rutasAvanceObra : require('./rutas/reportes/avanceobra.router.js'),
}
const bodyParser = require('body-parser');
const app = express();
const dotenv = require('dotenv');
dotenv.config({path: 'src/.env' });
//CORS

// cron.schedule('47 15 * * *', async() => {
// 	const resultado = await axios.get('http://localhost:3700/api/v2/comercializacion/prospectos')
// 	console.log(resultado.data);
// });

app.use(bodyParser.json({limit: '200mb'}));
app.use(bodyParser.urlencoded({extended: false}, {limit: '200mb'}));

app.use(bodyParser.json());
app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin'
    + ', X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method, token');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
	res.setHeader('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
	next();
});

app.set('trust proxy', true);

//RUTAS
const rutaAuth = require('./rutas/autenticacion/auth.router.js');
const rutasUsuario = require('./rutas/globales/usuarios.router.js');
const rutasPdfs = require('./rutas/globales/conversionArchivos/pdfs/pdf.router.js');
const rutasEliminacionProgobra = require('./rutas/globales/eliminarProgobra/eliminarprogobra.router.js');
const { default: axios } = require('axios');

const baseURL = "/api/v2";

app.use(baseURL, rutaAuth);

//RUTAS DE EDIFICACION
app.use(baseURL + "/contratosobra", rutasEdificacion.rutasContratosObra);
app.use(baseURL + '/costoespecialidades', rutasEdificacion.rutasCostoEspecialidades);
app.use(baseURL + "/disenoprogobra", rutasEdificacion.rutasDisenoProgobra);
app.use(baseURL + "/listaverificacion", rutasEdificacion.rutasListaVerificacion);
app.use(baseURL + "/plantillaverificacion", rutasEdificacion.rutasPlantillaVerificacion);
app.use(baseURL + "/plantillainsumosxestacion", rutasEdificacion.rutasPlantillaInsumos);
app.use(baseURL + "/estimacionesobra", rutasEdificacion.rutasEstimacionesObra);
app.use(baseURL + "/rolesavance", rutasEdificacion.rutasRolesAvanceObra);
app.use(baseURL + "/formatosobra", rutasEdificacion.rutasFormatosObra);

//RUTAS DE PROYECTO EJECUTIVO
app.use(baseURL + "/costoproduccion", rutasProyectoEjecutivo.rutasCostoProduccion);
app.use(baseURL + "/proyectoejecutivo", rutasProyectoEjecutivo.rutasSabanas);
app.use(baseURL + "/frentes", rutasProyectoEjecutivo.rutasfrentes);


//RUTAS DE VISTAS MODALES
app.use(baseURL + "/copiarfrente", rutasModales.rutasCopiarOtroFrente);
app.use(baseURL + "/modificarcostoespecialidad", rutasModales.rutasCambioCostoEspecialidad);

//RUTAS GLOBALES
app.use(baseURL + "/usuarios", rutasUsuario);
app.use(baseURL + "/catalogos", rutasGlobales.rutasCatalogosGlobales);
app.use(baseURL + "/pdf", rutasPdfs);
app.use(baseURL + '/insumos', rutasGlobales.rutasCatalogosInsumos);
app.use(baseURL + "/formatos", rutasGlobales.rutasCatalogosFormatos);
app.use(baseURL + "/faminsumos", rutasGlobales.rutasFamiliasInsumos);
app.use(baseURL + "/catespec", rutasGlobales.rutasEspecialidades);


//RUTAS ADMINISTRACION

app.use(baseURL + "/administracion", rutasAdministracion.rutasContratos);
app.use(baseURL + "/administracion", rutasAdministracion.rutasSecuencias);

//RUTAS GESTORIA

app.use(baseURL + "/gestoria", rutasGestoria.rutasBonos);

//RUTAS COMERCIALIZACION

app.use(baseURL + "/comercializacion", rutasComercializacion.rutasProspectos);

//RUTAS PARA CONSULTAR REPORTES

app.use(baseURL + "/reportes/avanceobra", rutasReportes.rutasAvanceObra);

//RUTAS PARA ELIMINAR PROGOBRA
app.use(baseURL + "/eliminarprogobra", rutasEliminacionProgobra);//plantillaInsXEst

// Ruta p/acceder a la documentación generada por Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
	customSiteTitle: 'API Documentación - Soldi',
	customCss: '.swagger-ui .topbar { background-color: #3498db; }', // Cambia el color de la barra superior
	customJs: './custom.js', // Ruta al archivo JavaScript personalizado
  }));

  app.use(cors());
//PUERTO ---
app.listen(process.env.PORT || 5000);
