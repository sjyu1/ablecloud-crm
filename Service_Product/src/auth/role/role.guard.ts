import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, ForbiddenException,} from '@nestjs/common';
import { Reflector } from '@nestjs/core'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const requiredRole = this.reflector.getAllAndOverride<string>('roles', [context.getHandler(), context.getClass(),])
      if(!requiredRole){
        return true
      }

      const request = context.switchToHttp().getRequest()
      const { authorization } = request.headers
      if (!authorization || authorization.trim() === '') {
        throw new UnauthorizedException('Please provide a valid token')
      }

      const roles = this.reflector.get<string[]>('roles', context.getHandler());
      const access_token_json = JSON.parse(Buffer.from(authorization.split('.')[1], 'base64').toString())
      const role_arr = access_token_json.realm_access.roles
      for ( const role in role_arr){
        if(role_arr[role] === "Admin" || role_arr[role] === "User"){
          //console.log('requiredRole : '+requiredRole+' ||| role : '+role_arr[role])

          return requiredRole.includes(role_arr[role])
        }
      }

    } catch (error) {
      console.error('Authentication error:', error.message || error)
      if (error instanceof UnauthorizedException) {
        throw error
      }
      throw new ForbiddenException('Session expired! Please sign in')
    }
  }

  // matchRoles(roles: string[], userRole: string){
  //   return roles.some((role) => role === userRole);
  // }
}
