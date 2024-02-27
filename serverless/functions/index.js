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
const { defineSecret, defineString } = require("firebase-functions/params");
const admin = require("firebase-admin");

const busboy = require("busboy"); // form parsing
const jimp = require("jimp"); // image processing
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// spotify environment
const client_id = defineSecret("CLIENT_ID");
const client_secret = defineSecret("CLIENT_SECRET");

// firebase admin credentials
const clientEmail = defineString("CLIENT_EMAIL");
const projectId = defineString("PROJECT_ID");
const privateKey = defineString("PRIVATE_KEY");

// delete a post by reference and all associated content from Firebase
async function delete_post(firestore, storage, post) {
	const user_id = post.data()["user_id"];
	// find and delete post image
	if (post.data()["image_url"] != "") {
		// const imageRef = ref(storage, "/images/" + user_id + "/" + post.id);
		const fileRef = storage.bucket().file("images/" + user_id + "/" + post.id);
		try {
			await fileRef.delete();
		} catch (e) {
			logger.info("failed to delete post image", e);
		}
		logger.info("Deleted post image " + post.id);
	}
	// find and delete post comments
	const _commSnap = await firestore
		.collection("posts/" + post.id + "/comments")
		.get();
	for (let c = 0; c < _commSnap.docs.length; c++) {
		const comment = _commSnap.docs[c];
		await comment.ref.delete();
		logger.info("Deleted comment " + comment.id);
	}
	// delete post smile counts
	try {
		await firestore.doc("users/" + user_id + "/smiles/" + post.id).delete();
	} catch (e) {
		//ignore
	}
	// delete post
	await post.ref.delete();
	logger.info("Deleted post " + post.id);
}
exports.deleteUser = onRequest({ maxInstances: 2 }, async (req, res) => {
	if (
		["https://chattea.app"].includes(
			req.headers.origin
		)
	) {
		res.set("Access-Control-Allow-Origin", "*");
		res.set("Access-Control-Allow-Headers", "content-type");
	} else
		return res
			.status(400)
			.set("Access-Control-Allow-Origin", "https://chattea.app")
			.send("");
	if (req.method == "OPTIONS") {
		res.set("Access-Control-Allow-Methods", "POST");
		res.set("x-test-origin", req.headers.origin);
		res.set("Vary", "Origin");
		return res.status(204).send("");
	} else if (req.method != "POST")
		return res.status(401).send("Incorrect request method");
	const app = (admin.apps.length > 0 && admin.apps[0]) || admin.initializeApp();
	const auth = getAuth(app);
	const firestore = getFirestore(app);
	const storage = getStorage(app);
	const data = JSON.parse(req.rawBody.toString("utf-8"));
	// validate requestor's privileges
	let token, user_id;
	try {
		token = await auth.verifyIdToken(data["token"]);
		user_id = data["user_id"];
	} catch (e) {
		return res.status(400).send("Invalid token provided");
	}
	logger.info("Validating token user " + token.uid);
	const adminRef = firestore.doc("admins/" + token.uid);
	const adminDoc = await adminRef.get();
	if (user_id !== token.uid && !adminDoc.exists)
		return res.status(401).send("Admin privileges required!");
	logger.info("User " + token.uid + " is admin");
	// validate target user's existence
	const targetRef = firestore.doc("users/" + user_id);
	const targetDoc = await targetRef.get();
	if (targetDoc.exists) {
		// find and delete user's public key
		const _keyRef = firestore.doc("pkeys/" + user_id);
		try {
			await _keyRef.delete();
			logger.info("Deleted public key " + user_id);
		} catch (e) {
			// do nothing
		}
		// find and delete user's public posts
		const _snap = await firestore
			.collection("posts")
			.where("user_id", "==", user_id)
			.get();
		for (let i = 0; i < _snap.docs.length; i++) {
			const post = _snap.docs[i];
			await delete_post(firestore, storage, post);
		}
		// find and delete user's private posts
		const _psnap = await firestore
			.collection("users/" + user_id + "/posts")
			.get();
		for (let i = 0; i < _psnap.docs.length; i++) {
			const post = _psnap.docs[i];
			await delete_post(firestore, storage, post);
		}

		const userData = targetDoc.data();
		// find and delete profile image
		if (String(userData["pfp"]).startsWith("https://")) {
			try {
				const pfpRef = storage
					.bucket()
					.file("profiles/" + user_id + "/" + user_id);
				await pfpRef.delete();
				logger.info("Deleted profile image " + targetDoc.id);
			} catch (e) {
				// continue process regardless
			}
		}
		// find and delete banner images
		if (userData["banner"] !== "") {
			const bannerSnap = (
				await storage.bucket().getFiles("banners/" + user_id)
			).values();
			for (let i = 0; i < bannerSnap.length; i++) {
				const banner = bannerSnap[i];
				try {
					await banner.delete();
				} catch (e) {
					logger.info("Failed to delete banner", banner.name);
				}
			}
		}
		// delete target's notifications
		const _notifSnap = await firestore
			.collection("users/" + user_id + "/notifications")
			.get();
		for (let n = 0; n < _notifSnap.docs.length; n++) {
			const notification = _notifSnap.docs[n];
			try {
				await notification.ref.delete();
				logger.info("Deleted notification " + notification.id);
			} catch (e) {
				// ignore
			}
		}
		// delete target's profile
		await targetDoc.ref.delete();
		logger.info("Deleted profile " + user_id);
	}
	try {
		// delete target's auth account
		await auth.deleteUser(user_id);
		logger.info("Deleted account " + user_id);
		res.send("Ok");
	} catch (e) {
		res.status(400).send("Failed to delete user " + user_id);
	}
});
// automated Spotify access token API
// just a middleman for handling secrets
exports.helloWorld = onRequest(
	{
		secrets: [client_id, client_secret],
		cors: ["https://chattea.app"],
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
		cors: ["https://chattea.app"],
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
