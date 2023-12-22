import mongoose from "mongoose";

async function connectDb() {
  console.log("connectDb");
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  return mongoose.connect(process.env.MONGODB_URI || "");
}

export default connectDb;
