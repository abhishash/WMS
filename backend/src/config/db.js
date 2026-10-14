import mongoose from "mongoose";

const options = {
    maxPoolSize : 50,
    minPoolSize : 10,
}
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, options);
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error(`Database connection error: ${error.message}`);
        process.exit(1);
    }
}

export default connectDB