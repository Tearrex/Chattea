//import { Link } from "react-router-dom";
import { useAuth } from "./firebase";
import WelcomeBanner from "./WelcomeBanner";
import Signup from "./Signup";
import { Link } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "./UserContext";
function TeaBar ()
{
    const {_user, _setUser} = useContext(UserContext);
    const currentUser = useAuth();
    return (
        <div>
            <div className="welcomer">
                <div className="chattea" 
                        style={{transform:currentUser? "translateX(0)" : "translateX(-50%)",
                            left:currentUser?"0":"50%"}}>
                    <p className="teaPrefix" style={{maxWidth:currentUser ? "0" : "100%"}}>Get</p>
                    <div style={{gap:"10px"}}>
                        <Link to={currentUser?"/main":"/"}><div style={{backgroundImage:"url('/tea.png')"}}></div></Link>
                        <p>Chat<span>tea</span></p>
                    </div>
                    <p style={{opacity:currentUser ? "0" : "1"}}>with people!</p>
                </div>
                <WelcomeBanner pfp={_user !== undefined ? _user["pfp"] : ""}/>
            </div>
            <Signup/>
        </div>
    )
}
export default TeaBar;