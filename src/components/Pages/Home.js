import MediaFeed from "../Media/MediaFeed";
import Scroller from "../Scroller";
import Submitter from "../Media/Submitter";
import { Timestamp, addDoc, collection, doc, setDoc } from 'firebase/firestore'
import { useAuth, _dbRef } from "../Main/firebase";
import { useContext } from "react";
import { showLogin, UserContext } from "../Main/Contexts";
import { useNavigate } from "react-router-dom";
function Home() {
	const navigate = useNavigate();
	const { _user, _setUser } = useContext(UserContext);
	const { _showLogin, setLogin } = useContext(showLogin);
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
				<MediaFeed />
			</div>
		</div>
	);
}
export default Home;