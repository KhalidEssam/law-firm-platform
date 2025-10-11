export class NotificationId {
    private constructor(private readonly value: string) { }

    static async create(): Promise<NotificationId> {
        const { v4: uuidv4 } = await import("uuid");
        return new NotificationId(uuidv4());
    }

    getValue(): string {
        return this.value;
    }
}
