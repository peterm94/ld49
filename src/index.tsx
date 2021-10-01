import './index.css';
import * as React from "react";
import * as ReactDOM from "react-dom";
import './App.css';
import {LagomGameComponent} from "lagom-engine";
import {Pong} from "./Pong";

const game = new Pong();

const App = () => (
    <div style={{display: "flex", height: "100%", alignItems: "center", justifyContent: "center"}}>
        <LagomGameComponent game={game}/>
    </div>
);

ReactDOM.render(
    <App/>,
    document.getElementById("root"));
