import path from "path";
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory
/*<----------------------------------------------------------->*/
import express from "express"; /* Accessing express module */
const app = express(); /* app is a request handler function */
/*<----------------------------------------------------------->*/
import bodyParser from "body-parser";
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
/*<----------------------------------------------------------->*/
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, '../credentials/.env') });
const uri = `mongodb+srv://${process.env.MONGO_DB_USERNAME}:${process.env.MONGO_DB_PASSWORD}@cluster0.gbmvg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
import {Code, MongoClient, ServerApiVersion} from "mongodb";
const client = new MongoClient(uri, {serverApi: ServerApiVersion.v1 });
connect2Mongo();
const db = process.env.MONGO_DB_NAME;
const coll = process.env.MONGO_COLLECTION;
/*<----------------------------------------------------------->*/
import * as transl from './translateUtil.js';
import { ExceptionCode } from "@xmldom/xmldom";
const apiKey = process.env.API_KEY;
const apiUrl = process.env.BASE_API_URL
/*<----------------------------------------------------------->*/
import Ajv from 'ajv';
const ajv = new Ajv();
/*<----------------MODIFY BELOW------------------------------------------->*/
process.stdin.setEncoding("utf8");
const portNumber = process.env.PORT_NUMBER;
console.log(`http://localhost:${portNumber}`);
app.listen(portNumber);
/*<----------------------------------------------------------->*/

async function connect2Mongo() {
    try {
        await client.connect();
    } catch(e) {
        console.log(e);
    }
}
/*<----------------------------------------------------------->*/

app.get("/search", async (req, resp) => {
    const kWord = req.query.kWord;

    let statusCode;
    let message;
    try {
        if (!kWord)
            statusCode = 400, message = "param 'kWord' is not given.";
        else
            statusCode = 200, message = await transl.translate(apiUrl, apiKey, kWord);
    } catch (e) {
        statusCode = 500, message = e.message;
    }

    resp.status(statusCode).json({message: message});
});

app.post("/savingWord", async (req, resp) => {
    const SCHEMA = {
        "type": "object",
        "properties": {
            "id": {"type": "string"}, 
            "kWord": {"type": "string"},
            "meaning": {
                "type": ["array", "null"],
                "items": {"type": "string"}
            },
            "name": {"type": "string"}
        },
        "required": ["id", "kWord", "meaning", "name"],
        "additionalProperties": false
    }

    const isValid = ajv.validate(SCHEMA, req.body)
    if (isValid === false)
        return resp.status(400).json({message: "Data's format is invalid."});
    //else
    let message;
    let statusCode;

    try {
        let result = await client.db(db).collection(coll).insertOne(req.body);
        const {name, kWord: word} = req.body;

        if (result) 
            statusCode = 200, message = `${word} is added to ${name}'s`;
        else 
            statusCode = 500, message = `Failed to add ${word} to ${name}'s`;
    } catch(e) {
        statusCode = 500, message = e.message;
    }

    resp.status(statusCode).json({message: message});
});

app.get("/getSavedWord", async (req, resp) => {
    const name = req.query.name;

    let statusCode;
    let message;
    try {
        if (!name)
            statusCode = 400, message = "param 'name' is not given.";
        else
            statusCode = 200, message = await client.db(db).collection(coll).find({name: name}).toArray();    
    } catch(e) {
        statusCode = 500, message = e.message;
    }

    resp.status(statusCode).json({message: message});
});