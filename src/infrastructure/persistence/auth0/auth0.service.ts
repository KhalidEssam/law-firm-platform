// @Injectable()
export class Auth0Service {
    private domain = process.env.AUTH0_DOMAIN!;
    private clientId = process.env.AUTH0_CLIENT_ID!;
    private clientSecret = process.env.AUTH0_CLIENT_SECRET!;
    private audience = `${process.env.AUTH0_AUDIENCE}`;

    private cachedToken: string | null = null;
    private tokenExpiry: number = 0;

    private async getToken(): Promise<string> {
        const now = Date.now();
        if (this.cachedToken && now < this.tokenExpiry) {
            return this.cachedToken;
        }

        const response = await fetch(`${this.domain}/oauth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: this.clientId,
                client_secret: this.clientSecret,
                audience: this.audience,
                grant_type: 'client_credentials',
            }),
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Failed to get Auth0 token: ${response.statusText} → ${text}`);
        }

        const data = await response.json() as { access_token: string; expires_in: number };
        this.cachedToken = data.access_token;
        this.tokenExpiry = now + (data.expires_in - 60) * 1000; // 1 minute buffer
        return this.cachedToken;
    }

    async getRoles(): Promise<any[]> {
        const token = await this.getToken();
        const res = await fetch(`${this.domain}/api/v2/roles`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Failed to fetch roles: ${res.statusText} → ${text}`);
        }

        return res.json();
    }

    async assignRole(userId: string, roleId: string): Promise<void> {
        const token = await this.getToken();
        const res = await fetch(`${this.domain}/api/v2/users/${encodeURIComponent(userId)}/roles`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ roles: [roleId] }),
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Failed to assign role: ${res.statusText} → ${text}`);
        }
    }

    async createUser(email: string, password: string, username: string) {
        const token = await this.getToken();
        const res = await fetch(`${this.domain}/api/v2/users`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                password,
                username,
                connection: 'Username-Password-Authentication',
            }),
        });

        if (!res.ok) throw new Error(`Auth0 user creation failed: ${await res.text()}`);
        return res.json();
    }
}
