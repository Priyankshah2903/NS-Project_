import HomePng from '../assets/home.png'

const Home = () => {
    return (
        <>
        <div >
            <br></br>
        </div>
        <div >
            
            <center>
            <img
                src={HomePng}
                style={{ transform: 'scale(1.1)', transformOrigin: 'top center' }}
                alt="Home"
            />
            </center>
        </div>
        </>
    )
}

export default Home
