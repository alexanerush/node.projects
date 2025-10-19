import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.send("node project 1");
});

app.listen(3000, () => {
  console.log("Сервер запущен на http://localhost:3000");
});
