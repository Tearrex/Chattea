import { useRef, useState, useEffect, useContext } from "react";
import { sendEmailVerification } from "@firebase/auth";
import { signup } from "../Main/firebase";
import { useNavigate } from "react-router";
import { UserContext, showLogin } from "../Main/Contexts";
import GithubButton from "../GithubButton";
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
	useEffect(() => {}, [emailInput]);
	return (
		<div className="splashBody">
			<div className="catch">
				<h1>
					<span>Share</span> snippets of your life
				</h1>
				<p>Downtime? Have a glance at what other humans are up to.</p>
			</div>
			<div className="splashNet">
				<div
					className="splash"
					style={{ backgroundImage: "url('network.png')" }}
				></div>
				<div
					className="splashRegister flashForm"
					style={{ display: _user === undefined ? "block" : "none" }}
				>
					{/* <h2 className="splashSub">Quick Start</h2> */}
					<p className="desc">
						Join <span className="chat">Chat</span>
						<span className="tea">tea</span> in a matter of seconds,
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
									? "You'll have to verify this email."
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
							className="loginBtn darkBlueBtn stealthBtn"
							type="button"
							onClick={members_action}
						>
							Already a member?
						</button>
						<button
							className="loginBtn guestBtn stealthBtn"
							type="button"
							onClick={() => navigate("/main")}
						>
							👀 View as Guest
						</button>
					</form>
				</div>
			</div>
			<div className="faqMessage">
				<p>
					Before diving in, check out the{" "}
					<span onClick={() => navigate("/faq")}>
						<b>FAQ</b>
					</span>
				</p>
			</div>
			<footer>
				<GithubButton />
			</footer>
		</div>
	);
}
export default SplashPage;
