import { useNavigate } from "react-router";
import { useContext } from "react";
import { UserContext } from "../../Main/Contexts";
import GithubButton from "../../GithubButton";
import FAQuestion from "./FAQuestion";

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
	return (
		<footer id="faq">
			<div className="faqNest">
				<h2>
					<i class="fas fa-question-circle"></i> FAQ
				</h2>
				<FAQuestion question="What is Chattea?" emote="☕">
					<p>
						Chattea is a modest social media platform for making pocket-sized
						memories as you go about your days. Meet new people and vibe with
						those that share similar hobbies or interests. The idea is to post
						glimpses of your activities while adding some mystery ;)
						<br />
					</p>
					<p>
						You can check-in whenever you like and perhaps you'll get a laugh
						out of some goofy post.
					</p>
				</FAQuestion>
				<FAQuestion question="Who can see my posts?" emote="👀">
					<p>
						At the moment, every user that is logged in can view what you post.
						Stay tuned for updates!
						<br />
						Please keep the content appropriate for the general public, be kind
						to others.
					</p>
				</FAQuestion>
				<FAQuestion question="Can I edit my posts?" emote="✏️">
					<p>
						To keep things simple, you cannot edit the posts that you make. Same
						goes for comments. You can always <i>delete</i> your posts later.
					</p>
				</FAQuestion>
				<FAQuestion question="What are buddies?" emote="👥">
					<p>
						Buddies are your friends. You should only add someone as your buddy
						if you know them. This feature will be expanded upon to make it more
						useful later.
					</p>
				</FAQuestion>
				<FAQuestion question="What about my data?" emote="😱">
					<p>Privacy concerns are a big deal! Here are the details:</p>
					<h2>How we store your data</h2>
					<p>When you sign up, the following is collected from you</p>
					<ul className="dataSection">
						<li>Username</li>
						<li>Email</li>
						<li>Password</li>
						<li>Current date</li>
					</ul>
					<p>
						This info is saved on a cloud database to keep track of every user
						that exists on the website. <br />
						<u>Your email is private from others</u>; It serves as an
						authentication and recovery method for your account. <br />
						We also fight spam by limiting accessibility to some parts of the
						website for those that are not verified. You'll only be emailed per
						your request.
					</p>
					<p>
						Every user is assigned an <b>identifier</b> upon signing up. The
						identifier (ID) is a unique sequence of random letters and numbers
						that distinguishes you from the rest of the users on Chattea.
					</p>
					<h2>How we use your data</h2>
					<p>Your identifier is logged when you do something like</p>
					<ul className="dataSection">
						<li>Create a post</li>
						<li>Like a post</li>
						<li>Add a comment</li>
						<li>Add a buddy</li>
					</ul>
					<p>
						This is only used to make Chattea function properly. Like displaying
						the correct author for each post and comment.
					</p>
					<p>
						As you browse the website, the profile data you fetch about other
						users will be cached locally on your device until you log out or
						clear your browser cookies. This cuts down bandwidth costs and the
						amount of requests your browser makes to the cloud. This means edits
						to your profile may not update for others right away.
					</p>
				</FAQuestion>
				<FAQuestion question="But why tea?" emote="🤔">
					<p>It's just catchy...</p>
				</FAQuestion>
				{_user === undefined && (
					<>
						<hr style={{ width: "100%" }} />
						<div className="faqactions">
							<button className="faqSignUp" onClick={focus_signup}>
								<i class="fas fa-angle-double-up"></i> Sign up!
							</button>
							<button onClick={guest_mode} className="guestMode">
								<i className="fas fa-eye"></i> Try guest mode
							</button>
						</div>
					</>
				)}
				<hr style={{ width: "100%" }} />
				<h2>
					<i class="fas fa-info-circle"></i> Feature Discretions
				</h2>
				<FAQuestion question="Profanity filters" emote="###">
					<p>
						Upon opening Chattea's feed for the first time, your browser will
						make a secure HTTP request to our{" "}
						<a href="https://github.com/Tearrex/Chattea" target="_blank">
							public code repository
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
					emote={<i className="fas fa-image"></i>}
				>
					<p>
						You must verify your email before posting images. <br />
						<br />
						Images over a certain file size are subject to lossy{" "}
						<b>compression</b> by your browser prior to uploading to our cloud
						storage. The size limit fluctuates depending on storage demands.
						<br />
						<br />
						We also offer an embedded browser tool for <b>cropping</b> your
						images into perfect squares for the best viewing experience for all
						users. We encourage you to use it, but{" "}
						<u>here's what you must know</u>:
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
						server for a cost-effective computing approach.
						<br />
						<br />
						<i class="fas fa-shield-alt"></i> We protect your privacy by
						stripping all metadata from the image before sending it back to you.
						The binary data of your image is processed in server memory instead
						of saving to disk storage, for optimal security.
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
						Before using this service, <u>keep in mind</u>:
						<br />
						Your initial use will make a secure HTTP request to an intermediate
						cloud API in order to retrieve a temporary access token for search
						results. This creates a seamless experience for you by not prompting
						for log in through Spotify.
					</p>
				</FAQuestion>
				<FAQuestion
					question="User moderation"
					emote={<i className="fas fa-user-shield"></i>}
				>
					<p>
						All user-generated content is contingent to inspection or deletion
						at moderator discretion without prior notice. We do our best to keep
						our small community civil and we ask that you help us achieve the
						same by not abusing our platform. <br />
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
