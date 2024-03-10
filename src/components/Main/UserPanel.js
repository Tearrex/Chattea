import { useContext, useRef, useState, useEffect } from "react";
import { _dbRef, _storageRef, logout, useAuth } from "./firebase";
import { useNavigate } from "react-router";
import { MembersContext, UserContext } from "./Contexts";
function UserPanel(props) {
	const navigate = useNavigate();
	const currentUser = useAuth();
	const { _user, _setUser } = useContext(UserContext);
	const { _users, _setUsers } = useContext(MembersContext);
	const [pfp, setPfp] = useState("");
	const [user_id, setUserID] = useState("");
	const [show, setShow] = useState(false);
	const [openSettings, setOpenSettings] = useState(false);
	const [deleting, setDeleting] = useState(false);
	useEffect(() => {
		if (_user !== undefined) {
			setPfp(_user["pfp"]);
			setUserID(_user["user_id"]);
		} else setPfp(null);
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
		localStorage.removeItem("privateKey");
		localStorage.removeItem("publicKey");
		localStorage.removeItem("channel_reads");
		navigate("/");
		_setUser(undefined);
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
	async function delete_account() {
		if (!deleting) return setDeleting(true);
		if (!window.confirm(`Account deletion occurs immediately, are you sure?`))
			return;

		const token = await currentUser.getIdToken(true);
		await fetch("https://deleteuser-oj5fff4opa-uc.a.run.app", {
			method: "POST",
			headers: {
				"Content-Type": "application/json;charset=UTF-8",
			},
			body: JSON.stringify({
				token,
				user_id: _user.user_id,
			}),
		});
		await logout();
		_setUser(null);
		localStorage.removeItem("publicKey");
		localStorage.removeItem("privateKey");
		navigate("/");
	}
	return (
		<>
			{openSettings && (
				<>
					<div id="postActionModal">
						<p className="repHead">Chattea Settings</p>
						<div className="repBody">
							{/* <div className="setting">
								<label for="profanity">Profanity filter</label>
								<input type="checkbox" id="profanity" />
							</div> */}
							{deleting && (
								<>
									<p>Delete yourself from Chattea?</p>
									<ul style={{ listStyle: "lower-roman" }}>
										<li>All your posts</li>
										<li>All your images</li>
										<li>Your user profile</li>
									</ul>
								</>
							)}
							{deleting && (
								<button onClick={() => setDeleting(false)}>
									<i className="fas fa-times" /> Cancel
								</button>
							)}
							<button className="deleteAcc" onClick={delete_account}>
								<i className="fas fa-user-slash" /> Delete Account
							</button>
							{/* <button>
								<i className="fas fa-key" /> Change Password
							</button> */}
							{!deleting && (
								<>
									<button onClick={() => navigate("/#faq")}>
										<i className="fas fa-question-circle" />
										FAQ
									</button>
									<button onClick={logout_user}>
										<i className="fas fa-sign-out-alt"></i> log out
									</button>
								</>
							)}
						</div>
					</div>
					<div
						className="postActionScreen"
						onClick={() => setOpenSettings(false)}
					></div>
				</>
			)}
			<div
				ref={selfRef}
				className="welcome"
				id="welcome"
				style={{ zIndex: "-5", opacity: "0" }}
				onTransitionEnd={hide}
			>
				<div className="profile">
					{_user &&
						(_user.pfp == "/default_user.png" || _user.about === "") &&
						!window.location.href.endsWith("/u/" + _user.user_id) && (
							<span
								className="hint"
								onClick={() => navigate("/u/" + _user.user_id)}
							>
								🎨 Customize your profile
							</span>
						)}
					<img
						className="pfp"
						style={{ objectFit: "cover", cursor: "pointer" }}
						src={pfp}
						onLoad={(e) => setShow(true)}
						onClick={(e) => navigate("/u/" + user_id)}
						alt="profile pic"
					/>
					{props.notifCount > 0 && (
						<button attention="true" onClick={props.notifEvent}>
							<i className="fas fa-bell"></i>
						</button>
					)}
					{_user && (
						<button onClick={() => setOpenSettings(true)}>
							<i className="fas fa-cog" />
						</button>
					)}
				</div>
			</div>
		</>
	);
}
export default UserPanel;
