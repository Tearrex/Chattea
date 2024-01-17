import { useContext, useRef, useState, useEffect } from "react";
import { _dbRef, _storageRef, logout, useAuth } from "./firebase";
import { useNavigate } from "react-router";
import { MembersContext, UserContext } from "./Contexts";
import {
	collection,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	query,
	where,
} from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { deleteUser } from "firebase/auth";
function UserPanel(props) {
	const navigate = useNavigate();
	const currentUser = useAuth();
	const { _user, _setUser } = useContext(UserContext);
	const { _users, _setUsers } = useContext(MembersContext);
	const [pfp, setPfp] = useState("");
	const [user_id, setUserID] = useState("");
	const [show, setShow] = useState(false);
	const [openSettings, setOpenSettings] = useState(false);
	const [deleting, setDeleting] = useState(false);
	useEffect(() => {
		if (_user !== undefined) {
			setPfp(_user["pfp"]);
			setUserID(_user["user_id"]);
		} else setPfp(null);
	}, [_user]);
	const selfRef = useRef();
	async function logout_user() {
		/*if(_users[_user.user_id] === undefined)
        {
            // add the current user's data to the _users state
            // we make sure to save all of their edits,
            // so it will remain up to date
            _setUsers({..._users, _user});
        }*/
		/*var _localUsers = localStorage.getItem("users");
        if(_localUsers)
        {
            var count = Object.entries(JSON.parse(_localUsers)).length;
            localStorage.removeItem("users");
            console.log(`Cleared ${count} users from localStorage`);
            // alternatively, we can store a timestamp with the _users object
            // to determine when the client should refresh the cache with new data.
            // in case users have made changes to their profiles since the last snapshot
        }*/
		setShow(false);
		await logout();
		localStorage.removeItem("privateKey");
		localStorage.removeItem("publicKey");
		localStorage.removeItem("channel_reads");
		_setUser(undefined);
		navigate("/");
	}
	useEffect(() => {
		if (show) {
			selfRef.current.style.zIndex = null;
			selfRef.current.style.opacity = "1";
		} else selfRef.current.style.opacity = "0";
	}, [show]);
	function hide() {
		if (!show) selfRef.current.style.zIndex = "-5";
	}
	async function delete_account() {
		if (!deleting) return setDeleting(true);
		if (!window.confirm(`Delete your @${_user.username} account?`)) return;

		// start deleting public posts
		const _publicQuery = query(
			collection(_dbRef, "posts"),
			where("user_id", "==", _user.user_id)
		);
		const _publicDocs = await getDocs(_publicQuery);
		for (let i = 0; i < _publicDocs.docs.length; i++) {
			const post = _publicDocs.docs[i];

			// delete post image
			const imgRef = ref(
				_storageRef,
				"images/" + _user.user_id + "/" + post.id
			);
			try {
				await deleteObject(imgRef);
			} catch (e) {
				// ignore
			}

			// delete comments on post
			const _commentsQuery = query(
				collection(_dbRef, "posts/" + post.id + "/comments")
			);
			const _comments = await getDocs(_commentsQuery);
			for (let c = 0; c < _comments.docs.length; c++) {
				const comment = _comments.docs[c];
				await deleteDoc(comment.ref);
			}

			// delete smile records for post
			const smilesRef = doc(
				_dbRef,
				"users/" + _user.user_id + "/smiles/" + post.id
			);
			try {
				await deleteDoc(smilesRef);
			} catch (e) {
				// ignore
			}

			// finally, delete post
			await deleteDoc(post.ref);
		}
		// start deleting private posts
		const _privateQuery = query(
			collection(_dbRef, "users/" + _user.user_id + "/posts")
		);
		const _privateDocs = await getDocs(_privateQuery);
		for (let i = 0; i < _privateDocs.docs.length; i++) {
			const post = _privateDocs.docs[i];

			// delete post image
			const imgRef = ref(
				_storageRef,
				"images/" + _user.user_id + "/" + post.id
			);
			try {
				await deleteObject(imgRef);
			} catch (e) {
				// ignore
			}
			// delete comments on post
			const _commentsQuery = query(
				collection(_dbRef, "posts/" + post.id + "/comments")
			);
			const _comments = await getDocs(_commentsQuery);
			for (let c = 0; c < _comments.docs.length; c++) {
				const comment = _comments.docs[c];
				await deleteDoc(comment.ref);
			}

			// delete smile records for post
			const smilesRef = doc(
				_dbRef,
				"users/" + _user.user_id + "/smiles/" + post.id
			);
			try {
				await deleteDoc(smilesRef);
			} catch (e) {
				// ignore
			}

			// finally, delete post
			await deleteDoc(post.ref);
		}

		// start deleting user's secure chats
		const _keyDoc = doc(_dbRef, "pkeys/" + _user.user_id); // user's public key
		try {
			await deleteDoc(_keyDoc);
		} catch (e) {
			// ignore
		}
		const _channelsQuery = query(
			collection(_dbRef, "messages"),
			where("users", "array-contains", _user.user_id)
		);
		const _channels = await getDocs(_channelsQuery);
		for (let i = 0; i < _channels.docs.length; i++) {
			const channel = _channels.docs[i];
			// delete messages within channel
			const _chatsQuery = query(
				collection(_dbRef, "messages/" + channel.id + "/safechats")
			);
			const _chats = await getDocs(_chatsQuery);
			for (let i = 0; i < _chats.docs.length; i++) {
				const chat = _chats.docs[i];
				await deleteDoc(chat.ref);
			}
			// finally, delete the message channel
			await deleteDoc(channel.ref);
		}

		// now delete the user's profile
		const profileDoc = doc(_dbRef, "users/" + _user.user_id);
		await deleteDoc(profileDoc);

		// finally, delete authentication account
		await deleteUser(currentUser);
		_setUser(null);
		localStorage.removeItem("publicKey");
		localStorage.removeItem("privateKey");
		navigate("/");
	}
	return (
		<>
			{openSettings && (
				<>
					<div id="postActionModal">
						<p className="repHead">Chattea Settings</p>
						<div className="repBody">
							{/* <div className="setting">
								<label for="profanity">Profanity filter</label>
								<input type="checkbox" id="profanity" />
							</div> */}
							{deleting && (
								<>
									<p>
										You're about to delete yourself from Chattea, including:
									</p>
									<ul>
										<li>Your public/private posts</li>
										<li>Your secure chats</li>
										<li>Your user profile</li>
									</ul>
								</>
							)}
							{deleting && (
								<button onClick={() => setDeleting(false)}>
									<i className="fas fa-times" /> Cancel
								</button>
							)}
							<button className="deleteAcc" onClick={delete_account}>
								<i className="fas fa-user-slash" /> Delete Account
							</button>
						</div>
					</div>
					<div
						className="postActionScreen"
						onClick={() => setOpenSettings(false)}
					></div>
				</>
			)}
			<div
				ref={selfRef}
				className="welcome"
				id="welcome"
				style={{ zIndex: "-5", opacity: "0" }}
				onTransitionEnd={hide}
			>
				<div className="profile">
					{_user &&
						(_user.pfp == "/default_user.png" || _user.about === "") &&
						!window.location.href.endsWith("/u/" + _user.user_id) && (
							<span
								className="hint"
								onClick={() => navigate("/u/" + _user.user_id)}
							>
								🎨 Customize your profile
							</span>
						)}
					<img
						className="pfp"
						style={{ objectFit: "cover", cursor: "pointer" }}
						src={pfp}
						onLoad={(e) => setShow(true)}
						onClick={(e) => navigate("/u/" + user_id)}
						alt="profile pic"
					/>
					<div className="userOptions">
						<div className="mpContent">
							{/**verified === false ?
					<button className="verifyEmail"><span>📧</span>Verify</button>
				: null */}
							<button
								className="stealthBtn settings"
								onClick={() => setOpenSettings(true)}
							>
								<i className="fas fa-cog"></i> Settings
							</button>
							<button className="stealthBtn" onClick={() => navigate("/#faq")}>
								<i className="fas fa-question"></i> FAQ
							</button>
							<button className="logout stealthBtn" onClick={logout_user}>
								<i className="fas fa-sign-out-alt"></i> log out
							</button>
						</div>
					</div>
					{props.notifCount > 0 && (
						<button attention="true" onClick={props.notifEvent}>
							<i className="fas fa-bell"></i>
						</button>
					)}
					<button onClick={() => navigate("/chats")}>
						<i className="fas fa-comment"></i>
					</button>
				</div>
			</div>
		</>
	);
}
export default UserPanel;
