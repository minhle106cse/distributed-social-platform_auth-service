import { Permission } from './permission.entity'
import { PermissionInactiveError } from '@/common/errors/rbac.error'

jest.mock('uuid', () => ({
  v7: jest.fn(() => 'mock-uuid-v7'),
}))

describe('Permission Entity', () => {
  it('should create a new Permission correctly', () => {
    const permission = Permission.create({
      code: 'CREATE_USER',
      module: 'USER',
      description: 'Can create a new user',
    })

    expect(permission.id).toBe('mock-uuid-v7')
    expect(permission.code).toBe('CREATE_USER')
    expect(permission.module).toBe('USER')
    expect(permission.description).toBe('Can create a new user')
    expect(permission.isActive).toBe(true)
  })

  it('should rehydrate an existing Permission correctly', () => {
    const permission = Permission.rehydrate({
      id: 'existing-id',
      code: 'READ_USER',
      module: 'USER',
      description: null,
      isActive: false,
    })

    expect(permission.id).toBe('existing-id')
    expect(permission.code).toBe('READ_USER')
    expect(permission.module).toBe('USER')
    expect(permission.description).toBeNull()
    expect(permission.isActive).toBe(false)
  })

  it('should throw PermissionInactiveError when ensureIsActive is called on inactive permission', () => {
    const permission = Permission.rehydrate({
      id: 'existing-id',
      code: 'READ_USER',
      module: 'USER',
      description: null,
      isActive: false,
    })

    expect(() => permission.ensureIsActive()).toThrow(PermissionInactiveError)
  })

  it('should not throw when ensureIsActive is called on active permission', () => {
    const permission = Permission.create({
      code: 'READ_USER',
      module: 'USER',
    })

    expect(() => permission.ensureIsActive()).not.toThrow()
  })
})
