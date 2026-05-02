const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const favoritesController = {
    // Add favorite
    addFavorite: async (req, res) => {
        try {
            const { farmId, plantId } = req.body;
            const userId = req.user.id;

            if (!farmId && !plantId) {
                return res.status(400).json({ message: 'Farm ID or Plant ID is required' });
            }

            // Check if already exists
            const existing = await prisma.favorite.findFirst({
                where: {
                    userId,
                    OR: [
                        { farmId: farmId || undefined },
                        { plantId: plantId || undefined }
                    ]
                }
            });

            if (existing) {
                return res.status(400).json({ message: 'Already in favorites' });
            }

            const favorite = await prisma.favorite.create({
                data: {
                    userId,
                    farmId,
                    plantId
                }
            });

            res.status(201).json(favorite);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error adding favorite' });
        }
    },

    // Remove favorite
    removeFavorite: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const favorite = await prisma.favorite.findUnique({
                where: { id }
            });

            if (!favorite || favorite.userId !== userId) {
                return res.status(404).json({ message: 'Favorite not found' });
            }

            await prisma.favorite.delete({
                where: { id }
            });

            res.json({ message: 'Removed from favorites' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error removing favorite' });
        }
    },

    // Get user favorites
    getFavorites: async (req, res) => {
        try {
            const userId = req.user.id;

            const favorites = await prisma.favorite.findMany({
                where: { userId },
                include: {
                    farm: {
                        include: {
                            photos: { where: { isPrimary: true } },
                            land: true
                        }
                    },
                    plant: {
                        include: {
                            cropType: true,
                            farm: { select: { farmName: true } }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            res.json(favorites);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching favorites' });
        }
    }
};

module.exports = favoritesController;
