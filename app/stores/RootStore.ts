import { DraftStore } from './DraftStore';
import { TeamsStore } from './TeamsStore';
import { PlayersStore } from './PlayerStore';
import { ScoresStore } from './ScoresStore';

export class RootStore {
    draftStore: DraftStore;
    teamsStore: TeamsStore;
    playersStore: PlayersStore;
    scoresStore: ScoresStore;

    constructor() {
        this.draftStore = new DraftStore(this);
        this.teamsStore = new TeamsStore(this);
        this.playersStore = new PlayersStore(this);
        this.scoresStore = new ScoresStore(this);
    }
}