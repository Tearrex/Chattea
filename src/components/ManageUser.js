//import pfp from './default_user.png'
//import cam from './cam_icon.png'
import { logout } from './firebase'
async function handleLogout()
{
    try {await logout();}
    catch {alert("error!");}
}
function ManageUser()
{
    //const currentUser = useAuth();

    return (
        <button onClick={handleLogout} style={{marginTop:"90px"}}>Log out</button>
    )
}
export default ManageUser