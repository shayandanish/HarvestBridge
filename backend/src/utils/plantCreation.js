/**
 * Shared utility for creating Plant records from a Plantation Request.
 * Used by both plantation.controller.js (Admin Manual Approval) 
 * and payment.controller.js (Investor Payment Approval).
 */
const createPlantsFromRequest = async (tx, plantationRequest, status) => {
    // 1. Ensure items and trees are included
    const requestWithItems = await tx.plantationRequest.findUnique({
        where: { id: plantationRequest.id },
        include: { items: { include: { tree: true } } }
    });

    if (!requestWithItems || !requestWithItems.items) {
        console.log(`[PlantCreation] No items found for request ${plantationRequest.id}`);
        return;
    }

    // 2. Iterate through items (trees)
    for (const item of requestWithItems.items) {
        const tree = item.tree;
        
        // 3. Find or create matching CropType
        let cropType = await tx.cropType.findUnique({
            where: { name: tree.name }
        });

        if (!cropType) {
            cropType = await tx.cropType.create({
                data: {
                    name: tree.name,
                    category: 'Tree',
                    description: `Automatically created for ${tree.name}`
                }
            });
        }

        // 4. Create individual Plant records based on quantity
        const plantsToCreate = [];
        for (let i = 0; i < item.quantity; i++) {
            plantsToCreate.push({
                farmId: requestWithItems.farmId,
                cropTypeId: cropType.id,
                plantationRequestId: requestWithItems.id, // Link to the specific project/request
                status: 'sponsored', // Mark as invested/sponsored
                growthStatus: status === 'planted' ? 'planted' : 'to_be_planted',
                plantDate: status === 'planted' ? new Date() : null,
            });
        }

        if (plantsToCreate.length > 0) {
            await tx.plant.createMany({
                data: plantsToCreate
            });
        }
    }
};

module.exports = { createPlantsFromRequest };
