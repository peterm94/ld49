import './index.css';
import * as React from "react";
import * as ReactDOM from "react-dom";
import './App.css';
import {LagomGameComponent, SpriteSheet} from "lagom-engine";
import {LD49, screenHeight, screenWidth} from "./LD49";
import start from "./Art/splash/start.png";
import {useEffect} from "react";
export const viewCollisionSystem = false;
export const pressedKeys: Set<string> = new Set();

export const titleScreen = new SpriteSheet(start, screenWidth, screenHeight);

titleScreen.load().then(() => {

    const game = new LD49();

    const App = () => {

        useEffect(() => {

            const addKey = (e: KeyboardEvent) => pressedKeys.add(e.key);
            const removeKey = (e: KeyboardEvent) => pressedKeys.delete(e.key);
            const clearKeys = () => pressedKeys.clear();
            const mousedown = (e: MouseEvent) => {
                if (e.button === 2) {
                    pressedKeys.clear();
                }
            };

            window.addEventListener("keydown", addKey);
            window.addEventListener("keyup", removeKey);
            window.addEventListener("blur", clearKeys);
            window.addEventListener("mousedown", mousedown);

            return () => {
                window.removeEventListener("keydown", addKey);
                window.removeEventListener("keyup", removeKey);
                window.removeEventListener("blur", clearKeys);
                window.removeEventListener("mousedown", mousedown);
            };
        }, []);

        return (
            <div style={{display: "flex", height: "100%", alignItems: "center", justifyContent: "center"}}>
                <LagomGameComponent game={game}/>
                {viewCollisionSystem &&
                <canvas id={"detect-render"} width={"426"} height={"240"} style={{border: "black", borderStyle: "solid"}}/>}
            </div>
        );
    };

    ReactDOM.render(
        <App/>,
        document.getElementById("root"));

});
