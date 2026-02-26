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

// ===============================
// 🔐 Middleware de autenticación
// Solo protege rutas privadas
// ===============================
function authMiddleware(req, res, next) {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: "API KEY requerida",
    });
  }

  if (apiKey !== process.env.API_KEY) {
    return res.status(403).json({
      success: false,
      error: "API KEY inválida",
    });
  }

  next();
}

// Ruta pública
app.get("/", (req, res) => {
  res.json({
    status: "API funcionando correctamente",
    environment: process.env.NODE_ENV || "development",
  });
});

// ===============================
// 🟢 Endpoint principal (privado)
// ===============================
app.post("/receive", authMiddleware, async (req, res) => {
  try {
    const payload = req.body;

    if (!payload || Object.keys(payload).length === 0) {
      return res.status(400).json({
        success: false,
        error: "Payload vacío",
      });
    }

    const filePath = path.join(__dirname, "data.json");

    let existingData = [];

    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf8");
      existingData = JSON.parse(fileContent || "[]");
    }

    const newRecord = {
      id: Date.now(),
      receivedAt: new Date().toISOString(),
      data: payload,
    };

    existingData.push(newRecord);

    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));

    console.log("Nuevo payload recibido:");
    console.log(JSON.stringify(newRecord, null, 2));

    return res.status(200).json({
      success: true,
      message: "Datos guardados correctamente",
      id: newRecord.id,
      receivedAt: newRecord.receivedAt,
    });
  } catch (error) {
    console.error("Error en /receive:", error);

    return res.status(500).json({
      success: false,
      error: "Error guardando datos",
    });
  }
});

// ===============================
// 📂 Endpoint para consultar datos (privado)
// ===============================
app.get("/data", authMiddleware, (req, res) => {
  try {
    const filePath = path.join(__dirname, "data.json");

    if (!fs.existsSync(filePath)) {
      return res.json([]);
    }

    const fileContent = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(fileContent || "[]");

    res.json(data);
  } catch (error) {
    console.error("Error en /data:", error);
    res.status(500).json({ error: "Error leyendo datos" });
  }
});

// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 API corriendo en puerto ${PORT}`);
});
