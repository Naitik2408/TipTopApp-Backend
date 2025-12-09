const Category = require('../models/category.model');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const APIFeatures = require('../utils/APIFeatures');

/**
 * Get all categories with pagination and filtering
 * GET /api/v1/categories
 */
exports.getAllCategories = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Category.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const categories = await features.query;
  const total = await Category.countDocuments();

  // Get actual item counts
  const categoriesWithCounts = await Category.getAllWithCounts();
  
  // Filter the counts based on the paginated results
  const categoryIds = categories.map(cat => cat._id.toString());
  const filteredCategoriesWithCounts = categoriesWithCounts.filter(cat => 
    categoryIds.includes(cat._id.toString())
  );

  res.status(200).json({
    status: 'success',
    results: filteredCategoriesWithCounts.length,
    pagination: {
      page: req.query.page * 1 || 1,
      limit: req.query.limit * 1 || 10,
      total,
      pages: Math.ceil(total / (req.query.limit * 1 || 10)),
    },
    data: {
      categories: filteredCategoriesWithCounts,
    },
  });
});

/**
 * Get category by ID
 * GET /api/v1/categories/:id
 */
exports.getCategoryById = catchAsync(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  const MenuItem = require('../models/MenuItem');
  const itemCount = await MenuItem.countDocuments({ 'category.main': category.name });

  res.status(200).json({
    status: 'success',
    data: {
      category: {
        ...category.toObject(),
        itemCount,
      },
    },
  });
});

/**
 * Create new category
 * POST /api/v1/categories
 * Admin only
 */
exports.createCategory = catchAsync(async (req, res, next) => {
  const { name, description, isActive, color } = req.body;

  // Check if category already exists
  const existingCategory = await Category.findOne({ 
    name: { $regex: new RegExp(`^${name}$`, 'i') } 
  });

  if (existingCategory) {
    return next(new AppError('Category with this name already exists', 400));
  }

  const category = await Category.create({
    name,
    description,
    isActive,
    color: color || ['green', 'blue', 'purple', 'orange', 'pink', 'yellow', 'red'][Math.floor(Math.random() * 7)],
  });

  res.status(201).json({
    status: 'success',
    data: {
      category,
    },
  });
});

/**
 * Update category
 * PATCH /api/v1/categories/:id
 * Admin only
 */
exports.updateCategory = catchAsync(async (req, res, next) => {
  const { name, description, isActive, color } = req.body;

  // If name is being updated, check for duplicates
  if (name) {
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      _id: { $ne: req.params.id },
    });

    if (existingCategory) {
      return next(new AppError('Category with this name already exists', 400));
    }
  }

  const category = await Category.findByIdAndUpdate(
    req.params.id,
    { name, description, isActive, color },
    { new: true, runValidators: true }
  );

  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      category,
    },
  });
});

/**
 * Delete category
 * DELETE /api/v1/categories/:id
 * Admin only
 */
exports.deleteCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  // Check if category has items
  const MenuItem = require('../models/MenuItem');
  const itemCount = await MenuItem.countDocuments({ 'category.main': category.name });

  if (itemCount > 0) {
    return next(
      new AppError(
        `Cannot delete category with ${itemCount} menu items. Please reassign or delete the items first.`,
        400
      )
    );
  }

  await category.deleteOne();

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

/**
 * Toggle category status
 * PATCH /api/v1/categories/:id/toggle-status
 * Admin only
 */
exports.toggleCategoryStatus = catchAsync(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  category.isActive = !category.isActive;
  await category.save();

  res.status(200).json({
    status: 'success',
    data: {
      category,
    },
  });
});

/**
 * Get category statistics
 * GET /api/v1/categories/stats
 */
exports.getCategoryStats = catchAsync(async (req, res, next) => {
  const total = await Category.countDocuments();
  const active = await Category.countDocuments({ isActive: true });
  const inactive = await Category.countDocuments({ isActive: false });

  const categoriesWithCounts = await Category.getAllWithCounts();
  const totalItems = categoriesWithCounts.reduce((sum, cat) => sum + cat.itemCount, 0);

  res.status(200).json({
    status: 'success',
    data: {
      stats: {
        total,
        active,
        inactive,
        totalItems,
      },
    },
  });
});
