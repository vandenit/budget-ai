import mongoose from "mongoose";

async function connectDb() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  console.log("connectDb");
  return mongoose.connect(process.env.MONGODB_URI || "");
}

export default connectDb;
