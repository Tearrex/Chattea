import { useRef, useState, useEffect, useContext } from "react";
import { sendEmailVerification } from "@firebase/auth";
import { signup } from "../Main/firebase";
import { useNavigate } from "react-router";
import { UserContext, showLogin } from "../Main/Contexts";
import GithubButton from "../GithubButton";
import FAQPage from "./FAQ/FAQPage";
export function is_email(text) {
	if (text.includes("@")) {
		var at = text.split("@");
		if (at[1].includes(".") && at[1].split(".")[1].length >= 2) return true;
		else return false;
	} else return false;
}
function SplashPage() {
	const [loading, setLoading] = useState(true);
	const { _user, _setUser } = useContext(UserContext);
	const navigate = useNavigate();
	const expandForm = useRef();
	const { _showLogin, setLogin } = useContext(showLogin);
	const nameField = useRef();
	const [nameInput, setName] = useState("");
	function name_input(e) {
		if (e.target.value.length <= 20) setName(e.target.value);
	}

	const emailField = useRef();
	const [emailInput, setEmail] = useState("");
	// remember the provided email if it was already used before
	const [prevEmail, setPrevEmail] = useState(null);

	const passField = useRef();
	const [passInput, setPass] = useState("");

	const cpassField = useRef();
	const [cpassInput, setCpass] = useState("");

	// use the given reference to adjust the element's class
	function swap_border(_ref, newClass) {
		_ref.current.classList = [newClass];
	}
	useEffect(() => {
		if (nameInput && nameInput.length >= 3) swap_border(nameField, null);
	}, [nameInput]);
	useEffect(() => {
		if (cpassInput !== passInput && cpassInput !== "") {
			// highlight password fields red if they do not match
			swap_border(passField, "bad");
			swap_border(cpassField, "bad");
		} else {
			if (
				passInput !== "" &&
				passInput === cpassInput &&
				passInput.length >= 6
			) {
				// highlight green if they do match
				swap_border(passField, "good");
				swap_border(cpassField, "good");
				setLoading(false);
			}
		}
	}, [cpassInput, passInput]);
	useEffect(() => {
		// clear email highlight when input is changed
		if (!is_email(emailInput)) return;
		if (emailInput !== prevEmail) swap_border(emailField, null);
	}, [emailInput]);
	async function handleSignup() {
		// don't submit form if the user has not
		// made corrections to their email input
		if (emailInput === prevEmail || loading) return;
		// don't submit if the password fields are empty or incorrect
		if (String(passInput).trim() === "" || passInput !== cpassInput) return;
		setLoading(true);
		try {
			const _profile = await signup(emailInput, passInput, nameInput);
			// send the user over to their brand new profile page.
			// hopefully they'll get the memo and personalize it

			// ill add tooltips and suggestions later on
			navigate(`/profile/${_profile.user_id}`);
		} catch (e) {
			switch (e.code) {
				case "auth/email-already-in-use":
					setPrevEmail(emailInput); // no spamming
					break;
				default:
					alert(e);
					break;
			}
		}
		setLoading(false);
	}
	function advance_form(e) {
		e.preventDefault();
		if (loading === true) return;
		if (nameField.current.value.length < 3) {
			swap_border(nameField, "bad");
			return nameField.current.focus();
		} else {
			if (is_email(emailInput) === true) {
				if (passInput.length < 6) return;
				if (passInput.length >= 6) {
					if (passInput === cpassInput) {
						handleSignup();
					}
				} else return swap_border(passField, "bad");
			} else {
				swap_border(emailField, "bad");
				return emailField.current.focus();
			}
		}
	}
	function members_action(e = null) {
		// the members button is inside of the signup form, smh.....
		if (e) e.preventDefault(); // prevent the button from submitting form
		if (_user === undefined) setLogin(true);
		// show login form
		else navigate("/main"); // show live feed
	}
	useEffect(() => {
		document.getElementById("welcomer").style.display = "none";
		if (window.location.href.includes("#faq")) {
			document.querySelector("#faq").scrollIntoView({ behavior: "smooth" });
		}
	}, []);
	function feature_scroll(e) {
		e.preventDefault();
		const jump = document.getElementById("featjump");
		window.scrollTo(0, jump.getBoundingClientRect().top - window.innerHeight);
	}
	function feature_jump() {
		document.querySelector(".features").scrollIntoView({ behavior: "smooth" });
	}
	function redirect_user() {
		if (_user) navigate("/main");
	}
	return (
		<div className="splashBody">
			<section>
				<div className="catch">
					<div className="chattea">
						<p className="teaPrefix">Get</p>
						<div style={{ gap: "10px" }}>
							<div
								style={{ backgroundImage: "url('/tea.png')" }}
								onClick={redirect_user}
							></div>
							<p>
								Chat<span>tea</span>
							</p>
						</div>
						<p>with people!</p>
					</div>
					<p>Downtime? Have a glance at what other humans are up to.</p>
				</div>
				<div className="splashNet">
					<div
						className="splash"
						style={{ backgroundImage: "url('network.png')" }}
					></div>
					<div
						className="splashRegister flashForm"
						style={{ display: _user === undefined ? null : "none" }}
					>
						{/* <h2 className="splashSub">Quick Start</h2> */}
						<p className="desc">
							Join in a matter of seconds,
							<br />
							setup a quick account here:
							<br />
						</p>
						<form onSubmit={(e) => advance_form(e)} className="niceInputs">
							<div ref={expandForm}>
								<input
									ref={nameField}
									type="text"
									placeholder="Display Name"
									value={nameInput}
									id="nameInput"
									onChange={(e) => name_input(e)}
								/>
								<label>Make it friendly, like a nickname.</label>
								<input
									ref={emailField}
									type="email"
									placeholder="Email Address"
									value={emailInput}
									onChange={(e) => setEmail(e.target.value)}
								/>
								<label
									style={{ display: emailInput === prevEmail ? "block" : null }}
								>
									{emailInput !== prevEmail
										? "You'll have to verify this later."
										: "This email is already in use."}
								</label>
								<input
									ref={passField}
									type="password"
									placeholder="Create Password"
									value={passInput}
									onChange={(e) => setPass(e.target.value)}
								/>

								<input
									ref={cpassField}
									type="password"
									placeholder="Repeat Password"
									value={cpassInput}
									onChange={(e) => setCpass(e.target.value)}
								/>
								{!loading && emailInput !== prevEmail && (
									<input type="submit" value="Complete" />
								)}
							</div>
							<button
								className="loginBtn stealthBtn"
								type="button"
								onClick={members_action}
							>
								<i class="fas fa-sign-in-alt"></i> Member Login
							</button>
							<button
								className="jump stealthBtn"
								type="button"
								onClick={feature_jump}
							>
								<i class="fas fa-angle-double-down"></i> Learn more
							</button>
						</form>
					</div>
				</div>
			</section>
			<section className="features">
				<h1 id="featureHead">
					<i class="fas fa-star"></i> Feature your cat{" "}
					<i class="fas fa-chevron-down down"></i>
				</h1>
				<div className="banner">
					<p>
						Our user submissions are vetted occasionally to get featured on the
						face of Chattea. You can participate by posting your pets or sharing
						memes to make others smile.
					</p>
					<a href="#" className="img" onClick={feature_scroll}>
						<img src="https://firebasestorage.googleapis.com/v0/b/reactback-1cf7d.appspot.com/o/images%2Fp4grb7YvQmXOpiWqGgQschzPqo02%2FM1d1Rb629Sb4lq2Dye5H?alt=media&token=57c8156a-62cf-4a65-9165-572cd35d05ce" />
					</a>
				</div>
				<hr id="featjump" />
			</section>
			<section className="musictaste">
				<img src="/spotify.svg" className="spotify" />
				<div className="portal">
					<img src="/waver.png" className="humanoid" />
				</div>
				<header>
					<h1 style={{ textAlign: "left" }}>
						<i className="fas fa-music" /> Add some sound
					</h1>
					<p>Pair a snapshot with your favorite music from Spotify.</p>
				</header>
			</section>
			<FAQPage />
		</div>
	);
}
export default SplashPage;
