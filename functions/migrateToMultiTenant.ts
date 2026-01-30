import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // 1. Authenticate Current User
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Set Current User as Super Admin
        // Note: We use base44.auth.updateMe() to update the current user
        await base44.auth.updateMe({
            app_role: 'super_admin',
            company_name: 'ArchiFlow Master Studio'
        });

        // 3. Migrate Furniture and References to be Global
        // Fetch all assets
        const allAssets = await base44.entities.DesignAsset.list(null, 1000); // Fetch plenty
        
        const updates = [];
        
        for (const asset of allAssets) {
            // Logic: If it's Furniture or References -> Make Global
            // Logic: If it's Moodboard or Template -> Make Private (default is false, but ensuring)
            
            let shouldUpdate = false;
            let isGlobal = false;

            if (['furniture', 'references', 'textures'].includes(asset.category)) {
                isGlobal = true;
                if (asset.is_global !== true) shouldUpdate = true;
            } else {
                // Proposal templates, moodboards, etc.
                isGlobal = false;
                if (asset.is_global !== false) shouldUpdate = true;
            }

            if (shouldUpdate) {
                updates.push(base44.entities.DesignAsset.update(asset.id, { is_global: isGlobal }));
            }
        }

        await Promise.all(updates);

        return Response.json({ 
            success: true, 
            message: `Migration complete. User set to Super Admin. Updated ${updates.length} assets to correct global/private status.`,
            user_updated: user.email,
            assets_processed: allAssets.length
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});