import { Router } from 'express';
import express from 'express';
import { llave } from '../../configuraciones/llave.js';

//FAMILIA INSUMOS
import obtenerCatalogos from '../../controladores/progObra/familiasInsumo.js';

//INSUMOS POR ESTACION

import consultaSPVN200, { consultarLegacy, ejecutarConsulta, ejecutarConsultaLegacy } from '../../controladores/ejecutaConsulta.js';

//IMPORTACIONES EXTRAS

import jwt from 'jsonwebtoken';
const app = express();
app.set('key', llave.llave);
app.use(express.urlencoded({extended:false}));
app.use(express.json());


const rutas = Router();

//rutas.post('/login',)

rutas.get('/api/v1/BuscarConsulta', consultaSPVN200);

rutas.get('/api/v1/BuscarConsultaLegacy', consultarLegacy);

rutas.post('/api/v1/EjecutaQuery', ejecutarConsulta);

rutas.post('/api/v1/EjecutaQueryLegacy', ejecutarConsultaLegacy);

//AQUI YA SE IMPLEMENTA EL TOKEN JUNTO CON LA CONSULTA

rutas.get('/api/v1/familiaInsumos/catalogoInsumos', obtenerCatalogos);


//rutas.get



export default rutas;
