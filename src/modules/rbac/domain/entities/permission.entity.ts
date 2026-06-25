import { v7 } from 'uuid'
import { PermissionInactiveError } from '@/common/errors/rbac.error'

export interface PermissionProps {
  id: string
  code: string
  module: string
  description: string | null
  isActive: boolean
}

export class Permission {
  private _id: string
  private _code: string
  private _module: string
  private _description: string | null
  private _isActive: boolean

  private constructor(props: PermissionProps) {
    this._id = props.id
    this._code = props.code
    this._module = props.module
    this._description = props.description
    this._isActive = props.isActive
  }

  static rehydrate(props: PermissionProps): Permission {
    return new Permission(props)
  }

  static create(
    props: Omit<PermissionProps, 'id' | 'description' | 'isActive'> & { description?: string },
  ): Permission {
    if (!props.code.trim()) throw new Error('Permission code is required')
    if (!props.module.trim()) throw new Error('Permission module is required')
    return new Permission({
      id: v7(),
      code: props.code,
      module: props.module,
      description: props.description || null,
      isActive: true,
    })
  }

  get id(): string {
    return this._id
  }
  get code(): string {
    return this._code
  }
  get module(): string {
    return this._module
  }
  get description(): string | null {
    return this._description
  }
  get isActive(): boolean {
    return this._isActive
  }

  ensureIsActive() {
    if (!this._isActive) {
      throw new PermissionInactiveError()
    }
  }
}
