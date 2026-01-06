import { createBroadcastDraft, sendBroadcast } from "../../services/app/broadcast.service";

export async function broadcast_post(req,res) {
    try{
        const {title,message,attachmentUrls,targets,campusId,userId} = req.body
        const broadcast = createBroadcastDraft({title,message,attachmentUrls,createdBy:userId,campusId,targets})
        if(!broadcast){
            throw new Error("Unable to Send the Message")
        }
        
        //trigger a taskq for this function
        const result = await sendBroadcast(broadcast.id,campusId)

        if(!result){
            throw new Error("Unable to Send the Message")
        }

        res.status(200).json("Success");
    }
    catch(err){
        res.status(400).json({ error: err.message });
    }
}