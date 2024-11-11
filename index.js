import axios from 'axios';
import express from 'express';
import dotenv from 'dotenv';
import { getNewPortalNotes } from './noteChecker.js';

// Used for local environment variables
dotenv.config();

// Create the express App
const app = express();

// Some authentication stuff
const token = Buffer.from(`${process.env.SSC_USER}:${process.env.SSC_PASSWORD}`).toString('base64')
const base_url = `${process.env.SERVICE_URL}/sap/c4c/api`

axios.defaults.headers.common['Authorization'] = `Basic ${token}`
axios.defaults.headers.common['content-type'] = "application/json"


// Returns a middleware that only parses JSON
app.use(express.json());

// Health Check: Runs a call against the case-service in order to determine if reachable
app.get('/health', async (req, res) => {
    // Get cases
  await axios.get(`${base_url}/v1/case-service/cases`)
    .then((response) => {
        res.send("OK")
    })
    .catch((error) => {
        res.status(500)
        res.send("Error")
    });

    res.end();
});

// Create sub-case for a given Case
app.post('/createSubCase', async (req, res) => {
    // Extract the data out the body of the event
    const id = req.body.data.currentImage.id;
    const requestData = req.body;

    // Validate if it is already a sub-case
    if (requestData.data?.currentImage?.parentCaseId) res.end(); // --> quit if this is the case

    // Create new sub-case
    const subCaseData = {
        "subject": `Sub Case of ${requestData.data.currentImage.displayId}`,
        "caseType": "ZCAS",
        "origin": "MANUAL_DATA_ENTRY",
        "status": "01",
        "priority": "03",
        "account": {
          "id": requestData.data.currentImage.account.id
        },
            "relatedObjects": [
            {
                "objectId": id,
                "type": "2886",
                "role": "13"
            }
        ]
      }

      await axios.post(`${base_url}/v1/case-service/cases`, subCaseData)
        .then((response) => {
            console.log(response)
        })
        .catch((error) => {          // handle error
            console.log(error);
            res.status(500)
        })
    
        // Send response
        res.end()
});


app.post('/casePreHook', (req, res) => {
    console.log(JSON.stringify(req.body));

    // Get the currentImage
    let currentImage = req.body.currentImage
    const lastImage = req.body.beforeImage

    const newPortalNotes = getNewPortalNotes(lastImage?.notes, currentImage?.notes)
    console.log(`Number of new portal notes: ${newPortalNotes.length}`)
    if (newPortalNotes.length > 0) {
        // Trigger async POST to portal API...
    }

    // Let us add checks here
    if (currentImage?.processor?.employeeDisplayId === "35") {
        currentImage.subject = "Case toegewezen aan Lander"
    }

    res.status(200).send({
        data: currentImage,
        noChanges: false
    })

    /*setTimeout(() => {
        console.log("Waited 10 seconds");
            // Send response
        res.status(200).send({
            data: currentImage,
            noChanges: false
        })
    }, 3000);*/


});

app.post('/casePostHook', (req, res) => {
    console.log(JSON.stringify(req.body));
    let errorMessages = [];
    let infoMessages = [];

    let currentImage = req.body.currentImage;

    // Some validations
    if (currentImage?.processor?.employeeDisplayId === "35") {
        infoMessages.push({
            "code": " external_CaseService.10000",
            "message": "Extra werk voor Lander!",
            "target": "",
            "severity": "INFO"
        });
    }

    // Send response
    res.status(200).send({
        noChanges: true,
        info: infoMessages
    })
});


// Listen to port 
app.listen( process.env.PORT || 4000)