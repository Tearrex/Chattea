//import pfp from './default_user.png'
//import cam from './cam_icon.png'
import { useContext, useEffect, useRef, useState } from "react";
import { signup, useAuth, login } from "./firebase";
import { Link, useNavigate } from "react-router-dom";
import { MembersContext, UserContext, showLogin } from "./Contexts";
import {
	updateEmail,
	sendEmailVerification,
	getAuth,
	sendPasswordResetEmail,
} from "@firebase/auth";
import { is_email } from "../Pages/SplashPage";
function Signup(props) {
	const navigate = useNavigate();
	const currentUser = useAuth();
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
		setResetPassword(false);
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

	const auth = getAuth();
	const [resetPassword, setResetPassword] = useState(false);
	const [acknowledged, setAcknowledged] = useState(false);

	// Clear any error messages when the user adjusts their input
	useEffect(() => {
		setError(null);
		// Give login button full opacity for the user
		if (
			is_email(email) &&
			email !== prevEmail &&
			(resetPassword ||
				(String(password).length >= 6 && password !== prevPassword))
		)
			setCanLogin(true);
		else setCanLogin(false);
	}, [email, password, resetPassword]);

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

	useEffect(() => {
		let recovery_email = localStorage.getItem("recovery_email");
		if (recovery_email && showLogin) {
			localStorage.removeItem("recovery_email");
			setResetPassword(true);
			setTimeout(() => setEmail(String(recovery_email).toLowerCase()), 500);
		}
	}, [_showLogin]);

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
		if (password == prevPassword && !resetPassword) {
			// prompt the user to change their password input
			setPassword("");
			return passwordRef.current.focus();
		} else if (resetPassword) {
			try {
				await sendPasswordResetEmail(auth, email);
			} catch (e) {
				return window.alert("Action failed: " + e.message);
			}
			setLinkSent(true);
			return;
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
		saucerRef.current.style.display = "block";
		saucerRef.current.style.opacity = "1";
		overlayBG.current.style.display = "block";
		emailRef.current.focus();
	}
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
				dismiss_verification();
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
	function dismiss_verification() {
		let redirect = localStorage.getItem("redirect");
		navigate(redirect || "/main");
		localStorage.removeItem("redirect");
		setTimeout(() => {
			overlayBG.current.style.opacity = "0";
			saucerRef.current.style.transform = "translate(-150vw, -50%)";
			setTransition(false);
			setLock(true);
		}, 2000);
	}
	function finish_transition(e) {
		if (!focus || transitioning) return;
		// saucerRef.current.style.display = "none";
		setFocus(false);
		setTransition(false);
		console.log("transition finished");
	}
	const [linkSent, setLinkSent] = useState(false);
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
			overlayBG.current.style.display = "none";
		} else {
			setFocus(true);
			overlayBG.current.style.display = "block";
		}
	}
	useEffect(() => {
		if (focus) {
			if (!transitioning) overlayBG.current.style.opacity = "0.7";
		} else {
			overlayBG.current.style.opacity = "0";
		}
	}, [focus]);
	function signup_redirect() {
		setLogin(false);
		setTimeout(() => document.getElementById("nameInput").focus(), 400);
	}
	useEffect(() => {
		if (linkSent && acknowledged) {
			setLinkSent(false);
			setAcknowledged(false);
			setResetPassword(false);
		}
	}, [linkSent, acknowledged]);
	function reset_pass() {
		setResetPassword(true);
		document.querySelector("#loginEmail").focus();
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
					) {
						setLogin(false);
						setLinkSent(false);
					}
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
							<span>
								{!resetPassword ? "Welcome back!" : "Account Recovery"}
							</span>
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
							{linkSent && (
								<div className="confirmation">
									<h2>
										<i class="fas fa-envelope"></i> Link Sent
									</h2>
									<p>Please check your spam folder for</p>
									<br />
									<small>support@chattea.app</small>
								</div>
							)}
							<input
								ref={emailRef}
								type="email"
								placeholder="*Email"
								id="loginEmail"
								value={email}
								onChange={(e) => setEmail(String(e.target.value).toLowerCase())}
								required
								disabled={linkSent}
							></input>
							{!resetPassword && (
								<input
									ref={passwordRef}
									type="password"
									placeholder="*Password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
								></input>
							)}
							{error && <label style={{ opacity: 0.8 }}>{error}</label>}
							{!transitioning && canLogin && (
								<input
									type="submit"
									// disabled={loading || currentUser}
									className="loginBtn loginOrange"
									value={!resetPassword ? "sign in" : "send password link"}
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
							!resetPassword ? (
								<>
									New here?{" "}
									<Link to="/" onClick={signup_redirect}>
										Create an account
									</Link>
									<br />
									<i class="fas fa-key"></i>{" "}
									<a href="#" onClick={reset_pass}>
										Reset password
									</a>
								</>
							) : !linkSent ? (
								<a href="#" onClick={() => setResetPassword(false)}>
									Cancel
								</a>
							) : (
								<a href="#" onClick={() => setAcknowledged(true)}>
									Continue
								</a>
							)
						) : (
							<p>
								<span>✨</span> We made some changes
							</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
export default Signup;
