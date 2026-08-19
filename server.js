require("dotenv").config();

const express = require("express");
const plivo = require("plivo");

const app = express();

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL;

const OTP = process.env.OTP;
const ASSOCIATE_NUMBER = process.env.ASSOCIATE_NUMBER;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const client = new plivo.Client(
    process.env.PLIVO_AUTH_ID,
    process.env.PLIVO_AUTH_TOKEN
);

/*
|--------------------------------------------------------------------------
| HOME
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {
    res.send("InspireWorks Plivo IVR server is running!");
});

/*
|--------------------------------------------------------------------------
| LEVEL 0 — ANSWER + OTP
|--------------------------------------------------------------------------
*/

app.get("/answer", (req, res) => {

    console.log("=================================");
    console.log("ANSWER ENDPOINT");
    console.log("Call UUID:", req.query.CallUUID);
    console.log("=================================");

    const xml = `
<Response>

    <GetDigits
        action="${BASE_URL}/verify-otp"
        method="POST"
        numDigits="4"
        timeout="10"
        digitTimeout="3">

        <Speak>
            Welcome to InspireWorks.
            Please enter your four digit OTP.
        </Speak>

    </GetDigits>

    <Speak>
        No OTP was received.
        Please try again.
    </Speak>

    <Redirect>
        ${BASE_URL}/answer
    </Redirect>

</Response>
`;

    res.type("application/xml");
    res.send(xml);
});

/*
|--------------------------------------------------------------------------
| OTP VERIFICATION
|--------------------------------------------------------------------------
*/

app.post("/verify-otp", (req, res) => {

    const enteredOtp = req.body.Digits;

    console.log("=================================");
    console.log("OTP VERIFICATION");
    console.log("Entered:", enteredOtp);
    console.log("Expected:", OTP);
    console.log("=================================");

    // Correct OTP
    if (enteredOtp === OTP) {

        console.log("OTP CORRECT");

        const xml = `
<Response>

    <Speak>
        Authentication successful.
    </Speak>

    <GetDigits
        action="${BASE_URL}/language"
        method="POST"
        numDigits="1"
        timeout="10"
        digitTimeout="3">

        <Speak>
            Please select your language.
            Press 1 for English.
            Press 2 for Spanish.
        </Speak>

    </GetDigits>

    <Speak>
        No language selection was received.
        Goodbye.
    </Speak>

    <Hangup/>

</Response>
`;

        res.type("application/xml");
        return res.send(xml);
    }

    // Wrong OTP
    console.log("OTP INCORRECT - RETRYING");

    const xml = `
<Response>

    <Speak>
        Incorrect OTP.
    </Speak>

    <GetDigits
        action="${BASE_URL}/verify-otp"
        method="POST"
        numDigits="4"
        timeout="10"
        digitTimeout="3">

        <Speak>
            Please enter your four digit OTP again.
        </Speak>

    </GetDigits>

    <Speak>
        No OTP was received.
        Goodbye.
    </Speak>

    <Hangup/>

</Response>
`;

    res.type("application/xml");
    res.send(xml);
});

/*
|--------------------------------------------------------------------------
| LEVEL 1 — LANGUAGE
|--------------------------------------------------------------------------
*/

app.post("/language", (req, res) => {

    const language = req.body.Digits;

    console.log("=================================");
    console.log("LANGUAGE SELECTION:", language);
    console.log("=================================");

    /*
    |--------------------------------------------------------------------------
    | English
    |--------------------------------------------------------------------------
    */

    if (language === "1") {

        const xml = `
<Response>

    <Speak>
        English selected.
    </Speak>

    <GetDigits
        action="${BASE_URL}/english-action"
        method="POST"
        numDigits="1"
        timeout="10"
        digitTimeout="3">

        <Speak>
            Press 1 to hear a short audio message.
            Press 2 to speak with a live associate.
        </Speak>

    </GetDigits>

    <Speak>
        No selection was received.
        Goodbye.
    </Speak>

    <Hangup/>

</Response>
`;

        res.type("application/xml");
        return res.send(xml);
    }

    /*
    |--------------------------------------------------------------------------
    | Spanish
    |--------------------------------------------------------------------------
    */

    if (language === "2") {

        const xml = `
<Response>

    <Speak>
        Spanish selected.
    </Speak>

    <GetDigits
        action="${BASE_URL}/spanish-action"
        method="POST"
        numDigits="1"
        timeout="10"
        digitTimeout="3">

        <Speak>
            Para escuchar un mensaje, presione 1.
            Para hablar con un asociado, presione 2.
        </Speak>

    </GetDigits>

    <Speak>
        No se recibio una seleccion.
        Goodbye.
    </Speak>

    <Hangup/>

</Response>
`;

        res.type("application/xml");
        return res.send(xml);
    }

    /*
    |--------------------------------------------------------------------------
    | Invalid language
    |--------------------------------------------------------------------------
    */

    const xml = `
<Response>

    <Speak>
        Invalid selection.
        Please try again.
    </Speak>

    <GetDigits
        action="${BASE_URL}/language"
        method="POST"
        numDigits="1"
        timeout="10"
        digitTimeout="3">

        <Speak>
            Press 1 for English.
            Press 2 for Spanish.
        </Speak>

    </GetDigits>

    <Speak>
        No selection was received.
        Goodbye.
    </Speak>

    <Hangup/>

</Response>
`;

    res.type("application/xml");
    res.send(xml);
});

