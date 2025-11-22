export enum GameType {
    TICTACTOE = 'TICTACTOE',
    BINARY = 'BINARY',
    MEMORY = 'MEMORY',
    SHOOTER = 'SHOOTER',
    GAME2048 = 'GAME2048',
    LOGIC_GATES = 'LOGIC_GATES'
}

export interface Game {
    id: GameType;
    title: string;
    description: string;
    rating: number;
    icon: string; // FontAwesome class
    colorClass: string; // Tailwind text color class for icon
    gradientClass: string; // Tailwind gradient class for background
    isNew?: boolean;
    isHot?: boolean;
    isOnline?: boolean;
    isComingSoon?: boolean;
}