import {
	addDoc,
	arrayRemove,
	arrayUnion,
	collection,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	limit,
	orderBy,
	query,
	serverTimestamp,
	setDoc,
	updateDoc,
} from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { useContext, useEffect, useState } from "react";
import { copy_text } from "../../App";
import { MembersContext, UserContext } from "../Main/Contexts";
import { _dbRef, _storageRef } from "../Main/firebase";
import { Link, useNavigate } from "react-router-dom";

function MediaActions(props) {
	const { _user, _setUser } = useContext(UserContext);
	const { _users, _setUsers } = useContext(MembersContext);
	const { focusPost, setFocusPost, visibilityContext } = props;
	const navigate = useNavigate();
	function closeModal() {
		if (mergeStatus > 0) return;
		visibilityContext.setChangeVisibility(false);
		if (setFocusPost) setFocusPost(null);
	}
	async function delete_post() {
		let role = "yourself";
		if (_user.user_id !== focusPost[1].user_id) role = "moderator";
		if (!window.confirm(`Delete this post as ${role}?`)) return;

		const commentsRef = collection(
			_dbRef,
			// "users",
			// user_id,
			"posts",
			focusPost[0],
			"comments"
		);
		const commentsQuery = query(commentsRef);

		try {
			const snap = await getDocs(commentsQuery);
			if (snap.docs.length > 0) console.log(snap.docs.length, "docs found");
			snap.forEach(async (doc) => {
				await deleteDoc(doc.ref);
				console.log("deleted comment", doc.id);
			});
		} catch (e) {
			return alert("failed to delete", e.message);
		}

		const postRef = !focusPost[1].private
			? doc(_dbRef, "posts", focusPost[0])
			: doc(_dbRef, "users", focusPost[1].user_id, "posts", focusPost[0]);
		await deleteDoc(postRef);
		const smilesRef = doc(
			_dbRef,
			"users/" + focusPost[1].user_id + "/smiles/" + focusPost[0]
		);
		await deleteDoc(smilesRef);

		if (focusPost[1].image_url != "") {
			const imgRef = ref(
				_storageRef,
				"images/" + focusPost[1].user_id + "/" + focusPost[0]
			);
			try {
				await deleteObject(imgRef);
			} catch (e) {
				console.log(e);
			}
		}
		if (props.onDelete) props.onDelete(focusPost[0]);
		if (setFocusPost) setFocusPost(null); // close modal
	}
	function buddify() {
		const buddyRef = doc(_dbRef, "users/" + _user.user_id);
		var oldUser = _user;
		if (!_user.buddies.includes(focusPost[1].user_id)) {
			//add the user
			updateDoc(buddyRef, {
				buddies: arrayUnion(focusPost[1].user_id),
			}).then(() => {
				const _notifRef = doc(
					_dbRef,
					"users/" + focusPost[1].user_id + "/notifications/" + _user.user_id
				);
				try {
					setDoc(_notifRef, {
						type: "buddy",
						date: serverTimestamp(),
					})
						.then(console.log("user has been notified!"))
						.catch((e) => console.log("failed to notify user"));
				} catch (error) {
					console.log("failed to notify user");
				}
			});
			oldUser.buddies.push(focusPost[1].user_id);
		} else {
			// remove the user
			updateDoc(buddyRef, {
				buddies: arrayRemove(focusPost[1].user_id),
			});
			oldUser.buddies.splice(oldUser.buddies.indexOf(focusPost[1].user_id), 1);
		}
		_setUser(oldUser);
		closeModal();
	}
	const [report, setReport] = useState(false);
	const [reported, setReported] = useState(false);
	const [vchanged, setVchanged] = useState(false);
	async function submit_report() {
		var report = document.getElementById("reptype").value;
		if (report === "PICK A CATEGORY") return;
		try {
			const docRef = await addDoc(collection(_dbRef, "reports"), {
				reportType: report,
				reportDate: serverTimestamp(),
				reportBy: _user.user_id,
				reportPost: focusPost[0],
				reportUser: focusPost[1].user_id,
				resolved: false,
			});
			console.log("Created report " + docRef.id);
			setReported(true);
		} catch (e) {
			console.log(e);
		}
	}
	const [pickedPrivateVis, setPickedPrivateVis] = useState(
		focusPost[1].private == true
	);
	const [mergeStatus, setMergeStatus] = useState(0);
	useEffect(() => {
		if (mergeStatus === 1)
			setTimeout(() => {
				console.log("private is", focusPost[1].private);
				const _doc =
					focusPost[1].private == true
						? doc(
								_dbRef,
								"users/" + focusPost[1].user_id + "/posts/" + focusPost[0]
						  )
						: doc(_dbRef, "posts", focusPost[0]);

				getDoc(_doc).then((snap) => {
					if (snap.exists()) {
						deleteDoc(snap.ref)
							.then(() => {
								setMergeStatus(2); // proceed to duplicate post
							})
							.catch((e) => {
								alert("Failed to move post");
								setMergeStatus(0);
							});
					}
				});
			}, 1000);
		else if (mergeStatus === 2)
			setTimeout(async () => {
				const _newDoc = focusPost[1].private
					? doc(_dbRef, "posts/" + focusPost[0])
					: doc(
							_dbRef,
							"users/" + focusPost[1].user_id + "/posts/" + focusPost[0]
					  );
				try {
					await setDoc(_newDoc, {
						...focusPost[1],
						private: !(focusPost[1].private || false),
					});
				} catch (e) {
					alert("failed to duplicate", e.message);
					return setMergeStatus(0);
				}
				if (!focusPost[1].private)
					navigate("/u/" + focusPost[1].user_id + "/p");
				else navigate("/post/" + focusPost[0]);
				closeModal();
			}, 1000);
	}, [mergeStatus]);
	function start_merge() {
		console.log([pickedPrivateVis, focusPost[1].private]);
		if (
			(pickedPrivateVis && focusPost[1].private === true) ||
			(!pickedPrivateVis && !focusPost[1].private !== true)
		)
			return;
		setMergeStatus(1);
	}
	return (
		<>
			{focusPost !== null && (
				<>
					{!report && visibilityContext.changeVisibility === false && (
						<div id="postActionModal">
							{_user &&
								(_user.role === "admin" ||
									_user.user_id === focusPost[1].user_id) && (
									<button className="high" onClick={delete_post}>
										{_user && _user.user_id !== focusPost[1].user_id && (
											<i class="fas fa-bolt"></i>
										)}
										Delete Post
									</button>
								)}
							{_user && (
								<button className="high" onClick={() => setReport(true)}>
									Report Post
								</button>
							)}
							{_user && _user.user_id === focusPost[1].user_id && (
								<button>
									<i class="fas fa-thumbtack"></i> Pin post
								</button>
							)}
							{_user && _users[focusPost[1].user_id] && (
								<button
									onClick={() => navigate("/chats/" + focusPost[1].user_id)}
								>
									Message <span>@{_users[focusPost[1].user_id].username}</span>
								</button>
							)}
							{_user && focusPost[1].user_id !== _user.user_id && (
								<button onClick={buddify}>
									{!_user.buddies.includes(focusPost[1].user_id)
										? "Add"
										: "Remove"}{" "}
									<span>
										@
										{_users[focusPost[1].user_id] &&
											_users[focusPost[1].user_id].username}
									</span>
								</button>
							)}
							<button
								onClick={() =>
									copy_text(
										window.location.origin + "/post/" + focusPost[0],
										closeModal
									)
								}
							>
								<i class="fas fa-link"></i> Copy Link
							</button>
							<button onClick={closeModal}>Cancel</button>
						</div>
					)}
					{visibilityContext.changeVisibility === true && (
						<div id="postActionModal">
							<p className="repHead">Post Privacy</p>
							{!vchanged ? (
								<>
									<div className="privacyModes" style={{ position: "initial" }}>
										<button
											active={!pickedPrivateVis && "true"}
											onClick={() => setPickedPrivateVis(false)}
											disabled={
												!_user ||
												(_user.user_id != focusPost[1].user_id &&
													_user.role != "admin")
											}
										>
											<i className="fas fa-globe-americas"></i> Explore
										</button>
										<button
											active={pickedPrivateVis && "true"}
											onClick={() => setPickedPrivateVis(true)}
											disabled={
												!_user ||
												(_user.user_id != focusPost[1].user_id &&
													_user.role != "admin")
											}
										>
											<i className="fas fa-user-friends"></i> Buddies
										</button>
									</div>
								</>
							) : (
								<p style={{ opacity: 0.8 }}>
									We received your report and will review this post momentarily.
								</p>
							)}
							{mergeStatus > 0 && (
								<div className="mergestatus">
									<p>
										{mergeStatus === 1 && (
											<>
												<i className="fas fa-cog" /> Ejecting old post...
											</>
										)}
										{mergeStatus === 2 && (
											<>
												<i className="fas fa-cog" /> Creating new post...
											</>
										)}
									</p>
								</div>
							)}
							{mergeStatus === 0 && (
								<>
									{!pickedPrivateVis ? (
										<p className="private">
											Anyone can see{" "}
											{(_users[focusPost[1].user_id] &&
												_users[focusPost[1].user_id].username + "'s ") ||
												(_user &&
													_user.user_id == focusPost[1].user_id &&
													"your ")}
											post
											<br />
											{mergeStatus === 0 && <Link to="/#faq">Learn more.</Link>}
										</p>
									) : (
										<p className="private">
											Only{" "}
											{(_users[focusPost[1].user_id] &&
												_users[focusPost[1].user_id].username + "'s ") ||
												(_user &&
													_user.user_id == focusPost[1].user_id &&
													"your ")}
											buddies can see this post.
											<br />
											{mergeStatus === 0 && <Link to="/#faq">Learn more.</Link>}
										</p>
									)}
									{(focusPost[1].private === true) != pickedPrivateVis && (
										<button className="reportBtn hcenter" onClick={start_merge}>
											<i className="fas fa-cog" /> Start Change
										</button>
									)}
								</>
							)}
						</div>
					)}
					{report && (
						<div id="postActionModal">
							{!reported ? (
								<p className="repHead">Why are you reporting this post?</p>
							) : (
								<p className="repHead">Thanks for your help!</p>
							)}
							{!reported ? (
								<>
									<select
										name="reptype"
										className="reportSelect hcenter"
										id="reptype"
									>
										<option>PICK A CATEGORY</option>
										<option value="spam">Spamming / Repetitive</option>
										<option value="sex">Nudity / Sexualized Content</option>
										<option value="hate">Hate Speech / Discrimination</option>
										<option value="danger">Violence / Dangerous Acts</option>
										<option value="source">
											Sourcing / Illegal Distribution
										</option>
										<option value="scam">Scam / Fraud / Bait Links</option>
										<option value="slander">
											Blackmail / Slander / Misinformation
										</option>
									</select>
									<p
										style={{ margin: 0, paddingBottom: "10px", opacity: 0.8 }}
										className="subText"
									>
										Keep Chattea safe, please don't abuse this form...
									</p>
								</>
							) : (
								<p style={{ opacity: 0.8 }}>
									We received your report and will review this post momentarily.
								</p>
							)}
							{!reported && (
								<button className="reportBtn hcenter" onClick={submit_report}>
									Submit Report
								</button>
							)}
						</div>
					)}
					<div className="postActionScreen" onClick={closeModal}></div>
				</>
			)}
		</>
	);
}

export default MediaActions;
