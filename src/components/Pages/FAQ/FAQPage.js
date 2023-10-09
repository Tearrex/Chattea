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
						This information is recorded on a database to keep track of every
						user that exists on the website. Your email is not shared with
						others, it serves as a recovery method for your account and
						mitigates grief by limiting accessibility to some parts of the
						website for those that are not verified. You'll only be emailed per
						your request and passwords are encrypted.
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
						This is only used to make Chattea function properly. Like displaying
						the correct author for each post and comment.
						<br />
						For the sake of transparency, this question will be kept updated
						with the latest information of how your data is handled.
					</p>
					<p>
						As you browse the website, the profile data you fetch about other
						users will be cached until you log out or clear your browser
						cookies. We do this to cut down on bandwidth costs and the amount of
						requests your device makes to the server. This means edits to your
						profile may not update for others right away.
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
				{_user === undefined && (
					<div className="faqactions">
						<button className="faqSignUp" onClick={focus_signup}>
							<i class="fas fa-angle-double-up"></i> Interested? Sign up!
						</button>
						<button onClick={guest_mode}>
							<i className="fas fa-eye"></i> Try guest mode
						</button>
					</div>
				)}
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
