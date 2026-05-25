export class Profile {
  private constructor(public readonly fullName: string) {}

  static rehydrate(props: { fullName: string }): Profile {
    return new Profile(props.fullName)
  }

  static createForRegister(props: { fullName: string }): Profile {
    return new Profile(props.fullName)
  }
}
