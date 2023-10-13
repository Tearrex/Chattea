//import pfp from './default_user.png'
//import cam from './cam_icon.png'
import { useContext, useEffect, useRef, useState } from "react";
import { signup, useAuth, login } from "./firebase";
import { Link, useNavigate } from "react-router-dom";
import { MembersContext, UserContext, showLogin } from "./Contexts";
import { updateEmail, sendEmailVerification, getAuth } from "@firebase/auth";
import { is_email } from "../Pages/SplashPage";
function Signup(props) {
	const navigate = useNavigate();
	const currentUser = useAuth();
	const [message, setMessage] = useState("Welcome back!");
	const [error, setError] = useState(null);
	const { _showLogin, setLogin } = useContext(showLogin);
	const { _user, _setUser } = useContext(UserContext);
	const { _users, _setUsers } = useContext(MembersContext);
	const [loading, setLoading] = useState(false);
	const overlayBG = useRef();
	const [locked, setLock] = useState(true);
	const [focus, setFocus] = useState(false);
	const [canLogin, setCanLogin] = useState(false);
	function closePopup() {
		if (!focus && showLogin) return;
		overlayBG.current.style.opacity = "0";
		if (_user === undefined) {
			saucerRef.current.style.transform = "translate(-50%, -50%) scale(0)";
			saucerRef.current.style.opacity = "0";
		}
		console.log("Cancelled log in process...");
	}
	/*
    when the user's profile badge slides into view with the welcome text, this is true.
    */
	const [transitioning, setTransition] = useState(false);

	const emailRef = useRef();
	const passwordRef = useRef();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	// Clear any error messages when the user adjusts their input
	useEffect(() => {
		setError(null);
		// Give login button full opacity for the user
		if (
			is_email(email) &&
			email !== prevEmail &&
			String(password).length >= 6 &&
			password !== prevPassword
		)
			setCanLogin(true);
		else setCanLogin(false);
	}, [email, password]);

	// reference the email of their previous attempt
	// to check if they made any corrections,
	// otherwise they cannot submit the request again.
	const [prevEmail, setPrevEmail] = useState(null);
	const [prevPassword, setPrevPassword] = useState(null);

	const saucerRef = useRef();
	const popupRef = useRef();
	const formRef = useRef();
	const avatarRef = useRef();

	// set to true in order to trigger the process of
	// creating a new image element with the user's picture
	// and transitioning to the home page.
	// _user has to be defined first
	const [shouldLoad, setShouldLoad] = useState(false);
	const pictureNest = useRef();

	/*
    When the user logs in succesfully, create an image element with their picture
    and wait for it load before welcoming them.
    */
	useEffect(() => {
		const abort = new AbortController();
		if (_user !== undefined && shouldLoad) {
			// check if a profile picture was left over from a previous login
			var oldImage = pictureNest.current.querySelector("img");
			if (oldImage) {
				if (oldImage.src === _user.pfp) {
					console.log("Recycling previous user image");
					setTransition(true);
					setShouldLoad(false);
					return;
				} else oldImage.remove();
			}
			console.log("just logged in", _user["user_id"]);
			var img = new Image();
			img.src = _user.pfp;
			//img.id = "richImage"
			img.onload = function () {
				if (abort.signal["aborted"] === true) {
					console.log("image load stopped, not in view");
					return;
				}
				console.log("pfp loaded");
				pictureNest.current.insertBefore(
					img,
					pictureNest.current.childNodes[0]
				);
				setTransition(true);
				setShouldLoad(false);
			};
		}
		return () => abort.abort();
	}, [_user, shouldLoad]);
	// don't let the user get carried away while it's loading
	function disable_inputs(disable = true) {
		setEmail("");
		setPassword("");
		emailRef.current.disabled = disable;
		passwordRef.current.disabled = disable;
	}
	/*
    Called when the form is submitted. If successful, the above effect will be executed

    At the moment, login errors are ugly alerts.
    Will make this less instrusive soon.

    3/3/2022 still havent done this

    */
	async function handleLogin(e) {
		setLoading(true);
		setCanLogin(false);
		e.preventDefault();
		// check if the input string looks like an email
		if (!is_email(email)) {
			emailRef.current.focus();
			setError("You must provide a valid email.");
			return setLoading(false);
		}
		if (email == prevEmail) {
			// prompt the user to change their email input
			setEmail("");
			return emailRef.current.focus();
		}
		if (password == prevPassword) {
			// prompt the user to change their password input
			setPassword("");
			return passwordRef.current.focus();
		}
		var failed = false;
		try /*to authenticate the user with their given credentials*/ {
			await login(email, password);
			// login was successful, cleanup the form
			setError(null);
			setPrevEmail(null);
			setPrevPassword(null);
			setLock(false);
			disable_inputs();
		} catch (e) {
			switch (e.code) {
				case "auth/user-not-found":
					setPrevEmail(email); // no spamming
					setError("Email not in use.");
					break;
				case "auth/wrong-password":
					setPrevPassword(password); // no spamming
					setError("Invalid credentials.");
					break;
				default:
					alert(e);
					break;
			}
			failed = true;
		}
		if (!failed) {
			setMessage("Welcome back!");
			setShouldLoad(true); // load the user's profile pic
		}
		setLoading(false);
	}
	/*
    Moves the login form into view and focuses on the email input.
    */
	function show() {
		switcheroo(false);
		disable_inputs(false);
		saucerRef.current.style.transform = "translate(-50%,-50%)";
		saucerRef.current.style.opacity = "1";
		saucerRef.current.style.display = "block";
		overlayBG.current.style.display = "block";
		emailRef.current.focus();
	}
	const emailWindow = useRef();
	function switcheroo(yes) {
		if (yes) {
			// show welcome banner
			if (locked) return;
			overlayBG.current.style.opacity = "1";
			//formRef.current.style.transform = "translateX(-200vw)";
			formRef.current.style.opacity = "0";
			avatarRef.current.style.transform = "translate(-50%, -50%)";
			//navigate("/main");
			setTimeout(function () {
				if (verified === true) dismiss_verification(true);
				else {
					setEmail(currentUser.email); // autofill link destination
					emailWindow.current.style.zIndex = "11";
					emailWindow.current.style.transform =
						"scale(1) translate(-50%, -50%)";
					emailWindow.current.style.opacity = "1";
				}
			}, 3000);
		} else {
			// show login form
			//formRef.current.style.transform = "translateX(0)";
			formRef.current.style.opacity = "1";
			avatarRef.current.style.transform = "translate(300%, -50%)";
		}
	}

	const [verified, setVerified] = useState(false);
	useEffect(() => {
		if (currentUser !== null && currentUser !== undefined) {
			setEmail(currentUser.email);
			if (currentUser.emailVerified === true) setVerified(true);
		}
	}, [currentUser]);
	function dismiss_verification(wasEmailVerified) {
		if (wasEmailVerified === false) saucerRef.current.style.display = "none";
		let redirect = localStorage.getItem("redirect");
		navigate(redirect || "/main");
		localStorage.removeItem("redirect");
		setTimeout(() => {
			overlayBG.current.style.opacity = "0";
			if (wasEmailVerified) {
				saucerRef.current.style.transform = "translate(-150vw, -50%)";
				setTransition(false);
			} else {
				emailWindow.current.style.transform = "scale(0) translate(-50%,-50%)";
				overlayBG.current.style.display = "none";
			}
			setLock(true);
		}, 2000);
	}
	function finish_transition(e) {
		if ((linkSent === false && !skip) || transitioning) return;
		saucerRef.current.style.display = "none";
		setFocus(false);
		setTransition(false);
		setSkip(false);
		console.log("transition finished");
	}
	const [verifying, setVerifying] = useState(false);
	const [linkSent, setLinkSent] = useState(false);
	const emailInput = useRef();
	async function handle_email(e) {
		e.preventDefault();
		if (linkSent === true) {
			dismiss_verification(false);
			return;
		}
		setVerifying(true);
		if (email !== currentUser.email) {
			try {
				await updateEmail(currentUser, email);
			} catch (e) {
				alert("Failed to update email: " + e);
				setVerifying(false);
				return;
			}
			console.log("email updated!");
		}
		try {
			await sendEmailVerification(currentUser);
			emailInput.current.disabled = true;
		} catch (e) {
			alert("Failed to send verification link: " + e);
			setVerifying(false);
			dismiss_verification(false);
			return;
		}
		setLinkSent(true);
	}
	useEffect(() => {
		if (transitioning) {
			console.log("switcheroo!");
			switcheroo(true);
		} else finish_transition();
	}, [transitioning]);
	useEffect(() => {
		if (locked) {
			setLogin(false);
		}
	}, [locked]);
	const [skip, setSkip] = useState(false);
	function skip_email(e) {
		e.preventDefault();
		setSkip(true);
	}
	useEffect(() => {
		if (skip) {
			dismiss_verification(false);
			console.log("skip email");
		}
	}, [skip]);
	useEffect(() => {
		if (_showLogin && !focus) {
			show();
			document.body.style.overflow = "hidden";
		} else {
			closePopup();
			document.body.style.overflow = null;
		}
	}, [_showLogin]);

	// called when the background overlay is done fading
	function dismiss_overlay(e) {
		/*
        trying times
        console.log("end transition", transitioning);
        console.log("end login", _showLogin);
        console.log("end focus", focus);
        console.log("end lock", locked);
        */
		if (!_showLogin) {
			setTransition(false);
		} else {
			setFocus(true);
			overlayBG.current.style.display = "block";
		}
	}
	useEffect(() => {
		if (focus) {
			if (!transitioning) overlayBG.current.style.opacity = "0.7";
		} else {
			if (overlayBG.current.style.opacity !== "0")
				overlayBG.current.style.opacity = "0";
			else overlayBG.current.style.display = "none";
		}
	}, [focus, skip]);
	function signup_redirect() {
		setLogin(false);
		setTimeout(() => document.getElementById("nameInput").focus(), 400);
	}
	return (
		<div className="teaDescendant">
			<div
				ref={overlayBG}
				className="overlay"
				onClick={(e) => {
					if (
						focus &&
						document.body.style.overflow === "hidden" &&
						!transitioning
					)
						setLogin(false);
				}}
				style={{ display: "none", opacity: "0", zIndex: "5" }}
				onTransitionEnd={(e) => dismiss_overlay(e)}
			/>
			<div
				ref={saucerRef}
				className="flyingSaucer centered"
				style={{ transform: "translate(-50%, -50%) scale(0)", opacity: "0" }}
				onTransitionEnd={(e) => {
					setFocus(_showLogin);
				}}
			>
				<div ref={popupRef} className="popup flashForm">
					<div style={{ position: "relative" }} className="banner">
						<h2>
							<span>{message}</span>
						</h2>
						<div
							className="teamatrix"
							style={{
								width: "100%",
								height: "100%",
								position: "absolute",
							}}
						></div>
					</div>
					<div className="profileAnchor">
						<form
							ref={formRef}
							className="loginForm niceInputs"
							onSubmit={handleLogin}
							style={{ transform: "translateX(0)", padding: "10px" }}
						>
							<input
								ref={emailRef}
								type="email"
								placeholder="*Email"
								value={email}
								onChange={(e) => setEmail(String(e.target.value).toLowerCase())}
								required
							></input>
							<input
								ref={passwordRef}
								type="password"
								placeholder="*Password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
							></input>
							{error && <label style={{ opacity: 0.8 }}>{error}</label>}
							{!transitioning && canLogin && (
								<input
									type="submit"
									// disabled={loading || currentUser}
									className="loginBtn loginOrange"
									value="sign in"
								></input>
							)}
						</form>
						<div
							ref={avatarRef}
							className="cozy"
							style={{ transform: "translate(150%, -50%)" }}
						>
							{/* <h1>Welcome back,</h1> */}
							<div ref={pictureNest}>
								<p>@{_user !== undefined ? _user.username : ""}</p>
							</div>
						</div>
					</div>
					<div className="psa">
						{!_user ? (
							<>
								<i className="fas fa-walking"></i> New here?{" "}
								<Link to="/" onClick={signup_redirect}>
									Gossip awaits you!
								</Link>
							</>
						) : (
							<p>
								<span>✨</span> We made some changes
							</p>
						)}
					</div>
				</div>
			</div>
			<div
				ref={emailWindow}
				className="verifyWindow"
				style={{ transform: "scale(0) translate(-50%, -50%)", zIndex: "-2" }}
				onTransitionEnd={(e) => finish_transition(e)}
			>
				{linkSent === false ? (
					<div>
						<h1>Email Verification</h1>
						<p>
							This is required for password resets and uploading images to our
							community.
						</p>
					</div>
				) : (
					<div>
						<h1>✓ Email Sent</h1>
						<p>A verification link has been tossed to your email.</p>
					</div>
				)}
				<form onSubmit={(e) => handle_email(e)}>
					<input
						ref={emailInput}
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
					/>
					<input
						type="submit"
						value={linkSent === false ? "Send Link" : "Dismiss"}
					/>
					<input
						type="submit"
						value={"Later"}
						style={{ backgroundColor: "#747474" }}
						onClick={(e) => skip_email(e)}
					/>
				</form>
			</div>
		</div>
	);
}
export default Signup;
