export class RegisterCommand {
  constructor(
    public email: string,
    public password: string,
    public fullName: string,
  ) {}
}
