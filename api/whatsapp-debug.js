"use strict";
// Endpoint de debug temporário - REMOVER após validar HMAC
const crypto = require("crypto");

function readRawBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on("data", c => chunks.push(c));
        req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
        req.on("error", reject);
    });
}

module.exports = async (req, res) => {
    const rawBody = await readRawBody(req);
    const sig = req.headers["x-mp-signature"];
    const secret = process.env.MP_WEBHOOK_SECRET || "(missing)";
    const expected = secret !== "(missing)"
        ? crypto.createHmac("sha256", secret).update(rawBody).digest("hex")
        : "(no secret)";

    res.status(200).json({
        rawBodyLength: rawBody.length,
        rawBodyFirst200: rawBody.slice(0, 200),
        rawBodyHex32: Buffer.from(rawBody).slice(0, 32).toString('hex'),
        receivedSignature: sig,
        expectedSignature: expected,
        match: sig === expected,
        bodyParseExists: typeof req.body !== "undefined",
        bodyParsed: req.body ? JSON.stringify(req.body).slice(0, 200) : null,
        secretSet: secret !== "(missing)",
        secretLength: secret.length
    });
};

module.exports.config = {
    api: {
        bodyParser: false
    }
};
