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
	query,
	orderBy,
	limit,
	getDocs,
} from "firebase/firestore";
import { useAuth, _dbRef } from "../Main/firebase";
import { useContext, useEffect, useState } from "react";
import { MembersContext, showLogin, UserContext } from "../Main/Contexts";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import MediaPost from "../Media/MediaPost";
import MediaActions from "../Media/MediaActions";
function Home(props) {
	const navigate = useNavigate();
	const { privateView } = props;
	const { _user, _setUser } = useContext(UserContext);
	const { _users, _setUsers } = useContext(MembersContext);
	const { _showLogin, setLogin } = useContext(showLogin);
	const [suggestions, setSuggestions] = useState([]);
	const [mutuals, setMutuals] = useState([]);

	const [posts, setPosts] = useState({});
	const [focusPost, setFocusPost] = useState(null);
	const [changeVisibility, setChangeVisibility] = useState(false);
	async function populate_buddies_page(buddies) {
		console.log("populating...");
		let _posts = {};
		let hops = 0;
		for (let u = 0; u < buddies.length; u++) {
			if (_posts.length >= 4 || hops >= 2) break;
			const buddy_id = buddies[u];
			const pageRef = collection(_dbRef, "users", buddy_id, "posts");
			const pageQuery = query(pageRef, orderBy("date", "desc"), limit(1));
			const _snap = await getDocs(pageQuery);
			if (!_snap.empty) {
				console.log("got post", _snap.docs[0].id);
				_posts[_snap.docs[0].id] = _snap.docs[0].data();
				hops = 0;
			} else hops++;
		}
		if (Object.entries(_posts).length > 0) setPosts({ ...posts, ..._posts });
	}
	async function check_cache(cache_list) {
		let _toCache = {};
		for (let i = 0; i < cache_list.length; i++) {
			const user_id = cache_list[i];
			if (_user.user_id === user_id || _users[user_id]) continue;
			const userRef = doc(_dbRef, "users", user_id);
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
		if (!_user) return;
		const buddies = _user.buddies;

		var suggs = {};
		var _mutuals = [];

		var toCache = [];
		// loop through all of user's buddies (user ids) to retrieve profiles (document data)
		for (let i = 0; i < buddies.length; i++) {
			const buddy = _users[buddies[i]]; // buddy as a User object
			if (!buddy) {
				toCache.push(buddies[i]);
				continue;
			}
			const friends2 = buddy.buddies; // now get the buddy's buddies

			if (friends2.includes(_user.user_id) && !_mutuals[buddies[i]])
				_mutuals.push(buddies[i]);
			for (let b = 0; b < friends2.length; b++) {
				const buddyBuddy = _users[friends2[b]]; // get User object with ID
				if (!buddyBuddy) {
					toCache.push(friends2[b]); // with user id -> pull profile data from firebase
					continue;
				}
				if (!buddyBuddy.user_id) {
					continue; // weird edge case
				}
				if (
					!buddies.includes(buddyBuddy.user_id) &&
					buddyBuddy.user_id !== _user.user_id &&
					buddy.buddies.includes(_user.user_id)
				)
					if (!suggs[buddyBuddy.user_id]) {
						// suggs.push(buddyBuddy.user_id); // suggest user added by a mutual buddy
						suggs[buddyBuddy.user_id] = { count: 1, id: buddyBuddy.user_id };
					} else suggs[buddyBuddy.user_id].count += 1;
			}
		}
		console.log("user suggestions", suggs);
		check_cache(toCache);
		setSuggestions(suggs);
		setMutuals(_mutuals);
		if (
			privateView &&
			Object.entries(posts).length === 0 &&
			_mutuals.length > 0
		)
			populate_buddies_page(_mutuals);
	}, [_users, _user]);
	async function postMessage(post) {
		if (!privateView) return;
		console.log("append post", Object.keys(post).at(0));
		setPosts({
			[Object.keys(post).at(0)]: Object.values(post).at(0),
			...posts,
		});
	}
	useEffect(() => {
		document.getElementById("welcomer").style.display = null;
		localStorage.removeItem("tc");
	}, []);
	return (
		<div className="homeWrapper">
			<div id="home" className="clamper">
				{_user ? (
					<>
						<Submitter
							onPostSubmit={postMessage}
							privateMode={privateView || false}
						/>
						<div className="privacyModes">
							<button
								active={!privateView && "true"}
								onClick={() => navigate("/main")}
							>
								<i className="fas fa-globe-americas"></i> Explore Page
							</button>
							<button
								active={privateView && "true"}
								onClick={() => navigate("/private")}
							>
								<i className="fas fa-user-friends"></i> Buddies Page
							</button>
						</div>
					</>
				) : (
					<h1 style={{ opacity: 0.5, color: "#fff" }}>
						Hello stranger, get comfy <i className="fas fa-mug-hot"></i>
					</h1>
				)}
				{/* .infinite-scroll-component */}
				{(_user || localStorage.getItem("guest")) &&
					(!privateView ? (
						<MediaFeed private={false} />
					) : (
						<div className="infinite-scroll-component">
							{focusPost && (
								<MediaActions
									focusPost={focusPost}
									// onDelete={delete_post}
									setFocusPost={setFocusPost}
									visibilityContext={{ changeVisibility, setChangeVisibility }}
								/>
							)}
							<div className="privateAlert" style={{ gridColumn: "1/-1" }}>
								<div
									className="bRelation"
									style={{
										gridAutoFlow: "row",
									}}
								>
									{mutuals.map((m, i) => {
										// return <button>{_users[m].username}</button>;
										return (
											<Link
												to={"/u/" + m + "/private"}
												className="bCard mutual"
												key={i}
											>
												<img src={_users[m].pfp} alt="user pic" />
												<p>
													@{_users[m].username}
													{_users[m] && _users[m].about && (
														<>
															<br />
															<small>"{_users[m].about}"</small>
														</>
													)}
												</p>
												<button
													onClick={(e) => {
														e.preventDefault();
														navigate("/chats/" + m);
													}}
												>
													<i className="fas fa-envelope" />
												</button>
												{/* <small>
													<i class="fas fa-user-friends"></i> <b>+{x.count}</b>{" "}
													relatives
												</small> */}
											</Link>
										);
									})}
								</div>
							</div>
							{Object.entries(posts)
								.sort((a, b) =>
									a[1].date.seconds > b[1].date.seconds ? -1 : 1
								)
								.map((post, index) => {
									return (
										<MediaPost
											key={post[0]}
											postID={post[0]}
											main
											msg={post[1]}
											setFocusPost={(vis = false) => {
												setFocusPost(post);
												setChangeVisibility(vis);
											}}
											authorID={post[1].user_id}
										/>
									);
								})}
							{Object.entries(posts).length > 0 && (
								<div
									className="mediaCard empty"
									style={{ gridColumn: "auto / span 2" }}
								/>
							)}
							{Object.entries(suggestions).length > 0 && (
								<div className="privateAlert" style={{ gridColumn: "1/-1" }}>
									<h2>
										<i className="fas fa-globe-americas"></i> You might know...
									</h2>
									<div
										className="exploreBuddies"
										style={{
											display:
												Object.entries(suggestions).length > 0 ? null : "none",
										}}
									>
										<div className="bRelation">
											{suggestions &&
												Object.values(suggestions).map((x, i) => (
													<Link to={"/u/" + x.id} className="bCard" key={i}>
														<img src={_users[x.id].pfp} alt="user pic" />
														<p>
															@{_users[x.id].username}
															{_users[x.id] && _users[x.id].about && (
																<>
																	<br />
																	<small>{_users[x.id].about}</small>
																</>
															)}
														</p>
													</Link>
												))}
										</div>
									</div>
								</div>
							)}
						</div>
					))}
				<div id="audionest"></div>
			</div>
		</div>
	);
}
export default Home;
