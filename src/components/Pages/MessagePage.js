import { useContext, useEffect, useState } from "react";
import { MembersContext, UserContext } from "../Main/Contexts";
import "../Styles/Messaging.scss";
import { useParams } from "react-router";
import { Link, useNavigate } from "react-router-dom";
import { _dbRef } from "../Main/firebase";
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
	const { user_id } = useParams();
	const { _user, _setUser } = useContext(UserContext);
	const { _users, _setUsers } = useContext(MembersContext);

	const [nudging, setNudging] = useState(false); // toggle buddy selection modal for creating channel
	const [insecureMode, setInsecureMode] = useState(false); // toggle skipping message encryption
	const [buddyList, setBuddyList] = useState({});

	const [publicPEM, setPublicPEM] = useState(null); // base64 encryption key
	const [publicKey, setPublicKey] = useState(null); // holds cryptokey object for encryption operations
	const [privatePEM, setPrivatePEM] = useState(null); // base64 decryption key
	const [privateKey, setPrivateKey] = useState(null); // holds cryptokey object for decryption operations

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
		setMessages(_chats);
	}
	const [channelReads, setChannelReads] = useState({}); // hold latest opened/read timestamp for each channel
	useEffect(() => {
		if (Object.entries(channelReads).length > 0)
			localStorage.setItem("channel_reads", JSON.stringify(channelReads));
	}, [channelReads]);
	useEffect(async () => {
		// fetch public keys of each buddy for the current user
		if (_user && Object.entries(buddyList).length === 0) {
			let buddies = _user.buddies;
			let result = {}; // each succesful iteration will append to this object
			// loop through each of the user's buddies
			// to find their corresponding public key from firestore
			for (let b = 0; b < buddies.length; b++) {
				const buddyID = buddies[b];
				// can only message buddies with mutual friendships
				if (
					!_users[buddyID] ||
					!Array.from(_users[buddyID].buddies).includes(_user.user_id)
				)
					continue;
				const buddyRef = doc(_dbRef, "pkeys", buddyID);
				let snap = await getDoc(buddyRef);
				if (snap.exists()) {
					let pkey = snap.data().key;
					result[buddyID] = {
						available: true,
						public_key: pkey,
					};
				} else {
					result[buddyID] = {
						available: false, // show greyed out in buddy list
					};
				}
			}
			setBuddyList(result);
			console.log("result", result);
		}
	}, [_user]);
	useEffect(async () => {
		if (!user_id || !chatChannels[user_id]) {
			setMessages([]);
			setLatestMsgTimestamp(null);
		}
		// only fetch channel messages when user's private key and channel id is ready
		if (
			_user &&
			user_id &&
			privateKey &&
			chatChannels[user_id] &&
			!latestMsgTimestamp
		) {
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
		if (content === "") return;

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
				encrypted: true,
				author: _user.user_id,
				recipient: user_id,
				date: msg_date,
			});
		} else {
			await setDoc(_newChat, {
				// now convert array buffer to base64 encoding
				content: final_content,
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
			date: msg_date,
			plain: insecureMode,
		});
		setMessages(msgs);
		setText("");
	}
	// delete all chats within current message channel
	async function purge_channel() {
		if (
			!window.confirm(
				`This will delete ALL messages between you and @${_users[user_id].username}. Continue?`
			)
		)
			return;
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
		setMessages([]);
		setOldestMsgTimestamp(null);
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
		if (
			!window.confirm(
				`This will overwrite your existing crypto keys.\n` +
					`Previous messages will become indecipherable on this device. Continue?`
			)
		)
			return;
		setPrivateKey(null);
		setPublicKey(null);
		await genkeys();
	}
	return (
		<div className="homeWrapper" style={{ height: "100vh" }}>
			<div
				id="home"
				className="clamper"
				style={{ alignItems: "center", marginBottom: 0 }}
			>
				{nudging && (
					<UserList
						users={Object.values(_user.buddies).filter(
							(buddy) =>
								!Object.keys(chatChannels)
									.map((channel_buddy) => channel_buddy)
									.includes(buddy)
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
											<span className="username">
												@{_users[channel[0]] && _users[channel[0]].username}
											</span>
										</div>
									);
								})}
							{user_id && !chatChannels[user_id] && (
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
										@{_users[user_id] && _users[user_id].username}
									</span>
								</div>
							)}
							<button className="add" onClick={() => setNudging(true)}>
								{_user &&
									Array.from(_user.buddies).length > 0 &&
									((Object.entries(chatChannels).length === 0 && !user_id) ||
										(user_id && !buddyList[user_id])) && (
										<span className="hint">My Buddies</span>
									)}
								<i className="fas fa-plus" />
							</button>
						</div>
						<div className="chatNest">
							<div className="chatbox">
								<div className="chats">
									{!user_id && privateKey && (
										<div className="tip direction">
											Choose a buddy to chat with
										</div>
									)}
									{user_id && !buddyList[user_id] && (
										<div className="tip">
											<Link to={"/u/" + user_id}>
												@{_users[user_id].username}
											</Link>{" "}
											must add you as a buddy.
										</div>
									)}
									{user_id &&
										buddyList[user_id] &&
										!buddyList[user_id].available &&
										privateKey &&
										!insecureMode && (
											<div className="tip">
												<p>
													<Link to={"/u/" + user_id}>
														@{_users[user_id].username}
													</Link>{" "}
													does not have an encryption key.
												</p>
												<button
													className="crypto"
													onClick={() => setInsecureMode(true)}
												>
													<i className="fas fa-lock-open" /> Send a plain chat?
												</button>
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
										insecureMode) && (
										<>
											{!insecureMode ? (
												<p className="status">
													<i className="fas fa-lock" /> Secure chats are
													encrypted between you and {_users[user_id].username}.
												</p>
											) : (
												<p className="status">
													<i className="fas fa-lock-open" /> Plain chats are
													sent unencrypted.{" "}
													{buddyList[user_id] &&
														buddyList[user_id].available && (
															<a
																href="#"
																onClick={() => setInsecureMode(false)}
															>
																Try Secure Chat
															</a>
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
										<i className="fas fa-key" /> Regenerate My Keys
									</button>
								)}
								{user_id && chatChannels[user_id] && messages.length > 0 ? (
									<button className="crypto alt" onClick={purge_channel}>
										<i className="fas fa-fire" /> Purge Channel
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
