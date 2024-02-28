import { useNavigate } from "react-router";
import { useContext, useEffect } from "react";
import { UserContext } from "../../Main/Contexts";
import GithubButton from "../../GithubButton";
import FAQuestion from "./FAQuestion";
import { Link } from "react-router-dom";

export function open_module(e, faqId) {
	if (e) e.preventDefault();
	let button = document.querySelector(faqId);
	if (button && button.nextSibling.getAttribute("open") != "true") {
		button.click();
	}
	setTimeout(() => button.scrollIntoView({ behavior: "smooth" }), 600);
}
function FAQPage(props) {
	const navigate = useNavigate();
	const { _user, _setUser } = useContext(UserContext);

	function focus_signup() {
		document.getElementById("nameInput").focus();
	}
	function guest_mode() {
		localStorage.setItem("guest", "true");
		navigate("/main");
	}
	useEffect(() => {
		// document.getElementById("welcomer").style.display = "none";
		if (window.location.href.includes("#faq")) {
			let jumpQuestion = localStorage.getItem("faq_jump");
			if (jumpQuestion) {
				console.log("jumping", jumpQuestion);
				open_module(null, jumpQuestion);
				localStorage.removeItem("faq_jump");
			} else
				document.querySelector("#faq").scrollIntoView({ behavior: "smooth" });
		}
		document.body.style.overflow = null;
	}, []);
	return (
		<footer id="faq">
			<div className="faqNest">
				<h2>FAQ</h2>
				<FAQuestion question="What is Chattea?" emote="☕">
					<p>
						Chattea is your home for making pocket-sized memories as you go
						about your days. Post glimpses of your activities while adding some
						mystery ;) <br />
						<br />
						You can check-in whenever you like and perhaps you'll get a laugh
						out of some goofy post.
					</p>
				</FAQuestion>
				<FAQuestion
					question="Who can see my posts?"
					buttonId="visibility"
					emote={<i className="fas fa-eye-slash"></i>}
				>
					<p>
						Chattea offers the options of public & private visiblity for your
						social media posts. <br />
						<br />
						<i className="fas fa-globe-americas"></i> Public posts can be seen
						by anyone on the explore page and can be forwarded in chat
						messaging.
						<br />
						<br />
						<i className="fas fa-user-friends"></i> Private posts can only be
						viewed by users in your buddies list and cannot be forwarded.
						<br />
						<br />
						You can change the visibility option at any time.
					</p>
				</FAQuestion>
				<FAQuestion
					question="What are buddies?"
					buttonId="buddies"
					emote={<i className="fas fa-user-friends" />}
				>
					<p>
						Buddies are your Chattea friends. By adding someone, you allow them
						to
						<ul>
							<li>View your private posts</li>
							<li>Mention you in comments</li>
							<li>
								Send you{" "}
								<Link to="#" onClick={() => open_module(null, "#chats")}>
									chat messages
								</Link>
							</li>
						</ul>
						Removing a buddy will revoke their access to these elements.
					</p>
				</FAQuestion>
				<FAQuestion
					question="What about my data?"
					buttonId="privacy"
					emote={<i className="fas fa-database"></i>}
				>
					<p>
						Privacy concerns are a big deal, and as a community-based platform
						we take it very seriously.
						<br />
					</p>
					<h2>Information We Collect</h2>
					<p>Basic account details upon sign up</p>
					<ul className="dataSection">
						<li>Username</li>
						<li>Email</li>
						<li>Password</li>
						<li>Profile Picture</li>
						<li>Current date</li>
					</ul>
					<p>
						This info is saved on our cloud database to keep track of every user
						that exists on the website. <br />
						Your email is used solely for authentication and account recovery.
						<br />
						<br />
						<u>We never share or sell this information with third parties.</u>
					</p>
					<p>The content you submit</p>
					<ul className="dataSection">
						<li>Attached images</li>
						<li>Timestamp</li>
						<li>Secure chat Public key</li>
					</ul>
					<p>
						Any visual media you share will be uploaded to our cloud storage
						bucket. When you delete a post we will also delete all traces of
						images from the cloud before receiving the confirmation response.
					</p>
					<p>
						Every user is assigned an <b>identifier</b> (ID) upon signing up.
						The ID is a unique sequence of random letters and numbers that
						distinguishes you from the rest of the users on Chattea.
					</p>
					<h2>
						<i className="fas fa-cog"></i> How we use your data
					</h2>
					<p>
						We do not use this content for any purpose other than providing you
						with Chattea's intended functionality, like displaying personalized
						feeds. Your identifier is logged when you do one of the following
					</p>
					<ul
						className="dataSection"
						style={{ listStyleType: "decimal-leading-zero" }}
					>
						<li>Create a post</li>
						<li>Like a post</li>
						<li>Add a comment</li>
						<li>Add a buddy</li>
						<li>Message a buddy</li>
					</ul>
					<p>
						As you browse the website, the profile data you fetch about other
						users will be cached locally on your browser. <br />
						This lowers the amount of requests your device makes to our servers
						by remembering the profiles of each user it retrieves; Edits to your
						profile (username and bio) may not propagate for others right away.
					</p>
				</FAQuestion>
				<div className="faqactions">
					{_user === undefined ? (
						<>
							<button className="faqSignUp" onClick={focus_signup}>
								<i class="fas fa-angle-double-up"></i> Sign up!
							</button>
							<button onClick={guest_mode} className="guestMode">
								<i className="fas fa-user"></i> Try guest mode
							</button>
						</>
					) : (
						<button className="faqSignUp" onClick={() => navigate("/main")}>
							<i className="fas fa-sign-in-alt"></i> Hey{" "}
							<span>@{_user.username}</span>, jump in!
						</button>
					)}
				</div>
				<FAQuestion
					question="Chat Messaging"
					buttonId="chats"
					open
					emote={<i className="fas fa-envelope"></i>}
				>
					<p>
						You can now send chat messages to your buddies. These messages are
						secured with end-to-end encryption when possible. Existing users
						must generate an asymmetric key pair from their browser before
						engaging in secure chats.
					</p>
					<p>
						Your <span style={{ color: "#0f0" }}>public key</span> will be
						uploaded to our cloud database so your buddies can send you
						encrypted messages.
					</p>
					<img src="/keygen.svg" />
					<p>
						Your <span style={{ color: "#f00" }}>private key</span> remains in
						your browser's local storage for decrypting incoming secure chats.
						It's recommended to use a single device since each browser session
						would have to overwrite your existing keys to read secure chats.
					</p>
					<img src="/e2ee.svg" />
					<p>
						You can message a buddy without their public key by opting for plain
						chat messaging, which is unencrypted. You have the option of
						deleting message channels and blocking further messages from users
						by removing them as your buddy.
					</p>
				</FAQuestion>
				{/* <FAQuestion question="Profanity filter" emote="###">
					<p>
						Upon opening Chattea's feed for the first time, your browser will
						fetch a blacklist of words from{" "}
						<a href="https://github.com/Tearrex/Chattea" target="_blank">
							our public code repository
						</a>{" "}
						and save it to local storage. <br />
						<br />
						The blacklist is used to process user-generated text before
						displaying it to you. This can be toggled later.
					</p>
				</FAQuestion> */}
				<FAQuestion
					question="Posting images"
					buttonId="images"
					open
					emote={<i className="fas fa-image"></i>}
				>
					<p>
						You must verify your email before posting images. Images over 1MB
						are compressed by your browser before uploading.
						<br />
						<br />
						Using our cropping tool involves ephemeral cloud processing.
						<br />
						<br />
						<img src="/image_func.svg" />
						<br />
						<br />
						Your image is cropped by an automated HTTP server that gets
						destroyed after returning the result. The binary data is also
						processed in-memory instead of disk storage for optimal security.
					</p>
				</FAQuestion>
				<FAQuestion
					question="Sharing Spotify songs"
					open
					emote={<i className="fab fa-spotify"></i>}
				>
					<p>
						Chattea integrates with Spotify's Web API to add music to your
						posts.
						<br />
						<br />
						<img src="/spotify_search.jpg" />
						<br />
						<br />
						For a seamless experience, this tool requests a temporary access
						token from our intermediate cloud API.
						<br />
						<br />
						<img src="/spotify_token.jpg" />
					</p>
				</FAQuestion>
			</div>
			<h3
				style={{
					fontWeight: "normal",
					color: "#fff",
					opacity: 0.5,
					textAlign: "right",
					marginBottom: 0,
				}}
			>
				Made by Anthony with <i class="fab fa-react"></i> React
			</h3>
		</footer>
	);
}
export default FAQPage;
