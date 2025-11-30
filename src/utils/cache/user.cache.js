import { LRUCache } from "lru-cache";
import firestore from "../firestore.js";
import { getUser } from "../../db/user.db.js";
import { getSchools } from "../../db/school.db.js";

const userCache = new LRUCache({
    max: 2000,
    ttl: 1000 * 60 * 30 // 30 minutes
});

export async function getUserDetails(userId) {
    // 1. Try cache
    const cached = userCache.get(userId);
    if (cached) return cached;

    // 2. Try Firestore
    const doc = await firestore.collection("users").doc(userId).get();

    if (doc.exists) {
        const data = doc.data();
        userCache.set(userId, data);
        return data;
    }

    // 3. Fallback DB user
    const user = await getUser(userId);
    if (!user) return null;

    const sitePermissions = user?.site_permissions;
    let site_permission_details = [];

    if (sitePermissions) {
        const schools = await getSchools(sitePermissions);
        site_permission_details = schools?.map(({ school_name, school_id }) => ({
            label: school_name,
            value: school_id
        })) || [];
    }

    const userData = {
        ...user,
        site_permissions: site_permission_details
    };

    // 4. Save to Firestore
    await firestore.collection("users").doc(userId).set(userData);

    // 5. Save to LRU cache
    userCache.set(userId, userData);

    return userData;
}


// await firestore.collection("users").doc(userId).delete();
// userCache.delete(userId);