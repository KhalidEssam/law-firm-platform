import { Injectable } from '@nestjs/common';

export interface Auth0Role {
  id: string;
  name: string;
  description?: string;
}

export interface Auth0User {
  user_id: string;
  email: string;
  name?: string;
  nickname?: string;
  picture?: string;
}

@Injectable()
export class Auth0Service {
  private domain = process.env.AUTH0_DOMAIN!;
  private clientId = process.env.AUTH0_CLIENT_ID!;
  private clientSecret = process.env.AUTH0_CLIENT_SECRET!;
  private audience = `${process.env.AUTH0_MANAGEMENT_AUDIENCE}`;

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
      throw new Error(
        `Failed to get Auth0 token: ${response.statusText} → ${text}`,
      );
    }

    const data = (await response.json()) as {
      access_token: string;
      expires_in: number;
    };
    this.cachedToken = data.access_token;
    this.tokenExpiry = now + (data.expires_in - 60) * 1000; // 1 minute buffer
    return this.cachedToken;
  }

  /**
   * Get all roles from Auth0
   */
  async getRoles(): Promise<Auth0Role[]> {
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

  /**
   * Get a specific role by ID from Auth0
   */
  async getRoleById(roleId: string): Promise<Auth0Role | null> {
    const token = await this.getToken();
    const res = await fetch(
      `${this.domain}/api/v2/roles/${encodeURIComponent(roleId)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to fetch role: ${res.statusText} → ${text}`);
    }

    return res.json();
  }

  /**
   * Find a role by name in Auth0
   */
  async getRoleByName(roleName: string): Promise<Auth0Role | null> {
    const roles = await this.getRoles();
    return roles.find((r) => r.name === roleName) || null;
  }

  /**
   * Get all roles assigned to a user in Auth0
   */
  async getUserRoles(auth0UserId: string): Promise<Auth0Role[]> {
    const token = await this.getToken();
    const res = await fetch(
      `${this.domain}/api/v2/users/${encodeURIComponent(auth0UserId)}/roles`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `Failed to fetch user roles: ${res.statusText} → ${text}`,
      );
    }

    return res.json();
  }

  /**
   * Assign a role to a user in Auth0
   */
  async assignRole(auth0UserId: string, roleId: string): Promise<void> {
    const token = await this.getToken();
    const res = await fetch(
      `${this.domain}/api/v2/users/${encodeURIComponent(auth0UserId)}/roles`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roles: [roleId] }),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to assign role: ${res.statusText} → ${text}`);
    }
  }

  /**
   * Assign multiple roles to a user in Auth0
   */
  async assignRoles(auth0UserId: string, roleIds: string[]): Promise<void> {
    const token = await this.getToken();
    const res = await fetch(
      `${this.domain}/api/v2/users/${encodeURIComponent(auth0UserId)}/roles`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roles: roleIds }),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to assign roles: ${res.statusText} → ${text}`);
    }
  }

  /**
   * Remove a role from a user in Auth0
   */
  async removeRole(auth0UserId: string, roleId: string): Promise<void> {
    const token = await this.getToken();
    const res = await fetch(
      `${this.domain}/api/v2/users/${encodeURIComponent(auth0UserId)}/roles`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roles: [roleId] }),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to remove role: ${res.statusText} → ${text}`);
    }
  }

  /**
   * Remove multiple roles from a user in Auth0
   */
  async removeRoles(auth0UserId: string, roleIds: string[]): Promise<void> {
    const token = await this.getToken();
    const res = await fetch(
      `${this.domain}/api/v2/users/${encodeURIComponent(auth0UserId)}/roles`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roles: roleIds }),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to remove roles: ${res.statusText} → ${text}`);
    }
  }

  /**
   * Get user by Auth0 ID
   */
  async getUser(auth0UserId: string): Promise<Auth0User | null> {
    const token = await this.getToken();
    const res = await fetch(
      `${this.domain}/api/v2/users/${encodeURIComponent(auth0UserId)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to fetch user: ${res.statusText} → ${text}`);
    }

    return res.json();
  }

  /**
   * Create a user in Auth0
   */
  async createUser(
    email: string,
    password: string,
    username: string,
  ): Promise<Auth0User> {
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

    if (!res.ok)
      throw new Error(`Auth0 user creation failed: ${await res.text()}`);
    return res.json();
  }

  /**
   * Get permissions for a role in Auth0
   */
  async getRolePermissions(
    roleId: string,
  ): Promise<{ permission_name: string; description: string }[]> {
    const token = await this.getToken();
    const res = await fetch(
      `${this.domain}/api/v2/roles/${encodeURIComponent(roleId)}/permissions`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `Failed to fetch role permissions: ${res.statusText} → ${text}`,
      );
    }

    return res.json();
  }

  /**
   * Get all permissions for a user (direct + from roles) in Auth0
   */
  async getUserPermissions(
    auth0UserId: string,
  ): Promise<{ permission_name: string; description: string }[]> {
    const token = await this.getToken();
    const res = await fetch(
      `${this.domain}/api/v2/users/${encodeURIComponent(auth0UserId)}/permissions`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `Failed to fetch user permissions: ${res.statusText} → ${text}`,
      );
    }

    return res.json();
  }
}
