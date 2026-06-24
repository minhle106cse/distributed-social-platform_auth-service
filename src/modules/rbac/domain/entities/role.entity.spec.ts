import { Role } from './role.entity'
import { RoleInactiveError } from '@/common/errors/rbac.error'

jest.mock('uuid', () => ({
  v7: jest.fn(() => 'mock-uuid-v7'),
}))

describe('Role Entity', () => {
  it('should create a new Role correctly', () => {
    const role = Role.create({ code: 'ADMIN', name: 'Administrator', description: 'Admin role' })

    expect(role.id).toBe('mock-uuid-v7')
    expect(role.code).toBe('ADMIN')
    expect(role.name).toBe('Administrator')
    expect(role.description).toBe('Admin role')
    expect(role.isActive).toBe(true)
    expect(role.getPermissions).toEqual([])
  })

  it('should rehydrate an existing Role correctly', () => {
    const role = Role.rehydrate({
      id: 'existing-id',
      code: 'USER',
      name: 'User',
      description: null,
      isActive: false,
      permissions: ['READ_POSTS'],
    })

    expect(role.id).toBe('existing-id')
    expect(role.isActive).toBe(false)
    expect(role.getPermissions).toEqual(['READ_POSTS'])
  })

  it('should throw RoleInactiveError when ensureIsActive is called on inactive role', () => {
    const role = Role.rehydrate({
      id: 'existing-id',
      code: 'USER',
      name: 'User',
      description: null,
      isActive: false,
      permissions: [],
    })

    expect(() => role.ensureIsActive()).toThrow(RoleInactiveError)
  })

  it('should not throw when ensureIsActive is called on active role', () => {
    const role = Role.create({ code: 'ADMIN', name: 'Admin' })
    expect(() => role.ensureIsActive()).not.toThrow()
  })

  it('should assign and deduplicate permissions', () => {
    const role = Role.create({ code: 'ADMIN', name: 'Admin' })
    role.assignPermissions(['READ_POSTS', 'WRITE_POSTS'])
    expect(role.getPermissions).toEqual(['READ_POSTS', 'WRITE_POSTS'])

    role.assignPermissions(['WRITE_POSTS', 'DELETE_POSTS'])
    expect(role.getPermissions).toEqual(['READ_POSTS', 'WRITE_POSTS', 'DELETE_POSTS'])
  })

  it('should revoke permissions', () => {
    const role = Role.rehydrate({
      id: 'id',
      code: 'ADMIN',
      name: 'Admin',
      description: null,
      isActive: true,
      permissions: ['READ_POSTS', 'WRITE_POSTS', 'DELETE_POSTS'],
    })

    role.revokePermissions(['WRITE_POSTS', 'NON_EXISTENT'])
    expect(role.getPermissions).toEqual(['READ_POSTS', 'DELETE_POSTS'])
  })
})
