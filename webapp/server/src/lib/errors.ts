export class AppError extends Error {
    public readonly key: string;
    public readonly statusCode: number;

    constructor(key: string, message: string, statusCode: number = 400) {
        super(message);
        this.key = key;
        this.statusCode = statusCode;
        // Restore prototype chain
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = 'AppError';
    }
}
