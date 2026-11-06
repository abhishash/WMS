import mongoose from "mongoose";

const options = {
  maxPoolSize: 50,
  minPoolSize: 10,
};

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured");
  }

  await mongoose.connect(process.env.MONGO_URI, options);
  console.log("MongoDB connected successfully");
};

export default connectDB;