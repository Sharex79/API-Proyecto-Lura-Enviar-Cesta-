import express from "express";
import cors from "cors";
import pkg from "pg";

const { Pool } = pkg;

const app = express();

// CORS configurado correctamente
app.use(cors({
  origin: ['http://localhost:5173', 'https://tu-dominio-vercel.app', '*'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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
        `INSERT INTO cesta_producto (numero_cesta, id_producto, cantidad_producto)
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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`API escuchando en puerto ${PORT}`));
