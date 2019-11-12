import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { getRange } from './sheets';
export { oauthcallback, authgoogleapi } from './auth';

admin.initializeApp({
    // credential: admin.credential.cert('.adminsdk.json'),
    databaseURL: "https://estatis-9743f.firebaseio.com"
});


export const readspreadsheet = functions.https.onCall(getRange);


export const readjsonspreadsheet = functions.https.onRequest(async (req, resp) => {
    try {
        const values = await getRange(req.body);

        resp.status(200).json(values);
    } catch (error) {
        resp.status(400).json(error);
    }
});
