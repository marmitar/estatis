import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { OAuth2Client } from 'google-auth-library';


// googleapi.client_id = Google API client ID,
// googleapi.client_secret = client secret, and
// googleapi.sheet_id = Google Sheet id (long string in middle of sheet URL)
const CONFIG_CLIENT_ID: string = functions.config().googleapi.client_id;
const CONFIG_CLIENT_SECRET: string = functions.config().googleapi.client_secret;
const GCLOUD_REGION: string = functions.config().gcloud.region;

// The OAuth Callback Redirect.
const FUNCTIONS_REDIRECT = `https://${GCLOUD_REGION}-${process.env.GCLOUD_PROJECT}.cloudfunctions.net/oauthcallback`;
// const FUNCTIONS_REDIRECT = `http://localhost:5001/${process.env.GCLOUD_PROJECT}/${GCLOUD_REGION}/oauthcallback`;

// setup for authGoogleAPI
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
export const functionsOauthClient = new OAuth2Client(CONFIG_CLIENT_ID, CONFIG_CLIENT_SECRET, FUNCTIONS_REDIRECT);

// setup for OauthCallback
export const DB_TOKEN_PATH = '/api_tokens';


// visit the URL for this Function to request tokens
export const authgoogleapi = functions.https.onRequest((req, resp) => {
    resp.set('Cache-Control', 'private, max-age=0, s-maxage=0');
    resp.redirect(functionsOauthClient.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent',
    }));
});

// after you grant access, you will be redirected to the URL for this Function
// this Function stores the tokens to your Firebase database
export const oauthcallback = functions.https.onRequest(async (req, resp) => {
    resp.set('Cache-Control', 'private, max-age=0, s-maxage=0');
    const {code} = req.query;
    try {
        const {tokens} = await functionsOauthClient.getToken(code);
        // Now tokens contains an access_token and an optional refresh_token. Save them.
        await admin.database().ref(DB_TOKEN_PATH).set(tokens);
        resp.status(200).json('App successfully configured with new Credentials. '
            + 'You can now close this page.');
    } catch (error) {
        resp.status(400).json(error);
    }
});
