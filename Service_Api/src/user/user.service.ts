import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { Partner } from 'src/partner/partner.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User, 'keycloak')
    private readonly userRepository: Repository<User>,
  ) {}

  async findAllForManager(
    currentPage: number = 1,
    itemsPerPage: number = 10,
    filters: {
      name?: string;
      type?: string;
      company_id?: string;
    }
  ): Promise<{ items: User[]; }> {
    const rawQuery = `
      SELECT 
        u.id AS id,
        u.username AS username,
        company_attr.value,
        type_attr.value as test,
        CASE 
          WHEN type_attr.value = 'partner' THEN p.name 
          ELSE 'ABLECLOUD' 
        END AS company
      FROM keycloak.USER_ENTITY u
      LEFT JOIN keycloak.USER_ATTRIBUTE company_attr
        ON u.id = company_attr.user_id
        AND company_attr.name = 'company_id'
      LEFT JOIN keycloak.USER_ATTRIBUTE type_attr
        ON u.id = type_attr.user_id
        AND type_attr.name = 'type'
        AND type_attr.value IN ('partner', 'vendor')
      LEFT JOIN licenses.partner p
        ON company_attr.value = CAST(p.id AS CHAR)
      WHERE company_attr.id IS NOT NULL
        AND type_attr.id IS NOT NULL
        ${filters.type ? `AND type_attr.value = '${filters.type}'` : ''}
        ${filters.company_id ? `AND company_attr.value = '${filters.company_id}'` : ''}
    `;

    const data = await this.userRepository.query(rawQuery);

    return {
      items: data
    };
  }

//   async findOne(id: number): Promise<User> {
//     const user = await this.userRepository.findOne({
//       where: { id },
//       withDeleted: false
//     });

//     if (!user) {
//       throw new NotFoundException(`제품 ID ${id}를 찾을 수 없습니다.`);
//     }

//     return user;
//   }
}