//import pfp from './default_user.png'
//import cam from './cam_icon.png'
import { useContext, useEffect, useRef, useState } from "react"
import { signup, useAuth, login } from "./firebase"
import {useNavigate} from "react-router-dom"
import { UserContext } from "./UserContext";
import { doc } from "@firebase/firestore";
function Signup(props)
{   
    const navigate = useNavigate();
    const {_user, _setUser} = useContext(UserContext);
    const [loading, setLoading] = useState(false);
    const currentUser = useAuth();
    const overlay = useRef();
    const overlayBG = useRef();
    const [locked, setLock] = useState(true)
    const [isDone, setDone] = useState(false);
    function closePopup()
    {
        if(transitioning === true) return;
        overlayBG.current.style.opacity = "0";
        popupRef.current.style.transform = "translate(50vw, -50%)";
        //document.body.style.overflowY = "hidden";
        console.log("Cancelled log in process...");
    }
    const [transitioning, setTransition] = useState(false);
    const emailRef = useRef();
    const passwordRef = useRef();
    const popupRef= useRef();
    const formRef = useRef();
    const avatarRef= useRef();
    async function handleLogin(e) {
        
        setLoading(true);
        e.preventDefault();
        try{await login(String(emailRef.current.value).toLowerCase(),
            passwordRef.current.value); emailRef.current.value = ""; 
                passwordRef.current.value = ""; setLock(false);}
        catch (e){alert(e);}
        //window.location.reload(false);
        setLoading(false);
    }
    function show()
    {
        switcheroo(false);
        popupRef.current.style.transform = "translate(-50%,-50%)";
        popupRef.current.style.display = "block";
        overlayBG.current.style.display = "block";
        overlayBG.current.style.opacity = "0.7";
        //popupRef.current.style.display = "block";
        //document.body.style.overflowX = "hidden";
    }
    function switcheroo(yes)
    {
        //console.log("switching",yes);
        if (yes === true)
        {
            if(transitioning === true || locked === true)
            {
                //console.log("cant switch", [transitioning, locked]);
                return;
            }
            setTransition(true);
            overlayBG.current.style.opacity = "1";
            formRef.current.style.transform="translateX(-200vw)";
            avatarRef.current.style.transform = "translate(-50%, -50%)";
            navigate("/main");
            setTimeout(function(){
                console.log("weeeeeeeeee!");
                setTransition(false);
                setDone(true); setLock(true);
                overlayBG.current.style.opacity = "0";
                popupRef.current.style.transform = "translate(-200vw, -50%)";
            },3000);
        }
        else
        {
            //popupRef.current.style.display = "block";
            formRef.current.style.transform="translateX(0)";
            avatarRef.current.style.transform = "translate(300%, -50%)";
        }
    }
    useEffect(() => {
        if(_user === undefined)
        {
            switcheroo(false);
        }
        else
        {
            switcheroo(true); //console.log("switchawooo");
        }
    }, [_user]);
    function dismiss_overlay(e)
    {
        //console.log("dismiss overlay ubghhghh");
        if(transitioning === true) return;
        //popupRef.current.style.display = "none";
        overlayBG.current.style.display = "none";
        //document.body.style.overflowY = "hidden";
        //document.body.style.overflowY = "hidden";
    }
    useEffect(() => {
        if(currentUser === null || currentUser === undefined)
        {
            setDone(false);
            switcheroo(false);
        }
    }, [isDone]);
    const [pfp, setPfp] = useState("");
    const [username, SetName] = useState("");
    return (
        <div style={{overflow:"hidden"}}>
            {!currentUser ? <button className="signinBtn" onClick={show}>Already a member?</button> : null}
            <div ref={overlayBG} className="overlay" onClick={closePopup} style={{display:"none", opacity:"0"}} onTransitionEnd={(e) => dismiss_overlay(e)}/>
            <div ref={popupRef} className="popup" style={{transform:"translate(50vw, -50%)", display:"none"}}>
                <form ref={formRef} className="loginForm" onSubmit={handleLogin} style={{transform:"translateX(0)"}}>
                    <input ref={emailRef} type="email" placeholder="*Email address" required></input>
                    <input ref={passwordRef} type="password" placeholder="*Password" required></input>
                    <input type="submit" disabled={loading || currentUser} className="loginBtn" value="Continue"></input>
                </form>
                <div ref={avatarRef} className="cozy" style={{transform:"translate(150%, -50%)"}}>
                    <h1>Welcome back,</h1>
                    <div>
                        <img src={_user !== undefined ? _user.pfp : null} onLoad={(e) => switcheroo(true)}/>
                        <p>{_user !== undefined ? _user.username : ""}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
export default Signup