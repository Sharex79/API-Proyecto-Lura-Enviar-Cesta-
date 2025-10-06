import express from "express";
import cors from "cors";
import pkg from "pg";

const { Pool } = pkg;
const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));

app.use(express.json());

const pool = new Pool({
  host: "switchback.proxy.rlwy.net",
  port: 15893,
  database: "railway",
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  ssl: { rejectUnauthorized: false }
});

// ENDPOINT CON SOBRESCRITURA
app.post("/api/cestas_productos", async (req, res) => {
  try {
    console.log("=== DATOS RECIBIDOS ===");
    console.log("req.body:", req.body);
    
    const { numero_cesta, productos } = req.body;
    
    if (!numero_cesta) {
      return res.status(400).json({ ok: false, error: "numero_cesta es requerido" });
    }
    
    if (!productos || !Array.isArray(productos)) {
      return res.status(400).json({ ok: false, error: "productos debe ser un array" });
    }

    // 🔥 PASO 1: ELIMINAR TODO LO ANTERIOR DE ESA CESTA
    const deleteResult = await pool.query(
      'DELETE FROM cestas_productos WHERE numero_cesta = $1',
      [numero_cesta]
    );
    
    console.log(`Eliminados ${deleteResult.rowCount} productos de la cesta ${numero_cesta}`);

    // 🔥 PASO 2: INSERTAR LOS NUEVOS PRODUCTOS
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

    console.log(`Insertados ${resultados.length} productos nuevos`);

    res.json({ 
      ok: true, 
      productos_eliminados: deleteResult.rowCount,
      productos_guardados: resultados.length,
      mensaje: `Cesta ${numero_cesta} sobrescrita: ${deleteResult.rowCount} eliminados, ${resultados.length} nuevos`
    });

  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/", (req, res) => {
  res.json({ message: "API funcionando con sobrescritura", timestamp: new Date() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API escuchando en puerto ${PORT}`);
});
});

