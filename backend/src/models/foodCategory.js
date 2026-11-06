import mongoose from "mongoose";

const foodCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Food category name is required"],
      trim: true,
      unique: true,
      maxlength: [100, "Category name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true, 
  },
);

const FoodCategory = mongoose.model(
  "FoodCategory",
  foodCategorySchema,
);

export default FoodCategory;
