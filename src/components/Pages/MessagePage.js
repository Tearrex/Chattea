import { useContext, useEffect, useState } from "react";
import { MembersContext, UserContext } from "../Main/Contexts";
import "../Styles/Messaging.scss";
import { useParams } from "react-router";
import { Link, useNavigate } from "react-router-dom";
import { _dbRef } from "../Main/firebase";
import {
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
	where,
} from "firebase/firestore";
import UserList from "../Buddies/UserList";

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
	const [buddyList, setBuddyList] = useState({});

	const [publicPEM, setPublicPEM] = useState(null); // base64 encryption key
	const [publicKey, setPublicKey] = useState(null); // holds cryptokey object for encryption operations
	const [privatePEM, setPrivatePEM] = useState(null); // base64 decryption key
	const [privateKey, setPrivateKey] = useState(null); // holds cryptokey object for decryption operations

	// lazy-load cache for referencing message channel ID's of each buddy for the current user
	const [chatChannels, setChatChannels] = useState({}); // { [buddy_id]: channel_id }
	useEffect(async () => {
		if (!user_id || !chatChannels[user_id]) setMessages([]);
		// fetch public keys of each buddy for the current user
		if (_user && Object.entries(buddyList).length === 0) {
			let buddies = _user.buddies;
			let result = {}; // each succesful iteration will append to this object
			// loop through each of the user's buddies
			// to find their corresponding public key from firestore
			for (let b = 0; b < buddies.length; b++) {
				const buddyID = buddies[b];
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
		// fetch list of message channel ID's that the current user appears in
		if (_user && Object.entries(chatChannels).length === 0) {
			const _channelsQuery = query(
				collection(_dbRef, "messages"),
				where("users", "array-contains", _user.user_id)
			);
			const channels = await getDocs(_channelsQuery);
			let _chatChannels = {};
			for (let i = 0; i < channels.docs.length; i++) {
				const channel = channels.docs[i];
				const buddy_id = Object.values(channel.data().users).find(
					(a) => a !== _user.user_id
				);
				_chatChannels[buddy_id] = channel.id;
			}
			setChatChannels(_chatChannels);
		}
		// only fetch messages when user's private key and buddy's public key is ready
		if (
			_user &&
			user_id &&
			privateKey &&
			buddyList[user_id] &&
			buddyList[user_id].available
		) {
			// fetch message history (if any) of selected channel (if any)
			let channel_id = null;
			if (!chatChannels[user_id]) {
				const _channelQuery = query(
					collection(_dbRef, "messages"),
					limit(1),
					where("users", "==", [_user.user_id, user_id].sort())
				);
				const channels = await getDocs(_channelQuery);
				if (channels.empty) return;
				channel_id = channels.docs[0].id;
				// write fresh data into state of temp cache
				let _chatChannels = { ...chatChannels };
				_chatChannels[user_id] = channel_id;
				setChatChannels(_chatChannels);
			} else channel_id = chatChannels[user_id];
			const _chatsRef = collection(_dbRef, "messages", channel_id, "safechats"); // nest of messages
			const _chatsQuery = query(_chatsRef, limit(5), orderBy("date", "desc")); // add batch loading later on....
			const chats = await getDocs(_chatsQuery);
			let chats_data = [];
			// chats.docs.forEach((d) =>
			// 	decrypt_message(d.data()).then((msg) => chats_data.push(msg))
			// );
			for (let i = 0; i < chats.docs.length; i++) {
				const message = chats.docs[i].data();
				decrypt_message(message).then((msg) => {
					chats_data.push(msg);
					if (i == chats.docs.length - 1) {
						setMessages(chats_data);
						console.log("messages", chats_data);
					}
				});
			}
		}
	}, [_user, user_id, privateKey]);

	// read base64 keypair from localstorage into component state
	useEffect(() => {
		let private_key = localStorage.getItem("privateKey");
		let public_key = localStorage.getItem("publicKey");
		if (private_key) setPrivatePEM(private_key);
		if (public_key) setPublicPEM(public_key);
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
	// use private key crypto object to decrypt ciphertext
	// then return document data in plaintext
	async function decrypt_message(message) {
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
			content = ab2str(content);
			message.content = content;
			return message;
		} catch (e) {
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
				});
				channel_id = _channel.id; // new message will go in new channel
			} else {
				console.log("Appending to existing message channel...");
				channel_id = channels.docs[0].id; // new message will go in existing channel
			}
			// write fresh data into state of temp cache
			let _chatChannels = { ...chatChannels };
			_chatChannels[user_id] = channel_id;
			setChatChannels(_chatChannels);
		} else channel_id = chatChannels[user_id];

		const _chatsRef = collection(_dbRef, "messages", channel_id, "safechats"); // nest of messages
		const _newChat = doc(_chatsRef);

		// convert the recipient's public key string to the necessary crypto object format
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
		console.log("key improted");
		let encoded_content = new TextEncoder().encode(content);
		console.log("encoded", encoded_content);
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

		let final_content = [ab2str(r_secure_content), ab2str(a_secure_content)];
		console.log("final", final_content);
		await setDoc(_newChat, {
			// now convert array buffer to base64 encoding
			content: window.btoa(final_content[0]),
			content_back: window.btoa(final_content[1]),
			author: _user.user_id,
			date: serverTimestamp(),
		});
		let msgs = messages;
		msgs.push({
			content: content,
			author: _user.user_id,
			date: new Date(),
		});
		setText("");
	}
	// delete all chats within current message channel
	async function purge_channel() {
		if (
			!window.confirm(
				`This will delete ALL messages between you and ${_users[user_id].username}. Continue?`
			)
		)
			return;
		if (!chatChannels[user_id]) return; // weird edge case, unlikely
		const chatsQuery = query(
			collection(_dbRef, "messages", chatChannels[user_id], "safechats")
		);
		const chats = await getDocs(chatsQuery);
		for (let i = 0; i < chats.docs.length; i++) {
			const chat = chats.docs[i];
			await deleteDoc(chat.ref);
		}
		setMessages([]);
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
							navigate("/chats/" + buddy_id);
							setNudging(false);
						}}
					/>
				)}
				<h2 style={{ color: "#fff", margin: 0 }}>
					Secure chats <small>BETA</small>
				</h2>
				<p style={{ color: "#fff", opacity: 0.7, margin: 0 }}>
					Only you and your intended recipient can decipher messages sent to
					each other over the Internet.{" "}
					<Link to="/#discretions">Learn more.</Link>
					<br />
					<br />
					<b>Switching devices will make chat history unrecoverable!</b>
				</p>
				<div id="chatscontainer">
					<div className="buddies">
						{_user &&
							Object.entries(chatChannels).map((channel, index) => {
								return (
									<div
										className="buddy"
										key={index}
										onClick={() => navigate("/chats/" + channel[0])}
									>
										<img
											src={_users[channel[0]].pfp}
											style={{
												borderRadius: user_id === channel[0] ? 0 : null,
											}}
										/>
									</div>
								);
							})}
						{buddyList[user_id] && !chatChannels[user_id] && (
							<div
								className="buddy"
								onClick={() => navigate("/chats/" + user_id)}
							>
								<img
									src={_users[user_id].pfp}
									style={{
										borderRadius: 0,
										filter: !buddyList[user_id].available
											? "grayscale(1)"
											: null,
									}}
								/>
							</div>
						)}
						<button className="add" onClick={() => setNudging(true)}>
							<i className="fas fa-plus" />
						</button>
					</div>
					<div className="chatbox">
						<div className="chats">
							{!user_id && privateKey && (
								<div className="tip">Choose a buddy to chat with</div>
							)}
							{user_id &&
								buddyList[user_id] &&
								!buddyList[user_id].available &&
								privateKey && (
									<div className="tip">
										<Link to={"/u/" + user_id}>
											@{_users[user_id].username}
										</Link>{" "}
										does not have a public key.
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
								.sort((a, b) => (a.date < b.date ? 1 : -1))
								.map((msg, i) => {
									return (
										<div
											className="message"
											self={msg.author === _user.user_id ? "true" : "false"}
										>
											{!msg.encrypted ? (
												msg.content
											) : (
												<i>[Encrypted message]</i>
											)}
										</div>
									);
								})}
						</div>
						{user_id &&
							privateKey &&
							(chatChannels[user_id] ||
								(buddyList[user_id] && buddyList[user_id].available)) && (
								<form className="textfield" onSubmit={send_msg}>
									<input
										type="text"
										placeholder={`Chat with ${
											_users[user_id] ? _users[user_id].username : "a user..."
										}`}
										value={text}
										onChange={(e) => setText(e.target.value)}
									/>
									<button>
										<i className="fas fa-paper-plane"></i>
									</button>
								</form>
							)}
					</div>
				</div>
				<div className="chatOptions">
					{privatePEM && (
						<button className="crypto alt" onClick={regen_keys}>
							<i className="fas fa-sync" /> Regenerate Keys
						</button>
					)}
					{messages.length > 0 ? (
						<button className="crypto alt" onClick={purge_channel}>
							<i className="fas fa-fire" /> Purge Channel
						</button>
					) : (
						<span></span>
					)}
				</div>
			</div>
		</div>
	);
}
