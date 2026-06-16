import { v7 } from 'uuid';

export interface PermissionProps {
  id: string;
  code: string;
  module: string;
  description: string | null;
}

export class Permission {
  private _id: string;
  private _code: string;
  private _module: string;
  private _description: string | null;

  private constructor(props: PermissionProps) {
    this._id = props.id;
    this._code = props.code;
    this._module = props.module;
    this._description = props.description;
  }

  static rehydrate(props: PermissionProps): Permission {
    return new Permission(props);
  }

  static create(props: Omit<PermissionProps, 'id' | 'description'> & { description?: string }): Permission {
    return new Permission({
      id: v7(),
      code: props.code,
      module: props.module,
      description: props.description || null,
    });
  }

  get id(): string { return this._id; }
  get code(): string { return this._code; }
  get module(): string { return this._module; }
  get description(): string | null { return this._description; }
}
