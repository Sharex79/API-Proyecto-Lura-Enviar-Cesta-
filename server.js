import express from "express";
import cors from "cors";
import pkg from "pg";

const { Pool } = pkg;
const app = express();

// CORS configurado correctamente para evitar errores
app.use(cors({
  origin: '*', // Permite todos los orígenes
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Access-Control-Allow-Origin'],
  credentials: false
}));

// Headers adicionales de CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());

// Configuración de base de datos
const pool = new Pool({
  host: "switchback.proxy.rlwy.net",
  port: 15893,
  database: "railway",
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  ssl: { rejectUnauthorized: false }
});

// ENDPOINT PRINCIPAL CON SOBRESCRITURA
app.post("/api/cestas_productos", async (req, res) => {
  try {
    console.log("=== DATOS RECIBIDOS EN EL SERVIDOR ===");
    console.log("req.body completo:", req.body);
    console.log("Headers recibidos:", req.headers);
    
    const { numero_cesta, foto, productos } = req.body;
    
    // Validaciones
    if (!numero_cesta) {
      return res.status(400).json({ ok: false, error: "numero_cesta es requerido" });
    }
    
    if (!productos || !Array.isArray(productos)) {
      return res.status(400).json({ ok: false, error: "productos debe ser un array" });
    }

    if (productos.length === 0) {
      return res.status(400).json({ ok: false, error: "productos no puede estar vacío" });
    }

    // 🔥 PASO 1: ELIMINAR TODOS LOS PRODUCTOS ANTERIORES DE ESA CESTA
    console.log(`Eliminando productos anteriores de la cesta ${numero_cesta}...`);
    const deleteResult = await pool.query(
      'DELETE FROM cestas_productos WHERE numero_cesta = $1',
      [numero_cesta]
    );
    
    console.log(`✅ Eliminados ${deleteResult.rowCount} productos anteriores de la cesta ${numero_cesta}`);

    // 🔥 PASO 2: INSERTAR LOS NUEVOS PRODUCTOS (incluyendo la foto en cada registro)
    console.log(`Insertando ${productos.length} productos nuevos con foto...`);
    const resultados = [];

    for (const producto of productos) {
      const { id_producto, cantidad_producto } = producto;
      
      console.log(`Insertando producto: ID=${id_producto}, Cantidad=${cantidad_producto}, Foto=${foto || 'sin foto'}`);
      
      const result = await pool.query(
        `INSERT INTO cestas_productos (numero_cesta, id_producto, cantidad_producto, foto)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [numero_cesta, id_producto, cantidad_producto, foto || null]
      );
      
      resultados.push(result.rows[0]);
    }

    console.log(`✅ Insertados ${resultados.length} productos nuevos en la cesta ${numero_cesta} con foto`);

    // Respuesta exitosa
    const respuesta = {
      ok: true,
      productos_eliminados: deleteResult.rowCount,
      productos_guardados: resultados.length,
      foto_guardada: foto || "Sin foto",
      mensaje: `Cesta ${numero_cesta} sobrescrita correctamente: ${deleteResult.rowCount} eliminados, ${resultados.length} nuevos insertados con foto: ${foto ? foto : 'sin foto'}`,
      datos: resultados
    };

    console.log("=== RESPUESTA ENVIADA ===");
    console.log(respuesta);

    res.json(respuesta);

  } catch (err) {
    console.error("=== ERROR EN EL SERVIDOR ===");
    console.error("Error completo:", err);
    console.error("Stack trace:", err.stack);
    
    res.status(500).json({ 
      ok: false, 
      error: err.message,
      details: "Error interno del servidor - revisar logs"
    });
  }
});

// Endpoint de prueba
app.get("/", (req, res) => {
  res.json({ 
    message: "API funcionando correctamente con sobrescritura y gestión de fotos", 
    timestamp: new Date(),
    endpoints: ["/api/cestas_productos"],
    features: ["Sobrescritura de cestas", "Gestión de fotos de cestas"]
  });
});

// Endpoint de test CORS
app.get("/test-cors", (req, res) => {
  res.json({ 
    message: "CORS funcionando correctamente", 
    timestamp: new Date(),
    origin: req.headers.origin || 'No origin header'
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API escuchando en puerto ${PORT}`);
  console.log(`📡 CORS configurado para todos los orígenes`);
  console.log(`🗃️ Conectado a base de datos PostgreSQL`);
  console.log(`🔄 Funcionalidad de sobrescritura habilitada`);
  console.log(`📸 Gestión de fotos de cestas habilitada`);
});
