import { useRef } from "react";

function FAQuestion(props) {
	const expander = useRef();
	function expand() {
		if (expander.current.style.maxHeight !== "0px") {
			expander.current.style.maxHeight = "0";
		} else {
			expander.current.style.maxHeight =
				expander.current.scrollHeight + 10 + "px";
		}
	}
	return (
		<div className="faQuestion">
			<button className="stealthBtn" onClick={expand}>
				{props.question}
				<p>{props.emote || null}</p>
			</button>
			<div className="expandable" ref={expander} style={{ maxHeight: "0" }}>
				<div className="expansion">{props.children}</div>
			</div>
		</div>
	);
}
export default FAQuestion;
