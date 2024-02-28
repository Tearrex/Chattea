import { useRef } from "react";

function FAQuestion(props) {
	const expander = useRef();
	function expand() {
		if (expander.current.style.maxHeight !== "0px") {
			expander.current.style.maxHeight = "0";
			expander.current.setAttribute("open", "false");
		} else {
			expander.current.style.maxHeight =
				expander.current.scrollHeight + 10 + "px";
			expander.current.setAttribute("open", "true");
		}
	}
	return (
		<div className="faQuestion">
			<button
				className="stealthBtn"
				id={props.buttonId || null}
				onClick={expand}
			>
				<span>{props.question}</span>
				<p>{props.emote || null}</p>
			</button>
			<div
				className="expandable"
				ref={expander}
				style={{ maxHeight: !props.open ? "0" : "100%" }}
				open={!props.open ? "false" : "true"}
			>
				<div className="expansion">{props.children}</div>
			</div>
		</div>
	);
}
export default FAQuestion;
