import MediaFeed from "../Media/MediaFeed";
import Scroller from "../Scroller";
import Submitter from "../Media/Submitter";
import {
	Timestamp,
	addDoc,
	collection,
	doc,
	setDoc,
	getDoc,
} from "firebase/firestore";
import { useAuth, _dbRef } from "../Main/firebase";
import { useContext, useEffect, useState } from "react";
import { MembersContext, showLogin, UserContext } from "../Main/Contexts";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import MediaActions from "../Media/MediaActions";
function Home() {
	const navigate = useNavigate();
	const { _user, _setUser } = useContext(UserContext);
	const { _users, _setUsers } = useContext(MembersContext);
	const { _showLogin, setLogin } = useContext(showLogin);
	const [suggestions, setSuggestions] = useState([]);

	const [cache, setCache] = useState([]);

	const [focusPost, setFocusPost] = useState(null);
	useEffect(() => {
		document.body.style.overflow = focusPost !== null ? "hidden" : null;
	}, [focusPost]);
	async function check_cache() {
		var _toCache = {};
		for (let i = 0; i < cache.length; i++) {
			const user_id = cache[i];
			if (_user.user_id === user_id || _users[user_id]) continue;
			const userRef = doc(_dbRef, "users", user_id);
			console.log("GOOGLED QUERY");
			const _doc = await getDoc(userRef);
			if (_doc.exists()) {
				var _json = { user_id: _doc.id, ..._doc.data() };
				_toCache[user_id] = _json;
				console.log("ADDED to cache (user suggestion)", _json);
			}
		}
		if (Object.entries(_toCache).length > 0)
			_setUsers({ ..._users, ..._toCache });
	}
	useEffect(() => {
		if (Object.entries(cache).length > 0) {
			check_cache();
		}
	}, [cache]);
	useEffect(() => {
		if (!_user) return;
		const buddies = _user.buddies;

		var suggs = {};

		var toCache = [];
		for (let i = 0; i < buddies.length; i++) {
			const buddy = _users[buddies[i]]; // buddy as a User object
			if (!buddy) return;
			const friends2 = buddy.buddies; // array of user IDs

			for (let b = 0; b < friends2.length; b++) {
				const buddyBuddy = _users[friends2[b]]; // get User object with ID
				if (!buddyBuddy) {
					toCache.push(friends2[b]); // with user id -> pull profile data from firebase
					continue;
				}
				if (
					!buddies.includes(buddyBuddy.user_id) &&
					buddyBuddy.user_id !== _user.user_id &&
					buddy.buddies.includes(_user.user_id)
				)
					// suggs.push(buddyBuddy.user_id); // suggest user added by a mutual buddy
					if (!suggs[buddyBuddy.user_id]) { 
						suggs[buddyBuddy.user_id] = { count: 1, id: buddyBuddy.user_id };
					}
					else suggs[buddyBuddy.user_id].count += 1;
			}
			console.log("miraaAA", suggs);
			setCache(toCache);
			setSuggestions(suggs);
		}
	}, [_users, _user]);
	async function postMessage(_content, imgFunc = null) {
		try {
			// now post!
			const docRef = await addDoc(collection(_dbRef, "posts"), {
				content: _content,
				date: Timestamp.now(),
				image_url: "",
				//smiles: [],
				user_id: _user.user_id,
			});
			//'users/' + props.author + '/smiles/' + _postID
			await setDoc(
				doc(_dbRef, "users/" + _user.user_id + "/smiles/" + docRef.id),
				{ smiles: [] }
			);
			console.log("Created post " + docRef.id);
			if (imgFunc !== null) {
				//start uploading user file, after we obtain the created post ID
				imgFunc(docRef.id);
			}
		} catch (e) {
			console.log(e);
		}
	}
	return (
		<div className="homeWrapper">
			{focusPost !== null && (
				<MediaActions focusPost={focusPost} setFocusPost={setFocusPost} />
			)}
			<div id="home" className="clamper">
				{_user ? (
					<Submitter onMessageSend={postMessage} />
				) : (
					<div className="submission guestBanner">
						<h2>Join the club to interact with posts and see comments</h2>
						<div className="authBtns">
							<button onClick={() => setLogin(true)}>Login</button>
							<button onClick={() => navigate("/")}>Signup</button>
						</div>
					</div>
				)}
				<div
					className="exploreBuddies"
					style={{
						display: Object.entries(suggestions).length > 0 ? null : "none",
					}}
				>
					<div
						className="bRelation"
						style={{
							overflowX: "scroll",
						}}
					>
						{suggestions && Object.values(suggestions).map((x, i) => (
							<Link
								to={"/profile/" + x.id}
								className="bCard"
								key={i}
							>
								<img src={_users[x.id].pfp} alt="user pic" />
								<p>{_users[x.id].username}</p>
								<small><i class="fas fa-user-friends"></i> <b>+{x.count}</b> connections</small>
							</Link>
						))}
					</div>
				</div>
				{(_user || localStorage.getItem("guest")) && (
					<MediaFeed setFocusPost={setFocusPost} />
				)}
			</div>
		</div>
	);
}
export default Home;