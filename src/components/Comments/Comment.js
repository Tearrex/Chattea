import { useContext, useState, useEffect } from "react";
import { MembersContext, UserContext } from "../Main/Contexts";
import { deleteDoc, doc } from "@firebase/firestore";
import { _dbRef } from "../Main/firebase";
import { useNavigate } from "react-router";
import { Link } from "react-router-dom";
function Comment(props) {
	const navigate = useNavigate();
	const { _user, _setUser } = useContext(UserContext);
	const { _users, _setUsers } = useContext(MembersContext);
	const { date, content, user_id, id } = props.comment;

	const [pfp, setPfp] = useState("/default_user.png");
	const [username, setUsername] = useState("LOADING");
	useEffect(() => {
		if (user_id === _user["user_id"]) {
			setPfp(_user.pfp);
			setUsername(_user.username);
		} else if (_users[user_id] !== undefined) {
			setPfp(_users[user_id].pfp);
			setUsername(_users[user_id].username);
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
			<span className="content">{content}</span>
		</div>
	);
}
export default Comment;