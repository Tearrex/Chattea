import { collection, orderBy, query, limit } from "firebase/firestore";
import {
	useCollectionData,
	useCollection,
} from "react-firebase-hooks/firestore";
import MediaPost from "./MediaPost";
import { _dbRef } from "../Main/firebase";
import React, { useContext, useEffect, useState } from "react";
import { MembersContext, UserContext } from "../Main/Contexts";
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
function MediaFeed(props) {
	const { _user, _setUser } = useContext(UserContext);
	const { _users, _setUsers } = useContext(MembersContext);

	/*
    Iterates over every requested user, checks if their info is
    already cached and fetches it from the database into if not.

    Array behaves as a queue for who's data to ask for. it works.
    */
	const [cache, setCache] = useState([]);
	useEffect(() => {
		const checkCache = async () => {
			var _toCache = {};
			for (let i = 0; i < cache.length; i++) {
				if (!_users[cache[i]] && !_toCache[cache[i]]) {
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
	const _limit = 4; // batch size, amount of documents to fetch at once

	const postsRef = collection(_dbRef, "posts");

	const [oldDoc, setOldDoc] = useState(null); // oldest firebase document, referenced for infinite scroll component
	useEffect(() => {
		// whether to display the message that the user reached the end of the road/feed
		hasMore(oldDoc !== null && oldDoc !== undefined);
	}, [oldDoc]);
	const [newDoc, setNewDoc] = useState(null); // the latest document we fetched, referenced for realtime updates w/ Firebase hooks
	const [lastUser, setLastUser] = useState("");
	const [switching, setSwitching] = useState(false);
	// remember the user id of the latest document to recognize profile page switching
	useEffect(() => {
		if (newDoc !== null && newDoc !== undefined) {
			setLastUser(newDoc.data().user_id);
		}
	}, [newDoc]);
	// when the profile page switches users, it will now clear previous posts from the media feed.
	useEffect(() => {
		if (newDoc === null && oldDoc === null && switching) {
			// wanted to give it smooth behavior but it often starts requesting more
			// batches of posts in the middle of the scroll animation since the images don't load right away.
			// a placeholder element with a fixed height would help
			window.scrollTo(0, 0);
			next_batch();
		}
	}, [newDoc, oldDoc, switching]);

	const [posts, _setPosts] = useState({}); // mapped to MediaPost components

	function next_batch() {
		var startFresh = false; // replace old posts?
		if (
			props.focus !== undefined &&
			props.focus !== lastUser &&
			lastUser !== "" &&
			!switching
		) {
			setNewDoc(null);
			setOldDoc(null);
			setSwitching(true);
			return;
		} else if (switching) {
			setSwitching(false);
			startFresh = true;
		}
		var _query;
		if (oldDoc === null || oldDoc === undefined) {
			if (props.focus === undefined)
				_query = query(postsRef, orderBy("date", "desc"), limit(_limit));
			// we can't order by date with the user_id filter
			// firebase limitations....
			else
				_query = query(
					postsRef,
					where("user_id", "==", props.focus),
					limit(_limit)
				);
		} else {
			if (props.focus === undefined)
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
					startAfter(oldDoc),
					limit(_limit)
				);
		}
		var _posts;
		if (startFresh) _posts = {};
		else _posts = posts;
		var _toCache = [];
		getDocs(_query).then((snap) => {
			var _old = null;
			var _new = null;
			if (snap.docs.length === 0) console.log("no posts left");
			snap.forEach((s) => {
				var data = s.data();
				//console.log(s);
				if (_new === null) _new = s;
				else _old = s;
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
				newDoc === null ||
				!_user ||
				(newDoc !== null &&
					lastUser !== _user.user_id &&
					props.focus !== undefined)
			)
				setNewDoc(_new);
			setOldDoc(_old);
			_setPosts(_posts);
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
			where("user_id", "==", props.focus),
			orderBy("date", "desc"),
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
					commenters[i] !== _user.user_id &&
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
				onDelete={(e) => delete_post(post[0])}
				key={post[0]}
				msg={post[1]}
				postID={post[0]}
				authorID={post[1].user_id}
			/>
		);
	}
	return (
		<InfiniteScroll
			dataLength={Object.entries(posts).length}
			next={next_batch}
			hasMore={more}
			scrollThreshold={"100%"}
			loader={<div className="loader" />}
			endMessage={
				<h2
					style={{ textAlign: "center", color: "#FFF", fontWeight: "normal" }}
				>
					☕ There is no more tea down here...
				</h2>
			}
		>
			{Object.entries(posts).length === 0
				? null
				: Object.entries(posts).map((msg) => cache_user(msg))}
		</InfiniteScroll>
	);
}
export default MediaFeed;
