import { useNavigate } from "react-router";
import { useContext } from "react";
import { UserContext } from "../../Main/Contexts";
import GithubButton from "../../GithubButton";
import FAQuestion from "./FAQuestion";

function FAQPage(props) {
	const navigate = useNavigate();
	const { _user, _setUser } = useContext(UserContext);
	return (
		<div id="home" style={{ alignItems: "center" }}>
			<div style={{ width: "clamp(300px, 90%, 600px)" }}>
				<h1 style={{ color: "#fff", fontSize: "1.5rem" }}>
					Learn more about the platform
				</h1>
				<div className="faqNest">
					<FAQuestion question="What is Chattea?" emote="☕">
						<p>
							Chattea is a modest social media platform for making pocket-sized
							memories as you go about your days. Meet new people as they come
							along and vibe with those that share similar hobbies or interests.
							Post glimpses of your activities and add some mystery ;)
							<br />
						</p>
						<p>
							You can check-in whenever you like and perhaps you'll get a laugh
							out of some goofy post.
						</p>
					</FAQuestion>
					<FAQuestion question="Who can see my posts?" emote="👀">
						<p>
							At the moment, every user that is logged in can view what you
							post. Stay tuned for updates!
							<br />
							Please keep the content appropriate for the general public, be
							kind to others.
						</p>
					</FAQuestion>
					<FAQuestion question="Can I edit my posts?" emote="✏️">
						<p>
							To keep things simple, you cannot edit the posts that you make.
							Same goes for comments. You can always <i>delete</i> your posts
							later.
						</p>
					</FAQuestion>
					<FAQuestion question="What are buddies?" emote="👥">
						<p>
							Buddies are your friends. You should only add someone as your
							buddy if you know them. This feature will be expanded upon to make
							it more useful later.
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
							This information is recorded on a database to keep track of every
							user that exists on the website. Your email is not shared with
							others, it serves as a recovery method for your account and
							mitigates grief by limiting accessibility to some parts of the
							website for those that are not verified. You'll only be emailed
							per your request and passwords are encrypted.
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
							<li>Smile a post</li>
							<li>Add a comment</li>
							<li>Add a buddy</li>
						</ul>
						<p>
							This is only used to make Chattea function properly. Like
							displaying the correct author for each post and comment.
							<br />
							For the sake of transparency, this question will be kept updated
							with the latest information of how your data is handled.
						</p>
						<p>
							As you browse the website, the profile data you fetch about other
							users will be cached until you log out or clear your browser
							cookies. We do this to cut down on bandwidth costs and the amount
							of requests your device makes to the server. This means edits to
							your profile may not update for others right away.
						</p>
						<h2>Note</h2>
						<p>
							You can always check the source code of this project on GitHub to
							see exactly what it does in the background.
						</p>
						<GithubButton />
					</FAQuestion>
					<FAQuestion question="But why tea?" emote="🤔">
						<p>It's just catchy...</p>
					</FAQuestion>
					<FAQuestion question="More questions?" emote="❔">
						<p>
							If you have a lingering question, feel free to hang out in our
							little Discord server.
							<br />
							In case the website ever combusts or anything.
						</p>
						<span
							className="discordBtn"
							onClick={() =>
								window.open("https://discord.gg/vYPWejJTet", "_blank")
							}
						>
							<div>
								<div />
								<p>Join Server</p>
							</div>
						</span>
					</FAQuestion>
					{_user === undefined ? (
						<button className="faqSignUp" onClick={() => navigate("/")}>
							Interested? Sign up!
						</button>
					) : null}
				</div>
				<h3 style={{ fontWeight: "normal", color: "#fff" }}>
					🛠️ This page will be updated regularly throughout development.
				</h3>
			</div>
		</div>
	);
}
export default FAQPage;
