export interface category {
    id: number;
    type: string | null; // item, service, contract
    section: string | null;
    name: string | null;
    is_game_related: boolean; // if exists in-game
    is_mining: boolean; // mining related
}
