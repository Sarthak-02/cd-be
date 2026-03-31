import { LRUCache } from "lru-cache";
import firestore from "../firestore.js";
import { getEndUserByUserid } from "../../db/enduser.db.js";
import { getTeacher } from "../../db/teacher.db.js";
import { getStudent } from "../../db/student.db.js";

const endUserCache = new LRUCache({
    max: 2000,
    ttl: 1000 * 60 * 30 // 30 minutes
});

export async function getEndUserDetails(userid) {

    try {
        // Validate userid is a non-empty string
        if (!userid || typeof userid !== 'string' || userid.trim() === '') {
            return null;
        }

        // 1. Try cache
        const cached = endUserCache.get(userid);
        if (cached) return cached;

        // 2. Try Firestore
        const doc = await firestore.collection("endusers").doc(userid).get();

        if (doc.exists) {
            const data = doc.data();
            endUserCache.set(userid, data);
            return data;
        }

        // 3. Fallback DB enduser
        const endUser = await getEndUserByUserid(userid);

        if (!endUser) return null;

        let details = null;
        if (endUser.role === "TEACHER") {
            details = await getTeacher(endUser.userid);
        } else if (endUser.role === "STUDENT") {
            details = await getStudent(endUser.userid);
        }

        const endUserData = {
            ...endUser,
            details
        };

        // 4. Save to Firestore
        await firestore.collection("endusers").doc(userid).set(endUserData);

        // 5. Save to LRU cache
        endUserCache.set(userid, endUserData);

        return endUserData;
    }
    catch (err) {
        console.log(err)
        return null
    }

}

export async function clearEndUserCache(userid) {
    try {
        // Validate userid is a non-empty string
        if (!userid || typeof userid !== 'string' || userid.trim() === '') {
            return;
        }
        
        await firestore.collection("endusers").doc(userid).delete();
        endUserCache.delete(userid);
    }
    catch (err) {
        console.log(err)
    }
}
