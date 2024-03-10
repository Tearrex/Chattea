import { useContext, useEffect, useState } from "react";
import { MembersContext, UserContext } from "../Main/Contexts";
import "../Styles/Messaging.scss";
import { useParams } from "react-router";
import { Link, useNavigate } from "react-router-dom";
import { _dbRef, useAuth } from "../Main/firebase";
import {
	Timestamp,
	collection,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	limit,
	orderBy,
	query,
	serverTimestamp,
	setDoc,
	updateDoc,
	where,
} from "firebase/firestore";
import UserList from "../Buddies/UserList";
import { useCollection } from "react-firebase-hooks/firestore";
import { getAuth } from "firebase/auth";

// keys from plaintext password....
function str2ab(str) {
	const buf = new ArrayBuffer(str.length);
	const bufView = new Uint8Array(buf);
	for (let i = 0; i < str.length; i++) {
		bufView[i] = str.charCodeAt(i);
	}
	return buf;
}
function ab2str(buf) {
	return String.fromCharCode.apply(null, new Uint8Array(buf));
}
const generateKeys = async () => {
	let keys = await window.crypto.subtle.generateKey(
		{
			name: "RSA-OAEP",
			modulusLength: 2048,
			publicExponent: new Uint8Array([1, 0, 1]),
			hash: "SHA-256",
		},
		true,
		["encrypt", "decrypt"]
	);
	let pubkey = await window.crypto.subtle.exportKey("spki", keys.publicKey);
	let pubpem = window.btoa(ab2str(pubkey)); // from array buffer to binary string to base64 //window.btoa(pubkey);
	let privkey = await window.crypto.subtle.exportKey("pkcs8", keys.privateKey);
	let privpem = window.btoa(ab2str(privkey));
	return { public: pubpem, private: privpem };
};
export default function MessagePage() {
	const navigate = useNavigate();
	const currentUser = useAuth();
	const { user_id } = useParams();
	const { _user, _setUser } = useContext(UserContext);
	const { _users, _setUsers } = useContext(MembersContext);

	const [cachedPosts, setCachedPosts] = useState({}); // load forwarded posts from local storage
	const [forwardedPost, setForwardedPost] = useState(null); // read from local storage after redirect
	const [nudging, setNudging] = useState(false); // toggle buddy selection modal for creating channel
	const [securing, setSecuring] = useState(false); // confirmation toggle for leaving insecure mode
	const [insecureMode, setInsecureMode] = useState(false); // toggle skipping message encryption
	const [buddyList, setBuddyList] = useState({});

	const [regenerating, setRegenerating] = useState(false);
	const [publicPEM, setPublicPEM] = useState(null); // base64 encryption key
	const [publicKey, setPublicKey] = useState(null); // holds cryptokey object for encryption operations
	const [privatePEM, setPrivatePEM] = useState(null); // base64 decryption key
	const [privateKey, setPrivateKey] = useState(null); // holds cryptokey object for decryption operations

	const [deletingChannel, setDeletingChannel] = useState(false);
	// lazy-load cache for referencing message channel ID's of each buddy for the current user
	const [chatChannels, setChatChannels] = useState({}); // { [buddy_id]: {channel_id, activity_date} }

	const [oldestMsgTimestamp, setOldestMsgTimestamp] = useState(null); // for scrolling back
	const [latestMsgTimestamp, setLatestMsgTimestamp] = useState(null); // for scrolling forward

	const channelsUpdateQuery = query(
		collection(_dbRef, "messages"),
		where("users", "array-contains", _user ? _user.user_id : "null")
	);
	const [channelUpdates] = useCollection(channelsUpdateQuery, {
		idField: "id",
	});
	useEffect(async () => {
		if (channelUpdates && channelUpdates.docChanges().length > 0) {
			console.log(
				"channel updates",
				channelUpdates.docChanges().map((d) => d.doc.data())
			);
			let _chatChannels = chatChannels ? { ...chatChannels } : {};
			let _toCache = {}; // list of user profiles to append to local cache in bulk
			for (let i = 0; i < channelUpdates.docChanges().length; i++) {
				const _updated = channelUpdates.docChanges()[i];
				const _updatedDoc = _updated.doc;
				const buddy_id = Array.from(_updatedDoc.data().users).find(
					(a) => a !== _user.user_id
				);
				if (_updated.type === "removed") {
					delete _chatChannels[buddy_id];
					continue;
				}

				_chatChannels[buddy_id] = {
					channel_id: _updatedDoc.id,
					activity_date: _updatedDoc.data().activity_date,
				};

				// if the open channel matches this updated document, save read receipt timestamp
				if (buddy_id === user_id) {
					if (
						latestMsgTimestamp &&
						latestMsgTimestamp.seconds <
							_chatChannels[buddy_id].activity_date.seconds
					)
						fetch_new_messages();
					setChannelReads({
						...channelReads,
						[_updatedDoc.id]: new Date(
							_chatChannels[buddy_id].activity_date.seconds * 1000
						),
					});
				}

				// lazy-load buddy's profile in local user cache
				if (!_users[buddy_id]) {
					const userRef = doc(_dbRef, "users", buddy_id);
					const _doc = await getDoc(userRef);
					if (_doc.exists()) {
						_toCache[buddy_id] = _doc.data(); // buddy's data from firestore
						console.log(`Caching user ${buddy_id} from channel list`);
					}
				}
			}
			if (Object.entries(_toCache).length > 0)
				_setUsers({ ..._users, ..._toCache });
			setChatChannels(_chatChannels);
		}
	}, [channelUpdates]);
	async function fetch_old_messages() {
		if (!oldestMsgTimestamp) return;
		const _query = query(
			collection(
				_dbRef,
				"messages/" + chatChannels[user_id].channel_id + "/safechats"
			),
			where("date", "<", oldestMsgTimestamp),
			limit(5),
			orderBy("date", "desc")
		);
		const _oldChats = await getDocs(_query);
		if (_oldChats.empty) return setOldestMsgTimestamp(null);
		let _chats = [...messages];
		for (let i = 0; i < _oldChats.docs.length; i++) {
			const _chat = _oldChats.docs[i].data();
			_chats.push(
				await decrypt_message({ ..._chat, _id: _oldChats.docs[i].id })
			);
			if (i == _oldChats.docs.length - 1)
				setOldestMsgTimestamp(_oldChats.docs.length >= 5 ? _chat.date : null);
		}
		console.log(
			"old messages",
			_oldChats.docs.map((a) => a.data())
		);
		setMessages(_chats);
	}
	async function fetch_new_messages() {
		if (!latestMsgTimestamp) return;
		const _query = query(
			collection(
				_dbRef,
				"messages/" + chatChannels[user_id].channel_id + "/safechats"
			),
			where("date", ">", latestMsgTimestamp),
			orderBy("date", "desc")
		);
		const _newChats = await getDocs(_query);
		if (_newChats.empty) return; // unlikely...
		let _chats = [...messages];
		for (let i = 0; i < _newChats.docs.length; i++) {
			const _chat = _newChats.docs[i].data();
			_chats.unshift(
				await decrypt_message({ ..._chat, _id: _newChats.docs[i].id })
			);
			if (i == 0 && messages.length == 0) setOldestMsgTimestamp(_chat.date);
			else if (i == _newChats.docs.length - 1)
				setLatestMsgTimestamp(_chat.date);
		}
		console.log(
			"new messages",
			_newChats.docs.map((a) => a.data())
		);
		preload_message_batch(
			_newChats.docs
				.map((d) => d.data())
				.filter((chat) => chat["post_id"])
				.map((chat) => chat["post_id"])
		);
		setMessages(_chats);
	}
	const [channelReads, setChannelReads] = useState({}); // hold latest opened/read timestamp for each channel
	useEffect(() => {
		if (Object.entries(channelReads).length > 0)
			localStorage.setItem("channel_reads", JSON.stringify(channelReads));
	}, [channelReads]);
	var keyCache = {}; // counter race conditions of sloppy effect hook
	useEffect(async () => {
		// fetch public keys of each buddy for the current user
		if (_user && Object.entries(buddyList).length === 0 && _users) {
			let buddies = [..._user.buddies] || [];
			Object.entries(_users)
				.filter((u) => Array.from(u[1].buddies).includes(_user.user_id))
				.forEach((u) => buddies.push(u[0]));
			let result = { ...buddyList }; // each successful iteration will append to this object
			// loop through each of the user's buddies
			// to find their corresponding public key from firestore
			for (let b = 0; b < buddies.length; b++) {
				const buddyID = buddies[b];
				// can only message buddies with mutual friendships
				if (
					!_users[buddyID] ||
					!Array.from(_users[buddyID].buddies).includes(_user.user_id) ||
					buddyList[buddyID] ||
					keyCache[buddyID]
				)
					continue;
				const buddyRef = doc(_dbRef, "pkeys", buddyID);
				let snap = await getDoc(buddyRef);
				if (snap.exists()) {
					let pkey = snap.data().key;
					result[buddyID] = keyCache[buddyID] = {
						available: true,
						public_key: pkey,
					};
					console.log("fetched key " + buddyID);
				} else {
					result[buddyID] = {
						available: false, // show greyed out in buddy list
					};
				}
			}
			setBuddyList(result);
			console.log("result", result);
		}
	}, [_user, _users]);
	// batch fetch forwarded posts from messages
	async function preload_message_batch(postIDs) {
		let _posts = {};
		for (let p = 0; p < postIDs.length; p++) {
			const _id = postIDs[p];
			if (!cachedPosts[_id] && !_posts[_id]) {
				const _doc = doc(_dbRef, "posts/" + _id);
				const _snap = await getDoc(_doc);
				if (_snap.exists()) {
					console.log("preloaded post " + _id);
					let _data = _snap.data();
					_posts[_id] = _data;
				}
			}
			if (p == postIDs.length - 1) {
				const result = { ...cachedPosts, ..._posts };
				setCachedPosts(result);
				localStorage.setItem("post_cache", JSON.stringify(result));
			}
		}
	}
	useEffect(async () => {
		if (
			!user_id ||
			!chatChannels[user_id] ||
			(messages.length > 0 &&
				![messages[0].author, messages[0].recipient].includes(user_id))
		) {
			setMessages([]);
			setLatestMsgTimestamp(null);
		}
		// only fetch channel messages when user's private key and channel id is ready
		if (
			_user &&
			user_id &&
			privateKey &&
			chatChannels[user_id] &&
			(!latestMsgTimestamp ||
				messages.length == 0 ||
				messages[0].channel_id !== chatChannels[user_id].channel_id)
		) {
			console.log("getting msgs", chatChannels[user_id].channel_id);
			// fetch message history (if any) of selected channel (if any)
			const _chatsRef = collection(
				_dbRef,
				"messages",
				chatChannels[user_id].channel_id,
				"safechats"
			); // nest of messages
			const _chatsQuery = query(_chatsRef, limit(5), orderBy("date", "desc")); // add batch loading later on....
			const chats = await getDocs(_chatsQuery);
			let chats_data = [];
			// chats.docs.forEach((d) =>
			// 	decrypt_message(d.data()).then((msg) => chats_data.push(msg))
			// );
			if (chats.docs.length === 0 && chatChannels[user_id]) {
				setMessages([]);
				return setChannelReads({
					...channelReads,
					[chatChannels[user_id].channel_id]: new Date(
						chatChannels[user_id].activity_date.seconds * 1000
					),
				});
			}
			for (let i = 0; i < chats.docs.length; i++) {
				const _data = chats.docs[i].data();
				const message = await decrypt_message({
					..._data,
					_id: chats.docs[i].id,
				});
				chats_data.push(message);
				if (i == chats.docs.length - 1) {
					setMessages(chats_data);
					preload_message_batch(
						Object.values(chats_data)
							.filter((c) => c.post_id)
							.map((c) => c.post_id)
					);
					if (chats.docs.length >= 5) setOldestMsgTimestamp(message.date);
					setLatestMsgTimestamp(chatChannels[user_id].activity_date);
					setChannelReads({
						...channelReads,
						[chatChannels[user_id].channel_id]: new Date(
							chatChannels[user_id].activity_date.seconds * 1000
						),
					});
					console.log("messages", chats_data);
				}
			}
		}
	}, [_user, user_id, privateKey, chatChannels]);

	// read base64 keypair from localstorage into component state
	useEffect(() => {
		let private_key = localStorage.getItem("privateKey");
		let public_key = localStorage.getItem("publicKey");
		if (private_key) setPrivatePEM(private_key);
		if (public_key) setPublicPEM(public_key);

		// load read timestamps for each message channel from local cache
		let channel_reads = localStorage.getItem("channel_reads");
		if (channel_reads) setChannelReads(JSON.parse(channel_reads));

		let forward_post = localStorage.getItem("forward_post");
		if (forward_post) {
			localStorage.removeItem("forward_post");
			console.log(JSON.parse(forward_post));
			setInsecureMode(true);
			setForwardedPost(JSON.parse(forward_post));
		}

		let posts = localStorage.getItem("post_cache");
		if (posts) {
			posts = JSON.parse(posts);
			setCachedPosts(posts);
		}
	}, []);
	// convert base64 private key into crypto object
	useEffect(async () => {
		if (privatePEM && !privateKey) {
			// import private key for first time
			let privKey = await window.crypto.subtle.importKey(
				"pkcs8",
				// from base64 to binary string to array buffer
				str2ab(window.atob(privatePEM)),
				{
					name: "RSA-OAEP",
					hash: "SHA-256",
				},
				true,
				["decrypt"]
			);
			setPrivateKey(privKey);
			console.log("Generated private key!");
		}
	}, [privatePEM, privateKey]);
	// convert base64 public key into crypto object
	useEffect(async () => {
		if (publicPEM && !publicKey) {
			// import public key for first time
			let pubKey = await window.crypto.subtle.importKey(
				"spki",
				// from base64 to binary string to array buffer
				str2ab(window.atob(publicPEM)),
				{
					name: "RSA-OAEP",
					hash: "SHA-256",
				},
				true,
				["encrypt"]
			);
			setPublicKey(pubKey);
			console.log("Generated public key!");
		}
	}, [publicPEM, publicKey]);

	const decoder = new TextDecoder();
	// use private key crypto object to decrypt ciphertext
	// then return document data in plaintext
	async function decrypt_message(message) {
		if (message.encrypted == false) {
			message.plain = true;
			return message;
		}
		if (
			!privateKey ||
			(message.author === _user.user_id && !message.content_back)
		) {
			message.encrypted = true;
			return message;
		}
		let content = [
			window.atob(
				message.author === _user.user_id
					? message.content_back
					: message.content
			),
		];
		try {
			content = await window.crypto.subtle.decrypt(
				{ name: "RSA-OAEP" },
				privateKey,
				str2ab(content[0])
			);
			content = decoder.decode(content);
			message.content = content;
			message.encrypted = false;
			return message;
		} catch (e) {
			console.log("error", e);
			message.encrypted = true;
			return message;
		}
	}

	const [messages, setMessages] = useState([]); // hold array of messages for selected channel
	const [text, setText] = useState(""); // hold input field value in plaintext for encryption

	async function send_msg(e) {
		e.preventDefault();
		const content = text.trim();
		if (content === "" && !forwardedPost) return;

		let msg_date = new Date();
		setLatestMsgTimestamp(Timestamp.fromDate(msg_date));

		let final_content; // request body
		// convert the recipient's public key string to the necessary crypto object format
		if (!insecureMode) {
			const r_keyContent = buddyList[user_id].public_key; // base64 string
			const r_binaryString = [window.atob(r_keyContent)]; // to binary string
			const r_binaryAB = str2ab(r_binaryString[0]); // to array buffer
			let _publicKey = null;
			try {
				_publicKey = await window.crypto.subtle.importKey(
					"spki",
					r_binaryAB,
					{
						name: "RSA-OAEP",
						hash: "SHA-256",
					},
					true,
					["encrypt"]
				);
			} catch (e) {
				console.log("error occured", e);
				return;
			}
			let encoded_content = new TextEncoder().encode(content);
			// ciphertext for recipient (encrypt plaintext with buddy's public key)
			let r_secure_content = await window.crypto.subtle.encrypt(
				{ name: "RSA-OAEP" },
				_publicKey, // recipient's public key
				encoded_content
			);
			// ciphertext for author readback (encrypt same plaintext with user's public key...)
			let a_secure_content = await window.crypto.subtle.encrypt(
				{ name: "RSA-OAEP" },
				publicKey, // author's public key
				encoded_content
			);
			final_content = [ab2str(r_secure_content), ab2str(a_secure_content)];
		} else final_content = content;

		// before sending message, check for existing message channel
		let channel_id = null; // hold reference id for placement of subcollection
		if (!chatChannels[user_id]) {
			const _query = query(
				collection(_dbRef, "messages"),
				limit(1),
				where("users", "==", [_user.user_id, user_id].sort())
			);
			const channels = await getDocs(_query);
			if (channels.empty) {
				console.log("Creating new message channel...");
				const _channel = doc(collection(_dbRef, "messages"));
				await setDoc(_channel, {
					users: [_user.user_id, user_id].sort(), // uniform sorting for single array clause
					activity_date: Timestamp.fromDate(msg_date),
				});
				channel_id = _channel.id; // new message will go in new channel
			}
		} else {
			console.log("Appending to existing message channel...");
			channel_id = chatChannels[user_id].channel_id;
			const channelDoc = doc(_dbRef, "messages/" + channel_id);
			updateDoc(channelDoc, {
				activity_date: Timestamp.fromDate(msg_date),
			});
		}

		const _chatsRef = collection(_dbRef, "messages", channel_id, "safechats"); // nest of messages
		const _newChat = doc(_chatsRef);

		if (!insecureMode) {
			await setDoc(_newChat, {
				// now convert array buffer to base64 encoding
				content: window.btoa(final_content[0]),
				content_back: window.btoa(final_content[1]),
				post_id: forwardedPost ? forwardedPost._id : null,
				channel_id,
				encrypted: true,
				author: _user.user_id,
				recipient: user_id,
				date: msg_date,
			});
		} else {
			await setDoc(_newChat, {
				// now convert array buffer to base64 encoding
				content: final_content,
				channel_id,
				post_id: forwardedPost ? forwardedPost._id : null,
				encrypted: false,
				author: _user.user_id,
				recipient: user_id,
				date: msg_date,
			});
		}

		let msgs = [...messages];
		msgs.unshift({
			content: content,
			author: _user.user_id,
			post_id: forwardedPost ? forwardedPost._id : undefined,
			date: msg_date,
			plain: insecureMode,
		});
		setForwardedPost(null);
		setMessages(msgs);
		setText("");
	}
	// delete all chats within current message channel
	async function purge_channel() {
		if (!deletingChannel) return setDeletingChannel(true); // conditionally render confirmation modal
		if (!chatChannels[user_id]) return; // weird edge case, unlikely
		const chatsQuery = query(
			collection(
				_dbRef,
				"messages",
				chatChannels[user_id].channel_id,
				"safechats"
			)
		);
		const chats = await getDocs(chatsQuery);
		for (let i = 0; i < chats.docs.length; i++) {
			const chat = chats.docs[i];
			await deleteDoc(chat.ref);
		}
		const channelRef = doc(
			_dbRef,
			"messages",
			chatChannels[user_id].channel_id
		);
		await deleteDoc(channelRef);

		setMessages([]);
		setOldestMsgTimestamp(null);
		setDeletingChannel(false);
	}
	async function genkeys() {
		let keys = await generateKeys();
		console.log("keys", keys);
		const _doc = doc(_dbRef, "pkeys", _user.user_id);
		await setDoc(_doc, {
			key: keys.public,
			date: serverTimestamp(),
		});
		localStorage.setItem("publicKey", keys.public); // store publicly && locally
		localStorage.setItem("privateKey", keys.private); // only store locally
		setPrivatePEM(keys.private);
		setPublicPEM(keys.public);
	}
	async function regen_keys() {
		if (!regenerating) return setRegenerating(true); // conditionally render modal
		setPrivateKey(null);
		setPublicKey(null);
		await genkeys();
		setRegenerating(false);
	}
	function render_activity_date(timestamp) {
		let seconds = Math.round(
			(
				Timestamp.now() -
				new Timestamp(timestamp.seconds, timestamp.nanoseconds)
			).toFixed(1)
		);
		if (seconds < 60) return "Just Now";
		let hours = Math.round(seconds / 60 / 60);
		if (hours >= 1 && hours < 24) return `${hours}h ago`;
		else if (hours >= 24) return `${Math.round(hours / 24)}d ago`;
		else return `${Math.round(seconds / 60)}m ago`;
	}
	return (
		<div className="homeWrapper" style={{ height: "calc(100vh - 80px)" }}>
			{securing && (
				<>
					<div id="postActionModal">
						<p className="repHead">Secure Chat feature</p>
						<div className="repBody">
							<img src="/e2ee.svg" />
							<p>
								This channel is eligible for E2E encryption.
								<br />
								<Link
									to="/#faq"
									style={{ marginBottom: "15px" }}
									onClick={() => localStorage.setItem("faq_jump", "#chats")}
								>
									Learn more.
								</Link>
							</p>
							{!insecureMode && (
								<button
									onClick={() => {
										setSecuring(false);
										setInsecureMode(true);
									}}
								>
									<i className="fas fa-times" /> Disable Encryption
								</button>
							)}
							{insecureMode && (
								<button
									className="main"
									onClick={() => {
										setSecuring(false);
										setInsecureMode(false);
									}}
									style={{ color: "#0f0" }}
								>
									<i className="fas fa-lock" /> Encrypt My Chats
								</button>
							)}
						</div>
					</div>
					<div
						className="postActionScreen"
						onClick={() => setSecuring(false)}
					></div>
				</>
			)}
			{deletingChannel && (
				<>
					<div id="postActionModal">
						<p className="repHead">Channel Deletion</p>
						<div className="repBody">
							<p style={{ marginBottom: "10px" }}>
								Erase all messages between you and{" "}
								<b>@{_users[user_id] && _users[user_id].username}</b>?{" "}
								<u>They can message you again as your buddy.</u>
							</p>
							<button onClick={() => setDeletingChannel(false)}>
								<i className="fas fa-times" /> Cancel
							</button>
							<button className="main deleteAcc" onClick={purge_channel}>
								Delete
							</button>
						</div>
					</div>
					<div
						className="postActionScreen"
						onClick={() => setDeletingChannel(false)}
					></div>
				</>
			)}
			{regenerating && (
				<>
					<div id="postActionModal">
						<p className="repHead">Key Renewal</p>
						<div className="repBody">
							<p style={{ marginBottom: "10px" }}>
								Overwrite your existing asymmetric keys?
								<br />
								<u>Previous messages will fail to decrypt for you.</u>
							</p>
							<img src="/keygen.svg" />
							<button onClick={() => setRegenerating(false)}>
								<i className="fas fa-times" /> Cancel
							</button>
							<button className="main" onClick={regen_keys}>
								<i className="fas fa-cog" /> Renew
							</button>
						</div>
					</div>
					<div
						className="postActionScreen"
						onClick={() => setRegenerating(false)}
					></div>
				</>
			)}
			<div
				id="home"
				className="clamper"
				style={{ alignItems: "center", marginBottom: 0 }}
			>
				{nudging && (
					<UserList
						users={Object.values(_user.buddies).filter(
							(buddy) => !Object.keys(chatChannels).includes(buddy)
						)}
						open
						chat
						onClose={() => setNudging(false)}
						onSelect={(buddy_id) => {
							document.body.style.overflow = null;
							navigate("/chats/" + buddy_id);
							setNudging(false);
						}}
					/>
				)}
				{/* <p style={{ color: "#fff", opacity: 0.7, margin: 0 }}>
					old{" "}
					{oldestMsgTimestamp &&
						new Date(oldestMsgTimestamp.seconds * 1000).toLocaleString()}
					new{" "}
					{latestMsgTimestamp &&
						new Date(latestMsgTimestamp.seconds * 1000).toLocaleString()}
				</p> */}
				{_user && (
					<div id="chatscontainer">
						<div className="buddies">
							{_user &&
								Object.values(_user.buddies)
									.filter((b) => _users[b] && !chatChannels[b])
									.map((buddy_id) => {
										return (
											<div
												className="buddy"
												key={buddy_id}
												onClick={() => navigate("/chats/" + buddy_id)}
												active={user_id === buddy_id ? "true" : "false"}
											>
												<img
													src={_users[buddy_id].pfp}
													style={{
														opacity:
															!buddyList[buddy_id] ||
															!buddyList[buddy_id].available
																? "0.5"
																: null,
													}}
												/>
												<p className="username">
													{_users[buddy_id].username}
													<br />
													{!Array.from(_users[buddy_id].buddies).includes(
														_user.user_id
													) && (
														<small style={{ opacity: 0.5 }}>
															<i>Pending</i>
														</small>
													)}
												</p>
											</div>
										);
									})}
							{_user &&
								Object.entries(chatChannels).map((channel, index) => {
									return (
										<div
											className="buddy"
											key={index}
											onClick={() => navigate("/chats/" + channel[0])}
											active={user_id === channel[0] ? "true" : "false"}
										>
											{user_id !== channel[0] &&
												(!channelReads[channel[1].channel_id] ||
													new Date(channelReads[channel[1].channel_id]) <
														new Date(
															channel[1].activity_date.seconds * 1000
														)) && (
													<span className="hint">
														<i className="fas fa-comment" />
													</span>
												)}
											<img
												src={
													_users[channel[0]]
														? _users[channel[0]].pfp
														: "/default_user.png"
												}
											/>
											<p className="username">
												{_users[channel[0]] && _users[channel[0]].username}
												<br />
												<span>
													<i className="fas fa-bell" />{" "}
													{render_activity_date(channel[1].activity_date)}
												</span>
											</p>
										</div>
									);
								})}
							{user_id &&
								!chatChannels[user_id] &&
								_users[user_id] &&
								!Array.from(_user.buddies).includes(user_id) && (
									<div
										className="buddy"
										onClick={() => navigate("/chats/" + user_id)}
										active="true"
									>
										<img
											src={_users[user_id].pfp}
											style={{
												borderRadius: 0,
												filter:
													!buddyList[user_id] || !buddyList[user_id].available
														? "grayscale(1)"
														: null,
											}}
										/>
										<span className="username">
											@{_users[user_id].username}
										</span>
									</div>
								)}
							<button className="add" onClick={() => setNudging(true)}>
								{_user &&
									Array.from(_user.buddies).length > 0 &&
									((Object.entries(chatChannels).length === 0 && !user_id) ||
										(user_id &&
											!buddyList[user_id] &&
											!chatChannels[user_id])) && (
										<span className="hint">Buddies</span>
									)}
								<i className="fas fa-user-friends" />
							</button>
						</div>
						<div className="chatNest">
							<div className="chatbox">
								<div className="chats">
									{!user_id && privateKey && (
										<div className="tip direction">
											<p>Choose a buddy to chat with</p>
										</div>
									)}
									{user_id &&
										!buddyList[user_id] &&
										privateKey &&
										!chatChannels[user_id] && (
											<div className="tip">
												<p>
													<Link to={"/u/" + user_id}>
														@{_users[user_id] && _users[user_id].username}
													</Link>{" "}
													must message you first or add you back.
												</p>
											</div>
										)}
									{user_id &&
										(!buddyList[user_id] || !buddyList[user_id].available) &&
										((_users[user_id] &&
											_users[user_id].buddies.includes(_user.user_id)) ||
											chatChannels[user_id]) &&
										privateKey &&
										!insecureMode && (
											<div className="tip">
												<p>
													<Link to={"/u/" + user_id}>
														@{_users[user_id] && _users[user_id].username}
													</Link>{" "}
													has not shared an encryption key.
												</p>
												{_users[user_id] && (
													<button
														className="crypto"
														onClick={() => setInsecureMode(true)}
													>
														<i className="fas fa-lock-open" /> Send a plain
														chat?
													</button>
												)}
											</div>
										)}
									{((buddyList[user_id] &&
										buddyList[user_id].available &&
										!insecureMode) ||
										(insecureMode &&
											user_id &&
											_users[user_id] &&
											_users[user_id].buddies.includes(_user.user_id))) &&
										messages.length == 0 &&
										!forwardedPost && (
											<div className="tip">
												<p style={{ opacity: 0.5 }}>
													🗣️ Start the conversation...
												</p>
											</div>
										)}
									{!privateKey && (
										<div className="tip">
											<p>
												You must generate <span>crypto keys</span> to use secure
												chats!
											</p>
											<button onClick={genkeys} className="crypto">
												<i className="fas fa-key" /> Generate Keys
											</button>
										</div>
									)}
									{forwardedPost && (
										<div
											className="message"
											self="true"
											preview="true"
											style={{ padding: 10 }}
										>
											<a href="#" onClick={send_msg}>
												<i>
													Click to send @
													{_users[forwardedPost.user_id] &&
														_users[forwardedPost.user_id].username}
													's post
												</i>
											</a>
											<br></br>
											<br></br>
											<img
												src={forwardedPost.image_url}
												className="sharePreview"
											/>
										</div>
									)}
									{messages
										.sort((a, b) => (a.date.seconds > b.date.seconds ? -1 : 1))
										.map((msg, i) => {
											return (
												<div
													className="message"
													key={msg._id}
													self={msg.author === _user.user_id ? "true" : "false"}
													plain={msg.plain ? "true" : "false"}
												>
													{!msg.encrypted ? (
														msg.content
													) : (
														<i>[Encrypted message]</i>
													)}
													{msg.post_id && (
														<>
															<br />
															<Link to={"/post/" + msg.post_id}>
																<i className="fas fa-link" /> View{" "}
																{!cachedPosts[msg.post_id]
																	? "Shared"
																	: `@${
																			_users[
																				cachedPosts[msg.post_id].user_id
																			] &&
																			_users[cachedPosts[msg.post_id].user_id]
																				.username
																	  }'s`}{" "}
																Post
																{cachedPosts[msg.post_id] && (
																	<img
																		src={cachedPosts[msg.post_id].image_url}
																	/>
																)}
															</Link>
														</>
													)}
												</div>
											);
										})}
									{oldestMsgTimestamp && (
										<button className="timetravel" onClick={fetch_old_messages}>
											<i className="fas fa-cloud-download-alt"></i> Load older
											messages
										</button>
									)}
								</div>
								{user_id &&
									privateKey &&
									((!insecureMode &&
										buddyList[user_id] &&
										buddyList[user_id].available) ||
										(insecureMode &&
											(chatChannels[user_id] ||
												(_users[user_id] &&
													_users[user_id].buddies.includes(
														_user.user_id
													))))) && (
										<>
											{!insecureMode ? (
												<p className="status">
													<i
														className="fas fa-lock"
														style={{ color: "#0f0" }}
													/>{" "}
													<a
														href="#"
														onClick={() => setSecuring(true)}
														style={{ color: "#0f0" }}
													>
														Secure chats
													</a>{" "}
													between you and @{_users[user_id].username}
												</p>
											) : (
												<p className="status">
													{!forwardedPost ? (
														<>
															<i className="fas fa-lock-open" /> Plain chats are
															sent unencrypted
														</>
													) : (
														<>
															<i className="fas fa-lock-open" /> Sharing post
															with @
															{_users[user_id] && _users[user_id].username}{" "}
															<a
																href="#"
																onClick={() => setForwardedPost(null)}
															>
																Cancel
															</a>
														</>
													)}
													{buddyList[user_id] &&
														buddyList[user_id].available &&
														!forwardedPost && (
															<>
																{" "}
																<a
																	href="#"
																	onClick={() => setSecuring(true)}
																	style={{ color: "#0f0" }}
																>
																	Try Secure Chat
																</a>
															</>
														)}
												</p>
											)}
											<form className="textfield" onSubmit={send_msg}>
												<input
													type="text"
													placeholder={`Type your ${
														insecureMode ? "plain" : "secure"
													} chat message...`}
													value={text}
													onChange={(e) => setText(e.target.value)}
												/>
												<button>
													<i className="fas fa-paper-plane"></i>
												</button>
											</form>
										</>
									)}
							</div>
							<div className="chatOptions">
								{privatePEM && (
									<button className="crypto alt" onClick={regen_keys}>
										<i className="fas fa-sync-alt" /> Renew My Keys
									</button>
								)}
								{user_id && chatChannels[user_id] ? (
									<button className="crypto alt delete" onClick={purge_channel}>
										Delete Channel
									</button>
								) : (
									<span></span>
								)}
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
