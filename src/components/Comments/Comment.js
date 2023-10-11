import { useContext, useState, useEffect } from "react";
import { MembersContext, UserContext } from "../Main/Contexts";
import { deleteDoc, doc } from "@firebase/firestore";
import { _dbRef } from "../Main/firebase";
import { useNavigate } from "react-router";
import { Link } from "react-router-dom";
import * as filter from "profanity-filter";
function Comment(props) {
	const navigate = useNavigate();
	const { _user, _setUser } = useContext(UserContext);
	const { _users, _setUsers } = useContext(MembersContext);
	const { date, content, user_id, id, mentions } = props.comment;

	const [pfp, setPfp] = useState("/default_user.png");
	const [username, setUsername] = useState("LOADING");
	useEffect(() => {
		let suffix = "";
		if (user_id === _user["user_id"]) {
			setPfp(_user.pfp);
			if (_user.role === "admin") suffix = " ";
			setUsername(_user.username + suffix);
		} else if (_users[user_id] !== undefined) {
			setPfp(_users[user_id].pfp);
			if (_users[user_id].role === "admin") suffix = " ";
			setUsername(_users[user_id].username + suffix);
		}
	}, [_users, _user]);
	async function delete_comment() {
		console.log(props.postID + " comment id: " + id);
		const commentRef = doc(_dbRef, "posts/" + props.postID + "/comments/" + id);
		await deleteDoc(commentRef);
	}
	function visit_user() {
		navigate("/profile/" + user_id);
	}
	// this function must return array of elements to map properly
	function render_comment(comment) {
		if (!mentions || mentions.length === 0)
			return [<span>{filter.clean(comment)}</span>];
		comment = String(comment);
		let startIndex = comment.indexOf("@");
		if (startIndex === -1) return [<span>{filter.clean(comment)}</span>];

		let result = [];

		if (!comment.startsWith("@"))
			result.push(<span key={result.length}>{comment.split("@")[0]}</span>);
		// "aaaaa "@"username"@"username "
		let chunks = comment.slice(startIndex, comment.length - 1).split("@");
		// @"username words"@"username  morewords..."
		let names = [];
		for (let c = 0; c < chunks.length; c++) {
			let chunk = chunks[c];
			let [_name, ..._text] = chunk.split(" ");
			if (_name != "") {
				names.push(_name);
				let user = Object.entries(mentions).find(([k, v], i) => k === _name);
				if (user)
					result.push(
						<Link
							to={"/profile/" + user[1]}
							href="#"
							className="mention"
							key={result.length}
						>
							@{user[0]}
						</Link>
					);
			}
			result.push(<span key={result.length}>{_text.join(" ")}</span>);
			// @"username"@"username"
		}
		// console.log("mentions", names);
		return result;
		return String(comment).replace("@", "#");
	}
	return (
		<div className="comment">
			{_user !== undefined && _user.role === "admin" ? (
				<span className="cDelete" onClick={delete_comment}>
					🗑️
				</span>
			) : null}
			<Link
				to={"/profile/" + user_id}
				className="ubadge"
				style={{ flexShrink: 0 }}
			>
				<img src={pfp} alt="pfp" />
				<span className="cUser" onClick={visit_user}>
					{username}
				</span>
			</Link>
			<span className="content">
				{render_comment(content).map((c) => {
					return c;
				})}
			</span>
			{_user.user_id !== user_id && _users[user_id] && (
				<button className="reply" onClick={() => props.mentionUser(user_id)}>
					<i class="fas fa-reply"></i>
				</button>
			)}
		</div>
	);
}
export default Comment;
