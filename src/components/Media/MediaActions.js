import {
	addDoc,
	arrayRemove,
	arrayUnion,
	collection,
	deleteDoc,
	doc,
	serverTimestamp,
	setDoc,
	updateDoc,
} from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { useContext, useEffect, useState } from "react";
import { copy_text } from "../../App";
import { UserContext } from "../Main/Contexts";
import { _dbRef, _storageRef } from "../Main/firebase";

function MediaActions(props) {
	const { _user, _setUser } = useContext(UserContext);
	const { focusPost, setFocusPost } = props;
	function closeModal() {
		setFocusPost(null);
	}
	async function delete_post() {
		var role = "yourself";
		if (_user.user_id !== focusPost[1].user_id) role = "moderator";
		if (!window.confirm(`Delete this post as ${role}?`)) return;
		const postRef = doc(_dbRef, "posts", focusPost[0]);
		await deleteDoc(postRef);
		const smilesRef = doc(
			_dbRef,
			"users/" + focusPost[1].user_id + "/smiles/" + focusPost[0]
		);
		await deleteDoc(smilesRef);
		//console.log("deleted?");
		const imgRef = ref(
			_storageRef,
			"images/" + focusPost[1].user_id + "/" + focusPost[0]
		);
		try {
			await deleteObject(imgRef);
		} catch (e) {
			console.log(e);
		}
		alert("Removed post " + focusPost[0]);
		setFocusPost(null); // close modal
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
	return (
		<>
			{focusPost !== null && (
				<>
					{!report && (
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
							<button className="high" onClick={() => setReport(true)}>
								<i class="fas fa-flag"></i> Report
							</button>
							{_user && _user.user_id === focusPost[1].user_id && (
								<button>
									<i class="fas fa-thumbtack"></i> Pin post
								</button>
							)}
							{focusPost[1].user_id !== _user.user_id && (
								<button onClick={buddify}>
									{!_user.buddies.includes(focusPost[1].user_id) ? (
										<>
											<i class="fas fa-user-plus"></i> Add
										</>
									) : (
										<>
											<i class="fas fa-user-minus"></i> Remove
										</>
									)}{" "}
									Buddy
								</button>
							)}
							<button
								onClick={() =>
									copy_text(
										"https://chattea.me/post/" + focusPost[0],
										closeModal
									)
								}
							>
								<i class="fas fa-link"></i> Copy Link
							</button>
							<button onClick={closeModal}>Cancel</button>
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
									<p style={{ margin: 0, paddingBottom: "10px", opacity: 0.8 }}>
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
