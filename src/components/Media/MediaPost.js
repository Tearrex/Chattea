import { doc, deleteDoc } from "firebase/firestore";
import { useEffect, useState, useRef, useContext } from "react";
import { _dbRef, _storageRef } from "../Main/firebase";
import SmileButton from "../Smiles/SmileButton";
import { deleteObject, ref } from "firebase/storage";
import React from "react";
import { MembersContext, UserContext, showLogin } from "../Main/Contexts";
import Comments, { post_comment } from "../Comments/Comments";
import { useNavigate, useParams } from "react-router";
import UserList from "../Buddies/UserList";

import { Link } from "react-router-dom";
import * as filter from "profanity-filter";
import { setCaretPosition } from "../../App";
function MediaPost(props) {
	const navigate = useNavigate();
	// didn't have time to finish, will commit feature later
	//const {page_user_id} = useParams();
	const { _user, _setUser } = useContext(UserContext);
	const { _showLogin, setLogin } = useContext(showLogin);
	const { _users, _setUsers } = useContext(MembersContext);
	const { caption, content, date, image_url, user_id, track } = props.msg;
	const [captionInput, setCaption] = useState("");
	const [isAuthor, setAuthor] = useState(false);
	const [postDate, setPostDate] = useState("");
	const postID = props.postID;
	const [commentCount, setCommentCount] = useState(0);

	const [pfp, setPfp] = useState("/default_user.png");

	// i don't think this is necessary...
	useEffect(() => {
		setCaption(caption);
	}, [caption]);
	/*
	Formats the timestamp value of the post for a nice looking date.
	*/
	useEffect(() => {
		if (date !== null && date !== undefined && postDate === "") {
			setPostDate(
				Intl.DateTimeFormat("en-US", {
					dateStyle: "medium",
					timeStyle: "short",
				})
					.format(date.toDate())
					.toString()
			);
		}
	}, [date]);
	/*
	This effect is called when there are new additions to the
	client's user cache. It will set the appropriate username and profile picture
	as soon as it is pulled from the database.
	*/
	useEffect(() => {
		if (user_id !== undefined) {
			//if(_users[user_id] !== undefined) return;
			if (_user !== undefined && user_id === _user["user_id"]) {
				setPfp(_user["pfp"]);
				setAuthor(true);
				return;
			}
			if (user_id === "") {
				console.log("USER HAS NO EMAIL");
			} else {
				if (_users[user_id] !== undefined) {
					var user = _users[user_id];
					var _pfp = user.pfp;
					if (_pfp !== "") setPfp(_pfp);
					return;
				}
			}
		}
	}, [_users, _user]);
	const imageNest = useRef();
	/*
	If the post has an image url, it will be loaded into a new image element.
	I prefer this method as I can add loading animations later on to make it smoother.
	*/
	const warningRef = useRef();
	useEffect(() => {
		const abort = new AbortController();
		if (image_url !== undefined && image_url !== "") {
			if (
				!image_url.startsWith(
					"https://firebasestorage.googleapis.com/v0/b/reactback-1cf7d.appspot.com/"
				)
			) {
				/*
				Since the document writes are done in the clientside, it is possible for users
				to tinker with the JSON values.
				An alternative would be a proxy server that serves the API on the backend.

				Don't fetch the image link if it's not coming from Firebase, it might be malicious!
				*/
				warningRef.current.style.display = "flex";
				return;
			}
			var _oldImage = imageNest.current.getElementsByTagName("img");
			if (_oldImage.length > 0) {
				console.log("Replace image is", props.replaceImg);
				if (props.replaceImg !== true) {
					console.log("image already exists!");
					return;
				} else {
					// doesnt need a for loop, but im planning on
					// allowing multiple images later on...
					for (let i = 0; i < _oldImage.length; i++) {
						imageNest.current.removeChild(_oldImage[i]);
					}
				}
			}
			console.log("loading post image...");
			var img = new Image();
			img.src = image_url;
			img.id = "richImage";
			img.onload = function () {
				if (abort.signal["aborted"] === true) {
					console.log("image load stopped, not in view");
					return;
				}
				//console.log("abort signal", abort.signal);
				imageNest.current.appendChild(img);
			};
			//imageNest.current.appendChild(img);
		}
		return () => abort.abort();
	}, [image_url]);
	const deleteOptions = useRef();
	const deleteOverlay = useRef();
	function toggle_options(show) {
		if (show === false) {
			deleteOptions.current.style.display = "none";
			deleteOverlay.current.style.maxWidth = "0%";
		} else {
			deleteOptions.current.style.display = "flex";
			deleteOverlay.current.style.maxWidth = "100%";
		}
	}
	async function delete_post() {
		//console.log("starting delete");
		const postRef = doc(_dbRef, "posts", props.postID);
		await deleteDoc(postRef);
		const smilesRef = doc(
			_dbRef,
			"users/" + props.authorID + "/smiles/" + props.postID
		);
		await deleteDoc(smilesRef);
		//console.log("deleted?");
		const imgRef = ref(_storageRef, "images/" + user_id + "/" + props.postID);
		try {
			await deleteObject(imgRef);
		} catch (e) {
			console.log(e);
		}
		props.onDelete();
		console.log("Removed post " + props.postID);
	}
	const commentBox = useRef();
	const textInput = useRef();
	const [mentioning, setMentioning] = useState(false);
	const [mentionQuery, setMentionQuery] = useState("");
	const [mentions, setMentions] = useState([]);
	const [comment, setComment] = useState("");
	/*
	used to prevent the user from spamming, it starts to get expensive!
	this is only checked on the clientside, so it is still vulnerable.
	*/
	const [lastAction, setLastAction] = useState(0);
	const [cooldown, setCooldown] = useState(0);
	const cooldownIncrement = 10000;
	async function handle_comment(e) {
		e.preventDefault();
		if (!_user) return;
		if (lastAction > 0 && cooldown >= Date.now() - lastAction) {
			alert(
				"Spam Protection: Please wait " +
					((cooldown - (Date.now() - lastAction)) / 1000).toFixed(1) +
					" seconds before commenting again."
			);
			return;
		}
		var _comment = comment;
		setComment("");
		setLastAction(Date.now());
		setCooldown(cooldown + cooldownIncrement);

		// tie a display name (as key) to each user id (as value)
		let labeled_mentions = {};
		console.log("total mentions", mentions);
		for (let i = 0; i < mentions.length; i++) {
			const uid = mentions[i];
			const user = Object.values(_users).find((u) => u.user_id === uid);
			console.log(uid, user);
			if (user)
				labeled_mentions[String(user.username).replace(/\s/g, "")] = uid; // regex removes all spaces
		}
		var result = await post_comment(
			_comment,
			postID,
			_user["user_id"],
			user_id,
			mentions.length > 0 ? labeled_mentions : null
		).then(() => {
			setMentioning(false);
			setMentionQuery("");
			setMentions([]);
		});
		//if(result === true) textInput.current.value = "";
	}
	function change_comment(e) {
		if (e.target.value.length > 100) return;
		let val = String(e.target.value);
		if (val.trim() === "") {
			setMentioning(false);
			setMentions([]);
		}
		if (val.endsWith("@")) setMentioning(true);
		else if (!val.includes("@")) {
			setMentioning(false);
			setMentionQuery("");
		} else if (mentioning) setMentionQuery(mentionQuery + val[val.length - 1]);
		setComment(val);
	}
	// keep input fields updated
	function watch_comment(e) {
		if (mentioning && e.keyCode === 8 && mentionQuery.length > 0) {
			setMentionQuery(mentionQuery.slice(0, mentionQuery.length - 2));
		}
	}
	function toggle_textbox() {
		if (!_user) {
			localStorage.setItem("redirect", `/post/${postID}`);
			return setLogin(true);
		}
		setComment("");
		setMentioning(false);
		commentBox.current.style.display = "flex";
		textInput.current.focus();
		commentBox.current.style.display = null;
	}
	function send_commenters_to_cache(commenters) {
		console.log("received commenters", commenters);
		requestAnimationFrame(() => {
			props.toCache(commenters);
		});
	}

	const [smilers, setSmilers] = useState(null);
	function show_smilers(_smilers) {
		setSmilers(_smilers);
	}

	// music controls
	const [playing, setPlaying] = useState(false);
	function clear_audios() {
		const nest = document.querySelector("#audionest");
		if (!nest) return;

		const remains = nest.querySelectorAll("audio");
		for (let r = 0; r < remains.length; r++) {
			const _audio = remains[r];
			if (_audio.getAttribute("src") == track.preview_url) continue;
			_audio.pause();
			_audio.remove();
		}
	}
	function toggle_playback() {
		const audio = document.querySelector("audio");
		if (audio.readyState === 4) {
			if (audio.paused) audio.play();
			else audio.pause();
			setPlaying(!audio.paused);
		}
		return;
	}
	function switch_song(url) {
		const nest = document.querySelector("#audionest");
		if (!nest) return;

		let audios = document.querySelectorAll("audio");
		for (let i = 0; i < audios.length; i++) {
			const audio = audios[i];
			if (audio.getAttribute("src") != url) {
				audio.pause();
				audio.remove();
			}
		}

		let audio = document.querySelector("audio");
		if (audio) return toggle_playback();

		clear_audios();

		audio = new Audio(url);
		nest.appendChild(audio);
		try {
			setTimeout(() => {
				if (document.querySelector("audio").readyState === 2) {
					audio.play();
					setPlaying(true);
				} else {
					console.warn("player was not ready!!!", audio);
					audio.currentTime = 0;
					audio.play(); // try again, buffer issue?
					setPlaying(true);
				}
			}, 1000);
		} catch (e) {
			console.log("error playing");
			clear_audios();
			setPlaying(false);
		}
	}
	function mention_user(user, force = false) {
		if (!_user) {
			localStorage.setItem("redirect", `/post/${postID}`);
			return setLogin(true);
		}
		let index = !force ? comment.lastIndexOf("@" + mentionQuery) : -1;
		if (index === -1) {
			if (!force) return;
			else index = comment.length - 1;
		}
		if (typeof user === "string") user = _users[user];
		// if (mentions.includes(user.user_id)) return; // only mention once
		setMentionQuery("");
		let c = String(comment);
		if (index != -1)
			c = c.slice(0, index + (force ? 1 : 0)) + "@" + user.username + " ";
		else if (c.trim() === "") c = "@" + user.username + " ";
		setComment(c);
		let input = document.querySelector("input[caret]");
		if (input) input.focus();
		else if (force) textInput.current.focus();
		setMentioning(false);
		if (!mentions.includes(user.user_id))
			setMentions([...mentions, user.user_id]);
		// document
	}
	function add_emoji(event, emoji) {
		event.preventDefault();
		setComment(comment + emoji);
		textInput.current.focus();
	}
	function prompt_tab(event, external_url) {
		const confirm = window.confirm("Open spotify link?");
		if (!confirm) return event.preventDefault();
		clear_audios();
	}
	function find_smilebutton() {
		const button = document.querySelector(`.smileButton[post='${postID}']`);
		if (button) button.click();
	}
	const emojis = ["👍", "😂", "❤️", "🔥", "😭", "😮", "☕"];
	return (
		<div
			className="mediaCard"
			onClick={() =>
				console.log({ post: props.postID, author: props.authorID })
			}
			style={{ gridColumn: !image_url ? "1/-1" : null }}
		>
			<div
				className="postUserInfo"
				style={{ boxShadow: image_url === "" ? "none" : null }}
			>
				<div className="mediaContent">
					<p style={{ marginBottom: 0, fontSize: "1.3rem" }}>{content}</p>
					{track && (
						<>
							<div
								className="track media"
								active={"true"}
								paused={playing ? "false" : "true"}
								id="mainTrack"
								onClick={() => switch_song(track.preview_url)}
							>
								<div className="info">
									<div className="art">
										<img src={track.album_art} />
									</div>
									<p>
										{track.name} • <span>{track.artist}</span>
									</p>
								</div>
								{String(track.url).startsWith("https://open.spotify.com") && (
									<a
										href={track.url}
										target="_blank"
										rel="nonreferrer"
										style={{ fontSize: "1.5rem" }}
										onClick={(e) => prompt_tab(e, track.url)}
									>
										<i className="fab fa-spotify"></i>
									</a>
								)}
							</div>
						</>
					)}
				</div>
				<Link to={"/profile/" + user_id} className="userAndPfp">
					{!isAuthor && (
						<p
							className="username"
							style={{
								display:
									_user && user_id === _user["user_id"] ? "none" : "block",
								color: "#fff",
							}}
						>
							{!_user && <i className="fas fa-user"></i>}
							{_users[props.authorID] !== undefined
								? _users[props.authorID].username
								: "User"}
						</p>
					)}
					<div
						onClick={() => {
							window.scrollTo(0, 0);
						}}
						style={{ backgroundImage: "url(" + pfp + ")" }}
						className="profilePicture niceClip"
					/>
				</Link>
			</div>
			<div className="mediaSecondary">
				<div
					ref={warningRef}
					className="medWarning"
					style={{ display: "none" }}
				>
					<p className="alienTitle">
						<span>🛸</span>Uh oh
					</p>
					<p>This image appears to have been abducted by aliens...</p>
				</div>
				{image_url !== "" ? (
					<div
						ref={imageNest}
						className="mediaPostImg"
						style={{ minHeight: image_url !== "" ? 250 : null }}
						onDoubleClick={find_smilebutton}
					>
						<div
							className="imgOverlay"
							style={{ opacity: captionInput !== "" ? null : "0" }}
							onClick={() => {
								if (track) switch_song(track.preview_url);
							}}
						>
							<p>{filter.clean(captionInput)}</p>
						</div>
						{/**<div style={{backgroundImage:"url("+image_url+")"}} /> */}
					</div>
				) : null}
				<div>
					<div className="postActions">
						<div
							ref={deleteOverlay}
							className="deleteOverlay"
							style={{ maxWidth: "0%" }}
						/>
						<div className="actionBundle">
							<SmileButton
								canSmile={(_user && _user.user_id != user_id) || !_user}
								postID={postID}
								author={user_id}
								smiles={(_user && user_id === _user.user_id) || 0}
								setSmilers={show_smilers}
							/>
						</div>
						<button className="stealthBtn" onClick={toggle_textbox}>
							💬 {commentCount === 0 ? "Comment" : commentCount}
						</button>
					</div>
					<div
						ref={deleteOptions}
						className="actions"
						style={{ flexFlow: "row-reverse", display: "none" }}
					>
						<button onClick={delete_post}>Delete</button>
						<button onClick={(e) => toggle_options(false)}>Cancel</button>
					</div>
					<div className="commentNest">
						{_user && (
							<form
								ref={commentBox}
								className="commenter"
								onSubmit={handle_comment}
							>
								{mentioning && (
									<>
										<div className="mentionList">
											{_user &&
												Object.values(_users)
													.filter(
														(u) => _user.buddies.indexOf(u.user_id) !== -1
													)
													.filter((u) =>
														String(u.username)
															.toLowerCase()
															.startsWith(mentionQuery.toLowerCase())
													)
													.map((u) => {
														return (
															<div
																className="tooltip mention"
																onClick={() => mention_user(u)}
															>
																<img src={u.pfp} />
																<span className="tooltext">{u.username}</span>
															</div>
														);
													})}
										</div>
									</>
								)}
								<input
									ref={textInput}
									type="text"
									value={comment}
									disabled={!_user}
									onChange={change_comment}
									onKeyDown={(e) => watch_comment(e)}
									caret={mentioning ? "true" : null}
									placeholder="Mention buddies with @"
								/>
								<input type="submit" style={{ display: "none" }} />
								<div className="emojis">
									{emojis.map((emoji, i) => {
										return (
											<button onClick={(e) => add_emoji(e, emoji)}>
												{emoji}
											</button>
										);
									})}
								</div>
							</form>
						)}
						{smilers && Object.entries(smilers).length > 0 && (
							<UserList users={smilers} onClose={() => setSmilers(null)} open />
						)}
						<Comments
							postID={postID}
							authorID={postID}
							updateComments={setCommentCount}
							mentionUser={(user_id) => mention_user(user_id, true)}
							toCache={(e) => send_commenters_to_cache(e)}
						/>
					</div>
					<div className="timestamp">
						{(!_user ||
							(_user && (_user.user_id === user_id || _users[user_id]))) && (
							<button className="pActions" onClick={props.setFocusPost}>
								<i class="fas fa-ellipsis-h"></i>
							</button>
						)}
						<p>Posted {postDate}</p>
					</div>
				</div>
			</div>
		</div>
	);
}
export default MediaPost;
