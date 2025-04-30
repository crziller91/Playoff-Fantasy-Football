import { DraftStore } from './DraftStore';
import { TeamsStore } from './TeamsStore';
import { PlayersStore } from './PlayerStore';
import { ScoresStore } from './ScoresStore';
import { Socket } from 'socket.io-client';
import { toast } from 'react-toastify';

export class RootStore {
    draftStore: DraftStore;
    teamsStore: TeamsStore;
    playersStore: PlayersStore;
    scoresStore: ScoresStore;
    socket: Socket | null = null;

    constructor() {
        this.draftStore = new DraftStore(this);
        this.teamsStore = new TeamsStore(this);
        this.playersStore = new PlayersStore(this);
        this.scoresStore = new ScoresStore(this);
    }

    // Update the socket event listeners in setSocket method
    setSocket(socket: Socket | null) {
        this.socket = socket;

        if (socket) {
            // Set up socket event listeners
            socket.on('draftPickUpdate', (data) => {
                if (data.action === 'add' || data.action === 'update') {
                    this.playersStore.handleRemoteDraftPickUpdate(data);
                    toast.info(`${data.team} selected ${data.player.name} in round ${data.pick}`);
                } else if (data.action === 'remove') {
                    this.playersStore.handleRemoteDraftPickRemoval(data);
                    toast.info(`${data.team} removed their pick in round ${data.pick}`);
                }
            });

            socket.on('playerScoreUpdate', (data) => {
                this.scoresStore.handleRemoteScoreUpdate(data);
                if (data.isDeleted) {
                    toast.info(`Scores cleared for ${data.playerName} in ${data.round} round`);
                } else {
                    toast.info(`Scores updated for ${data.playerName} in ${data.round} round`);
                }
            });

            socket.on('draftStatusUpdate', (data) => {
                this.draftStore.handleRemoteDraftStatusUpdate(data);
                if (data.isDraftFinished) {
                    toast.success('Draft has been marked as finished');
                } else {
                    toast.info('Draft has been reset');
                }
            });
        }
    }
}