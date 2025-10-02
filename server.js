import express from "express";
import cors from "cors";
import pkg from "pg";

const { Pool } = pkg;
const app = express();

// CORS configurado
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));

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

// Endpoint principal
app.post("/api/cestas_productos", async (req, res) => {
  try {
    console.log("Datos recibidos:", req.body);
    
    const { numero_cesta, productos } = req.body;
    
    // Validación
    if (!numero_cesta) {
      return res.status(400).json({ ok: false, error: "numero_cesta es requerido" });
    }
    
    if (!productos || !Array.isArray(productos)) {
      return res.status(400).json({ ok: false, error: "productos debe ser un array" });
    }

    const resultados = [];

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
      productos_guardados: resultados.length,
      datos: resultados
    });

  } catch (err) {
    console.error("Error completo:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Endpoint de test
app.get("/", (req, res) => {
  res.json({ message: "API funcionando", timestamp: new Date() });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API escuchando en puerto ${PORT}`);
});
