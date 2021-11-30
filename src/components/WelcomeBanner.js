import { useContext, useRef, useState, useEffect } from 'react';
import { logout, useAuth } from './firebase'
import UserProfile from './UserProfile';
import { useNavigate } from 'react-router';
import { MembersContext, UserContext } from './UserContext';
import { Link } from 'react-router-dom';
import { updateEmail, sendEmailVerification, getAuth } from '@firebase/auth';
import NotificationChild from './NotificationChild';
function WelcomeBanner (props)
{
    const navigate = useNavigate();
    const currentUser = useAuth();
    const {_user, _setUser} = useContext(UserContext);
    const {_users, _setUsers} = useContext(MembersContext);
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
    function logout_user()
    {
        if(_users[_user.user_id] === undefined)
        {
            //Save the user's data so we don't have to ask for it again.
            _setUsers({..._users, _user});
        }
        logout()
        _setUser(undefined); navigate("/");
    }
    function make_entry()
    {
        selfRef.current.style.transform = null;
    }
    return (
        <div>
            <div ref={selfRef} className="welcome" id="welcome"
                    style={{transform:_user === undefined ? "translateX(200%)" : "translateX(0%)",
                        marginRight:"10px"}}>
                <img className="pfp" style={{objectFit:"cover", cursor:"pointer"}} src={pfp}
                    onLoad={make_entry} onClick={(e) => navigate("/profile/" + user_id)}/>
                <div className="userOptions">
                    <p>▼</p>
                    <div className="mpContent">
                        {/**verified === false ?
                            <button className="verifyEmail"><span>📧</span>Verify</button>
                        : null */}
                        <button className="logout stealthBtn" onClick={logout_user}>log out</button>
                    </div>
                </div>
                <div className="notifMain" onClick={props.notifEvent}>
                    <p>🔔</p>
                    <span style={{backgroundColor:(props.notifCount === 0) ? "#8f8f8f": "#E74C3C"}}>{props.notifCount}</span>
                </div>
            </div>

        </div>
    )
}
export default WelcomeBanner;