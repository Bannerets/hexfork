import { HexServer, HexSocket } from "../../server";
import Container from 'typedi';
import LobbyWebsocketController from "./LobbyWebsocketController";
import GameWebsocketController from "./GameWebsocketController";

export interface WebsocketControllerInterface
{
    onConnection(socket: HexSocket): void;
}

export function registerWebsocketControllers() {
    // Explicitely load all WebsocketControllerInterface here to make them available in container.
    LobbyWebsocketController;
    GameWebsocketController;

    const websocketControllers = Container.getMany<WebsocketControllerInterface>('websocket_controller');

    Container
        .get(HexServer)
        .on('connection', socket => {
            socket.join('lobby');

            websocketControllers.forEach(websocketController => {
                websocketController.onConnection(socket);
            });
        })
    ;
}
