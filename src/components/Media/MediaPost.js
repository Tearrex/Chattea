import { doc, deleteDoc } from "firebase/firestore";
import { useEffect, useState, useRef, useContext } from "react";
import { _dbRef, _storageRef } from "../Main/firebase";
import SmileButton from "../Smiles/SmileButton";
import { deleteObject, ref } from "firebase/storage";
import React from "react";
import { MembersContext, UserContext } from "../Main/Contexts";
import Comments, { post_comment } from "../Comments/Comments";
import { useNavigate, useParams } from "react-router";
import UserList from "../Buddies/UserList";

import { Link } from "react-router-dom";
function MediaPost(props) {
	const navigate = useNavigate();
	// didn't have time to finish, will commit feature later
	//const {page_user_id} = useParams();
	const { _user, _setUser } = useContext(UserContext);
	const { _users, _setUsers } = useContext(MembersContext);
	const { caption, content, date, image_url, user_id } = props.msg;
	const [captionInput, setCaption] = useState("");
	const [isAuthor, setAuthor] = useState(false);
	const [postDate, setPostDate] = useState("");
	const postID = props.postID;

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
		var result = await post_comment(
			_comment,
			postID,
			_user["user_id"],
			user_id
		);
		//if(result === true) textInput.current.value = "";
	}
	function change_comment(e) {
		if (e.target.value.length > 100) return;
		setComment(e.target.value);
	}
	function toggle_textbox() {
		setComment("");
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
				{_user && (_user.user_id === user_id || _users[user_id]) && (
					<button className="pActions" onClick={props.setFocusPost}>
						<img src="/ellipsis.svg" width={20} alt="menu" />
					</button>
				)}
				<div className="mediaContent">
					<p style={{ marginBottom: 0, fontSize: "1.3rem" }}>{content}</p>
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
							{_users[props.authorID] !== undefined
								? _users[props.authorID].username
								: "User"}
						</p>
					)}
					{_user && props.authorID !== _user.user_id && <div onClick={() => {
						window.scrollTo(0, 0);
					}}
						style={{ backgroundImage: "url(" + pfp + ")" }}
						className="profilePicture niceClip"
					/>}
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
					<div ref={imageNest} className="mediaPostImg">
						<div
							className="imgOverlay"
							style={{ opacity: captionInput !== "" ? null : "0" }}
						>
							<p>{captionInput}</p>
						</div>
						{/**<div style={{backgroundImage:"url("+image_url+")"}} /> */}
					</div>
				) : null}
				<div>
					{_user && (
						<div className="postActions">
							<div
								ref={deleteOverlay}
								className="deleteOverlay"
								style={{ maxWidth: "0%" }}
							/>
							<div className="actionBundle">
								<SmileButton
									canSmile={_user["user_id"] !== user_id}
									smiled={props.smiled}
									postID={postID}
									author={user_id}
									smiles={user_id === _user.user_id}
									setSmilers={show_smilers}
								/>
							</div>
							<button className="stealthBtn" onClick={toggle_textbox}>
								💬 Comment
							</button>
						</div>
					)}
					<div
						ref={deleteOptions}
						className="actions"
						style={{ flexFlow: "row-reverse", display: "none" }}
					>
						<button onClick={delete_post}>Delete</button>
						<button onClick={(e) => toggle_options(false)}>Cancel</button>
					</div>
					<div>
						<form
							ref={commentBox}
							className="commenter"
							onSubmit={handle_comment}
						>
							<input
								ref={textInput}
								type="text"
								value={comment}
								onChange={(e) => change_comment(e)}
								placeholder="Type your comment..."
							/>
						</form>
						{smilers && Object.entries(smilers).length > 0 && (
							<UserList users={smilers} onClose={() => setSmilers(null)} open />
						)}
						{_user && (
							<Comments
								postID={postID}
								authorID={postID}
								toCache={(e) => send_commenters_to_cache(e)}
							/>
						)}
					</div>
					<span className="timestamp">Posted {postDate}</span>
				</div>
			</div>
		</div>
	);
}
export default MediaPost;
