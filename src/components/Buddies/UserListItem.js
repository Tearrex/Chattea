import { useEffect, useContext, useState } from "react";
import { useNavigate } from "react-router";
import { MembersContext, UserContext } from "../Main/Contexts";
import BuddyButton from "./BuddyButton";

function UserListItem(props) {
	const navigate = useNavigate();
	const { _user, _setUser } = useContext(UserContext);
	const { _users, _setUsers } = useContext(MembersContext);
	const [name, setName] = useState("User");
	const [pfp, setPfp] = useState("/default_user.png");
	/*
    The user data is fetched in the BuddyList component,
    we just wait for it with this hook
    */
	useEffect(() => {
		if (_user !== undefined && _user.user_id === props.buddy) {
			setName(_user.username);
			setPfp(_user.pfp);
		} else if (_users[props.buddy] !== undefined) {
			setName(_users[props.buddy].username);
			setPfp(_users[props.buddy].pfp);
		}
	}, [_user, _users, props]);
	function go_to_profile() {
		if (props.chat) {
			return props.onSelect(props.buddy);
		}
		navigate("/u/" + props.buddy);
		props.toggle();
	}
	return (
		<div className="buddyItem">
			<div className="buddy" onClick={go_to_profile}>
				<div
					className="pfp niceClip"
					style={{ backgroundImage: "url(" + pfp + ")" }}
					onClick={(e) => e.preventDefault()}
				/>
				@{name}
				{props.smile && " 🙂"}
			</div>
			{_user && props.buddy !== _user.user_id && !props.chat && (
				<BuddyButton buddy={props.buddy} />
			)}
		</div>
	);
}

export default UserListItem;
