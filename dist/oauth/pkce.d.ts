export interface PkcePair {
    verifier: string;
    challenge: string;
}
/** Generates a PKCE verifier/challenge pair (S256). */
export declare function createPkcePair(): PkcePair;
/** Generates a random opaque state value for CSRF protection. */
export declare function randomState(): string;
