import { useState, useEffect, useContext, useRef } from "react";
import { MembersContext, UserContext } from "../Main/Contexts";
import UserListItem from "./UserListItem";
import { getDoc, doc } from "@firebase/firestore";
import { _dbRef } from "../Main/firebase";
import { useParams } from "react-router";
function UserList(props) {
	//console.log("friends are",users);
	const { users } = props;
	const { user_id } = useParams();
	const { _user, _setUser } = useContext(UserContext);
	const { _users, _setUsers } = useContext(MembersContext);
	const [cached, setCached] = useState(false);
	async function check_cache() {
		if (users && Object.entries(users).length > 0) {
			var _toCache = {};
			for (let i = 0; i < users.length; i++) {
				if (_users[users[i]] === undefined && (!_user || users[i] !== _user.user_id)) {
					if (_toCache[users[i]] !== undefined) continue;
					/*{
                        if(i < users.length - 1) continue;
                        else _setUsers( {..._users, ..._toCache});
                    }*/
					const userRef = doc(_dbRef, "users", users[i]);
					const _doc = await getDoc(userRef);
					if (_doc.exists()) {
						var _json = { user_id: _doc.id, ..._doc.data() };
						_toCache[users[i]] = _json;
						console.log("ADDED to cache (user list component)", _json);
					} else console.log("COULDNT FIND " + users[i]);
				}
			}
			if (Object.entries(_toCache).length > 0)
				_setUsers({ ..._users, ..._toCache });
		}
	}
	useEffect(() => {
		if(!props.buddies)
		{
			setCached(true);
		}
	}, []);
	useEffect(() => {
		if(!props.buddies) return;
		setCached(false);
		popupRef.current.style.display = "none";
		document.body.style.overflow = null;
	}, [user_id]);
	useEffect(async () => {
		if (cached) await check_cache();
	}, [cached]);
	const popupRef = useRef();
	function toggle_list(toggle=null) {
		//console.log("toggling");
		if (users.length === 0) return;
		if(!props.buddies)
		{
			if(props.onClose) props.onClose();
			return;
		};
		if (toggle == true) {
			// show it
			popupRef.current.style.display = "block";
			document.body.style.overflow = "hidden";
			setCached(true);
		} else {
			popupRef.current.style.display = "none";
			document.body.style.overflow = null;
		}
		//if(props.onClose) props.onClose();
	}
	return (
		<div>
			{props.buddies && (
				<button className="buddies" onClick={() => toggle_list(true)}>
					<p>{users.length} Buddies</p>
				</button>
			)}
			<div ref={popupRef}>
				<div
					className="overlay"
					style={{ display: "block" }}
					onClick={() => {toggle_list(false); if(props.onClose) props.onClose();}}
				/>
				<div className="buddiesFrame center">
					{users &&
						users.length > 0 &&
						users.map((buddy, i) => {
							return (
								<UserListItem buddy={buddy} key={i} toggle={toggle_list} />
							);
						})}
				</div>
			</div>
		</div>
	);
}
export default UserList;
