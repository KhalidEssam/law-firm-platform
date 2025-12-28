// src/core/domain/call-request/value-objects/call-platform.vo.ts

/**
 * CallPlatform Value Object
 * Represents supported video/audio call platforms
 */
export enum CallPlatformType {
  ZOOM = 'zoom',
  GOOGLE_MEET = 'google_meet',
  MICROSOFT_TEAMS = 'microsoft_teams',
  INTERNAL = 'internal',
  PHONE = 'phone',
}

export class CallPlatform {
  private constructor(
    public readonly type: CallPlatformType,
    public readonly callLink: string | null,
    public readonly meetingId: string | null,
    public readonly passcode: string | null,
  ) {}

  /**
   * Create a new CallPlatform
   */
  static create(props: {
    type: CallPlatformType;
    callLink?: string;
    meetingId?: string;
    passcode?: string;
  }): CallPlatform {
    return new CallPlatform(
      props.type,
      props.callLink || null,
      props.meetingId || null,
      props.passcode || null,
    );
  }

  /**
   * Create from string platform type
   */
  static fromString(platform: string, callLink?: string): CallPlatform {
    const typeMap: Record<string, CallPlatformType> = {
      zoom: CallPlatformType.ZOOM,
      google_meet: CallPlatformType.GOOGLE_MEET,
      microsoft_teams: CallPlatformType.MICROSOFT_TEAMS,
      internal: CallPlatformType.INTERNAL,
      phone: CallPlatformType.PHONE,
    };

    return new CallPlatform(
      typeMap[platform.toLowerCase()] || CallPlatformType.INTERNAL,
      callLink || null,
      null,
      null,
    );
  }

  /**
   * Check if platform supports video
   */
  supportsVideo(): boolean {
    return [
      CallPlatformType.ZOOM,
      CallPlatformType.GOOGLE_MEET,
      CallPlatformType.MICROSOFT_TEAMS,
      CallPlatformType.INTERNAL,
    ].includes(this.type);
  }

  /**
   * Check if platform supports recording
   */
  supportsRecording(): boolean {
    return [
      CallPlatformType.ZOOM,
      CallPlatformType.GOOGLE_MEET,
      CallPlatformType.MICROSOFT_TEAMS,
      CallPlatformType.INTERNAL,
    ].includes(this.type);
  }

  /**
   * Check if platform is external
   */
  isExternal(): boolean {
    return this.type !== CallPlatformType.INTERNAL;
  }

  /**
   * Get display name for the platform
   */
  getDisplayName(): string {
    const names: Record<CallPlatformType, string> = {
      [CallPlatformType.ZOOM]: 'Zoom',
      [CallPlatformType.GOOGLE_MEET]: 'Google Meet',
      [CallPlatformType.MICROSOFT_TEAMS]: 'Microsoft Teams',
      [CallPlatformType.INTERNAL]: 'Internal Platform',
      [CallPlatformType.PHONE]: 'Phone Call',
    };
    return names[this.type];
  }

  /**
   * Check equality with another CallPlatform
   */
  equals(other: CallPlatform): boolean {
    return this.type === other.type && this.callLink === other.callLink;
  }

  /**
   * Convert to plain object
   */
  toObject(): {
    type: string;
    callLink: string | null;
    meetingId: string | null;
    passcode: string | null;
  } {
    return {
      type: this.type,
      callLink: this.callLink,
      meetingId: this.meetingId,
      passcode: this.passcode,
    };
  }
}
