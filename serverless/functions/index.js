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

const busboy = require("busboy"); // form parsing
const jimp = require("jimp"); // image processing

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// spotify environment
const client_id = defineSecret("CLIENT_ID");
const client_secret = defineSecret("CLIENT_SECRET");

// automated Spotify access token API
// just a middleman for handling secrets
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

// automated cropping API
exports.cropImage = onRequest(
	{
		cors: ["https://chattea.me"],
	},
	(request, response) => {
		if (request.method !== "POST") {
			return response.status(405).end();
		}

		let formData = {};
		// pipe the request to busboy for parsing form fields
		let bb = busboy({
			headers: request.headers,
			defCharset: "utf8",
			limits: {
				files: 1,
			},
		});
		let result = null;
		// get the crop region and crop size fields
		bb.on("field", (key, val) => {
			try {
				val = parseInt(val);
			} catch (e) {
				// ignore
			}
			formData[key] = val;
		});
		// get file list, only expecting one file
		bb.on("file", (fieldname, fileStream, filename, enc, mimetype) => {
			logger.info("got file", filename);
			// decode bytes to read filename
			let originalName = Buffer.from(filename.filename, "latin1").toString(
				"utf8"
			);

			// store file type in variable
			let extension = originalName
				.toLowerCase()
				.slice(originalName.lastIndexOf(".") + 1);
			// compare against whitelisted filetypes
			if (!["jpg", "png", "jpeg", "blob"].includes(extension.toLowerCase())) {
				logger.info("Skipping unsafe file " + originalName);
				fileStream.resume(); // equivalent to 'continue' on a loop
			} else {
				// encoded image bytes are progressively loaded to this array
				var buffers = [];
				fileStream.on("data", async (chunk) => {
					logger.info(`reading ${chunk.length} bytes...`);
					if (chunk.length > 0) buffers.push(chunk);
				});
				fileStream.on("close", () => {
					// the file gets concatenated from random access memory
					result = Buffer.concat(buffers);
					logger.info("total read", result.length); // log processed bytes
				});
			}
		});
		bb.on("finish", () => {
			// did client include required parameters?
			if (!formData["width"])
				return response.status(400).send("Bad request!!!");
			logger.info("busboy done");
			// load the image from memory and begin crop process
			jimp.read(result, (err, image) => {
				let proportion;
				// use the shortest dimension of the image
				// to make a 1:1 aspect ratio
				if (image.getWidth() > image.getHeight())
					proportion = image.getHeight() / formData["height"];
				else proportion = image.getWidth() / formData["width"];
				logger.info("img dimensions", [image.getWidth(), image.getHeight()]);
				logger.info("proportion", proportion);
				// crop region is provided by grid of the frontend tool
				image.crop(
					formData["x"] * proportion,
					formData["y"] * proportion,
					formData["width"] * proportion,
					formData["height"] * proportion
				);
				// here we make the image object return the result
				// in bytes to send a blob response to the client request
				image.getBuffer(jimp.MIME_JPEG, (err, buffer) => {
					logger.info("complete");
					response.writeHead(200, {
						"content-disposition": 'attachment; filename="image.jpeg',
						"content-type": "image/jpeg",
					});
					response.end(Buffer.from(buffer, "base64"));
				});
			});
		});
		bb.end(request.rawBody);
	}
);