/*
|--------------------------------------------------------------------------
| LEVEL 2 — ENGLISH ACTION
|--------------------------------------------------------------------------
*/

app.post("/english-action", (req, res) => {

    const choice = req.body.Digits;

    console.log("=================================");
    console.log("ENGLISH ACTION:", choice);
    console.log("=================================");

    // Audio
    if (choice === "1") {

        const xml = `
<Response>

    <Speak>
        Here is your requested audio message.
    </Speak>

    <Play>
        https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3
    </Play>

    <Speak>
        Thank you for listening. Goodbye.
    </Speak>

    <Hangup/>

</Response>
`;

        res.type("application/xml");
        return res.send(xml);
    }

    // Live associate
    if (choice === "2") {

        const xml = `
<Response>

    <Speak>
        Please hold while we connect you
        to a live associate.
    </Speak>

    <Dial>
        <Number>${ASSOCIATE_NUMBER}</Number>
    </Dial>

</Response>
`;

        res.type("application/xml");
        return res.send(xml);
    }

    // Invalid input
    const xml = `
<Response>

    <Speak>
        Invalid selection.
        Please try again.
    </Speak>

    <GetDigits
        action="${BASE_URL}/english-action"
        method="POST"
        numDigits="1"
        timeout="10">

        <Speak>
            Press 1 for audio.
            Press 2 for a live associate.
        </Speak>

    </GetDigits>

    <Hangup/>

</Response>
`;

    res.type("application/xml");
    res.send(xml);
});

/*
|--------------------------------------------------------------------------
| LEVEL 2 — SPANISH ACTION
|--------------------------------------------------------------------------
*/

app.post("/spanish-action", (req, res) => {

    const choice = req.body.Digits;

    console.log("=================================");
    console.log("SPANISH ACTION:", choice);
    console.log("=================================");

    // Audio
    if (choice === "1") {

        const xml = `
<Response>

    <Speak>
        Este es su mensaje de audio.
    </Speak>

    <Play>
        https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3
    </Play>

    <Speak>
        Gracias por escuchar. Adios.
    </Speak>

    <Hangup/>

</Response>
`;

        res.type("application/xml");
        return res.send(xml);
    }

    // Live associate
    if (choice === "2") {

        const xml = `
<Response>

    <Speak>
        Por favor espere mientras lo conectamos
        con un asociado.
    </Speak>

    <Dial>
        <Number>${ASSOCIATE_NUMBER}</Number>
    </Dial>

</Response>
`;

        res.type("application/xml");
        return res.send(xml);
    }

    // Invalid input
    const xml = `
<Response>

    <Speak>
        Seleccion no valida.
        Por favor intentelo de nuevo.
    </Speak>

    <GetDigits
        action="${BASE_URL}/spanish-action"
        method="POST"
        numDigits="1"
        timeout="10">

        <Speak>
            Presione 1 para audio.
            Presione 2 para un asociado.
        </Speak>

    </GetDigits>

    <Hangup/>

</Response>
`;

    res.type("application/xml");
    res.send(xml);
});

/*
|--------------------------------------------------------------------------
| OUTBOUND CALL
|--------------------------------------------------------------------------
*/

app.get("/make-call", async (req, res) => {

    try {

        const targetNumber =
            req.query.to || process.env.TARGET_NUMBER;

        console.log("=================================");
        console.log("STARTING OUTBOUND CALL");
        console.log("To:", targetNumber);
        console.log("From:", process.env.PLIVO_NUMBER);
        console.log("Answer URL:", `${BASE_URL}/answer`);
        console.log("=================================");

        const response = await client.calls.create(
            process.env.PLIVO_NUMBER,
            [targetNumber],
            `${BASE_URL}/answer`,
            {
                answerMethod: "GET"
            }
        );

        console.log("Call queued:", response);

        res.json({
            success: true,
            message: "Outbound call initiated.",
            response
        });

    } catch (error) {

        console.error("Plivo error:", error);

        res.status(500).json({
            success: false,
            message: error.message,
            status: error.status
        });
    }
});

/*
|--------------------------------------------------------------------------
| START SERVER
|--------------------------------------------------------------------------
*/

app.listen(PORT, () => {

    console.log("--------------------------------------");
    console.log("InspireWorks Plivo IVR");
    console.log("--------------------------------------");
    console.log(`Server: http://localhost:${PORT}`);
    console.log(`Base URL: ${BASE_URL}`);
    console.log("--------------------------------------");

});