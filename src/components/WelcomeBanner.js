import { useContext, useRef, useState, useEffect } from 'react';
import { logout } from './firebase'
import UserProfile from './UserProfile';
import { useNavigate } from 'react-router';
import { UserContext } from './UserContext';
import { Link } from 'react-router-dom';
function WelcomeBanner (props)
{
    const navigate = useNavigate();
    const menu = useRef();
    const {_user, _setUser} = useContext(UserContext);
    const [name, setName] = useState("");
    const [pfp, setPfp] = useState("");
    const [user_id, setUserID] = useState("");
    useEffect(() => {
        //console.log("name has changed",_user.username);
        if(_user !== undefined)
        {
            setName(_user["username"]);
            setPfp(_user["pfp"]);
            setUserID(_user["user_id"]);
        }
    }, [_user]);
    const selfRef = useRef();
    function persist(disp)
    {
        menu.current.style.display = disp;
        //document.body.style.overflow = "hidden";
    }
    function make_entry()
    {
        selfRef.current.style.transform = null;
    }
    return (
        <div ref={selfRef} className="welcome" id="welcome"
                style={{transform:_user === undefined ? "translateX(200%)" : "translateX(0%)"}}>
            {/**<span>Hello,</span> */}
            <div className="userOptions">
                <Link to={"/profile/" + user_id}>
                    <img className="pfp" style={{objectFit:"cover"}} src={pfp} onLoad={make_entry}/>
                </Link>
                <div ref={menu} className="mpContent">
                    <button onClick={() => {logout(); _setUser(undefined); navigate("/");}}>log out</button>
                </div>
            </div>
            <span style={{marginRight:"10px"}}>{name}</span>
        </div>
    )
}
export default WelcomeBanner;