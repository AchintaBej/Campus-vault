import {Router} from "express";
import multer from "multer";
import {randomUUID} from "node:crypto";
import {DeleteObjectCommand,GetObjectCommand,ListObjectsV2Command,PutObjectCommand} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import {s3,bucket} from "../s3.js";
const router=Router();
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:Number(process.env.MAX_FILE_MB||10)*1024*1024},fileFilter:(_r,f,cb)=>{
 const types=["application/pdf","image/jpeg","image/png","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/vnd.ms-powerpoint","application/vnd.openxmlformats-officedocument.presentationml.presentation"];
 cb(types.includes(f.mimetype)?null:new Error("Allowed: PDF, JPG, PNG, DOC, DOCX, PPT, PPTX."),types.includes(f.mimetype));
}});
function admin(req,res,next){if(!process.env.ADMIN_PIN||req.get("x-admin-pin")!==process.env.ADMIN_PIN)return res.status(401).json({message:"Wrong admin PIN"});next();}
router.get("/",async(_req,res)=>{try{
 const r=await s3.send(new ListObjectsV2Command({Bucket:bucket,Prefix:"uploads/",MaxKeys:100}));
 const files=await Promise.all((r.Contents||[]).map(async x=>({key:x.Key,name:decodeURIComponent(x.Key.split("/").pop().replace(/^[0-9a-f-]+_/,"")),size:x.Size,uploadedAt:x.LastModified,downloadUrl:await getSignedUrl(s3,new GetObjectCommand({Bucket:bucket,Key:x.Key}),{expiresIn:300})})));
 files.sort((a,b)=>new Date(b.uploadedAt)-new Date(a.uploadedAt));res.json({files});
 }catch(e){console.error(e);res.status(500).json({message:"S3 list failed. Check bucket, region and EC2 IAM role."});}});
router.post("/upload",upload.single("file"),async(req,res)=>{try{
 if(!req.file)return res.status(400).json({message:"Select a file"});
 const name=req.file.originalname.replace(/[^a-zA-Z0-9._-]/g,"_").slice(0,100),key=`uploads/${randomUUID()}_${name}`;
 await s3.send(new PutObjectCommand({Bucket:bucket,Key:key,Body:req.file.buffer,ContentType:req.file.mimetype}));
 res.status(201).json({message:"Uploaded to S3",key});
 }catch(e){console.error(e);res.status(500).json({message:"Upload failed. Check S3 permissions."});}});
router.delete("/:key(*)",admin,async(req,res)=>{try{
 const key=decodeURIComponent(req.params.key);if(!key.startsWith("uploads/")||key.includes(".."))return res.status(400).json({message:"Invalid key"});
 await s3.send(new DeleteObjectCommand({Bucket:bucket,Key:key}));res.json({message:"Deleted from S3"});
 }catch(e){console.error(e);res.status(500).json({message:"Delete failed"});}});
export default router;
