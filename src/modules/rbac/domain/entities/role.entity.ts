import { v7 } from 'uuid';

export interface RoleProps {
  id: string;
  code: string;
  name: string;
  description: string | null;
  permissions: string[]; // permission codes
}

export class Role {
  private _id: string;
  private _code: string;
  private _name: string;
  private _description: string | null;
  private _permissions: string[];

  private constructor(props: RoleProps) {
    this._id = props.id;
    this._code = props.code;
    this._name = props.name;
    this._description = props.description;
    this._permissions = [...props.permissions];
  }

  static rehydrate(props: RoleProps): Role {
    return new Role(props);
  }

  static create(props: Omit<RoleProps, 'id' | 'description' | 'permissions'> & { description?: string }): Role {
    return new Role({
      id: v7(),
      code: props.code,
      name: props.name,
      description: props.description || null,
      permissions: [],
    });
  }

  get id(): string { return this._id; }
  get code(): string { return this._code; }
  get name(): string { return this._name; }
  get description(): string | null { return this._description; }
  get getPermissions(): string[] { return this._permissions; }

  assignPermissions(permissions: string[]) {
    // Basic deduplication
    this._permissions = Array.from(new Set([...this._permissions, ...permissions]));
  }

  revokePermissions(permissions: string[]) {
    this._permissions = this._permissions.filter(p => !permissions.includes(p));
  }
}
