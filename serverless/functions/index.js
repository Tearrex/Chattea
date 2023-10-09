/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const { defineSecret } = require("firebase-functions/params");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// spotify environment
const client_id = defineSecret("CLIENT_ID");
const client_secret = defineSecret("CLIENT_SECRET");

exports.helloWorld = onRequest(
	{
		secrets: [client_id, client_secret],
		cors: ["https://chattea.me"],
	},
	(request, response) => {
		fetch("https://accounts.spotify.com/api/token", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
			},
			body: `client_id=${client_id.value()}&client_secret=${client_secret.value()}&grant_type=client_credentials`,
		})
			.then((res) => res.json())
			.then((data) => {
				logger.info("Hello logs!", data);
				response.send("Bearer " + data.access_token);
			});
	}
);
