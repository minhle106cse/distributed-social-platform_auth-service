export interface UserProfileProps {
  id: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  phoneNumber: string | null;
}

export class UserProfile {
  private _id: string;
  private _userId: string;
  private _firstName: string | null;
  private _lastName: string | null;
  private _displayName: string | null;
  private _avatarUrl: string | null;
  private _phoneNumber: string | null;

  private constructor(props: UserProfileProps) {
    this._id = props.id;
    this._userId = props.userId;
    this._firstName = props.firstName;
    this._lastName = props.lastName;
    this._displayName = props.displayName;
    this._avatarUrl = props.avatarUrl;
    this._phoneNumber = props.phoneNumber;
  }

  static rehydrate(props: UserProfileProps): UserProfile {
    return new UserProfile(props);
  }

  static create(props: Omit<UserProfileProps, 'id' | 'firstName' | 'lastName' | 'displayName' | 'avatarUrl' | 'phoneNumber'> & { id?: string }): UserProfile {
    return new UserProfile({
      id: props.id || '', // Replaced by DB or mapped id
      userId: props.userId,
      firstName: null,
      lastName: null,
      displayName: null,
      avatarUrl: null,
      phoneNumber: null,
    });
  }

  get id(): string { return this._id; }
  get userId(): string { return this._userId; }
  get firstName(): string | null { return this._firstName; }
  get lastName(): string | null { return this._lastName; }
  get displayName(): string | null { return this._displayName; }
  get avatarUrl(): string | null { return this._avatarUrl; }
  get phoneNumber(): string | null { return this._phoneNumber; }

  update(props: {
    firstName?: string;
    lastName?: string;
    displayName?: string;
    avatarUrl?: string;
    phoneNumber?: string;
  }) {
    if (props.firstName !== undefined) this._firstName = props.firstName;
    if (props.lastName !== undefined) this._lastName = props.lastName;
    if (props.displayName !== undefined) this._displayName = props.displayName;
    if (props.avatarUrl !== undefined) this._avatarUrl = props.avatarUrl;
    if (props.phoneNumber !== undefined) this._phoneNumber = props.phoneNumber;
  }
}
