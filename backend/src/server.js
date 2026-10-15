import app from "./app.js";
import connectDB from "./config/db.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 5000;

connectDB();

let node = result;
while (node !== null) {
  console.log(node.val);
  node = node.next;
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
