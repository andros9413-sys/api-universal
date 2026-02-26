require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const fs = require("fs");
const path = require("path");

const app = express();

// Seguridad básica
app.use(helmet());

// Permitir peticiones externas
app.use(cors());

// Permitir JSON grande
app.use(express.json({ limit: "10mb" }));

// 🔐 Middleware de autenticación
app.use((req, res, next) => {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: "API KEY requerida"
    });
  }

  if (apiKey !== process.env.API_KEY) {
    return res.status(403).json({
      success: false,
      error: "API KEY inválida"
    });
  }

  next();
});

// 🟢 Endpoint principal
app.post("/receive", async (req, res) => {
  try {
    const payload = req.body;

    const filePath = path.join(__dirname, "data.json");

    let existingData = [];

    // Si el archivo existe, leerlo
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf8");
      existingData = JSON.parse(fileContent || "[]");
    }

    // Agregar nuevo registro
    existingData.push({
      receivedAt: new Date(),
      data: payload
    });

    // Guardar nuevamente
    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));

    return res.status(200).json({
      success: true,
      message: "Datos guardados correctamente",
      receivedAt: new Date()
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      error: "Error guardando datos"
    });
  }
});

// 🟢 Endpoint de prueba
app.get("/", (req, res) => {
  res.json({
    status: "API funcionando correctamente"
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 API corriendo en puerto ${PORT}`);
});