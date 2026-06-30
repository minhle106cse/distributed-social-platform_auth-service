import { UserProfile } from './user-profile.entity'

jest.mock('uuid', () => ({
  v7: jest.fn(() => 'mock-uuid-v7'),
}))

describe('UserProfile Entity', () => {
  it('should create and get properties', () => {
    const profile = UserProfile.create({
      userId: 'u1',
    })

    expect(profile.id).toBe('mock-uuid-v7')
    expect(profile.userId).toBe('u1')
    expect(profile.firstName).toBeNull()
    expect(profile.lastName).toBeNull()
    expect(profile.displayName).toBeNull()
    expect(profile.avatarUrl).toBeNull()
    expect(profile.phoneNumber).toBeNull()
  })

  it('should create with provided id', () => {
    const profile = UserProfile.create({
      id: 'p2',
      userId: 'u2',
    })

    expect(profile.id).toBe('p2')
    expect(profile.userId).toBe('u2')
  })

  it('should rehydrate correctly', () => {
    const profile = UserProfile.rehydrate({
      id: 'p1',
      userId: 'u1',
      firstName: 'John',
      lastName: 'Doe',
      displayName: 'JohnD',
      avatarUrl: 'http://avatar',
      phoneNumber: '123',
    })

    expect(profile.id).toBe('p1')
    expect(profile.userId).toBe('u1')
    expect(profile.firstName).toBe('John')
    expect(profile.lastName).toBe('Doe')
    expect(profile.displayName).toBe('JohnD')
    expect(profile.avatarUrl).toBe('http://avatar')
    expect(profile.phoneNumber).toBe('123')
  })

  it('should update properties', () => {
    const profile = UserProfile.create({
      userId: 'u1',
    })

    profile.update({
      firstName: 'Jane',
      lastName: 'Smith',
      displayName: 'JaneS',
      avatarUrl: 'http://new',
      phoneNumber: '456',
    })

    expect(profile.firstName).toBe('Jane')
    expect(profile.lastName).toBe('Smith')
    expect(profile.displayName).toBe('JaneS')
    expect(profile.avatarUrl).toBe('http://new')
    expect(profile.phoneNumber).toBe('456')
  })

  it('should only update provided properties', () => {
    const profile = UserProfile.rehydrate({
      id: 'p1',
      userId: 'u1',
      firstName: 'John',
      lastName: 'Doe',
      displayName: 'JohnD',
      avatarUrl: 'http://avatar',
      phoneNumber: '123',
    })

    profile.update({
      firstName: 'Jane',
    })

    expect(profile.firstName).toBe('Jane')
    expect(profile.lastName).toBe('Doe') // unchanged
    expect(profile.displayName).toBe('JohnD') // unchanged
    expect(profile.avatarUrl).toBe('http://avatar') // unchanged
    expect(profile.phoneNumber).toBe('123') // unchanged

    profile.update({
      lastName: 'Smith',
    })
    expect(profile.firstName).toBe('Jane')
    expect(profile.lastName).toBe('Smith')
  })
})
