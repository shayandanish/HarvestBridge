const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { notifyFarmActivity } = require('../utils/notification.service');

const trackingController = {
    // Log Activity
    logActivity: async (req, res) => {
        try {
            const { plantId, farmId } = req.params;
            const { activityType, description, activityDate, notes } = req.body;

            const activity = await prisma.$transaction(async (tx) => {
                const newActivity = await tx.plantActivity.create({
                    data: {
                        plantId: plantId || null,
                        farmId: farmId || null,
                        activityType,
                        description,
                        activityDate: new Date(activityDate),
                        notes
                    }
                });

                // Handle Photo if uploaded
                let photoUrl = null;
                if (req.file) {
                    const { processAndUploadImage } = require('../utils/fileUpload');
                    photoUrl = await processAndUploadImage(req.file.buffer, req.file.originalname, 'tracking');
                    
                    await tx.plantPhoto.create({
                        data: {
                            plantId: plantId || null,
                            farmId: farmId || null,
                            photoUrl,
                            caption: description,
                            takenDate: new Date(activityDate),
                            isMilestone: activityType === 'growth_update'
                        }
                    });
                }

                // Automation: If this is a farm-level growth update to 'planted'
                if (farmId && activityType === 'growth_update' && (req.body.growthStatus === 'planted' || notes?.toLowerCase().includes('status: planted'))) {
                    const statusDate = activityDate ? new Date(activityDate) : new Date();
                    
                    // 1. Get all plants that will be updated
                    const plantsToUpdate = await tx.plant.findMany({
                        where: { farmId, growthStatus: 'to_be_planted' }
                    });

                    // 2. Update all plants in this farm that are 'to_be_planted'
                    await tx.plant.updateMany({
                        where: {
                            farmId,
                            growthStatus: 'to_be_planted'
                        },
                        data: {
                            growthStatus: 'planted',
                            plantDate: statusDate,
                            status: 'planted', // Move from sponsored to planted
                            locationInFarm: req.body.locationInFarm || undefined
                        }
                    });

                    // 3. If there's a photo, create a record for each plant
                    if (photoUrl) {
                        for (const plant of plantsToUpdate) {
                            await tx.plantPhoto.create({
                                data: {
                                    plantId: plant.id,
                                    photoUrl,
                                    caption: `Planted at ${req.body.locationInFarm || 'Farm'}`,
                                    takenDate: statusDate,
                                    isMilestone: true
                                }
                            });
                        }
                    }

                    // 4. Update all approved plantation requests to 'planted'
                    await tx.plantationRequest.updateMany({
                        where: {
                            farmId,
                            status: 'approved'
                        },
                        data: {
                            status: 'planted'
                        }
                    });
                }

                return newActivity;
            });

            res.status(201).json(activity);

            // Notify linked investors asynchronously
            const resolvedFarmId = farmId || activity.farmId;
            if (resolvedFarmId) {
                notifyFarmActivity(resolvedFarmId, activityType, description, req.user.id);
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error logging activity' });
        }
    },

    // Upload Photo
    uploadPhoto: async (req, res) => {
        try {
            const { plantId, farmId } = req.params;
            let { photoUrl, caption, takenDate, isMilestone } = req.body;

            // Handle file upload
            if (req.file) {
                const { processAndUploadImage } = require('../utils/fileUpload');
                photoUrl = await processAndUploadImage(req.file.buffer, req.file.originalname, 'tracking');
            }

            const isMilestoneParsed = isMilestone === 'true' || isMilestone === true;

            const result = await prisma.$transaction(async (tx) => {
                const photo = await tx.plantPhoto.create({
                    data: {
                        plantId: plantId || null,
                        farmId: farmId || null,
                        photoUrl,
                        caption,
                        takenDate: new Date(takenDate),
                        isMilestone: isMilestoneParsed
                    }
                });

                if (isMilestoneParsed) {
                    await tx.plantMilestone.create({
                        data: {
                            plantId: plantId || null,
                            farmId: farmId || null,
                            milestoneType: 'photo_update',
                            milestoneDate: new Date(takenDate),
                            photoUrl,
                            notes: caption
                        }
                    });
                }

                // Automation: If this is a farm-level photo upload, sync to all plants
                if (farmId) {
                    const plants = await tx.plant.findMany({ where: { farmId } });
                    for (const plant of plants) {
                        await tx.plantPhoto.create({
                            data: {
                                plantId: plant.id,
                                photoUrl,
                                caption,
                                takenDate: new Date(takenDate),
                                isMilestone: isMilestoneParsed
                            }
                        });

                        if (isMilestoneParsed) {
                            await tx.plantMilestone.create({
                                data: {
                                    plantId: plant.id,
                                    milestoneType: 'photo_update',
                                    milestoneDate: new Date(takenDate),
                                    photoUrl,
                                    notes: caption
                                }
                            });
                        }
                    }
                }

                return photo;
            });

            res.status(201).json(result);

            // Notify linked investors asynchronously
            const resolvedFarmId = farmId || result.farmId;
            if (resolvedFarmId) {
                notifyFarmActivity(resolvedFarmId, 'photo_update', caption || 'Photo uploaded', req.user.id);
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error uploading photo' });
        }
    },

    // Log Milestone
    logMilestone: async (req, res) => {
        try {
            const { plantId, farmId } = req.params;
            const { milestoneType, milestoneDate, photoUrl, notes } = req.body;

            const milestone = await prisma.$transaction(async (tx) => {
                const newMilestone = await tx.plantMilestone.create({
                    data: {
                        plantId: plantId || null,
                        farmId: farmId || null,
                        milestoneType,
                        milestoneDate: new Date(milestoneDate),
                        photoUrl,
                        notes
                    }
                });

                // Automation: If this is a farm-level milestone, sync to all plants
                if (farmId) {
                    const plants = await tx.plant.findMany({ where: { farmId } });
                    for (const plant of plants) {
                        await tx.plantMilestone.create({
                            data: {
                                plantId: plant.id,
                                milestoneType,
                                milestoneDate: new Date(milestoneDate),
                                photoUrl,
                                notes
                            }
                        });
                    }
                }

                return newMilestone;
            });

            res.status(201).json(milestone);

            // Notify linked investors asynchronously
            const resolvedFarmId = farmId || milestone.farmId;
            if (resolvedFarmId) {
                notifyFarmActivity(resolvedFarmId, 'milestone', notes || milestoneType, req.user.id);
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error logging milestone' });
        }
    },

    // Get Timeline
    getTimeline: async (req, res) => {
        try {
            const { plantId, farmId } = req.params;

            const where = plantId ? { plantId } : { farmId };

            const activities = await prisma.plantActivity.findMany({ where });
            const photos = await prisma.plantPhoto.findMany({ where });
            const milestones = await prisma.plantMilestone.findMany({ where });

            const timeline = [
                ...activities.map(a => ({ ...a, type: 'activity', date: a.activityDate })),
                ...photos.map(p => ({ ...p, type: 'photo', date: p.takenDate })),
                ...milestones.map(m => ({ ...m, type: 'milestone', date: m.milestoneDate }))
            ].sort((a, b) => new Date(b.date) - new Date(a.date));

            res.json(timeline);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching timeline' });
        }
    }
};

module.exports = trackingController;
