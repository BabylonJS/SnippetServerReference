const express = require("express");
const cors = require("cors");
const fs = require("fs");
const app = express();
const port = 3000;

const DATA_DIR = "data/";
const METADATA_DIR = "metadata/";
const LOCAL_SEPARATOR = "_";
const FILE_EXT = ".json";
const METADATA_EXT = ".txt";
const ID_LEN = 5;

const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Set up reading of the JSON body. You can access the body with req.body
app.use(express.json());
// Set up CORS handling. Here you could specify only some specific domains to accept requests from
app.use(cors());

app.post("/:id?", (req, res) => {
    let id = req.params.id;
    let version;
    
    if (!id) {
        // Generate "random" 5 character string
        const genRndChar = () => {
            const idx = Math.floor(Math.random() * chars.length);
            return chars[idx];
        };

        id = "";
        for (let i = 0; i < ID_LEN; i++) {
            id += genRndChar();
        }
    }

    const metadataPath = METADATA_DIR + id + METADATA_EXT;
    // Look for the latest version in the metadata directory. If there is no metadata file, then it is the first version.
    if (fs.existsSync(metadataPath)) {
        version = fs.readFileSync(metadataPath, {encoding: 'utf-8'});
        // Increment the version and convert back to string
        version = Number.parseInt(version) + 1;
        version = version + "";
    } else {
        version = "1";
    }

    const newLocalToken = id + LOCAL_SEPARATOR + version;
    
    fs.writeFileSync(metadataPath, version);

    const filePath = DATA_DIR + newLocalToken + FILE_EXT;
    const stringBody = JSON.stringify(req.body);
    fs.writeFileSync(filePath, stringBody);
    
    res.status(200).json({
        id,
        version
    });
});

app.get("/:id/:version?", (req, res) => {
    const id = req.params.id;
    const version = req.params.version || "1";
    
    const localToken = id + LOCAL_SEPARATOR + version;
    const path = DATA_DIR + localToken + FILE_EXT;
    
    if (fs.existsSync(path)) {
        const rawData = fs.readFileSync(path);
        const parsedData = JSON.parse(rawData);
        
        res.status(200).json({
            name: parsedData.name,
            description: parsedData.description,
            tags: parsedData.tags,
            jsonPayload: parsedData.payload
        });
    } else {
        res.status(404).send();
    }
});

app.listen(port, () => {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR);
    }
    if (!fs.existsSync(METADATA_DIR)) {
        fs.mkdirSync(METADATA_DIR);
    }
    console.log(`Example app listening on port ${port}`);
});
