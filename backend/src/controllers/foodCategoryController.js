import mongoose from "mongoose";
import FoodCategory from "../models/foodCategory.js";

// POST: Create category
export const createFoodCategory = async (req, res, next) => {
  try {
    const { name, description, status } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Food category name is required",
      });
    }

    const category = await FoodCategory.create({
      name: name.trim(),
      description,
      status,
    });

    return res.status(201).json({
      success: true,
      message: "Food category created successfully",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// GET: Get all categories
export const getFoodCategories = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;

    const pageNumber = Number(page);
    const pageSize = Number(limit);

    if (
      !Number.isInteger(pageNumber) ||
      pageNumber < 1 ||
      !Number.isInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Page must be positive and limit must be between 1 and 100",
      });
    }

    const filter = {};

    if (typeof search === "string" && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.name = { $regex: escaped, $options: "i" };
    }

    if (status === "true") filter.status = true;
    if (status === "false") filter.status = false;

    const [categories, total] = await Promise.all([
      FoodCategory.find(filter)
        .sort({ name: 1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .lean(),

      FoodCategory.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: categories,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET: Get category by ID
export const getFoodCategoryById = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const category = await FoodCategory.findById(req.params.id).lean();

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Food category not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// PUT: Update category
export const updateFoodCategory = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const { name, description, isActive } = req.body;
    const updates = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name must be a non-empty string",
        });
      }
      updates.name = name.trim();
    }

    if (description !== undefined) {
      if (typeof description !== "string") {
        return res.status(400).json({
          success: false,
          message: "Description must be a string",
        });
      }
      updates.description = description;
    }

    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "isActive must be a boolean",
        });
      }
      updates.isActive = isActive;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update",
      });
    }

    const category = await FoodCategory.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
        context: "query",
      },
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Food category not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Food category updated successfully",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE: Delete category
export const deleteFoodCategory = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    // Later, check whether menu products use this category
    // before allowing permanent deletion.
    const category = await FoodCategory.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Food category not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Food category deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
