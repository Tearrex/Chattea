import { useRef, useState, useEffect } from "react";
import { sendEmailVerification } from "@firebase/auth";
import { signup } from "./firebase";
import MediaPost from "./MediaPost";
import Signup from "./Signup";
function Splash() {
    const [loading, setLoading] = useState(true);

    const inputHeight = 60;
    const [formHeight, setFormHeight] = useState(inputHeight);
    const offsetHeight = 5;
    const expandForm = useRef();

    const nameField = useRef();
    const [nameInput, setName] = useState("");
    function name_input(e) {
        if (e.target.value.length <= 20) setName(e.target.value);
    }
    useEffect(() => {
        if (nameInput.length >= 3 && formHeight <= inputHeight) {
            //setFormHeight(formHeight + inputHeight + offsetHeight);
            nameField.current.style.border = null;
            setLoading(false);
        }
        else if (nameInput.length < 3) {
            setLoading(true);
            setFormHeight(inputHeight);
        }
    }, [nameInput]);

    const emailField = useRef();
    const [emailInput, setEmail] = useState("");
    // barebones validation, room for error
    function is_email(text) {
        if (text.includes("@")) {
            var at = text.split("@");
            if (at[1].includes(".") && at[1].split(".")[1].length >= 2) return true;
            else return false;
        }
        else return false;
    }
    useEffect(() => {
        emailField.current.style.border = null;
        //console.log(is_email(emailInput));
        if (is_email(emailInput) === true) {
            if (passInput === "" || loading && formHeight <= (inputHeight * 2) + (offsetHeight * 2)) setLoading(false);
        }
        else {
            setLoading(true); setSubText("Continue");
            if (nameInput !== "") setFormHeight((inputHeight * 2) + (offsetHeight * 2));
            else {
                setSubText("Continue"); setLoading(true);
            }
        }
    }, [emailInput]);

    const passField = useRef();
    const [passInput, setPass] = useState("");

    useEffect(() => {
        if (passInput.length >= 6) {
            passField.current.style.border = null;
            if (formHeight <= (inputHeight * 3) + (offsetHeight * 4)) {
                setFormHeight(formHeight + inputHeight + (offsetHeight * 2)); // 1 offsetheight only
            }
        }
        else {
            if (is_email(emailInput) === true) setFormHeight((inputHeight * 3) + (offsetHeight *  3));
            if (cpassInput === "") setLoading(true);
        }
    }, [passInput]);

    const cpassField = useRef();
    const [cpassInput, setCpass] = useState("");
    const [submitText, setSubText] = useState("Continue");
    useEffect(() => {
        if (cpassInput !== passInput && cpassInput !== "") {
            passField.current.style.border = "3px solid #E74C3C";
            cpassField.current.style.border = "3px solid #E74C3C";
            setLoading(true);
            setSubText("Continue");
        }
        else {
            if (passInput !== "" && passInput === cpassInput) {
                passField.current.style.border = "3px solid #2ECC71";
                cpassField.current.style.border = "3px solid #2ECC71";
                setLoading(false);
                setSubText("Finish");
            }
        }
    }, [cpassInput, passInput]);
    async function handleSignup() {
        setLoading(true);
        try { await signup(emailInput, passInput, nameInput); }
        catch (e) { alert(e); }
        //window.location.reload(false);
        setLoading(false);
    }
    function advance_form(e) {
        e.preventDefault();
        if (loading === true) return;
        if (nameField.current.value.length < 3) {
            nameField.current.style.border = "3px solid #E74C3C";
            setFormHeight(inputHeight);
        }
        else {
            if (formHeight <= inputHeight) {
                if (is_email(emailInput) === false) setLoading(true);
                setFormHeight(formHeight + inputHeight + (offsetHeight * 2));
            }
            else {
                if (is_email(emailInput) === true) {
                    if (passInput.length < 6) {
                        setLoading(true);

                    }
                    if (formHeight <= (inputHeight * 2) + (offsetHeight * 3)) {
                        setFormHeight(formHeight + inputHeight + offsetHeight);
                        return;
                    }
                    if (passInput.length >= 6) {
                        if (formHeight <= (inputHeight * 3) + (offsetHeight * 4)) {
                            setFormHeight(formHeight + inputHeight + offsetHeight);
                        }
                        if (passInput === cpassInput) {
                            handleSignup();
                        }
                    }
                    else passField.current.style.border = "3px solid #E74C3C";
                }
                else {
                    setLoading(true);
                    emailField.current.style.border = "3px solid #E74C3C";
                }
            }
        }
    }
    return (
        <div className="splashNet">
            <div className="splash" style={{ backgroundImage: "url('network.png')" }}></div>
            <div className="splashRegister">

                <p className="splashSub">Start <span>brewing</span> your memories</p>
                <form onSubmit={(e) => advance_form(e)}>
                    <div ref={expandForm} style={{ maxHeight: formHeight + "px" }}>
                        <input ref={nameField} type='text' placeholder='Your Name' value={nameInput} onChange={(e) => name_input(e)} />
                        <input ref={emailField} type='email' placeholder='Email Address' value={emailInput} onChange={(e) => setEmail(e.target.value)} />
                        <input ref={passField} type='password' placeholder='Create Password' value={passInput} onChange={(e) => setPass(e.target.value)} />
                        <input ref={cpassField} type='password' placeholder='Repeat Password' value={cpassInput} onChange={(e) => setCpass(e.target.value)} />
                    </div>
                    <input type='submit' value={submitText} style={{ opacity: loading === true ? "0.5" : "1" }} />
                </form>
            </div>
        </div>
    );
}
export default Splash;