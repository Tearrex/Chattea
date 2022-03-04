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

	const passField = useRef();
	const [passInput, setPass] = useState("");

	useEffect(() => {
		if (passInput.length >= 6) {
			passField.current.style.border = null;
		} else {
			if (cpassInput === "") setLoading(true);
		}
	}, [passInput]);

	const cpassField = useRef();
	const [cpassInput, setCpass] = useState("");
	const [submitText, setSubText] = useState("Continue");
	useEffect(() => {
		if (cpassInput !== passInput && cpassInput !== "") {
			passField.current.style.border = "3px solid #E74C3C";
			cpassField.current.style.border = "3px solid #E74C3C";
			setLoading(true);
			setSubText("Continue");
		} else {
			if (passInput !== "" && passInput === cpassInput) {
				passField.current.style.border = "3px solid #2ECC71";
				cpassField.current.style.border = "3px solid #2ECC71";
				setLoading(false);
				setSubText("Finish");
			}
		}
	}, [cpassInput, passInput]);
	async function handleSignup() {
		setLoading(true);
		try {
			const _profile = await signup(emailInput, passInput, nameInput);
			// send the user over to their brand new profile page.
			// hopefully they'll get the memo and personalize it

			// ill add tooltips and suggestions later on
			navigate(`/profile/${_profile.user_id}`);
		} catch (e) {
			alert(e);
		}
		setLoading(false);
	}
	function advance_form(e) {
		e.preventDefault();
		if (loading === true) return;
		if (nameField.current.value.length < 3) {
			nameField.current.style.border = "3px solid #E74C3C";
			//setFormHeight(inputHeight);
		} else {
			if (is_email(emailInput) === true) {
				if (passInput.length < 6) {
					setLoading(true);
				}
				if (passInput.length >= 6) {
					if (passInput === cpassInput) {
						handleSignup();
					}
				} else passField.current.style.border = "3px solid #E74C3C";
			} else {
				setLoading(true);
				emailField.current.style.border = "3px solid #E74C3C";
			}
		}
	}
	function login_action() {
		if (_user === undefined) setLogin(true); // show the login form
		else navigate("/main"); // show the live feed
	}
    useEffect(() => {
        
    }, [emailInput]);
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
							<label>You'll have to verify this email.</label>
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
							{!loading && <input type="submit" value={submitText} />}
						</div>
						<button className="loginBtn darkBlueBtn" onClick={login_action}>
							Already a member?
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
