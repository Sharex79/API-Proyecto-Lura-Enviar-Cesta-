app.post("/api/cestas_productos", async (req, res) => {
  try {
    console.log("Datos recibidos:", req.body);
    
    const { numero_cesta, productos } = req.body;
    
    // AGREGAR VALIDACIÓN
    if (!numero_cesta) {
      return res.status(400).json({ ok: false, error: "numero_cesta es requerido" });
    }
    
    if (!productos || !Array.isArray(productos)) {
      return res.status(400).json({ ok: false, error: "productos debe ser un array" });
    }
    
    if (productos.length === 0) {
      return res.status(400).json({ ok: false, error: "productos no puede estar vacío" });
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
      productos_guardados: resultados.length
    });

  } catch (err) {
    console.error("Error completo:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});
