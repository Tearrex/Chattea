//import pfp from './default_user.png'
//import cam from './cam_icon.png'
import { useContext, useEffect, useRef, useState } from "react";
import { useAuth, _storageRef, _dbRef } from "../Main/firebase";
import { uploadBytesResumable, ref, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import { UserContext } from "../Main/Contexts";
import { Timestamp, addDoc, setDoc, collection } from "firebase/firestore";
import imageCompression from "browser-image-compression";
import * as filter from "profanity-filter";
function Submitter(props) {
	const { _user, _setUser } = useContext(UserContext);
	const currentUser = useAuth();
	const [localFile, setLocalFile] = useState(null);
	const [cropMode, setCropMode] = useState(false);
	const [cropped, setCropped] = useState(false);
	const [cropSet, setCropSet] = useState(false);
	const [waiting, setWaiting] = useState(false); // waiting for firebase response?
	const [mobileCrop, setMobileCrop] = useState(false); // mouseover doesn't work on mobile

	const [spotifyToken, setSpotifyToken] = useState("");
	const [pickingTrack, setPickingTrack] = useState(false);
	const [pickedTrack, setPickedTrack] = useState(null);
	const [trackResults, setTrackResults] = useState([]);

	/*
	used to prevent the user from spamming, it starts to get expensive!
	this is only checked on the clientside, so it is still vulnerable.
	*/
	const [lastAction, setLastAction] = useState(0);
	const [cooldown, setCooldown] = useState(0);
	const cooldownIncrement = 10000;

	const subWarning = useRef();
	function onFileChange(e) {
		fileNest.current.style.maxHeight = "100%";
		console.log(e.target.files[0]);
		setLocalFile(e.target.files[0]);
	}
	const [imageSize, setImageSize] = useState(0);
	useEffect(() => {
		if (localFile !== null) {
			if (localFile.size >= 1000000) {
				subWarning.current.style.display = "flex";
				setImageSize((localFile.size / 1000000).toFixed(1));
			}
		} else {
			setCropMode(false);
			setCropSet(false);
			subWarning.current.style.display = "none";
			setImageSize(0);
			let gridBox = document.querySelector(".gridBox");
			if (gridBox) {
				gridBox.style.width = null;
				gridBox.style.height = null;
			}
		}
	}, [localFile]);
	function remove_image() {
		if (cropMode) {
			setCropSet(false);
			return setCropMode(false);
		}
		setCropped(false);
		setCaption("");
		imageField.current.value = null;
		setLocalFile(null);
		fileNest.current.style.maxHeight = "0";
	}
	const fileNest = useRef();
	const image = useRef();
	const imageField = useRef();

	const _progress = useRef();
	const [uploading, setUploading] = useState(false);
	const _textInput = useRef();
	const [_text, _setText] = useState("");
	const subButton = useRef();
	function change_text(e) {
		if (e.target.value.length > 100) return;
		_setText(e.target.value);
	}
	const [caption, setCaption] = useState("");
	function change_caption(e) {
		if (e.target.value.length > 45) return;
		setCaption(e.target.value);
	}
	const [canSave, setSave] = useState(false);

	const [compressing, setCompressing] = useState(false);
	const compProgress = useRef();
	async function compress_image(_file) {
		const _options = {
			maxSizeMB: 1,
			maxWidthOrHeight: 1280,
			useWebWorker: true,
			onProgress: (p) => {
				compProgress.current.style.maxWidth = "" + p + "%";
			},
		};
		try {
			setCompressing(true);
			const compressed = await imageCompression(_file, _options);
			console.log(`compressedFile size ${compressed.size / 1024 / 1024} MB`);
			setImageSize((compressed.size / 1000000).toFixed(1));
			setCompressing(false);
			return compressed;
		} catch (e) {
			console.log(e);
			setCompressing(false);
			return false;
		}
	}
	function search_song() {
		if (!spotifyToken || spotifyToken === "") return;
		let query = encodeURIComponent(_text.trim());
		console.log("Searching:", query);
		fetch(
			`https://api.spotify.com/v1/search?q=${query}&limit=5&market=US&type=track`,
			{
				headers: { Authorization: spotifyToken },
			}
		)
			.then((res) => res.json())
			.then((res) => {
				if (res.error) {
					if (String(res.error.message).includes("expired")) {
						// renew x token
						localStorage.removeItem("spotify_token");
						alert("Please try that again...");
						setSpotifyToken("");
					}
					return;
				}
				clear_audios();
				let results = res.tracks.items;
				results = Object.entries(results).filter((a) =>
					String(a[1].preview_url).startsWith("https://")
				);
				console.log("results", results);
				setTrackResults(results);
			});
	}
	async function postMessage(e) {
		e.preventDefault();
		if (!currentUser || canSave === false) return;
		if (uploading || compressing) return;
		if (_text.trim() === "" && localFile === null) return;
		if (lastAction > 0 && cooldown >= Date.now() - lastAction) {
			alert(
				"Spam Protection: Please wait " +
					((cooldown - (Date.now() - lastAction)) / 1000).toFixed(1) +
					" seconds before posting again."
			);
			return;
		}
		if (!pickingTrack && filter.clean(_text) !== _text)
			return alert("Please refrain from using provokative language.");
		if (pickingTrack) {
			return search_song();
		}
		const newPost = doc(collection(_dbRef, "posts"));
		let _content = _text;
		let _author = _user.user_id;
		let _caption = caption;
		let _track = null;
		if (pickedTrack) {
			// add track metadata to document
			_track = {
				name: pickedTrack.name,
				artist: pickedTrack.artists[0].name,
				url: pickedTrack.external_urls.spotify,
				preview_url: pickedTrack.preview_url,
				album_art:
					pickedTrack.album.images[pickedTrack.album.images.length - 1].url,
			};
		}
		if (localFile !== null) {
			setUploading(true);
			console.log("starting upload for PID: " + newPost.id);
			var _file = null;
			if (localFile.size >= 1000000) _file = await compress_image(localFile);
			else _file = localFile;
			const _ref = ref(_storageRef, "images/" + _author + "/" + newPost.id);
			if (_file === false) {
				// need to improve my error handles...
				alert("compression process failed!");
				return;
			}
			const task = uploadBytesResumable(_ref, _file);
			task.on(
				"state_changed",
				(s) => {
					const progress = (s.bytesTransferred / s.totalBytes) * 100;
					_progress.current.style.maxWidth = "" + progress + "%";
				},
				(error) => {
					alert(error);
				},
				() => {
					getDownloadURL(task.snapshot.ref).then((downloadURL) => {
						console.log(downloadURL);
						setDoc(newPost, {
							content: _content,
							track: _track,
							date: Timestamp.now(),
							image_url: downloadURL,
							user_id: _author,
							caption: _caption,
						});
						setCropped(false);
						setDoc(
							doc(_dbRef, "users/" + _user.user_id + "/smiles/" + newPost.id),
							{ smiles: [] }
						);
						remove_image();
						compProgress.current.style.maxWidth = "0%";
						setUploading(false);
						console.log("Post upload succesful!");
					});
				}
			);
		} else {
			try {
				const docRef = await addDoc(collection(_dbRef, "posts"), {
					content: _content,
					date: Timestamp.now(),
					image_url: "",
					track: _track,
					caption: "",
					user_id: _user.user_id,
				});
				await setDoc(
					doc(_dbRef, "users/" + _user.user_id + "/smiles/" + docRef.id),
					{ smiles: [] }
				);
				console.log("Created post " + docRef.id);
			} catch (e) {
				console.log(e);
			}
		}
		_setText("");
		setLastAction(Date.now());
		setCooldown(cooldown + cooldownIncrement);
	}
	useEffect(() => {
		if (_text.trim() === "" && localFile === null) setSave(false);
		else setSave(true);
	}, [_text, localFile]);
	useEffect(() => {
		if (!canSave) {
			subButton.current.style.opacity = "0.5";
			subButton.current.style.cursor = "default";
		} else {
			subButton.current.style.opacity = "1";
			subButton.current.style.cursor = "pointer";
		}
	}, [canSave]);
	useEffect(() => {
		if (pickingTrack && !spotifyToken) {
			let token = localStorage.getItem("spotify_token");
			if (token) return setSpotifyToken(token);
			else {
				// query cloud function for x token
				setTimeout(() => {
					fetch("https://helloworld-oj5fff4opa-uc.a.run.app/")
						.then((res) => res.text())
						.then((access_token) => {
							localStorage.setItem("spotify_token", access_token);
							setSpotifyToken(access_token);
						});
				}, 1000);
			}
		}
	}, [pickingTrack, spotifyToken]);
	function verify_error(e) {
		if (_user && !_user.verified) {
			e.preventDefault();
			return window.alert(
				"You must verify your email to upload images to Chattea.\n\nLogin again for the prompt."
			);
		}
	}
	function clear_audios() {
		const nest = document.querySelector("#audionest");
		if (!nest) return;

		const remains = nest.querySelectorAll("audio");
		for (let r = 0; r < remains.length; r++) {
			const _audio = remains[r];
			if (pickedTrack && _audio.getAttribute("src") == pickedTrack.preview_url)
				continue;
			_audio.pause();
			_audio.remove();
		}
	}
	function toggle_playback() {
		const audio = document.querySelector("audio");
		const track = document.querySelector("#mainTrack");
		if (audio.readyState === 4) {
			if (audio.paused) audio.play();
			else audio.pause();
			if (track) track.setAttribute("paused", !audio.paused);
		}
		return;
	}
	function switch_song(track) {
		// const audio = document.getElementById("audio");
		// audio.pause();
		// if (audio.getAttribute("src") === url) return;
		// audio.setAttribute("src", url);
		const nest = document.querySelector("#audionest");
		if (!nest) return;

		if (pickedTrack && pickedTrack.preview_url === track.preview_url)
			return toggle_playback();
		clear_audios();

		let audio = new Audio(track.preview_url);
		nest.appendChild(audio);
		try {
			setTimeout(() => {
				if (document.querySelector("audio").readyState === 2) {
					audio.play();
					setPickedTrack(track);
				} else {
					console.warn("player was not ready!!!", audio);
					audio.currentTime = 0;
					audio.play(); // try again, buffer issue?
					setPickedTrack(track);
				}
			}, 1000);
		} catch (e) {
			console.log("error playing");
			clear_audios();
		}
	}
	function toggle_music_view(e) {
		e.preventDefault();
		_setText(""); // clear search query
		if (!pickingTrack === true) document.getElementById("subTxt").focus();
		setPickingTrack(!pickingTrack);
	}
	function cancel_pick(e) {
		e.preventDefault();
		clear_audios();
		_setText(""); // clear search query
		setPickedTrack(null);
		setPickingTrack(false);
	}
	function confirm_pick(e) {
		e.preventDefault();
		clear_audios();
		_setText(""); // clear search query
		setPickingTrack(false);
	}
	function resize_grid() {
		if (!localFile || !cropMode) return;
		let scape = document.querySelector("#imageScape");
		let gridBox = document.querySelector(".gridBox");
		console.log("buggin", gridBox);
		if (!gridBox) return;

		let cropBtn = document.querySelector("#cropTool");
		if (cropBtn)
			cropBtn.style.display =
				scape.clientWidth == scape.clientHeight ? "none" : "block";
		console.log("cropbtn", cropBtn);

		if (scape.clientWidth < scape.clientHeight) gridBox.style.width = "100%";
		else gridBox.style.height = "100%";
	}
	function distance(a, b) {
		return -(a - b);
	}
	function move_grid(e) {
		if (!cropMode || cropSet) return;
		let canvas = document.querySelector("#imageScape");
		let canvasPos = canvas.getBoundingClientRect();

		let matrix = document.querySelector("#gridBox");
		let x = e.clientX,
			y = e.clientY;

		let middleX = canvasPos.x + canvasPos.width / 4;
		let middleY = canvasPos.height / 4 + canvasPos.y;

		console.log([x, y]);
		x = Math.min(
			Math.max(distance(middleX, x), 0),
			canvasPos.width - matrix.clientWidth
		);
		y = Math.min(
			Math.max(distance(middleY, y), 0),
			canvasPos.height - matrix.clientHeight
		);

		matrix.style.left = String(x) + "px";
		matrix.style.top = String(y) + "px";
	}
	async function do_crop() {
		if (cropMode && (cropSet || mobileCrop) && localFile) {
			let matrix = document.querySelector("#gridBox");
			// image crop process
			let x = matrix.style.left,
				y = matrix.style.top;
			let w = matrix.clientWidth,
				h = matrix.clientHeight;

			// compress image locally before shipping out to cloudfunc
			// hopefully this eases memory consumption...
			var _file = null;
			if (localFile.size >= 1000000) _file = await compress_image(localFile);
			else _file = localFile;

			setWaiting(true);
			let data = new FormData();
			data.append("x", x);
			data.append("y", y);
			data.append("width", w);
			data.append("height", h);
			data.append("files[]", _file);
			setTimeout(() => {
				fetch("https://cropimage-oj5fff4opa-uc.a.run.app/", {
					method: "POST",
					body: data,
				})
					.then((res) => res.blob())
					.then((blob) => {
						setLocalFile(blob);
						setCropped(true);
						subWarning.current.style.display = "none";
						setWaiting(false);
					})
					.catch((e) => {
						setWaiting(false);
						setCropMode(false);
						setCropSet(false);
					});
			}, 1000);
		}
		setCropMode(!cropMode);
		setCropSet(false);
	}
	useEffect(() => {
		// unreliable mobile device check, user-agent is manipulatable by client
		if (
			/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
				navigator.userAgent
			)
		) {
			setMobileCrop(true);
		}
	}, []);
	return (
		<div className="subPop" id="subPop">
			<form className="submission" onSubmit={postMessage}>
				<div className="top">
					<div
						className="subVerbose"
						searching={pickingTrack ? "true" : "false"}
					>
						<input
							ref={_textInput}
							value={_text}
							onChange={(e) => change_text(e)}
							style={{ borderRadius: "20px 0 0 20px" }}
							type="text"
							id="subTxt"
							placeholder={
								!pickingTrack
									? `What's up ${(_user && _user.username) || ""}?`
									: "Search for a song name..."
							}
							autoComplete="off"
						></input>
						<input
							ref={subButton}
							type="submit"
							id="subBtn"
							className="subWidget"
							value=""
						/>
					</div>
				</div>
				{pickingTrack && !spotifyToken && (
					<p className="musicLoad">
						<i className="fas fa-cog"></i> Waiting for server...
					</p>
				)}
				{pickingTrack && trackResults && (
					<>
						{spotifyToken && (
							<p className="musicResults">
								<i class="fas fa-music"></i> We found{" "}
								<b>{trackResults.length}</b> songs you can play.
							</p>
						)}
						<div className="trackList">
							{trackResults.map((track, i) => {
								return (
									<div
										key={i}
										className="track"
										active={
											pickedTrack &&
											pickedTrack.preview_url === track[1].preview_url
												? "true"
												: "false"
										}
									>
										<div onClick={() => switch_song(track[1])} className="info">
											<div className="art">
												<img
													src={
														track[1].album.images[
															track[1].album.images.length - 1
														].url
													}
												/>
											</div>
											<p>
												{track[1].name} •{" "}
												<span>{track[1].artists[0].name}</span>
											</p>
										</div>
										<a
											href={track[1].external_urls.spotify}
											target="_blank"
											rel="nonreferrer"
										>
											<i class="fas fa-external-link-alt"></i>
										</a>
									</div>
								);
							})}
							{pickedTrack && (
								<>
									<button className="cancel" onClick={cancel_pick}>
										<i class="fas fa-times"></i> Cancel
									</button>
									<button className="confirm" onClick={confirm_pick}>
										<i class="fas fa-check"></i> Confirm Pick
									</button>
								</>
							)}
						</div>
					</>
				)}
				{!pickingTrack && pickedTrack && (
					<>
						<div className="trackList preview">
							<div
								className="track"
								active={"true"}
								paused="false"
								id="mainTrack"
							>
								<div onClick={toggle_playback} className="info">
									<div className="art">
										<img
											src={
												pickedTrack.album.images[
													pickedTrack.album.images.length - 1
												].url
											}
										/>
									</div>
									<p>
										{pickedTrack.name} •{" "}
										<span>{pickedTrack.artists[0].name}</span>
									</p>
								</div>
								<a
									href={pickedTrack.external_urls.spotify}
									target="_blank"
									rel="nonreferrer"
								>
									<i class="fas fa-external-link-alt"></i>
								</a>
							</div>
						</div>
					</>
				)}
				<div className="bottom">
					<label
						className="subWidget photo"
						style={{ borderRadius: "50%" }}
						active={localFile !== null ? "true" : "false"}
					>
						<i class="fas fa-image"></i> {!localFile ? "Attach" : "Change"}{" "}
						Image
						<input
							ref={imageField}
							type="file"
							accept=".png, .jpg, .jpeg"
							style={{ display: "none" }}
							onChange={(e) => onFileChange(e)}
						/>
					</label>
					<button
						active={pickedTrack || pickingTrack ? "true" : "false"}
						onClick={toggle_music_view}
						className="spotify"
					>
						<i class="fab fa-spotify"></i> Share Song
					</button>
				</div>
			</form>
			<div ref={subWarning} className="subWarning">
				<div ref={compProgress} className="compProgress"></div>
				<div className="compText">
					⚠️ Upload exceeds 1MB, your image will be compressed!{" "}
					<span>({imageSize}/1.0MB)</span>
				</div>
			</div>
			<div
				className="subProgress"
				style={{ display: uploading === false ? "none" : "flex" }}
			>
				<div ref={_progress} />
			</div>
			<div
				id="fileNest"
				ref={fileNest}
				style={{ maxHeight: "0", position: "relative" }}
				waiting={waiting ? "true" : null}
			>
				<div
					className="imgOverlay"
					style={{ opacity: "1" }}
					onMouseMove={(e) => {
						if (!mobileCrop) move_grid(e);
					}}
					onClick={(e) => {
						if (cropMode && !mobileCrop) setCropSet(true);
						else if (cropMode && mobileCrop) move_grid(e);
					}}
				>
					{waiting && (
						<h1 className="load">
							<i class="fas fa-cog"></i> Processing request...
						</h1>
					)}
					<div className="imgMenu">
						<button
							onClick={remove_image}
							className="remove"
							cropping={cropMode ? "true" : "false"}
						>
							<i class="fas fa-times"></i>
						</button>
						{!cropped && (
							<button
								className="crop"
								id="cropTool"
								cropping={cropMode ? "true" : "false"}
								onClick={do_crop}
							>
								<i class="fas fa-crop-alt"></i>
							</button>
						)}
						{!cropMode && (
							<>
								{caption === "" && (
									<button
										onClick={() => document.querySelector("#caption").focus()}
										className="caption"
									>
										<i class="fas fa-font"></i>
									</button>
								)}
								{!pickedTrack && (
									<button className="music" onClick={toggle_music_view}>
										<i class="fas fa-music"></i>
									</button>
								)}
							</>
						)}
					</div>
					{!cropMode && (
						<input
							type="text"
							value={caption}
							onChange={(e) => change_caption(e)}
							id="caption"
							placeholder="..."
						/>
					)}
				</div>
				<div className="imageScape" id="imageScape">
					{cropMode && <div className="gridBox" id="gridBox" />}
					<img
						ref={image}
						src={localFile ? URL.createObjectURL(localFile) : null}
						alt={localFile ? localFile.name : null}
						onLoad={resize_grid}
					/>
				</div>
				{/*<div className="fileCaption">Add a caption</div>*/}
			</div>
		</div>
	);
}
export default Submitter;
