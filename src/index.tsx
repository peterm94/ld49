import './index.css';
import * as React from "react";
import * as ReactDOM from "react-dom";
import './App.css';
import {LagomGameComponent, SpriteSheet} from "lagom-engine";
import {LD49, screenHeight, screenWidth} from "./LD49";
import start from "./Art/splash/start.png";
export const viewCollisionSystem = true;

export const titleScreen = new SpriteSheet(start, screenWidth, screenHeight);
titleScreen.load().then(() => {

    const game = new LD49();

    const App = () => (
        <div style={{display: "flex", height: "100%", alignItems: "center", justifyContent: "center"}}>
            <LagomGameComponent game={game}/>
            {viewCollisionSystem &&
            <canvas id={"detect-render"} width={"426"} height={"240"} style={{border: "black", borderStyle: "solid"}}/>}
        </div>
    );

    ReactDOM.render(
        <App/>,
        document.getElementById("root"));

});
