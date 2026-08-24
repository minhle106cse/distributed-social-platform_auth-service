import { v7 } from 'uuid'
import { RoleInactiveError } from '../rbac.error'

export interface RoleProps {
  id: string
  code: string
  name: string
  description: string | null
  isActive: boolean
  permissions: string[] // permission codes
}

export class Role {
  private _id: string
  private _code: string
  private _name: string
  private _description: string | null
  private _isActive: boolean
  private _permissions: string[]

  private constructor(props: RoleProps) {
    this._id = props.id
    this._code = props.code
    this._name = props.name
    this._description = props.description
    this._isActive = props.isActive
    this._permissions = [...props.permissions]
  }

  static rehydrate(props: RoleProps): Role {
    return new Role(props)
  }

  static create(
    props: Omit<RoleProps, 'id' | 'description' | 'permissions' | 'isActive'> & {
      description?: string
    },
  ): Role {
    return new Role({
      id: v7(),
      code: props.code,
      name: props.name,
      description: props.description || null,
      isActive: true,
      permissions: [],
    })
  }

  get id(): string {
    return this._id
  }
  get code(): string {
    return this._code
  }
  get name(): string {
    return this._name
  }
  get description(): string | null {
    return this._description
  }
  get isActive(): boolean {
    return this._isActive
  }
  get permissions(): string[] {
    return [...this._permissions]
  }

  ensureIsActive() {
    if (!this._isActive) {
      throw new RoleInactiveError()
    }
  }

  assignPermissions(permissions: string[]) {
    // Basic deduplication
    this._permissions = Array.from(new Set([...this._permissions, ...permissions]))
  }

  revokePermissions(permissions: string[]) {
    this._permissions = this._permissions.filter((p) => !permissions.includes(p))
  }
}
