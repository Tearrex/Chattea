import { useRef } from "react";

function Scroller ()
{
    const scroller = useRef();
    //console.log(document.body.offsetHeight)
    window.onscroll = function (e)
    {
        //console.log(window.scrollY);
        if((window.innerHeight + window.scrollY) / document.body.offsetHeight >= 0.5)
        {
            scroller.current.style.bottom = "0";
        }
        else
        {
            scroller.current.style.bottom = "-30%";
        }
    };
    function up()
    {
        var top = document.getElementById("main");
        top.scrollIntoView({behavior:"smooth", block:"start"});
    }
    return (
        <div ref={scroller} className="scroller" onClick={up} style={{bottom:"-30%"}}></div>
    )
}
export default Scroller