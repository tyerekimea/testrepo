export type UserProfile = {
    id: string;
    username: string;
    email: string;
    totalScore: number;
    highestLevel: number;
    rank: string;
    createdAt: string;
    updatedAt: string;
    purchasedThemes?: string[];
    hints: number;
    // Subscription fields
    isPremium?: boolean;
    subscriptionStatus?: 'active' | 'canceled' | 'past_due' | 'expiring' | null;
    subscriptionPlan?: 'monthly' | 'yearly' | null;
    subscriptionReference?: string;
    subscriptionStartDate?: string;
    subscriptionEndDate?: string;
    customerId?: string;
};

export type GameSession = {
    id: string;
    userProfileId: string;
    score: number;
    difficulty: string;
    seed: string;
    startTime: string;
    endTime: string;
};
