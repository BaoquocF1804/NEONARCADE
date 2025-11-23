export enum GameType {

    BINARY = 'BINARY',
    MEMORY = 'MEMORY',
    SHOOTER = 'SHOOTER',
    GAME2048 = 'GAME2048',
    LOGIC_GATES = 'LOGIC_GATES',
    FLAPPY_BIRD = 'FLAPPY_BIRD',
    FLEXBOX_DEFENSE = 'FLEXBOX_DEFENSE',
    GOMOKU = 'GOMOKU'
}

export enum GameCategory {
    ALL = 'ALL',
    PROGRAMMING = 'PROGRAMMING',
    ACTION = 'ACTION',
    PUZZLE = 'PUZZLE',
    SPORTS = 'SPORTS'
}

export interface Game {
    id: GameType;
    title: string;
    description: string;
    rating: number;
    icon: string; // FontAwesome class
    colorClass: string; // Tailwind text color class for icon
    gradientClass: string; // Tailwind gradient class for background
    category: GameCategory;
    isNew?: boolean;
    isHot?: boolean;
    isOnline?: boolean;
    isComingSoon?: boolean;
}