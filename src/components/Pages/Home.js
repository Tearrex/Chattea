import MediaFeed from "../Media/MediaFeed";
import Scroller from "../Scroller";
import Submitter from "../Media/Submitter";
import { Timestamp, addDoc, collection, doc, setDoc } from 'firebase/firestore'
import { useAuth, _dbRef } from "../Main/firebase";
import { useContext, useEffect, useState } from "react";
import { MembersContext, showLogin, UserContext } from "../Main/Contexts";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
function Home() {
	const navigate = useNavigate();
	const { _user, _setUser } = useContext(UserContext);
	const { _users, _setUsers } = useContext(MembersContext);
	const { _showLogin, setLogin } = useContext(showLogin);
	const [suggestions, setSuggestions] = useState([]);
	useEffect(() => {
		if (!_user) return;
		const buddies = _user.buddies;

		var suggs = [];
		for (let i = 0; i < buddies.length; i++) {
			const buddy = _users[buddies[i]];
			if (!buddy) return console.log("skipped buddy", buddies[i]);
			const friends2 = buddy.buddies;

			for (let b = 0; b < friends2.length; b++) {
				const buddyBuddy = _users[friends2[b]];
				if (
					!buddies.includes(buddyBuddy.user_id) &&
					buddyBuddy.user_id !== _user.user_id &&
					buddy.buddies.includes(_user.user_id)
				)
					suggs.push(buddyBuddy.user_id);
			}
			console.log(suggs);
			setSuggestions(suggs);
			// if bando and bando in buddy's list, suggest
		}
	}, [_users]);
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
				<div className="exploreBuddies">
					<p style={{ margin: 0 }} className="head">
						You might know:
					</p>
					<div
						className="bRelation"
						style={{
							overflowX: "scroll",
							margin: "0 20px",
						}}
					>
						{suggestions.map((x) => (
							<Link to={"/profile/" + _users[x].user_id} className="bCard">
								<img src={_users[x].pfp} alt="user pic" />
								<p>{_users[x].username}</p>
							</Link>
						))}
					</div>
				</div>
				<MediaFeed />
			</div>
		</div>
	);
}
export default Home;