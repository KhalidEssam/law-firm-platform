export class Biography {
    private constructor(private readonly value: string) { }

    static create(value: string): Biography {
        if (!value || value.trim().length < 10) {
            throw new Error('Biography must be at least 10 characters');
        }
        if (value.trim().length > 1000) {
            throw new Error('Biography cannot exceed 1000 characters');
        }
        return new Biography(value.trim());
    }

    getValue(): string {
        return this.value;
    }
}