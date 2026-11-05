import express from "express";import cors from "cors";import dotenv from "dotenv";import files from "./src/routes/files.js";
dotenv.config();const app=express();app.use(cors());app.use(express.json());
app.get("/api/health",(_q,s)=>s.json({status:"ok"}));app.use("/api/files",files);
app.use((e,_q,s,_n)=>s.status(400).json({message:e.message||"Request error"}));
app.listen(process.env.PORT||5000,"127.0.0.1",()=>console.log("CampusVault API ready"));
