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
	button.scrollIntoView({ behavior: "smooth" });
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
		document.getElementById("welcomer").style.display = "none";
		if (window.location.href.includes("#faq")) {
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
						by anyone and are shown on the home page by default.
						<br />
						<br />
						<i className="fas fa-eye"></i> Private posts are exclusive to your
						buddies and are backed by database rules requiring user
						authentication.
						<br />
						<br />
						You can change the visibility at any time.
						<br />
						<br />
						However, we still moderate content reported by users.{" "}
						<Link to="#" onClick={(e) => open_module(e, "#modDiscretion")}>
							Read more on moderation discretions.
						</Link>
					</p>
				</FAQuestion>
				<FAQuestion
					question="What are buddies?"
					emote={<i className="fas fa-user-friends" />}
				>
					<p>
						By adding someone on Chattea, you allow them to
						<ul>
							<li>View your private posts</li>
							<li>Mention you in comments</li>
							<li>Message you in secure chats</li>
						</ul>
						They still need to add you back before messaging each other.
						<br />
						<br />
						Removing a buddy will instantly revoke their access to these
						elements.
						<br />
					</p>
				</FAQuestion>
				<FAQuestion question="Can I edit my posts?" emote="✏️">
					<p>You can only delete your posts along with associated comments.</p>
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
						<u>Your email is kept private from others</u>; Used solely for
						authentication and account recovery. You're only emailed upon
						request.
						<br />
						<br />
						<u>We never share or sell this information with third parties.</u>
					</p>
					<p>The content you submit</p>
					<ul className="dataSection">
						<li>Attached images</li>
						<li>Timestamp</li>
					</ul>
					<p>
						Any visual media you share will be uploaded to our cloud storage
						bucket. When you delete a post we will also delete all traces of
						images from the cloud before giving you the confirmation response.
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
					</ul>
					<p>
						As you browse the website, the profile data you fetch about other
						users will be cached locally on your browser. <br />
						This lowers the amount of requests your browser makes to our servers
						by remembering the profiles of each user it retrieves; Edits to your
						profile (username and bio) may not propagate for others right away.
					</p>
					<h2>
						How we <u>DO NOT</u> use your data
					</h2>
					The only data we collect that can personally identify you is..... your
					email. That's it—and maybe a smiley profile picture of your face. Keep
					in mind what other social medias are (probably) collecting from you
					that we strictly do not.
					<ul className="dataSection" style={{ listStyleType: "circle" }}>
						<li>Public IP addresses</li>
						<li>Browser info (User-Agent)</li>
						<li>Device info (MAC address, etc..)</li>
						<li>Contact lists</li>
						<li>Phone Numbers</li>
						<li>GPS location</li>
						<li>Other sensor data</li>
					</ul>
				</FAQuestion>
				<FAQuestion question="But why tea?" emote="🤔">
					<p>It's just catchy...</p>
				</FAQuestion>
				<hr style={{ width: "100%" }} />
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

				<hr style={{ width: "100%" }} />
				<h2>
					<i class="fas fa-info-circle"></i> App Discretions
				</h2>
				<FAQuestion
					question="Secure chats"
					emote={<i className="fas fa-comment"></i>}
				>
					<p>
						You can now send direct messages to your buddies. These messages are{" "}
						<span>end-to-end encrypted</span>, meaning only you and your message
						recipient will be able to decipher the conversation going on between
						you two.
						<br />
						<br />
						Existing users must generate a <span>
							cryptographic key pair
						</span>{" "}
						from their browser before engaging in secure chats. Your public key
						will be uploaded to our cloud database so your buddies can send you
						encrypted messages. Public keys are intended to be shared for mutual
						transactions. <br />
						<u>We do not store your private key</u>. Your private key remains in
						your browser's local storage for decrypting your buddies' messages.
						This, however, may pose an inconvenience when using multiple devices
						for the same account since each will need to generate an independent
						key-pair that will overwrite your existing public key and deem
						previous messages indecipherable.
						<br /> <br />
						The feature is <u>limited to text-only conversations</u>; You can
						cease to receive further messages from buddies by removing them. You
						also have the option of purging your message channels.
					</p>
				</FAQuestion>
				<FAQuestion question="Profanity filter" emote="###">
					<p>
						<i className="fas fa-cog"></i> Upon opening Chattea's feed for the
						first time, your browser will make a secure HTTP request to{" "}
						<a href="https://github.com/Tearrex/Chattea" target="_blank">
							our public code repository
						</a>{" "}
						for a list of blacklisted words and save it to local storage. <br />
						<br />
						Your browser will process user-generated text before displaying it
						to you. This can be toggled later.
					</p>
				</FAQuestion>
				<FAQuestion question="Mentioning users" emote="@">
					<p>
						You can only mention your buddies. They will be notified only if
						they have you added as well.
					</p>
				</FAQuestion>
				<FAQuestion
					question="Posting images"
					buttonId="images"
					emote={<i className="fas fa-image"></i>}
				>
					<p>
						You must verify your email before posting images. <br />
						<br />
						Images over 1megabyte are subject to lossy <b>compression</b> prior
						to uploading to our cloud. This process is done locally by your
						browser.
						<br />
						<br />
						We also offer an embedded browser tool for <b>cropping</b> images
						into squares to provide the best viewing experience for all users.
						We encourage you to use it, but here's what you must know:
						<br />
						<br />
						<p style={{ textAlign: "center", width: "100%" }}>
							<i class="fas fa-compress-alt"></i> Large images are still
							compressed before cropping
							<br />
							<i class="fas fa-cloud-upload-alt"></i> Cropping involves
							intermediate upload of image for cloud processing.
						</p>
						<br />
						<br />
						Unlike compression, your image is cropped by an automated HTTP
						server for a cost-effective computing approach.{" "}
						<a
							href="https://github.com/Tearrex/Chattea/blob/main/serverless/functions/index.js"
							target="_blank"
							rel="noreferrer"
						>
							See the code for this feature.
						</a>
						<br />
						<br />
						<i class="fas fa-shield-alt"></i> We protect your privacy by
						stripping all metadata from the image before sending it back to you.
						The binary data is also processed in memory instead of disk
						storage, for optimal security.
					</p>
				</FAQuestion>
				<FAQuestion
					question="Sharing Spotify songs"
					emote={<i className="fab fa-spotify"></i>}
				>
					<p>
						Our website integrates with Spotify's Web API to show off previews
						of your favorite songs on a post. Tracks that do not have a valid
						preview URL cannot be played and will not be shown.
						<br />
						<br />
						<i className="fas fa-cog"></i> Your initial use will make a secure
						HTTP request to an intermediate cloud API for a temporary access
						token for search results. This creates a seamless experience for you
						by not prompting for log in through Spotify.{" "}
						<a
							href="https://github.com/Tearrex/Chattea/blob/main/serverless/functions/index.js"
							target="_blank"
							rel="noreferrer"
						>
							See the code for this feature.
						</a>
					</p>
				</FAQuestion>
				<FAQuestion
					question="User moderation"
					buttonId="modDiscretion"
					emote={<i className="fas fa-user-shield"></i>}
				>
					<p>
						All user-generated content (<span>except secure chats</span>) is
						subject to inspection or deletion at moderator discretion. We do our
						best to keep our small community civil and we ask that you help us
						achieve the same by not abusing this platform. <br />
						<br />
						Repeat offenders will be blocked permanently from further
						interaction within Chattea.
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
