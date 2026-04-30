import mongoose from "mongoose";

const unitSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true 
  },
  type: { 
    type: String, 
    enum: ["weight", "count", "length"], 
    required: true 
  },
  conversionFactor: { 
    type: Number, 
    required: true,
    default: 1.0 
  }
}, { timestamps: true });

const Unit = mongoose.model("Unit", unitSchema);

export default Unit;
