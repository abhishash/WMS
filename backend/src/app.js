import express from "express";
import cors from "cors";
const app = express();

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

app.get("/",(req, res)=> {
    res.json({
        success: true,
        message: "MERN API is running"
    })
})

export default app;