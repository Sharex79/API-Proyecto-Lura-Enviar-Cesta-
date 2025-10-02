import express from "express";
import cors from "cors";
import pkg from "pg";

const { Pool } = pkg;
const app = express();

// CORS configurado correctamente - IMPORTANTE
app.use(cors({
  origin: '*', // Permite todos los orígenes temporalmente
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));

// Headers CORS adicionales por si acaso
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());

// Configuración conexión DB
const pool = new Pool({
  host: "switchback.proxy.rlwy.net",
  port: 15893,
  database: "railway",
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  ssl: { rejectUnauthorized: false }
});

// Endpoint para crear cesta
app.post("/api/crear_cesta", async (req, res) => {
  try {
    console.log("Datos recibidos:", req.body);
    
    const { numero_cesta, productos } = req.body;

    const resultados = [];

    // Insertar cada producto en la tabla
    for (const producto of productos) {
      const { id_producto, cantidad_producto } = producto;
      
      const result = await pool.query(
        `INSERT INTO cestas_productos (numero_cesta, id_producto, cantidad_producto)
         VALUES ($1, $2, $3) RETURNING *`,
        [numero_cesta, id_producto, cantidad_producto]
      );
      
      resultados.push(result.rows[0]);
    }

    res.json({ 
      ok: true, 
      productos_guardados: resultados.length
    });

  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Endpoint de test para verificar CORS
app.get("/api/test-cors", (req, res) => {
  res.json({ message: "CORS funciona correctamente", timestamp: new Date() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API escuchando en puerto ${PORT}`);
  console.log(`Test CORS: https://api-proyecto-lura-enviar-cesta-production.up.railway.app/api/test-cors`);
});

