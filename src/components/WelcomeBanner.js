import { useContext, useRef, useState, useEffect } from 'react';
import { logout, useAuth } from './firebase'
import { useNavigate } from 'react-router';
import { MembersContext, UserContext } from './UserContext';
function WelcomeBanner (props)
{
    const navigate = useNavigate();
    const {_user, _setUser} = useContext(UserContext);
    const {_users, _setUsers} = useContext(MembersContext);
    const [pfp, setPfp] = useState("");
    const [user_id, setUserID] = useState("");
    const [show, setShow] = useState(false);
    useEffect(() => {
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
        setShow(false);
        logout()
        _setUser(undefined); navigate("/");
    }
    useEffect(() => {
        if(show)
        {
            selfRef.current.style.zIndex = null;
            selfRef.current.style.opacity = "1";
        }
        else selfRef.current.style.opacity = "0";
    }, [show]);
    function hide()
    {
        if(!show) selfRef.current.style.zIndex = "-5";
    }
    return (
        <div ref={selfRef} className="welcome" id="welcome"
                style={{zIndex:"-5", opacity:"0", marginRight:"10px"}}
                    onTransitionEnd={hide}>
            <img className="pfp" style={{objectFit:"cover", cursor:"pointer"}} src={pfp}
                onLoad={(e) => setShow(true)} onClick={(e) => navigate("/profile/" + user_id)}/>
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
    )
}
export default WelcomeBanner;