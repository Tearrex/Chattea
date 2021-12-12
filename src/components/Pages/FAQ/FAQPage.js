import { useNavigate } from "react-router";
import { useContext } from "react";
import { UserContext } from "../../Contexts";
import GithubButton from "../../GithubButton";
import FAQuestion from "./FAQuestion";

function FAQPage (props)
{
    const navigate = useNavigate();
    const { _user, _setUser } = useContext(UserContext);
    return (
        <div id="home" style={{alignItems:"center"}}>
            <div style={{width:"clamp(300px, 90%, 600px)"}}>
                <h1 style={{color:"#fff", fontSize:"1.5rem"}}>Learn more about the platform</h1>
                <div className="faqNest">
                    <FAQuestion question="What is Chattea?" emote="☕">
                        <p>
                        Chattea aims to be a painless social media platform where you can ramble about with friends.
                        The idea is that you can meet new people as they come along and vibe with those that
                        share similar hobbies or interests. You post updates of what you've been up to for those
                        curious about their surroundings.<br/>
                        </p>
                        <p>
                        Life gets rough sometimes. You can check-in whenever you like and perhaps you'll find
                        something that will cheer you up, or you can make a post that may brighten the day for others.
                        </p>
                    </FAQuestion>
                    <FAQuestion question="Who can see my posts?" emote="👀">
                        <p>
                        At the moment, every user that is logged in
                        can see what you post. In the future,
                        you will be able to make it private for your buddies.<br/>
                        For now, post only what you are comfortable with sharing in public.
                        Please keep the content appropriate for everyone and be friendly to people you may not know!
                        </p>
                    </FAQuestion>
                    <FAQuestion question="Can I edit my posts?" emote="✏️">
                        <p>
                        To keep things simple, you <b>cannot</b> edit the posts that you make.
                        Same goes for comments.
                        Make sure to think it through before you send it!<br/>
                        You can always <i>delete</i> your posts later.
                        </p>
                    </FAQuestion>
                    <FAQuestion question="What are buddies?" emote="👥">
                        <p>
                        Buddies are your friends. Ideally, you should only make someone
                        your buddy if you know them.
                        This feature will be expanded upon to make it more useful later.
                        </p>
                    </FAQuestion>
                    <FAQuestion question="What about my data?" emote="😱">
                        <p>Privacy concerns are a big deal! Here are the details:</p>
                        <p>When you sign up, the following is collected from you</p>
                        <ul className="dataSection">
                            <li>Username</li>
                            <li>Email</li>
                            <li>Password</li>
                            <li>Current date</li>
                        </ul>
                        <p>
                        This information is recorded on a database to keep track of every user that exists on the website.
                        Other websites follow a similar process, though they probably collect a lot more
                        and hide it behind a lengthy terms of service agreement that looks like gibberish—can you relate?
                        </p>
                        <p>Every user is assigned an <b>identifier</b> upon signing up.
                        The identifier (ID) is a unique sequence of random letters and numbers that distinguishes you
                        from the rest of the users on Chattea.
                        </p>
                        <p>
                        Your identifier is logged when you do something like
                        </p>
                        <ul className="dataSection">
                            <li>Create a post</li>
                            <li>Smile a post</li>
                            <li>Add a comment</li>
                            <li>Add a buddy</li>
                        </ul>
                        <p>
                        This is only used to make Chattea function properly. For the sake of transparency, this question will be
                        kept updated with the latest information of how your data is handled.
                        </p>
                        <h2 style={{margin:"0"}}>Remember</h2>
                        <p>
                        You can always check the source code of this project on GitHub to see exactly what it does
                        in the background.
                        </p>
                        <GithubButton/>
                    </FAQuestion>
                    <FAQuestion question="But why tea?" emote="🤔">
                        <p>It's just catchy...</p>
                    </FAQuestion>
                    <FAQuestion question="More questions?" emote="❔">
                        <p>
                        If you have a lingering question, problem or suggestion,
                        feel free to join the Discord server. It is the easiest and fastest
                        way to stay in the loop.
                        </p>
                        <span className="discordBtn" onClick={() => window.open("https://discord.gg/S5gzJpFKKa","_blank")}>
                            <div>
                                <div/>
                                <p>Join Server</p>
                            </div>
                        </span>
                    </FAQuestion>
                    {_user === undefined ?
                    <button className="faqSignUp" onClick={() => navigate("/")}>Interested? Sign up!</button>
                    : null}
                </div>
                <h3 style={{fontWeight:"normal", color:"#fff"}}>🛠️ This page will be updated regularly throughout development.</h3>
            </div>
        </div>
    )
}
export default FAQPage;