import { useContext, useEffect, useState, useRef } from "react";
import { useParams } from "react-router";
import { updateDoc, doc, getDoc } from "@firebase/firestore";
import { uploadBytesResumable, ref, getDownloadURL } from "firebase/storage";

import MediaFeed from "../Media/MediaFeed";
import { MembersContext, UserContext } from "../Main/Contexts";
import { _storageRef, _dbRef } from "../Main/firebase";
import BuddyButton from "../Buddies/BuddyButton";
import UserList from "../Buddies/UserList";

function ProfilePage(props) {
	const { _user, _setUser } = useContext(UserContext);
	const { _users, _setUsers } = useContext(MembersContext);
	const { user_id } = useParams();
	const [canSave, setSave] = useState(false);
	const [uploading, setUploading] = useState(false);
	//profile picture
	const [userPfp, setUserPfp] = useState("default_user.png");
	const [pfpFile, setPfpFile] = useState(null);
	const [origPfp, setOrigPfp] = useState("");
	const [pfpSaved, setPfpSaved] = useState(false);
	// banner
	const [userBanner, setBanner] = useState("");
	const [bannerFile, setBannerFile] = useState(null);
	const [origBanner, setOrigBanner] = useState("");
	const [bannerSaved, setBannerSaved] = useState(false);

	const [profile, setProfile] = useState(null);

	/*
    Instead of using states for original values, utilize
    the user's context and update on top of that instead
    */
	const [inputName, setName] = useState("");
	const [bioText, setBio] = useState("");
	const nameCharLimit = 20;
	const bioCharLimit = 150;
	const profileCard = useRef();
	const bannerChanger = useRef();
	const pfpChanger = useRef();
	useEffect(() => {
		profile_cleanup();
	}, [_user, _users, user_id]);

	// used to rerender the main profile card
	// every time the client jumps between profile pages
	async function profile_cleanup() {
		/*
        If the user is viewing a profile other than their own,
        don't allow them to edit the input fields.
        */
		var isUserSelf = _user && user_id === _user.user_id;
		var inputs = profileCard.current.getElementsByTagName("input");
		for (let i = 0; i < inputs.length; i++) {
			if (inputs[i].className === "addBuddy") continue;
			inputs[i].disabled = !isUserSelf;
		}
		if (isUserSelf) {
			bannerChanger.current.style.opacity = null;
			pfpChanger.current.style.display = "block";
		} else {
			bannerChanger.current.style.opacity = "0";
			pfpChanger.current.style.display = "none";
		}
		// if it's the user's own profile, set their information
		if (_user !== undefined && user_id === _user.user_id) {
			setProfile(_user);
		}
		// otherwise, grab info from the _users state or fetch from firestore
		else {
			if (!_users[user_id]) {
				var localUsers = localStorage.getItem("users");
				if (localUsers) {
					localUsers = JSON.parse(localUsers);
					if (localUsers[user_id]) {
						return console.log("waiting for cache to load...");;
					}
				}
				console.log(`${user_id} != ${profile ? profile.user_id : "null"}`);
				const userRef = doc(_dbRef, "users", user_id);
				const _doc = await getDoc(userRef);
				if (_doc.exists()) {
					const _profile = { user_id: _doc.id, ..._doc.data() };
					_setUsers({ ..._users, [_doc.id]: _profile });
				}
			}
			else {
				setProfile(_users[user_id]);
			}
			//console.log("Author's profile", _users[user_id]);
		}
	}
	useEffect(() => {
		if (profile) {
			setName(profile.username);
			setUserPfp(profile.pfp);
			setBio(profile.about);
			if (profile["banner"] !== undefined) setBanner(profile.banner);
			console.log("Author's profile", profile);
		}
	}, [profile]);
	// write firebase rules
	function change_name(e) {
		if (e.target.value.length > nameCharLimit) return;
		setName(e.target.value);
	}
	function change_bio(e) {
		if (e.target.value.length > bioCharLimit) return;
		setBio(e.target.value);
	}

	const usernameField = useRef();
	const [_msg, changeMsg] = useState("");

	const saveOptions = useRef();
	useEffect(() => {
		if (!_user) return;
		if (String(inputName).trim() === "") {
			// add red border when name field is empty
			usernameField.current.style.border = "3px solid #f00";
			setSave(false);
			changeMsg("Name missing!");
		} else {
			usernameField.current.style.border = null;
			// show save options if the name field has been altered
			if (inputName !== _user.username && user_id === _user.user_id)
				setSave(true);
			else {
				if (profile && userPfp === profile.pfp) setSave(false);
			}
		}
	}, [inputName]);
	useEffect(() => setSave(profile && bioText !== profile.about), [bioText]);
	function update_pfp(e) {
		console.log(e.target.files[0]);
		setSave(true);
		setPfpFile(e.target.files[0]);
		setUserPfp(URL.createObjectURL(e.target.files[0]));
	}
	function update_banner(e) {
		console.log(e.target.files[0]);
		setSave(true);
		setBannerFile(e.target.files[0]);
		setBanner(URL.createObjectURL(e.target.files[0]));
	}
	function revert_changes() {
		setName(profile.username);
		setUserPfp(profile.pfp);
		setPfpFile(null);
		setBanner(profile.banner);
		setBannerFile(null);
		setSave(false);
		setBio(profile.about);
		inputRef.current.value = null;
		//closePopup();
	}
	function submit_changes() {
		if (!canSave || uploading) return;
		if (profile && userPfp !== profile.pfp) {
			// upload new pfp
			console.log("uploading profile picture");
			setUploading(true);
			const _ref = ref(
				_storageRef,
				"profiles/" + _user["user_id"] + "/" + _user["user_id"]
			);
			const task = uploadBytesResumable(_ref, pfpFile);
			task.on(
				"state_changed",
				(s) => {
					const progress = (s.bytesTransferred / s.totalBytes) * 100;
					changeMsg(String(Math.round(progress)) + "%");
				},
				(error) => {
					changeMsg("FAILED!");
					console.log(error);
				},
				() => {
					getDownloadURL(task.snapshot.ref).then((downloadURL) => {
						console.log("File available at", downloadURL);
						setUserPfp(downloadURL);
						setPfpSaved(true);
						//changesRef = {...changesRef, pfp:downloadURL};
					});
				}
			);
		} else setPfpSaved(true);
		if (userBanner !== origBanner) {
			// upload new banner
			console.log("uploading banner");
			setUploading(true);
			const _ref = ref(
				_storageRef,
				"banners/" + _user["user_id"] + "/" + bannerFile.name
			);
			const task = uploadBytesResumable(_ref, bannerFile);
			task.on(
				"state_changed",
				(s) => {
					const progress = (s.bytesTransferred / s.totalBytes) * 100;
					changeMsg(String(Math.round(progress)) + "%");
				},
				(error) => {
					changeMsg("FAILED!");
					console.log(error);
				},
				() => {
					getDownloadURL(task.snapshot.ref).then((downloadURL) => {
						console.log("File available at", downloadURL);
						setBanner(downloadURL);
						// ^ it should stick with the user's local file to save bandwidth
						// change this later
						setBannerSaved(true);
					});
				}
			);
		} else setBannerSaved(true);
		changeMsg("");
		setSave(false);
		setUploading(false);
	}
	useEffect(() => {
		if (bannerSaved === true && pfpSaved === true) {
			var changesRef = {};
			if (inputName !== _user.username && inputName !== "") {
				changesRef["username"] = inputName;
			}
			if (userPfp !== origPfp) {
				setUserPfp(userPfp);
				setOrigPfp(userPfp);
				changesRef["pfp"] = userPfp;
			}
			if (userBanner !== origBanner) {
				setOrigBanner(userBanner);
				changesRef["banner"] = userBanner;
			}
			if (profile && bioText !== profile.about) {
				var trimmedBio = String(bioText).trimStart();
				changesRef["about"] = trimmedBio;
			}
			const docRef = doc(_dbRef, "users", _user["user_id"]);
			updateDoc(docRef, changesRef);
			console.log("changes", changesRef);
			//setOrigName(inputName);
			_setUser({ ..._user, ...changesRef });
			setBannerSaved(false);
			setPfpSaved(false);
			setSave(false);
			setUploading(false);
		}
	}, [bannerSaved, pfpSaved]);
	useEffect(() => {
		if (canSave === true) {
			saveOptions.current.style.display = "flex";
		} else {
			if (uploading === false) saveOptions.current.style.display = "none";
		}
	}, [canSave]);
	useEffect(() => {
		if (uploading === false) saveOptions.current.style.display = "none";
	}, [uploading]);
	const inputRef = useRef();
	const bannerRef = useRef();
	return (
		<div className="homeWrapper">
			<div id="home" className="clamper">
				<div
					ref={profileCard}
					className="mainProfile"
					id="mainProfile"
					style={{ width: "100%" }}
				>
					<div
						className="niceClip"
						style={{
							backgroundImage: "url('" + userBanner + "')",
							position: "relative",
						}}
					>
						<label
							ref={bannerChanger}
							className="bannerBtn niceClip"
							style={{
								backgroundImage: "url('/cam_icon.svg')",
								borderRadius: "0",
							}}
						>
							<input
								ref={bannerRef}
								type="file"
								accept=".jpg, .png"
								onChange={update_banner}
							/>
						</label>
						<div className="primaryInfo profileMod">
							<div className="pfpNest">
								<label
									ref={pfpChanger}
									style={{
										backgroundImage: "url('/cam_icon.svg')",
										borderRadius: "0",
										opacity: _user && _user.pfp === "/default_user.png" ? "1" : null,
									}}
								>
									<input
										ref={inputRef}
										type="file"
										accept=".jpg, .png"
										onChange={update_pfp}
									/>
								</label>
								<div
									style={{
										backgroundImage: "url(" + userPfp + ")",
										borderRadius: "0",
									}}
									className="profilePic"
								/>
							</div>
							<div className="nameField">
								<input
									ref={usernameField}
									type="text"
									value={inputName}
									onChange={(e) => change_name(e)}
								/>
								<p className="charCount">
									{inputName ? inputName.length : "0"}/{nameCharLimit}
								</p>
							</div>
						</div>
					</div>
					<div className="aboutSection">
						{/**<textarea rows="3" cols="60"
                            placeholder={user_id === _user["user_id"] ? "Brief description about you...":"No description"}
                                onChange={(e) => change_bio(e)} value={bioText} maxLength="150"></textarea> */}
						<input
							className="userBio"
							type="text"
							value={bioText}
							placeholder={
								_user !== undefined && user_id === _user["user_id"]
									? "Don't be a stranger..."
									: "No description"
							}
							onChange={(e) => change_bio(e)}
						/>
					</div>
					<div ref={saveOptions} className="actions">
						<button
							onClick={submit_changes}
							style={{ backgroundColor: "#3498DB" }}
						>
							{!uploading ? "Save" : "Uploading..."}
						</button>
						<button onClick={revert_changes}>
							{!uploading ? "Cancel" : _msg}
						</button>
					</div>
					<div className="userInfo">
						<p>
							Joined <span>{profile && profile.joined}</span>
						</p>
						<div className="buddyInfo">
							<UserList users={profile ? profile.buddies : []} buddies />
							{_user !== undefined && _user.user_id !== user_id && _users[user_id] ? (
								<BuddyButton buddy={user_id} />
							) : null}
						</div>
					</div>
				</div>
				{((_user && _user.user_id === user_id) || _users[user_id]) && <MediaFeed focus={user_id} />}
			</div>
		</div>
	);
}
export default ProfilePage;
