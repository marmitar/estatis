import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { google, sheets_v4 } from 'googleapis';
import { Credentials } from 'google-auth-library';

import { functionsOauthClient, DB_TOKEN_PATH } from './auth';
import { isString } from 'util';


const CONFIG_SHEET_ID: string = functions.config().googleapi.sheet_id;

// OAuth token cached locally.
let oauthTokens: Credentials | null = null;


// checks if oauthTokens have been loaded into memory, and if not, retrieves them
export async function getAuthorizedClient() {
    if (oauthTokens) {
        return functionsOauthClient;
    }
    const snapshot = await admin.database().ref(DB_TOKEN_PATH).once('value');
    const newTokens: Credentials | undefined = snapshot.val();
    if (! newTokens) {
        throw Error('no tokens set');
    }
    functionsOauthClient.setCredentials(newTokens);
    oauthTokens = newTokens;
    return functionsOauthClient;
}


export interface Range {
    start: string,
    stop?: string,
    sheet?: string
}

export function rangeToStr(range: Range) {
    let rangeText = range.start;

    if (range.stop) {
        rangeText += ':' + range.stop
    }
    if (range.sheet) {
        rangeText = `'${range.sheet}'!${rangeText}`
    }
    return rangeText;
}


export async function getRange(range?: Range | string) {
    const sheets = google.sheets('v4');

    const request: sheets_v4.Params$Resource$Spreadsheets$Values$Get = {
        spreadsheetId: CONFIG_SHEET_ID,
        majorDimension: 'COLUMNS',
        auth: await getAuthorizedClient()
    };
    if (range) {
        request.range = isString(range)? range : rangeToStr(range);
    }

    const {data} = await sheets.spreadsheets.values.get(request);
    return data.values;
}

