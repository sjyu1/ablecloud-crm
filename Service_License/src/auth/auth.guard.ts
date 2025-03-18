import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, ForbiddenException,} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
    
    type UserInfoResponse = {
      sub: string;
      email_verified: boolean;
      preferred_username: string;
    };
    
  @Injectable()
  export class AuthGuard implements CanActivate {
  constructor(private readonly httpService: HttpService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest()
      const { authorization } = request.headers
      console.log(authorization+"authorization");
      // console.log('User info fetched successfully:1')
      if (!authorization || authorization.trim() === '') {
        throw new UnauthorizedException('Please provide a valid token')
      }

      const resp = await this.getUserInfo(authorization)
      request.decodedData = resp
      return true

    } catch (error) {
      console.error('Authentication error:', error.message || error)
      if (error instanceof UnauthorizedException) {
        throw error
      }
      throw new ForbiddenException('Session expired! Please sign in')
    }
  }

  private async getUserInfo(accessToken: string): Promise<UserInfoResponse> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`${process.env.KEYCLOAK_API_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/userinfo`, {
          headers: {
            Authorization: accessToken,
          },
        }),
      )
      // console.log('User info fetched successfully:', data)
      return data
    } catch (error) {
      console.error('Error fetching user info:', error.message || error)
      throw new UnauthorizedException('Failed to fetch user information')
    }
  }
}
