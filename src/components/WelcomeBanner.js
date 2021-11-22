import { useContext, useRef, useState, useEffect } from 'react';
import { logout, useAuth } from './firebase'
import UserProfile from './UserProfile';
import { useNavigate } from 'react-router';
import { UserContext } from './UserContext';
import { Link } from 'react-router-dom';
import EmailVerifier from './EmailVerifier';
import { updateEmail, sendEmailVerification, getAuth } from '@firebase/auth';
function WelcomeBanner (props)
{
    const navigate = useNavigate();
    const currentUser = useAuth();
    const {_user, _setUser} = useContext(UserContext);
    const [pfp, setPfp] = useState("");
    const [user_id, setUserID] = useState("");
    const [verified, setVerified] = useState(false);
    useEffect(() => {
        //console.log("name has changed",_user.username);
        if(_user !== undefined)
        {
            setPfp(_user["pfp"]);
            setUserID(_user["user_id"]);
        }
    }, [_user]);
    const selfRef = useRef();
    function make_entry()
    {
        selfRef.current.style.transform = null;
    }
    return (
        <div>
            <div ref={selfRef} className="welcome" id="welcome"
                    style={{transform:_user === undefined ? "translateX(200%)" : "translateX(0%)",
                        marginRight:"10px"}}>
                {/**<span>Hello,</span> */}
                <Link to={"/profile/" + user_id}>
                    <img className="pfp" style={{objectFit:"cover"}} src={pfp} onLoad={make_entry}/>
                </Link>
                <div className="userOptions">
                    <p>▼</p>
                    <div className="mpContent">
                        {/**verified === false ?
                            <button className="verifyEmail"><span>📧</span>Verify</button>
                        : null */}
                        <button className="logout stealthBtn" onClick={() => {logout(); _setUser(undefined); navigate("/");}}>log out</button>
                    </div>
                </div>
                
                {/**<span style={{marginRight:"10px"}}>{name}</span> */}
            </div>

        </div>
    )
}
export default WelcomeBanner;