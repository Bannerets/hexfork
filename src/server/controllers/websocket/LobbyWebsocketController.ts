import HostedGameRepository from '../../repositories/HostedGameRepository';
import { Service } from 'typedi';
import { WebsocketControllerInterface } from '.';
import { HexSocket } from 'server';

@Service({ id: 'websocket_controller', multiple: true })
export default class LobbyWebsocketController implements WebsocketControllerInterface
{
    constructor(
        private hostedGameRepository: HostedGameRepository,
    ) {}

    onConnection(socket: HexSocket): void
    {
        socket.on('joinGame', async (gameId, answer) => {
            const { player } = socket.data;

            if (null === player) {
                answer('Player not found');
                return;
            }

            const joined = this.hostedGameRepository.playerJoinGame(player, gameId);
            answer(joined);
        });
    }
}
