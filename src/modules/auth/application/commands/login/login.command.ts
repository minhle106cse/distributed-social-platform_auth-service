export class LoginCommand {
  constructor(
    public email: string,
    public password: string,
    public ipAddress?: string,
    public userAgent?: string,
  ) {}
}
