import mongoose from "mongoose";

async function connectDb() {
  if (mongoose.connection.readyState >= 1) {
    console.log("connectDb");
    return;
  }

  return mongoose.connect(process.env.MONGODB_URI || "");
}

export default connectDb;
