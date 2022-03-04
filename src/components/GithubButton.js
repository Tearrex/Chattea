function GithubButton ()
{
    return (
        <button className="githuBtn" onClick={() => window.open("https://github.com/Tearrex/Chattea","_blank")}>
            <div className="invertees">
                <div/>
                <p>View Repo</p>
            </div>
        </button>
    )
}
export default GithubButton;