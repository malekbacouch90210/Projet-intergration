import express from "express";
import dotenv from "dotenv";
import { initDB } from "./lib/db.js";
import authRoutes from "./routes/auth.routes.js";
import iproute from "./routes/ip.routes.js";
import ipsecurity from "./routes/security.routes.js";
import reportsRouter from "./routes/reports.routes.js";
import repliesRouter from "./routes/replies.routes.js";
import cors from 'cors';

const app = express();
app.use(cors());

dotenv.config();
const PORT = process.env.PORT;

app.use(express.json());

//test
// app.get("/",(req,res)=>{
//     res.send("Hello on server port 3000");
// })

app.use("/api/auth",authRoutes);
app.use("/api/ip", iproute); 
app.use("/api/security",ipsecurity);
app.use("/api/reports", reportsRouter);
app.use("/api/replies", repliesRouter);


initDB().then(() => {
  app.listen(PORT, () => {
    console.log("SERVER RUNNING ON PORT:", PORT);
  });
}).catch((err) => {//for testing reasons 
  console.error("❌ Failed to init DB", err);
});
