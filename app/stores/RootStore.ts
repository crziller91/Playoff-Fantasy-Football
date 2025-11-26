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
    isReloading: boolean = false; // Flag to prevent operations during page reload

    constructor() {
        this.draftStore = new DraftStore(this);
        this.teamsStore = new TeamsStore(this);
        this.playersStore = new PlayersStore(this);
        this.scoresStore = new ScoresStore(this);
    }

    // Update the socket event listeners in setSocket method
    setSocket(socket: Socket | null) {
        // First, remove existing listeners from the previous socket if there was one
        if (this.socket) {
            this.socket.off('playerScoreUpdate');
            this.socket.off('draftPickUpdate');
            this.socket.off('draftStatusUpdate');
            this.socket.off('teamUpdate');
            this.socket.off('selectedPlayerUpdate');
        }

        this.socket = socket;

        if (socket) {
            // Set up socket event listeners
            socket.on('playerScoreUpdate', (data) => {
                this.scoresStore.handleRemoteScoreUpdate(data);
                if (data.action === 'scoring_rules_update') {
                    toast.info(`Scoring rules for ${data.position} position were updated`);
                } else if (data.isDeleted) {
                    toast.info(`Scores cleared for ${data.playerName} in ${data.round} round`);
                } else if (data.action === 'reactivate') {
                    toast.info(`${data.playerName} reactivated for ${data.round} round`);
                } else {
                    toast.info(`Scores updated for ${data.playerName} in ${data.round} round`);
                }
            });

            socket.on('draftPickUpdate', (data) => {
                if (data.action === 'add' || data.action === 'update') {
                    this.playersStore.handleRemoteDraftPickUpdate(data);
                    toast.info(`${data.team} selected ${data.player.name} in round ${data.pick}`);
                } else if (data.action === 'remove') {
                    this.playersStore.handleRemoteDraftPickRemoval(data);
                    toast.info(`${data.team} removed their pick in round ${data.pick}`);
                }
            });

            socket.on('draftStatusUpdate', (data) => {
                // Handle full reset action immediately to prevent API spam
                if (data.action === 'reset') {
                    // Set the reloading flag to prevent any store operations
                    this.isReloading = true;

                    toast.info('Draft has been reset - reloading page...');

                    // Reload immediately without updating store state
                    // This prevents the stores from entering inconsistent states
                    if (typeof window !== 'undefined') {
                        setTimeout(() => {
                            window.location.href = '/';
                        }, 500);
                    }
                    return; // Don't process further
                }

                // For non-reset actions, update the store state normally
                this.draftStore.handleRemoteDraftStatusUpdate(data);

                // Handle UI notifications for other actions
                if (data.isDraftFinished) {
                    toast.success('Draft has been marked as finished');
                }
            });

            socket.on('teamUpdate', (data) => {
                // Update the teams store with the new data
                this.teamsStore.handleRemoteTeamUpdate(data);

                // Show appropriate toast notification based on action
                if (data.action === 'update_all_budgets') {
                    toast.info(`All team budgets updated to $${data.budget}`);
                } else if (data.action === 'update') {
                    toast.info(`Team "${data.teamName}" updated`);
                } else if (data.action === 'add') {
                    toast.info(`New team "${data.teamName}" added`);
                } else if (data.action === 'delete') {
                    toast.info(`Team "${data.teamName}" deleted`);
                }
            });

            socket.on('selectedPlayerUpdate', (data) => {
                // Update the player store with the selected player
                this.playersStore.handleRemoteSelectedPlayerUpdate(data);
            });
        }
    }
}