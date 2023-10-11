import { useDocumentData } from "react-firebase-hooks/firestore";
import { doc } from "firebase/firestore";
import { useContext, useEffect, useState } from "react";
import { _dbRef } from "../Main/firebase";
import { UserContext, showLogin } from "../Main/Contexts";
function SmileCounter(props) {
	const { _user, _setUser } = useContext(UserContext);
	const { _showLogin, setLogin } = useContext(showLogin);
	const [_smiles, setSmiles] = useState(null); //props.smiles;
	//doc(_dbRef, "users", user_id);
	//const omg = collection(_dbRef, 'users/' + props.author + '/smiles');
	const _smilesRef = doc(
		_dbRef,
		"users/" + props.authorID + "/smiles/" + props.postID
	);
	const smiles = useDocumentData(_smilesRef);
	useEffect(() => {
		if (smiles[0] !== undefined) {
			var ssmiles = smiles[0]["smiles"];
			setSmiles([ssmiles.length, ssmiles]);
		}
	}, [smiles]);
	return (
		<div className="managePost">
			<div
				className="smileButton"
				post={props.postID}
				onClick={() => {
					if (_user) props.setSmilers(_smiles[1]);
					else setLogin(true); // prompt for auth
				}}
			>
				{_smiles && (
					<span style={{ cursor: "default", border: "none" }}>
						{_smiles[0] == 0 ? "🙂" : "😃"} {_smiles[0]}
					</span>
				)}
			</div>
		</div>
	);
}
export default SmileCounter;
