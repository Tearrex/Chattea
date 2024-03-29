import { collection, orderBy, query, limit } from "firebase/firestore";
import {
	useCollectionData,
	useCollection,
} from "react-firebase-hooks/firestore";
import MediaPost from "./MediaPost";
import { _dbRef } from "../Main/firebase";
import React, { useContext, useEffect, useState } from "react";
import { MembersContext, UserContext, showLogin } from "../Main/Contexts";
import {
	getDoc,
	getDocs,
	doc,
	where,
	startAfter,
	startAt,
	endAt,
	endBefore,
} from "@firebase/firestore";
import InfiniteScroll from "react-infinite-scroll-component";
import { Link, useNavigate } from "react-router-dom";
import MediaActions from "./MediaActions";
import UserList from "../Buddies/UserList";
function MediaFeed(props) {
	const { _user, _setUser } = useContext(UserContext);
	const { _users, _setUsers } = useContext(MembersContext);
	const { _showLogin, setLogin } = useContext(showLogin);
	const navigate = useNavigate();
	/*
	Iterates over every requested user, checks if their info is
	already cached and fetches it from the database if not.

	Array behaves as a queue for who's data to ask for. it works.
	*/
	const [cache, setCache] = useState([]);
	useEffect(() => {
		const checkCache = async () => {
			var _toCache = {};
			for (let i = 0; i < cache.length; i++) {
				if (
					!_users[cache[i]] &&
					!_toCache[cache[i]] &&
					(!_user || _user.user_id !== cache[i])
				) {
					if (_user && cache[i] === _user.user_id) continue;
					const userRef = doc(_dbRef, "users", cache[i]);
					const _doc = await getDoc(userRef);
					if (_doc.exists()) {
						var _json = { user_id: _doc.id, ..._doc.data() };
						_toCache[cache[i]] = _json;
						console.log("ADDED to cache", _json);
					} else console.log("COULDNT FIND " + cache[i]);
				}
			}
			if (Object.entries(_toCache).length > 0) {
				_setUsers({ ..._users, ..._toCache });
			}
		};
		checkCache();
	}, [cache]);
	useEffect(() => {
		console.log("private", props.private);
		if (
			!oldDoc ||
			(oldDoc &&
				(oldDoc.data().private || false) != (props.private || false)) ||
			(props.focus != lastUser && lastUser != "")
		) {
			console.warn("jumping batch");
			return next_batch();
		}
		setNewDoc(null);
		setOldDoc(null);
		_setPosts({});
	}, [props.private]);
	const _limit = 4; // batch size, amount of documents to fetch at once

	const postsRef =
		(props.private || false) === false
			? collection(_dbRef, "posts")
			: collection(_dbRef, "users", props.focus, "posts");

	const [oldDoc, setOldDoc] = useState(null); // oldest firebase document, referenced for infinite scroll component
	useEffect(() => {
		// whether to display the message that the user reached the end of the road/feed
		hasMore(oldDoc !== null && oldDoc !== undefined);
		if (oldDoc) {
			console.log("OLDDOC", oldDoc);
			setLastUser(oldDoc.data().user_id);
		} else console.log("OLDDOC is NULL");
	}, [oldDoc]);
	const [newDoc, setNewDoc] = useState(null); // the latest document we fetched, referenced for realtime updates w/ Firebase hooks
	const [lastUser, setLastUser] = useState("");
	const [switching, setSwitching] = useState(false);
	// remember the user id of the latest document to recognize profile page switching
	// useEffect(() => {
	// 	if (oldDoc) {
	// 		setLastUser(newDoc.data().user_id);
	// 	}
	// }, [oldDoc]);
	useEffect(() => {
		if (
			newDoc &&
			props.postInjection &&
			Object.values(props.postInjection)[0].date > newDoc.data().date
		) {
			console.warn("injected post", props.postInjection);
			_setPosts({ ...props.postInjection, ...posts });
		}
	}, [props.postInjection]);
	// when the profile page switches users, it will now clear previous posts from the media feed.
	useEffect(() => {
		if (!newDoc && !oldDoc && switching) {
			// wanted to give it smooth behavior but it often starts requesting more
			// batches of posts in the middle of the scroll animation since the images don't load right away.
			// a placeholder element with a fixed height would help
			window.scrollTo(0, 0);
			next_batch();
		}
	}, [newDoc, oldDoc, switching]);

	const [forwardPost, setForwardPost] = useState(null);
	const [focusPost, setFocusPost] = useState(null);
	const [changeVisibility, setChangeVisibility] = useState(false);
	useEffect(() => {
		document.body.style.overflow = focusPost ? "hidden" : null;
	}, [focusPost]);
	const [posts, _setPosts] = useState({}); // mapped to MediaPost components
	const [fetchError, setFetchError] = useState(false);

	function splash_page() {
		navigate("/");
		setTimeout(() => {
			let focusElement = document.querySelector("#nameInput");
			if (focusElement) focusElement.focus();
		});
	}

	const { postCount, setPostCount } = props.postCountContext || {};
	function next_batch() {
		let history = localStorage.getItem("tc");
		if (history) {
			try {
				history = parseInt(history);
			} catch (e) {
				history = null;
			}
			if (history >= 2) {
				return hasMore(false);
			} else {
				localStorage.setItem("tc", ++history);
			}
		} else {
			if (localStorage.getItem("guest")) localStorage.setItem("tc", 1);
		}
		var startFresh = false; // replace old posts?
		if (
			((props.focus && props.focus !== lastUser && lastUser !== "") ||
				(oldDoc &&
					oldDoc.data().private != props.private &&
					props.focus &&
					oldDoc.data().user_id !== props.focus)) &&
			!switching
		) {
			console.log("DETECTED visiblity switch");
			setNewDoc(null);
			setSwitching(true);
			setOldDoc(null);
			return;
		} else if (switching) {
			console.log("switching NOW!");
			// setSwitching(false);
			startFresh = true;
		} else if (
			(props.private && (!oldDoc || !oldDoc.data()["private"])) ||
			(!props.private && (!oldDoc || oldDoc.data()["private"] === true))
		) {
			startFresh = true;
			console.log("fresh batch now!");
		}
		let _query;
		if (startFresh) {
			console.log("feed from zero");
			if (!props.focus)
				_query = query(
					postsRef,
					where("private", "!=", true),
					orderBy("private", "desc"),
					orderBy("date", "desc"),
					limit(_limit)
				);
			// we can't order by date with the user_id filter
			// firebase limitations....
			else
				_query = query(
					postsRef,
					where("user_id", "==", props.focus),
					orderBy("date", "desc"),
					limit(_limit)
				);
		} else {
			console.log("olddoc exists", oldDoc);
			if (!props.focus)
				_query = query(
					postsRef,
					orderBy("date", "desc"),
					startAfter(oldDoc),
					limit(_limit)
				);
			else
				_query = query(
					postsRef,
					where("user_id", "==", props.focus),
					orderBy("date", "desc"),
					startAfter(oldDoc),
					limit(_limit)
				);
		}
		var _posts;
		if (startFresh) _posts = {};
		else _posts = { ...posts };
		var _toCache = [];
		getDocs(_query)
			.then((snap) => {
				let _old = null;
				let _new = null;
				if (snap.docs.length === 0) {
					hasMore(false);
					if (!switching) return;
					else {
						setOldDoc(null);
						// setSwitching(false);
						hasMore(false);
					}
				}
				console.log("fetched", snap.docs.length);
				snap.forEach((s) => {
					var data = s.data();
					//console.log(s);
					if (!_new) _new = s;
					_old = s;
					_posts = { ..._posts, [s.id]: data };
					if (
						!_user ||
						(data.user_id !== _user.user_id &&
							!cache.includes(data.user_id) &&
							!_toCache.includes(data.user_id))
					) {
						_toCache.push(data.user_id);
					}
				});
				if (_toCache.length > 0)
					requestAnimationFrame((e) => {
						setCache(cache.concat(_toCache));
					});
				if (
					!newDoc ||
					!_user ||
					(newDoc && lastUser !== _user.user_id && props.focus)
				)
					setNewDoc(_new);
				if (_old || switching) {
					setOldDoc(_old);
					setSwitching(false);
				}
				_setPosts(_posts);
				if (setPostCount) setPostCount(Object.entries(_posts).length);
			})
			.catch((e) => {
				console.log(e);
				setFetchError(true);
			});
	}

	const col = collection(_dbRef, "posts");
	var liveQuery;
	if (props.focus === undefined) {
		// viewing home page
		liveQuery = query(
			col,
			orderBy("date", "desc"),
			endBefore(newDoc === null || newDoc.data()["date"] === null ? "" : newDoc)
		);
	} else {
		// viewing profile page
		liveQuery = query(
			col,
			orderBy("date", "desc"),
			where("user_id", "==", props.focus),
			endBefore(newDoc)
		);
	}

	const [livePosts] = useCollection(liveQuery, { idField: "id" });
	useEffect(() => {
		if (livePosts !== undefined && livePosts.docs.length > 0) {
			requestAnimationFrame(() => {
				var _latest = null;
				var _newBatch = {};
				livePosts.docs.forEach((s) => {
					if (_latest === null) _latest = s;
					var _postData = s.data();
					_newBatch[s.id] = _postData;
				});
				setNewDoc(_latest);
				var _posts = { ..._newBatch, ...posts };
				_setPosts(_posts);
			});
		}
	}, [livePosts]);
	useEffect(() => {
		if (props.focus && lastUser !== props.focus && lastUser !== "")
			next_batch();
	}, [props.focus]);
	useEffect(() => {
		if (Object.keys(posts).length > 0) {
			console.log("Media feed posts:", posts);
		}
	}, [posts]);
	const [more, hasMore] = useState(false);
	function delete_post(postID) {
		const temp = { ...posts };
		delete temp[postID];
		_setPosts(temp);
	}
	function send_commenters_to_cache(commenters) {
		requestAnimationFrame(() => {
			var _cache = [];
			for (let i = 0; i < commenters.length; i++) {
				if (
					(!_user || commenters[i] !== _user.user_id) &&
					!cache.includes(commenters[i]) &&
					_users[commenters[i]] === undefined
				) {
					_cache.push(commenters[i]);
				}
			}
			if (_cache.length > 0) setCache([...cache, ..._cache]);
		});
	}
	function cache_user(post) {
		return (
			<MediaPost
				toCache={(e) => send_commenters_to_cache(e)}
				key={post[0]}
				msg={post[1]}
				postID={post[0]}
				onForward={(postID, data) => setForwardPost({ postID, data })}
				setFocusPost={(vis = false) => {
					setFocusPost(post);
					setChangeVisibility(vis);
				}}
				authorID={post[1].user_id}
			/>
		);
	}
	return (
		<>
			{forwardPost && (
				<UserList
					users={Object.values(_user.buddies)}
					open
					chat
					onClose={() => setForwardPost(null)}
					onSelect={(buddy_id) => {
						localStorage.setItem(
							"forward_post",
							JSON.stringify({ _id: forwardPost[0], ...forwardPost[1] })
						);
						navigate("/chats/" + buddy_id);
					}}
				/>
			)}
			{focusPost && (
				<MediaActions
					focusPost={focusPost}
					onDelete={delete_post}
					setFocusPost={setFocusPost}
					onForwardPost={() => {
						setFocusPost(null);
						setForwardPost(focusPost);
					}}
					visibilityContext={{ changeVisibility, setChangeVisibility }}
				/>
			)}
			<InfiniteScroll
				dataLength={Object.entries(posts).length}
				next={next_batch}
				hasMore={more}
				scrollThreshold={"100%"}
				loader={<div className="loader" />}
				endMessage={
					<>
						{_user ? (
							!fetchError ? (
								<h2
									style={{
										textAlign: "center",
										color: "#FFF",
										fontWeight: "normal",
										gridColumn: "1/-1",
									}}
								>
									☕ There is no more tea down here...
								</h2>
							) : (
								<div className="privateAlert" style={{ gridColumn: "1/-1" }}>
									<h2>
										<i className="fas fa-exclamation-circle"></i> That didn't
										work
									</h2>
									<p>
										{(_users[props.focus] && _users[props.focus].username) ||
											"The user"}{" "}
										may have removed you as a buddy
									</p>
									<br />
									<Link to="/#faq">Learn more</Link>
								</div>
							)
						) : (
							<div className="brochure">
								<h4>
									<i className="fas fa-smile-beam"></i>
									<br />
									<br />
									Chattea is better with you.
								</h4>
								<div className="buttons">
									<button onClick={splash_page}>Sign Up</button>
									or
									<button onClick={() => setLogin(true)}>Log In</button>
								</div>
								<p>to keep browsing</p>
							</div>
						)}
					</>
				}
			>
				{Object.entries(posts).length === 0
					? null
					: Object.entries(posts).map((msg) => cache_user(msg))}
			</InfiniteScroll>
		</>
	);
}
export default MediaFeed;
