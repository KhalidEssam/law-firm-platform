
export class Auth0Service {
    private domain = process.env.AUTH0_DOMAIN!;
    private clientId = process.env.AUTH0_CLIENT_ID!;
    private clientSecret = process.env.AUTH0_CLIENT_SECRET!;
    private audience = `${process.env.AUTH0_DOMAIN}/api/v2/`;

    private async getToken(): Promise<string> {
        console.log('AUTH0_DOMAIN:', process.env.AUTH0_DOMAIN);
        console.log('AUTH0_CLIENT_ID:', process.env.AUTH0_CLIENT_ID);
        console.log('AUTH0_CLIENT_SECRET:', process.env.AUTH0_CLIENT_SECRET);
        console.log('[Auth0Service] Full token URL:', `${this.domain}/oauth/token`);

        const response = await fetch(`${this.domain}/oauth/token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                client_id: this.clientId,
                client_secret: this.clientSecret,
                audience: this.audience,
                grant_type: "client_credentials",
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to get Auth0 token: ${response.statusText}`);
        }

        const data = (await response.json()) as { access_token: string }; // 👈 Explicit cast
        return data.access_token;
    }


    async getRoles(): Promise<any[]> {
        const token = await this.getToken();
        const res = await fetch(`${this.domain}/api/v2/roles`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch roles: ${res.statusText}`);
        }

        const data = (await res.json()) as any[]; // 👈 Explicit cast
        return data;
    }


    async assignRole(userId: string, roleId: string): Promise<void> {
        const token = await this.getToken();
        const res = await fetch(
            `${this.domain}/api/v2/users/${encodeURIComponent(userId)}/roles`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ roles: [roleId] }),
            },
        );

        if (!res.ok) {
            throw new Error(`Failed to assign role: ${res.statusText}`);
        }
    }
}
