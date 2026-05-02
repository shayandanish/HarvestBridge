const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all trees for investors/admin
exports.getAllTrees = async (req, res, next) => {
    try {
        const trees = await prisma.tree.findMany({
            where: req.user.role === 'admin' ? {} : { isActive: true },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({
            status: 'success',
            data: trees
        });
    } catch (error) {
        next(error);
    }
};

// Create a tree
exports.createTree = async (req, res, next) => {
    try {
        const { name, price, spaceRequired, spaceUnit, isActive } = req.body;

        const tree = await prisma.tree.create({
            data: {
                name,
                price: parseFloat(price),
                spaceRequired: spaceRequired ? parseFloat(spaceRequired) : 100,
                spaceUnit: spaceUnit || 'SQ FT',
                isActive: isActive !== undefined ? isActive : true
            }
        });

        res.status(201).json({
            status: 'success',
            data: tree
        });
    } catch (error) {
        next(error);
    }
};

// Update a tree
exports.updateTree = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, price, spaceRequired, spaceUnit, isActive } = req.body;

        const tree = await prisma.tree.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(price && { price: parseFloat(price) }),
                ...(spaceRequired && { spaceRequired: parseFloat(spaceRequired) }),
                ...(spaceUnit && { spaceUnit }),
                ...(isActive !== undefined && { isActive })
            }
        });

        res.status(200).json({
            status: 'success',
            data: tree
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                status: 'error',
                message: 'Tree not found'
            });
        }
        next(error);
    }
};

// Delete a tree
exports.deleteTree = async (req, res, next) => {
    try {
        const { id } = req.params;

        await prisma.tree.delete({
            where: { id }
        });

        res.status(204).send();
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                status: 'error',
                message: 'Tree not found'
            });
        }
        next(error);
    }
};
