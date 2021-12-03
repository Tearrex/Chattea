//import pfp from './default_user.png'
//import cam from './cam_icon.png'
import { useContext, useEffect, useRef, useState } from "react"
import { signup, useAuth, login } from "./firebase"
import { useNavigate } from "react-router-dom"
import { MembersContext, UserContext } from "./UserContext";
import { updateEmail, sendEmailVerification, getAuth } from '@firebase/auth';
import { doc } from "@firebase/firestore";
function Signup(props) {
    const navigate = useNavigate();
    const currentUser = useAuth();
    const { _user, _setUser } = useContext(UserContext);
    const { _users, _setUsers } = useContext(MembersContext);
    const [loading, setLoading] = useState(false);
    const overlay = useRef();
    const overlayBG = useRef();
    const [locked, setLock] = useState(true)
    const [isDone, setDone] = useState(false);
    function closePopup() {
        if (transitioning === true) return;
        overlayBG.current.style.opacity = "0";
        saucerRef.current.style.transform = "translate(50vw, -50%)";
        console.log("Cancelled log in process...");
    }
    // when transitioning, the popup cannot be dismissed by clicking on the background
    const [transitioning, setTransition] = useState(false);
    const emailRef = useRef();
    const passwordRef = useRef();
    const saucerRef = useRef();
    const popupRef = useRef();
    const formRef = useRef();
    const avatarRef = useRef();

    const [shouldLoad, setShouldLoad] = useState(false);
    const pictureNest = useRef();

    /*
    When the user logs in succesfully, create an image element with their picture
    and wait for it load before welcoming them.
    */
    useEffect(() => {
        const abort = new AbortController();
        if (_user !== undefined && shouldLoad) {
            var oldImage = pictureNest.current.querySelector("img");
            if (oldImage) {
                if (oldImage.src == _user.pfp) {
                    console.log("Recycling previous user image");
                    switcheroo(true); setShouldLoad(false);
                    return;
                }
                else
                {
                    oldImage.remove();
                }
            }
            console.log("just logged in", _user["user_id"]);
            var img = new Image();
            img.src = _user.pfp;
            //img.id = "richImage"
            img.onload = function () {
                if (abort.signal["aborted"] === true) {
                    console.log("image load stopped, not in view");
                    return;
                }
                pictureNest.current.insertBefore(img, pictureNest.current.childNodes[0]);
                switcheroo(true); setShouldLoad(false);
            };
        }
        return () => abort.abort();
    }, [_user, shouldLoad]);
    // don't let the user get carried away while it's loading
    function disable_inputs(disable = true)
    {
        emailRef.current.value = ""; passwordRef.current.value = "";
        emailRef.current.disabled = disable; passwordRef.current.disabled = disable;
    }
    /*
    Called when the form is submitted. If successful, the above effect will be executed

    At the moment, login errors are ugly alerts.
    Will make this less instrusive soon.
    */
    async function handleLogin(e)
    {
        setLoading(true);
        e.preventDefault();
        var failed = false;
        try
        {
            await login(String(emailRef.current.value).toLowerCase(),
                passwordRef.current.value);
            setLock(false); disable_inputs();
        }
        catch (e) { alert(e); failed = true; }
        if (!failed) setShouldLoad(true);
        setLoading(false);
    }
    /*
    Moves the login form into view and focuses on the email input.
    */
    function show()
    {
        switcheroo(false); disable_inputs(false);
        saucerRef.current.style.transform = "translate(-50%,-50%)";
        saucerRef.current.style.display = "block";
        overlayBG.current.style.display = "block";
        overlayBG.current.style.opacity = "0.7";
        emailRef.current.focus();
    }
    const emailWindow = useRef();
    function switcheroo(yes)
    {
        if (yes)
        {
            if (transitioning === true || locked === true) return;
            setTransition(true);
            overlayBG.current.style.opacity = "1";
            formRef.current.style.transform = "translateX(-200vw)";
            avatarRef.current.style.transform = "translate(-50%, -50%)";
            //navigate("/main");
            setTimeout(function () {
                if (verified === true) dismiss_verification(true);
                else {
                    emailWindow.current.style.zIndex = "11";
                    emailWindow.current.style.transform = "scale(1) translate(-50%, -50%)";
                }
            }, 3000);
        }
        else
        {
            formRef.current.style.transform = "translateX(0)";
            avatarRef.current.style.transform = "translate(300%, -50%)";
        }
    }
    const [email, setEmail] = useState("");
    const [verified, setVerified] = useState(false);
    useEffect(() => {
        if (currentUser !== null && currentUser !== undefined) {
            setEmail(currentUser.email);
            if (currentUser.emailVerified === true) setVerified(true);
        }
    }, [currentUser]);
    function dismiss_verification(wasEmailVerified, skipped=false)
    {
        if (wasEmailVerified === false) saucerRef.current.style.display = "none";
        navigate("/main");
        setTimeout(() => {
            overlayBG.current.style.opacity = "0";
            if (wasEmailVerified)
            {
                saucerRef.current.style.transform = "translate(-150vw, -50%)";
                setDone(true);
            }
            else
            {
                emailWindow.current.style.transform = "scale(0) translate(-50%,-50%)";
            }
            setTransition(false);
            setLock(true);
        }, 2000);
    }
    useEffect(() => {
        if(isDone)
        {
            finish_transition();
            setDone(false);
        }
    }, [isDone]);
    function finish_transition(e)
    {
        if (linkSent === false || isDone === false) return;
        saucerRef.current.style.display = "none";
        overlayBG.current.style.display = "none";
        console.log("transition finished");
    }
    const [verifying, setVerifying] = useState(false);
    const [linkSent, setLinkSent] = useState(false);
    const emailInput = useRef();
    async function handle_email(e)
    {
        e.preventDefault();
        if (linkSent === true) {
            dismiss_verification(false);
            return;
        }
        setVerifying(true);
        if (email !== currentUser.email) {
            try { await updateEmail(currentUser, email) }
            catch (e) { alert("Failed to update email: " + e); setVerifying(false); return; }
            console.log("email updated!");
        }
        try { await sendEmailVerification(currentUser); emailInput.current.disabled = true; }
        catch (e)
        {
            alert("Failed to send verification link: " + e); setVerifying(false);
            dismiss_verification(false);
            return;
        }
        setLinkSent(true);
    }
    useEffect(() => {
        console.log("transitionionign now", transitioning);
    }, [transitioning]);
    function dismiss_overlay(e)
    {
        //console.log("dismiss overlay ubghhghh");
        if (transitioning === true) return;
        //popupRef.current.style.display = "none";
        overlayBG.current.style.display = "none";
        //document.body.style.overflowY = "hidden";
        //document.body.style.overflowY = "hidden";
    }
    useEffect(() => {
        // reverts the login form back into its original position
        if (currentUser === null || currentUser === undefined) {
            setDone(false);
            switcheroo(false);
        }
    }, [isDone]);
    function skip_email(e)
    {
        e.preventDefault();
        dismiss_verification(false, true);
        console.log("skip email");
    }
    return (
        <div className="teaDescendant">
            {!currentUser ? <button className="signinBtn" onClick={show}>Already a member?</button> : null}
            <div ref={overlayBG} className="overlay" onClick={closePopup} style={{ display: "none", opacity: "0", zIndex:"5" }} onTransitionEnd={(e) => dismiss_overlay(e)} />
            <div ref={saucerRef} className="flyingSaucer" style={{ transform: "translate(50vw, -50%)" }}>
                <div ref={popupRef} className="popup">
                    <form ref={formRef} className="loginForm" onSubmit={handleLogin} style={{ transform: "translateX(0)" }}>
                        <input ref={emailRef} type="email" placeholder="*Email address" required></input>
                        <input ref={passwordRef} type="password" placeholder="*Password" required></input>
                        <input type="submit" disabled={loading || currentUser} className="loginBtn" value="sign in"></input>
                    </form>
                </div>
                <div ref={avatarRef} className="cozy" style={{ transform: "translate(150%, -50%)" }}>
                    <h1>Welcome back,</h1>
                    <div ref={pictureNest}>
                        <p>{_user !== undefined ? _user.username : ""}</p>
                    </div>
                </div>
            </div>
            <div ref={emailWindow} className="verifyWindow"
                style={{ transform: "scale(0) translate(-50%, -50%)", zIndex: "-2" }}
                onTransitionEnd={(e) => finish_transition(e)}>
                {linkSent === false ?
                    <div>
                        <h1>Email Verification</h1>
                        <p>This is required for password resets and will be necessary for
                            uploading images in the future.</p>
                    </div> :
                    <div>
                        <h1>✓ Email Sent</h1>
                        <p>A verification link has been tossed to your email.</p>
                    </div>
                }
                <form onSubmit={(e) => handle_email(e)}>
                    <input ref={emailInput} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <input type="submit" value={linkSent === false ? "Send Link" : "Dismiss"} />
                    <input type="submit" value={"Later"} style={{backgroundColor:"#747474"}} onClick={(e) => skip_email(e)}/>
                </form>
            </div>
        </div>
    )
}
export default Signup