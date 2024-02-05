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
			document.querySelector("#faq").scrollIntoView({ behavior: "smooth" });
			let jumpQuestion = localStorage.getItem("faq_jump");
			if (jumpQuestion) {
				console.log("jumping", jumpQuestion);
				open_module(null, jumpQuestion);
				localStorage.removeItem("faq_jump");
			}
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
					buttonId="buddies"
					emote={<i className="fas fa-user-friends" />}
				>
					<p>
						Buddies are your online friends. By adding someone on Chattea, you
						allow them to
						<ul>
							<li>
								View your{" "}
								<Link to="#" onClick={() => open_module(null, "#visibility")}>
									private posts
								</Link>
							</li>
							<li>
								<Link to="#" onClick={() => open_module(null, "#mentions")}>
									Mention
								</Link>{" "}
								you in comments
							</li>
							<li>
								Message you in{" "}
								<Link to="#" onClick={() => open_module(null, "#chats")}>
									secure chats
								</Link>
							</li>
						</ul>
						Note: Buddies must add you back before messaging each other.
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
					<h2>
						How we <u>DO NOT</u> use your data
					</h2>
					The only data we collect that can personally identify you is..... your
					email. That's it—and maybe a smiley profile picture of your face. Keep
					in mind what other social medias are (probably) collecting from you
					already that we strictly do not.
					<ul className="dataSection" style={{ listStyleType: "circle" }}>
						<li>Public IP addresses</li>
						<li>Browser info (User-Agent, Cookies)</li>
						<li>Device info (MAC address, etc..)</li>
						<li>Contact lists</li>
						<li>Phone Numbers</li>
						<li>GPS location</li>
						<li>Other sensor data (like Bluetooth)</li>
					</ul>
				</FAQuestion>
				<FAQuestion question="But why tea?" emote="🤔">
					<p>It's just catchy...</p>
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

				<hr style={{ width: "100%" }} />
				<h2 id="discretions">
					<i class="fas fa-info-circle"></i> App Discretions
				</h2>
				<FAQuestion
					question="Notifications"
					emote={<i className="fas fa-bell" />}
				>
					<p>
						We have the following icons flash on the navigation bar to display
						realtime notifications:
						<br />
						<br />
						<i className="fas fa-bell hoticon" /> New comments, mentions, or
						buddies
						<br />
						<i className="fas fa-comment hoticon" /> New chat message
					</p>
				</FAQuestion>
				<FAQuestion
					question="Secure chats"
					buttonId="chats"
					emote={<i className="fas fa-comment"></i>}
				>
					<p>
						You can now send direct messages to your{" "}
						<Link to="#" onClick={() => open_module(null, "#buddies")}>
							buddies
						</Link>
						. These messages are end-to-end encrypted, meaning only you and your
						message recipient will be able to decipher the conversation going on
						between you two.
						<br />
						<br />
						Existing users must generate a cryptographic key pair from their
						browser before engaging in secure chats. Your public key will be
						uploaded to our cloud database so your buddies can send you
						encrypted messages. Public keys are intended to be shared for mutual
						transactions. <br />
						<u>We do not save your private key</u>. Your private key remains in
						your browser's local storage for decryption of incoming message
						ciphertext. This, however, may pose an inconvenience when using
						multiple devices for the same account since each will need to
						generate an independent key-pair which will overwrite your existing
						public key and deem previous messages indecipherable.
						<br /> <br />
						You can cease to receive further messages from buddies by removing
						them. You also have the option of purging your message channels.
						<br />
						<br />
						Secure chats is a <span className="beta">BETA</span> feature with
						the following limitations:
						<ul>
							<li>Text-only realtime conversations</li>
							<li>No read receipts</li>
							<li>No typing indicators</li>
							<li>No private key syncing</li>
						</ul>
						Note: Logging out will delete your private key from your browser,
						losing access to old messages. This is expected behavior of the
						security constraints.
					</p>
				</FAQuestion>
				<FAQuestion question="Profanity filter" emote="###">
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
				</FAQuestion>
				<FAQuestion question="Mentioning users" emote="@" buttonId="mentions">
					<p>
						You can only mention your{" "}
						<Link to="#" onClick={() => open_module(null, "#buddies")}>
							buddies
						</Link>
						. They will be notified only if they have you added as well.
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
						Images over 1megabyte will be compressed prior to uploading. This
						process is done locally by your browser.
						<br />
						<br />
						We also offer an embedded browser tool for cropping images into
						squares to provide the best viewing experience for all users.
						<br />
						<br />
						<p style={{ textAlign: "center", width: "100%" }}>
							<i class="fas fa-compress-alt"></i> Large images are still
							compressed before cropping.
							<br />
							<i class="fas fa-cloud-upload-alt"></i> Cropping involves
							intermediate upload of image for cloud processing.
						</p>
						<br />
						<br />
						<img src="https://github.com/Tearrex/Chattea/assets/26557969/fcc28a48-3f43-4b8f-add6-ddf4a627378a" />
						<br />
						<br />
						Unlike compression, your image is cropped by an automated HTTP
						server for a cost-effective computing approach. <br />
						<br />
						We protect your privacy by stripping all metadata from the image
						before posting. The binary data is also processed in memory instead
						of disk storage, for optimal security.
					</p>
				</FAQuestion>
				<FAQuestion
					question="Sharing Spotify songs"
					emote={<i className="fab fa-spotify"></i>}
				>
					<p>
						Our website integrates with Spotify's Web API to show off previews
						of your favorite songs on a post. Tracks that do not have a valid
						preview URL cannot be played and will not be shown in search
						results.
						<br />
						<br />
						<img src="https://private-user-images.githubusercontent.com/26557969/302143082-df0432b1-afd8-4f8d-90e2-18344768ef83.jpg?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3MDcwOTY0ODEsIm5iZiI6MTcwNzA5NjE4MSwicGF0aCI6Ii8yNjU1Nzk2OS8zMDIxNDMwODItZGYwNDMyYjEtYWZkOC00ZjhkLTkwZTItMTgzNDQ3NjhlZjgzLmpwZz9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNDAyMDUlMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjQwMjA1VDAxMjMwMVomWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPWUyYjRlMmI2YWJlMjFkYTZiZDJlMGM1NmQ4ODQ4NmEyNzM0Mjk3ZmVjZTg1NzA5MjMxYzFkOWM4MDMyYjQ5ODYmWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0JmFjdG9yX2lkPTAma2V5X2lkPTAmcmVwb19pZD0wIn0._FHntvEfnu_nUkH6joz2gV6DdS_P9t7GSBswKDlUieg" />
						<br />
						<br />
						This tool will make a secure HTTP request to our intermediate cloud
						API for a temporary access token, creating a seamless experience for
						you by not prompting for Spotify credentials.
						<br />
						<br />
						<img src="https://private-user-images.githubusercontent.com/26557969/302141015-f7f9af41-8b6a-4c21-81a4-7fa9c03ebc0b.jpg?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3MDcwOTYyNTMsIm5iZiI6MTcwNzA5NTk1MywicGF0aCI6Ii8yNjU1Nzk2OS8zMDIxNDEwMTUtZjdmOWFmNDEtOGI2YS00YzIxLTgxYTQtN2ZhOWMwM2ViYzBiLmpwZz9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNDAyMDUlMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjQwMjA1VDAxMTkxM1omWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPTdjYmM2YTJkMmFmYTcxZWI0NjZjZjQ2ODc2YmUyNmZhZjAwMGI4MWE3NTdjNzg4NTg5MDk3ZjlkMDYyNDY2YzAmWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0JmFjdG9yX2lkPTAma2V5X2lkPTAmcmVwb19pZD0wIn0.5B6BZ_w7CJ5aeojnBKQR7ENlO6Q-W4PwF7raFmsV0x4" />
					</p>
				</FAQuestion>
				<FAQuestion
					question="User moderation"
					buttonId="modDiscretion"
					emote={<i className="fas fa-user-shield"></i>}
				>
					<p>
						All user-generated content (except{" "}
						<Link to="#" onClick={(e) => open_module(e, "#chats")}>
							secure chats
						</Link>
						) is subject to inspection or deletion at moderator discretion. We
						ask that you help us keep our community civil by not abusing this
						platform. <br />
						<br />
						Moderators can send chat messages to users without having to add
						them. These messages are sent in plaintext for auditing purposes and
						are used to warn troublesome members before resorting to
						adminstrative actions, including bans or loss of privileges.
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
