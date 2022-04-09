import { useContext, useRef, useState, useEffect } from 'react';
import { logout, useAuth } from './firebase'
import { useNavigate } from 'react-router';
import { MembersContext, UserContext } from './Contexts';
function UserPanel (props)
{
    const navigate = useNavigate();
    const {_user, _setUser} = useContext(UserContext);
    const {_users, _setUsers} = useContext(MembersContext);
    const [pfp, setPfp] = useState("");
    const [user_id, setUserID] = useState("");
    const [show, setShow] = useState(false);
    useEffect(() => {
        if(_user !== undefined)
        {
            setPfp(_user["pfp"]);
            setUserID(_user["user_id"]);
        }
        else setPfp(null);
    }, [_user]);
    const selfRef = useRef();
    async function logout_user() {
			/*if(_users[_user.user_id] === undefined)
        {
            // add the current user's data to the _users state
            // we make sure to save all of their edits,
            // so it will remain up to date
            _setUsers({..._users, _user});
        }*/
			/*var _localUsers = localStorage.getItem("users");
        if(_localUsers)
        {
            var count = Object.entries(JSON.parse(_localUsers)).length;
            localStorage.removeItem("users");
            console.log(`Cleared ${count} users from localStorage`);
            // alternatively, we can store a timestamp with the _users object
            // to determine when the client should refresh the cache with new data.
            // in case users have made changes to their profiles since the last snapshot
        }*/
			setShow(false);
			await logout();
			_setUser(undefined); // navigate("/");
		}
		useEffect(() => {
			if (show) {
				selfRef.current.style.zIndex = null;
				selfRef.current.style.opacity = "1";
			} else selfRef.current.style.opacity = "0";
		}, [show]);
		function hide() {
			if (!show) selfRef.current.style.zIndex = "-5";
		}
		return (
			<div
				ref={selfRef}
				className="welcome"
				id="welcome"
				style={{ zIndex: "-5", opacity: "0", marginRight: "10px" }}
				onTransitionEnd={hide}
			>
				<img
					className="pfp"
					style={{ objectFit: "cover", cursor: "pointer" }}
					src={pfp}
					onLoad={(e) => setShow(true)}
					onClick={(e) => navigate("/profile/" + user_id)}
					alt="profile pic"
				/>
				<div className="userOptions">
					<p>▼</p>
					<div className="mpContent">
						{/**verified === false ?
                        <button className="verifyEmail"><span>📧</span>Verify</button>
                    : null */}
						<button className="logout stealthBtn" onClick={logout_user}>
							log out
						</button>
						<button className="stealthBtn" onClick={() => navigate("/faq")}>
							FAQ
						</button>
					</div>
				</div>
				<div className="notifMain" onClick={props.notifEvent}>
					<p>🔔</p>
					<span
						style={{
							backgroundColor: props.notifCount === 0 ? "#8f8f8f" : "#E74C3C",
						}}
					>
						{props.notifCount}
					</span>
				</div>
			</div>
		);
}
export default UserPanel;